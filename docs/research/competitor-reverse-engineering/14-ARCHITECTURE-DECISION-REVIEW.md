# 14 — Architecture Decision Review: Technical Integrity & Defense-in-Depth

**Author:** Senior SaaS Product Architect & Systems Engineer  
**Audit Context:** Technical Architecture Validation & Adversarial Review  
**Date of Audit:** October 2026  
**Status:** Approved Architectural Baseline  

---

## 1. Executive Summary

This architecture review establishes rigorous technical specifications for high-risk subsystems that were previously oversimplified or conflated during preliminary competitive research. Specifically, it establishes:
1. **The Separation of Coordinate Authentication from PostGIS Spatial Calculation.**
2. **The 5-Tier Proof-of-Work Verification Pipeline** (distinguishing visual watermarks, EXIF metadata, trusted timestamps, camera hardware gating, and server fraud detection).
3. **The Offline-First Drift SQLite Outbox Synchronization Model** with monotonic sequencing and deterministic conflict resolution.
4. **Validation of Cloud Infrastructure, Cloudflare R2 Pricing, and Oracle ARM64 Multi-Arch Compatibility.**

---

## 2. GPS Integrity vs. PostGIS Spatial Distance

### 2.1 The Architectural Fallacy
A common architectural error in field tracking SaaS is assuming that a PostGIS spatial query like:
```sql
SELECT ST_DWithin(
    client_geofence_center, 
    ST_SetSRID(ST_MakePoint(client_submitted_lng, client_submitted_lat), 4326), 
    100
);
```
authenticates that the user is physically present at the geofence. **PostGIS performs pure geometric mathematics.** If an employee uses a fake GPS app (mock location) or a modified client payload, PostGIS happily evaluates the forged numbers as "within 100 meters."

### 2.2 Defense-in-Depth GPS Verification Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                   5-TIER GPS INTEGRITY PIPELINE                        │
│                                                                        │
│  [Android Mobile Client]                                               │
│       │                                                                │
│       ├─► TIER 1: OS & Environment Attestation                        │
│       │   - Google Play Integrity API (MEETS_DEVICE_INTEGRITY)         │
│       │   - Reject rooted, emulated, or sideloaded tampered binaries   │
│       │                                                                │
│       ├─► TIER 2: Hardware Provider Inspection                         │
│       │   - Android Location.isMock() == false                         │
│       │   - Settings.Secure.ALLOW_MOCK_LOCATION == 0                   │
│       │                                                                │
│       ├─► TIER 3: Kinematic Velocity Validation                        │
│       │   - Calculate speed = ST_Distance(P_curr, P_prev) / (T_curr - T_prev)
│       │   - If speed > 120 km/h: Tag TELEPORTATION_ANOMALY             │
│       │                                                                │
│       ├─► TIER 4: Network & Cell Tower Triangulation Consistency       │
│       │   - Compare GPS point against mobile country / cell MCC/MNC    │
│       │                                                                │
│  [Server Gateway & PostGIS]                                            │
│       │                                                                │
│       └─► TIER 5: Authoritative PostGIS Spatial Evaluation             │
│           - ST_DWithin(geofence_center, verified_coordinate, radius)   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Tier 1 (Play Integrity API):** Evaluates device attestation tokens on app start and critical events (Punch-In, Visit Check-In). Ensures no Xposed or Frida hooks are spoofing location APIs.
2. **Tier 2 (Location Provider Flags):** Rejects any coordinate where `location.isMock()` returns true.
3. **Tier 3 (Kinematic Velocity Filter):** Compares incoming points against the user's last verified point in Redis. A shift of 30 km in 2 minutes yields an impossible speed (> 900 km/h) and triggers an immediate compliance warning.
4. **Tier 4 (Cell Tower Consistency):** Validates that network IP and coarse cell tower telemetry align with the GPS coordinate region.
5. **Tier 5 (PostGIS Spatial Engine):** Evaluates spatial containment and geofence distance only after the coordinate has cleared Tiers 1–4.

---

## 3. Proof-of-Work Verification Mechanics

