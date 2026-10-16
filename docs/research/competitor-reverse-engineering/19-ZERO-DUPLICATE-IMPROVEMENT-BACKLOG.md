# 19 — Zero-Duplicate Incremental Improvement Backlog

**Auditor:** Principal Software Architect, Senior QA Lead & Product Gap Analyst  
**Context:** Incremental Roadmap Reconciled with Existing Merged Codebase (`main`)  
**Strict Exclusion Rule:** Absolutely zero items from prior foundational sprints (e.g., RLS, duty tracking, selfie attendance, offline Drift SQLite, live maps, 30-day GPS pruning) appear in this backlog, as they are already 100% implemented and tested.  
**Date of Audit:** October 2026  
**Status:** Approved Incremental Backlog  

---

## 1. Backlog Summary Matrix

| Priority | Item ID | Title | Module | Effort | Primary Value |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **P0** | `SEC-001` | Google Play Integrity API Hardware Attestation | Mobile Security & Anti-Fraud | 5 SP | Hardware-backed verification against rooted devices and modified APKs |
| **P1** | `QA-001` | Standardized 8-Hour Battery Profiling Harness | Mobile QA & Profiling | 3 SP | Empirical verification of battery consumption target (<8%/shift) |
| **P1** | `PERF-001`| MapLibre Marker Clustering for Large Fleets (>100 pins) | Web Dashboard (`live-map`) | 3 SP | Prevents DOM canvas lag when monitoring high-density field teams |
| **P1** | `REL-001` | Cellular/Wi-Fi Handover Network Watchdog | Mobile Connectivity & Sync | 3 SP | Prevents sync stalling during rapid cell tower or Wi-Fi transitions |
| **P2** | `PAR-001` | Vehicle Odometer Photo Capture & Conveyance Allowance | Attendance & Expense Engine | 8 SP | Competitor parity vs. Unolo: Automated fuel reimbursement calculation |
| **P2** | `PAR-002` | WhatsApp Business Cloud API Dispatch Webhooks | Dispatch & Notifications | 5 SP | Competitor parity vs. TaskOPad: Instant technician mobile engagement |
| **P2** | `PAR-003` | Automated Day-Gap Task Morning Rollover | Task Lifecycle & Worker | 3 SP | Competitor parity vs. TaskOPad: Automatic rollover of uncompleted tasks |
| **P3** | `DIFF-001`| Kinematic Teleportation Visual Flags on Live Map | Live Radar & Security | 5 SP | Differentiator: Visual fraud detection for speeds > 120 km/h |
| **P3** | `DIFF-002`| Offline Voice Dictation for Field Visit Notes | Proof of Work & Usability | 5 SP | Differentiator: Hands-free visit report dictation for field technicians |

---

## 2. Priority P0: Security & Fraud Hardening

### [SEC-001] Google Play Integrity API Hardware Attestation
- **Evidence & Rationale:** Currently, Oprino verifies `location.isMock() == false` in native code. However, a malicious field worker running a modified client binary on a rooted device with Xposed/Frida could patch this check. Unolo advertises mock-location defenses; Oprino should implement hardware-backed Play Integrity token verification.
- **Impacted Files:**
  - `apps/mobile/android/app/build.gradle` (Play Integrity dependency)
  - `apps/mobile/lib/core/location/real_location_hardware_adapter.dart`
  - `services/api/src/services/attendance.service.ts`
  - `packages/contracts/src/attendance.ts`
- **Required Changes:**
  1. Mobile app requests a short-lived Play Integrity token on Punch-In and Visit Check-In.
  2. Fastify API verifies the attestation token against Google Play Integrity servers.
  3. Rejects punch-in if `appLicensingVerdict != 'LICENSED'` or `deviceRecognitionVerdict` does not meet basic integrity.
- **Acceptance Criteria:**
  - Sideloaded or rooted device fails punch-in when workspace policy enforces `DEVICE_INTEGRITY_REQUIRED`.
  - Zero false positives on stock, unrooted Android devices.
- **Estimated Effort:** 5 Story Points.
- **Regression Tests:** `v1-blockers.integration.test.ts` (BLK-004 attendance suite).
- **Dependencies:** Google Cloud Project with Play Integrity API enabled.

---

## 3. Priority P1: Reliability, Performance & Usability Defects

