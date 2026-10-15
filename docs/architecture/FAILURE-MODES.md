# Oprino Field Failure Modes & System Resilience Specification

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Controlling Documents:** 
- Phase 00 Approved PRD ([`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md))
- [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](./SYNC-CONFLICT-MATRIX.md)
- [`docs/architecture/LOCATION-PIPELINE.md`](./LOCATION-PIPELINE.md)

---

## 1. Resilience Philosophy

In field operations, failure is not an edge case—it is a continuous operational condition. Devices run out of battery, cheap phones kill background services, cellular signals vanish in concrete basements, and employees drop their phones.

The Oprino platform is architected around **Graceful Degradation, Zero Data Loss, and Self-Healing Recovery**.

---

## 2. Comprehensive Field Failure Modes Matrix

### Category 1: Mobile Client & Device Hardware Failures

| ID | Failure Scenario | Impact | Detection Mechanism | Automated Recovery Behavior | User Experience |
|---|---|---|---|---|---|
| **F-01** | **Device Battery Dies Mid-Shift** | Location tracking and task updates abruptly stop. | Mobile OS emits low battery intent; server detects telemetry heartbeat cessation > 15 mins. | Client saves current state to SQLite before OS shutdown. Server flags employee status as `LAST_SEEN_OFFLINE (Battery Low)`. When phone recharges, foreground service auto-resumes if shift is still active. | Manager sees: *"Jane Smith (Offline - Battery Exhausted at 14:15)"*. |
| **F-02** | **OEM Battery Manager Kills Background Service** (MIUI / ColorOS / Samsung) | Background GPS halts while app is minimized. | Transistor plugin detects process termination via native watchdog alarm. | Watchdog restarts the Android Foreground Service with sticky notification. If killed repeatedly, app surfaces persistent OS-specific "Disable Battery Optimization" guidance screen. | In-app banner: *"Background tracking restricted by device battery saver. Tap to grant permission."* |
| **F-03** | **Employee Revokes GPS Permission Mid-Duty** | Cannot track duty location. | OS permission callback triggers `ON_LOCATION_PERMISSION_DENIED`. | Mobile app generates an immediate high-priority audit event (`LOCATION_PERMISSION_REVOKED`). Server marks employee as `TRACKING_COMPROMISED` and notifies manager. | Worker cannot accept new tasks until permission restored; banner explains requirement. |
| **F-04** | **Device Clock Skewed / Manipulated** | Time-travel attack or incorrect manual clock. | Delta check between `client_timestamp` and server `NOW()` exceeds ±5 minutes. | Server accepts mutation but uses trusted server timestamp for audit logs and shift calculations; flags record with `CLOCK_SKEW_DETECTED`. | Transparent to worker; manager sees informational flag on audit log. |
| **F-05** | **Device Storage Full (0 MB Remaining)** | SQLite writes or camera captures fail. | SQLite `SQLITE_FULL` error or camera write exception. | App aggressively purges already-synced offline cache data and temporary image thumbnails; notifies worker with explicit free-space requirement. | Modal alert: *"Device storage full. 150MB required to capture photos and complete tasks."* |
| **F-06** | **Camera Hardware Crash Mid-Task** | Cannot capture proof-of-work photo. | Flutter Camera package initialization exception. | Fallback intent launches native system camera app; captures and returns image via filesystem URI. | Seamless fallback to system camera app. |
| **F-07** | **App Force-Killed Mid-Form Input** | In-progress task checklist lost. | App restarts without clean unmount. | Form state continuously autosaved to local SQLite draft store on every keystroke/toggle. | Upon reopening app, worker is presented with: *"Unsaved draft restored."* |

---

### Category 2: Network & Connectivity Failures

| ID | Failure Scenario | Impact | Detection Mechanism | Automated Recovery Behavior | User Experience |
|---|---|---|---|---|---|
| **F-08** | **Prolonged Cellular Blackout (4+ Hours)** | No live updates sent to dashboard. | NetInfo detects `isConnected = false`; HTTP requests timeout. | App transitions to Offline Mode. All tasks, attendance punches, and breadcrumbs queue monotonically in `outbox_mutations`. | UI displays subtle offline badge: *"Working Offline (24 items queued)"*. Zero UI blocking. |
| **F-09** | **Flapping Network Connection (Every 3s)** | Half-uploaded requests, socket churn. | Network status oscillates rapidly. | Exponential backoff sync debouncer: waits for 15 seconds of stable connectivity before initiating batch sync. | Avoids battery drain from connection cycling. |
| **F-10** | **Captive Portal Wi-Fi (No Internet)** | Phone connects to Wi-Fi that requires web login. | HTTP reachability probe (`/health/liveness`) fails despite `isConnected = true`. | App treats captive portal as offline; refuses to flush outbox until probe endpoint succeeds. | Displays: *"Network requires login. Operating offline."* |
| **F-11** | **Batch Upload Timeout Mid-Flight** | Server received some points or timed out. | HTTP 504 Gateway Timeout or client timeout. | Sync manager replays batch with exact same `mutationId` and `batchId`. Server idempotency deduplicates points; zero data duplicated. | Worker sees sync spinner, then success checkmark. |

---

### Category 3: Cloud Infrastructure & Backend Failures

| ID | Failure Scenario | Impact | Detection Mechanism | Automated Recovery Behavior | User Experience |
|---|---|---|---|---|---|
| **F-12** | **Primary PostgreSQL DB Failover** | API queries fail for 30–60 seconds. | Connection pool emits `ECONNREFUSED` or read-only replica error. | Fastify connection pool retries with backoff. Mobile clients buffer mutations locally in SQLite. Web dashboard displays reconnecting banner. | Zero data lost; clients flush queues once standby DB is promoted to primary. |
| **F-13** | **Redis HA Instance Crash / Failover / Restart** | BullMQ workers pause; SSE connections drop. | Redis `NR_CLOSED` or connection timeout. | API falls back to database-backed token validation; SSE clients reconnect with exponential jitter. Background jobs resume processing from Redis AOF log. | Dashboard live map shows *"Reconnecting live stream..."* for ~5s. |
| **F-14** | **S3 / Cloudflare R2 Upload Outage** | Proof photos fail to upload. | S3 PUT returns HTTP 500/503. | Decoupled Media Queue pauses binary uploads; retries with exponential backoff (up to 24 hours). Task metadata is already safely committed to DB. | Task marked `COMPLETED` immediately; photo thumbnail marked *"Uploading in background"*. |
| **F-15** | **BullMQ Worker OOM during Large PDF Export** | Worker container crashes. | Docker exit code 137 (OOM Killer). | Orchestrator automatically restarts container. Failed job moved to BullMQ retry queue with memory-restricted batch chunking. | Requesting manager receives notification: *"Report generation delayed, retrying..."* |

---

### Category 4: Operational & Human Conflict Scenarios

| ID | Failure Scenario | Impact | Detection Mechanism | Automated Recovery Behavior | User Experience |
|---|---|---|---|---|---|
| **F-16** | **Manager Cancels Task While Worker Completes Offline** | Conflicting task states. | Sync replay arrives with `COMPLETED` for task currently `CANCELLED`. | [`SYNC-CONFLICT-MATRIX.md`](./SYNC-CONFLICT-MATRIX.md) Rule: Cancellation stands, but worker's submitted proof and time are preserved as an audit attachment. | Worker informed: *"Task was cancelled by Manager. Your work notes have been archived."* |
| **F-17** | **Worker Forgets to Punch Out (Overnight)** | Runaway tracking risk into personal hours. | Auto-Punchout Engine detects shift duration > scheduled end + 2 hours. | Server automatically closes shift with reason `AUTO_SYSTEM_TIMEOUT`. Native local deadline triggers SDK shutdown; local queue purges post-duty points; server drops any out-of-shift telemetry. Explicit punch-out always executes immediate native stop. | Tracking terminates; morning notification prompts employee to review/regularize shift end. |
| **F-18** | **Accidental Employee Deletion During Active Shift** | Shift orphan / token revocation. | Admin clicks delete/deactivate on active worker. | System converts delete into `DEACTIVATED`; auto-terminates active shift; revokes tokens gracefully. | Mobile app displays: *"Your company account has been deactivated. Please contact your manager."* |
| **F-19** | **Simultaneous Multi-Device Login by Same Worker** | Race condition on attendance and outbox sync. | Device token registry detects new device login for non-manager employee. | Previous device session revoked immediately. Mobile app on old device displays session expired modal. | Prevents dual-device location spoofing. |
| **F-20** | **GPS Teleportation / Bouncing Anomaly** | 10km jump in 15 seconds due to cell-tower bounce. | Speed calculator exceeds 160 km/h between sequential coordinates. | Anomaly filter discards jump coordinate; marks point as `REJECTED_GPS_BOUNCE`; does not add to travel mileage. | Live map avoids erratic lines across the city. |

---

## 3. Resilience Testing & Disaster Recovery Runbooks

1. **Chaos Simulation Tests:** Periodic chaos testing simulates network drops during batch sync, Redis restarts during peak hours, and killed mobile processes.
2. **Automated Database Backups:** Point-in-Time Recovery (PITR) enabled with 35-day backup retention on primary PostgreSQL cluster. Daily encrypted snapshots mirrored to secondary geographical region.

---

## 4. Compliance with Phase 00 Approved Scope

- Ensures reliable field execution across diverse real-world SMB conditions.
- Protects employee privacy during device crashes, shift overruns, and network anomalies.