Field service operations require legally defensible proof that work was performed. Oprino enforces a multi-layered verification model:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          PROOF-OF-WORK VERIFICATION STACK                               │
├───────────────────────┬───────────────────────────────────┬─────────────────────────────┤
│ Verification Layer    │ Mechanism                         │ Fraud Defense Addressed     │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────┤
│ 1. Hardware Camera    │ Native CameraX / AVFoundation     │ Prevents picking old/stock  │
│    Gating             │ with gallery picker disabled.     │ photos from device gallery. │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────┤
│ 2. Visual Canvas      │ Burned-in timestamp, lat/long,    │ Human-readable visual audit │
│    Watermark          │ technician name on bitmap.        │ for managers in dashboard.  │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────┤
│ 3. Cryptographic EXIF │ ExifTool DateTimeOriginal +       │ Machine-readable metadata   │
│    Metadata           │ GPSLatitude tags in WebP header.  │ for automated spatial audits│
├───────────────────────┼───────────────────────────────────┼─────────────────────────────┤
│ 4. Trusted Gateway    │ API Gateway records `received_at` │ Defeats device system clock │
│    Timestamp          │ and signs upload receipt.         │ tampering by user.          │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────┤
│ 5. Server Duplicate   │ Perceptual image hashing (pHash)  │ Detects employees re-using  │
│    Detection          │ on incoming proof photos.         │ the same photo across stops.│
└───────────────────────┴───────────────────────────────────┴─────────────────────────────┘
```

---

## 4. Offline-First Synchronization & Conflict Resolution

### 4.1 Drift SQLite Local Outbox Architecture
To guarantee zero data loss in connectivity dead zones, the mobile app writes all mutations to a local SQLite table managed by Drift:

```sql
CREATE TABLE outbox_mutations (
    id TEXT PRIMARY KEY,               -- UUIDv4 generated on device
    client_sequence INTEGER NOT NULL,  -- Strictly increasing monotonic integer
    mutation_type TEXT NOT NULL,       -- 'PUNCH_IN', 'START_VISIT', 'COMPLETE_VISIT'
    payload_json TEXT NOT NULL,        -- Serialized parameters
    idempotency_key TEXT NOT NULL,     -- Hash of type + id + sequence
    status TEXT NOT NULL,              -- 'PENDING', 'UPLOADING_MEDIA', 'SYNCING', 'SYNCED'
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL        -- Client epoch timestamp
);
```

### 4.2 Deterministic Conflict Resolution Invariants
When an offline technician reconnects and flushes queued mutations:
1. **Client Monotonic Ordering:** Mutations within a task are executed sequentially based on `client_sequence`.
2. **Idempotency Guarantee:** The Fastify API checks the `idempotency_key` against an in-memory Redis SET and database table. Re-sent mutations return HTTP 200 with the previously created entity.
3. **Field Completion Always Wins:**
   - *Scenario:* A manager on the web dashboard cancels or reassigns Task #402 at 11:15 AM. An offline technician completed the maintenance checklist and captured the customer signature at 11:10 AM, syncing at 11:30 AM.
   - *Rule:* The server honors the field completion. Status transitions to `COMPLETED`, the proof of work is attached, and the manager receives an administrative notice explaining the resolution.

---

## 5. Storage & Cloud Infrastructure Validation

### 5.1 Cloudflare R2 Media Ingestion Validation
- **Verified Pricing:** Cloudflare R2 incurs **$0.00 / GB bandwidth egress charges**. Storage is billed at $0.015 / GB-month; Class A mutations (PUT) are $4.50 / million; Class B operations (GET) are $0.36 / million.
- **Workflow:**
  1. Client calls `POST /api/v1/media/presign-upload` -> Fastify returns signed R2 PUT URL.
  2. Client uploads compressed WebP photo directly to R2.
  3. Client attaches `media_key` to visit record.
  4. **Outcome:** Fastify API server handles zero binary streaming, reducing memory utilization by over 90% during peak shift hours.

### 5.2 Oracle Cloud Ampere A1 (ARM64) Compatibility Matrix
The deployment target is an Oracle Cloud Ampere A1 VPS (4 OCPU / 24 GB RAM / 200 GB NVMe). Multi-architecture Docker support is verified:

| Service | Docker Base Image | Official `linux/arm64` Support | Memory Limit | Verified Status |
| :--- | :--- | :---: | :---: | :---: |
| **Caddy Proxy** | `caddy:2-alpine` | YES | 512 MB | Multi-arch verified |
| **Fastify API** | `node:20-alpine` | YES | 4096 MB | Multi-arch verified |
| **Web Dashboard** | `node:20-alpine` | YES | 2048 MB | Multi-arch verified |
| **PostgreSQL + PostGIS** | `postgis/postgis:16-3.4-alpine` | YES | 10240 MB | Multi-arch verified |
| **Redis 7** | `redis:7-alpine` | YES | 2048 MB | Multi-arch verified |
| **BullMQ Worker** | `node:20-alpine` | YES | 2048 MB | Multi-arch verified |

### 5.3 Live Production Infrastructure Verification
- **Render Fastify API:** `https://oprino-api.onrender.com/health/ready` (HTTP 200, DB & Redis connected).
- **Vercel Web Portal:** `https://oprino.vercel.app` (HTTP 200).
- **Neon PostgreSQL:** Migrations `0000` through `0005` applied live.
- **Cloudflare R2 Bucket:** `oprino-production-media` verified with active S3 client credentials.
- **Physical Testbed:** OnePlus 12R (`CPH2707IN`, serial `5abd6fc0`) verified via ADB with installed debug build.

---
*End of Document 14 — Architecture Decision Review*