### [QA-001] Standardized 8-Hour Battery Profiling Test Harness
- **Evidence & Rationale:** In Documents 06 and 12, battery drain figures (12–15% Unolo vs. <8% Oprino) were downgraded to unverified estimates due to the lack of an empirical test harness. A formal automated profiling script must run on our connected OnePlus testbed (`5abd6fc0`) to establish a reproducible baseline.
- **Impacted Files:**
  - `apps/mobile/scripts/benchmark_battery.sh` (New ADB profiling script)
  - `docs/research/competitor-reverse-engineering/15-IMPLEMENTATION-READINESS-GATE.md`
- **Required Changes:**
  1. Script resets `adb shell dumpsys batterystats --reset`.
  2. Executes simulated 8-hour shift with continuous foreground service location tracking.
  3. Pulls battery drain percentage and background CPU time attributable to `com.oprino.app`.
- **Acceptance Criteria:**
  - Verified empirical power consumption remains under 8.0% over an 8-hour simulated duty cycle.
  - Generates structured JSON report with mAh consumed per subsystem (GPS, CPU, Radio).
- **Estimated Effort:** 3 Story Points.
- **Regression Tests:** Mobile test harness.
- **Dependencies:** Physical device connected via ADB.

---

### [PERF-001] MapLibre Marker Clustering for Large Fleets (>100 Pins)
- **Evidence & Rationale:** In `apps/web/src/app/live-map/page.tsx`, every live worker pin is rendered as an individual GeoJSON DOM marker. For enterprise workspaces with > 100 simultaneous field personnel, marker DOM nodes cause frame-rate drops during panning and zooming.
- **Impacted Files:**
  - `apps/web/src/app/live-map/page.tsx`
- **Required Changes:**
  1. Configure MapLibre GL GeoJSON source with `cluster: true`, `clusterMaxZoom: 14`, and `clusterRadius: 50`.
  2. Add circle layer for cluster count badges (`get: 'point_count'`).
  3. Clicking a cluster zooms into the boundary of contained workers.
- **Acceptance Criteria:**
  - Smooth 60 FPS map panning when rendering 500 simulated moving worker coordinates.
  - Expanding clusters reveals individual worker status pills.
- **Estimated Effort:** 3 Story Points.
- **Regression Tests:** Live map rendering tests.
- **Dependencies:** MapLibre GL JS.

---

### [REL-001] Cellular/Wi-Fi Handover Network Watchdog
- **Evidence & Rationale:** Field executives exiting an office Wi-Fi network and transitioning to 4G LTE sometimes experience hanging HTTP connection pools, delaying outbox sync until the app is refreshed.
- **Impacted Files:**
  - `apps/mobile/lib/core/sync/sync_service.dart`
  - `apps/mobile/lib/core/network/api_client_provider.dart`
- **Required Changes:**
  1. Listen to `connectivity_plus` network change stream.
  2. On network interface change (Wi-Fi -> Mobile or vice versa), immediately abort stale in-flight connections with a 5-second socket timeout and trigger an immediate outbox queue flush.
- **Acceptance Criteria:**
  - Outbox flushes automatically within 3 seconds of cellular connection re-establishment without user intervention.
- **Estimated Effort:** 3 Story Points.
- **Regression Tests:** `media_workflow_and_offline_reliability_test.dart`.
- **Dependencies:** None.

---

## 4. Priority P2: Competitor-Parity Operational Enhancements

### [PAR-001] Vehicle Odometer Photo Capture & Conveyance Allowance
- **Evidence & Rationale:** Unolo's #1 competitive selling point in India is automated conveyance claim verification. Oprino already calculates GPS Haversine distance (`dailyTravelSummaries`), but lacks the odometer photo capture and fuel rate reimbursement calculator needed by fleet managers.
- **Impacted Files:**
  - `packages/database/src/schema/attendance.ts` (Add `start_odometer_km`, `end_odometer_km`, `start_odometer_media_key`, `end_odometer_media_key`, `fuel_allowance_amount`)
  - `services/api/src/services/attendance.service.ts`
  - `apps/mobile/lib/features/attendance/presentation/widgets/attendance_selfie_sheet.dart`
  - `apps/web/src/app/attendance/page.tsx`
- **Required Changes:**
  1. Add optional workspace policy: `ODOMETER_TRACKING_REQUIRED`.
  2. When enabled, punch-in requires entering initial odometer number and camera photo of the vehicle dashboard.
  3. Punch-out requires ending odometer number and photo.
  4. Server calculates:  
     $$\text{Claimed Distance} = \text{End Odometer} - \text{Start Odometer}$$  
     $$\text{Discrepancy} = |\text{Claimed Distance} - \text{GPS Calculated Distance}|$$
  5. Flags discrepancy if variance exceeds 15% and computes payable allowance based on workspace fuel rate (e.g. ₹3.50/km for bike, ₹8.00/km for car).
- **Acceptance Criteria:**
  - Manager attendance report displays both GPS distance and claimed odometer photos side-by-side.
  - Automatically calculates fuel reimbursement expense amount.
- **Estimated Effort:** 8 Story Points.
- **Regression Tests:** `task-attendance.integration.test.ts`.
- **Dependencies:** Cloudflare R2 presigned media upload.

---

### [PAR-002] WhatsApp Business Cloud API Dispatch Webhooks
- **Evidence & Rationale:** TaskOPad leverages WhatsApp notifications to achieve high task acknowledgment rates in the Indian market. Field technicians on two-wheelers often miss mobile push notifications but check WhatsApp messages immediately.
- **Impacted Files:**
  - `services/api/src/services/notification.service.ts`
  - `services/worker/src/worker.ts`
  - `packages/contracts/src/notifications.ts`
- **Required Changes:**
  1. Implement a WhatsApp Cloud API outbound webhook dispatcher in `notification.service.ts`.
  2. When a task with `priority: 'URGENT'` is assigned, the worker enqueues a `whatsapp.dispatch.send` job.
  3. Sends structured template message with Task Title, Client Address, Due Time, and deep-link into Oprino mobile app.
- **Acceptance Criteria:**
  - Configurable per-workspace with encrypted Meta access token and phone number ID.
  - Dispatches template message within 5 seconds of task assignment.
- **Estimated Effort:** 5 Story Points.
- **Regression Tests:** `phase-05.unit.test.ts`.
- **Dependencies:** Meta WhatsApp Business Cloud API account.

---

### [PAR-003] Automated Day-Gap Task Morning Rollover
- **Evidence & Rationale:** TaskOPad's Day-Gap workflow automatically carries forward uncompleted tasks from yesterday to today, preventing field tasks from becoming "lost" in past dates.
- **Impacted Files:**
  - `services/worker/src/worker.ts`
  - `services/api/src/services/task.service.ts`
- **Required Changes:**
  1. Scheduled worker job `tasks.daygap.rollover` runs daily at 04:00 AM local workspace time.
  2. Finds tasks where `due_at < NOW()` and `status NOT IN ('COMPLETED', 'VERIFIED')` with `auto_rollover: true`.
  3. Advances `due_at` to today's shift end and records task activity log: `task.daygap_rolled_over`.
- **Acceptance Criteria:**
  - Technicians see yesterday's uncompleted tasks on their "Today" tab upon morning punch-in.
  - Manager receives a summary notification of rolled-over tasks.
- **Estimated Effort:** 3 Story Points.
- **Regression Tests:** `phase-04.unit.test.ts`.
- **Dependencies:** None.

---

## 5. Priority P3: Future Differentiation

### [DIFF-001] Kinematic Teleportation Visual Flags on Live Map
- **Evidence & Rationale:** While the backend drops points with speeds > 45 m/s, managers currently have no visual indication on the web map when an employee attempts GPS spoofing or location manipulation.
- **Impacted Files:**
  - `apps/web/src/app/live-map/page.tsx`
  - `services/api/src/services/telemetry.service.ts`
- **Required Changes:**
  1. Emit `TELEPORTATION_WARNING` event over SSE when a rejected anomaly point is received.
  2. Web map flashes an amber alert icon on the worker's pin with tooltip: `"Impossible speed detected (142 km/h) — check-in flagged for review."`
- **Acceptance Criteria:**
  - Immediate visual feedback on the supervisor dashboard without page refresh.
- **Estimated Effort:** 5 Story Points.
- **Regression Tests:** Live map telemetry tests.
- **Dependencies:** Redis PubSub SSE stream.

---

### [DIFF-002] Offline Voice Dictation for Field Visit Notes
- **Evidence & Rationale:** Field technicians working on greasy machinery or wearing protective gloves struggle to type long inspection notes on small smartphone touchscreens.
- **Impacted Files:**
  - `apps/mobile/lib/features/visits/presentation/visits_view.dart`
  - `apps/mobile/lib/features/tasks/presentation/task_detail_screen.dart`
- **Required Changes:**
  1. Add native speech-to-text button using `speech_to_text` Flutter plugin.
  2. Transcribes voice note to text field on device without requiring active internet connectivity.
- **Acceptance Criteria:**
  - Populates visit note text field with transcribed audio in Hindi and English.
- **Estimated Effort:** 5 Story Points.
- **Regression Tests:** Mobile visit sheet test.
- **Dependencies:** Device speech recognition engine.

---
*End of Document 19 — Zero-Duplicate Incremental Improvement Backlog*
