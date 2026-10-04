# ADR-009: Offline-First Mobile Storage & Synchronization Architecture

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, Mobile Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Field workers and mobile operators frequently work in environments with degraded or zero cellular connectivity: building basements, steel-reinforced industrial plants, elevators, and remote rural facilities.
The Phase 00 frozen product requirements mandate:
- **Offline-First Execution:** Employees must be able to view their assigned agenda, transition task states (`Accepted` → `En Route` → `Arrived` → `In Progress` → `Completed`), update checklists, capture photo proofs, record customer signatures, and punch attendance while completely offline.
- **Reliable Delta Synchronization:** When connectivity returns, the local queue must replay safely to the server without duplicate executions, state corruption, or data loss.
- **Idempotency & Determinism:** Network drops during an upload must not result in duplicate tasks, double attendance punches, or lost field notes.
- **Large Attachment Handling:** Photo proofs and signature captures must be handled asynchronously so large binary uploads do not block operational text/status updates.

---

## 2. Alternatives Evaluated (Local Mobile Storage)

### Alternative A: Native Embedded SQLite via JSI (`op-sqlite` / Raw SQLite with Repository Pattern)
- **Overview:** Modern, ultra-fast SQLite driver using direct React Native JavaScript Interface (JSI) C++ bindings.
- **Pros:**
  - Sub-millisecond SQL queries directly on the device thread without bridge serialization.
  - Standard relational schema mirroring server models; supports ACID transactions, foreign keys, and indexes.
  - Clean separation: Local tables store cached entities (`cached_tasks`, `cached_sites`) and an append-only `outbox_mutations` queue.
  - Zero proprietary sync lock-in; maximum developer control over retry backoff, priority queueing, and conflict resolution.
- **Cons:** Requires implementing the local repository and sync queue processor (well-established engineering pattern).

### Alternative B: WatermelonDB (Reactive SQLite Abstraction)
- **Overview:** High-level reactive database for React Native backed by SQLite, designed for lazy loading.
- **Pros:** Excellent observable streams for UI reactivity.
- **Cons:** Heavy custom schema DSL; complex built-in sync protocol that requires specific server adapter formatting; difficult to customize for multi-part binary photo queueing.

### Alternative C: Key-Value / Document Stores (MMKV / AsyncStorage)
- **Overview:** Fast key-value stores.
- **Pros:** Simple to set up.
- **Cons:** Incapable of complex relational querying (e.g., sorting tasks by customer site proximity, querying checklist completion status); risks corruption when storing large relational queues.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | Embedded SQLite (`op-sqlite`) | WatermelonDB | Key-Value (MMKV/AsyncStorage) |
|---|:---:|:---:|:---:|:---:|
| **Query Performance & Speed (JSI)** | 25% | **10 / 10** | 9 / 10 | 7 / 10 |
| **Relational Integrity & ACID Transactions**| 25% | **10 / 10** | 9 / 10 | 2 / 10 (No relational engine)|
| **Custom Outbox & Photo Queue Control** | 20% | **10 / 10** | 7 / 10 | 5 / 10 |
| **Idempotency & Conflict-Aware Replay** | 15% | **9.5 / 10** | 8 / 10 | 4 / 10 |
| **Maintenance Simplicity & Open Standards**| 15% | **9.5 / 10 (Pure SQLite)** | 7 / 10 (Custom DSL) | 8 / 10 |
| **Weighted Total** | **100%** | **9.83 / 10** | **8.15 / 10** | **4.90 / 10** |

---

## 4. Decision

**Adopt Native Embedded SQLite (via `op-sqlite`) using an Outbox Pattern with an append-only `outbox_mutations` queue and Client-Generated UUIDv4 Identifiers for Application Domain State.**

### Explicit Engine Separation (Domain SQLite vs Geolocation SDK):
1. **Application Domain SQLite (`op-sqlite`):**
   - Strictly dedicated to business entities: cached tasks, checklists, attendance punch-in/out records, customer site visits, proof photos/signatures, draft forms, notes, and the `outbox_mutations` queue.
   - Responsible for business state transitions and offline operational continuity.
2. **Background Geolocation SDK Native Persistence:**
   - As established in [`ADR-008`](file:///workspace/oprino/docs/architecture/ADR-008-background-location.md), high-frequency continuous location breadcrumbs are stored and managed exclusively within Transistor Software's native C++/Kotlin/Swift SQLite queue and uploaded directly via its native HTTP client to `/v1/telemetry/locations`.
   - Continuous GPS breadcrumbs are **NEVER** duplicated into the application's `op-sqlite` domain outbox, avoiding two competing sync engines and double-write overhead.

### Architectural Schema & Synchronization Workflow:

```mermaid
sequenceDiagram
    autonumber
    actor Worker as Field Worker (Offline)
    participant UI as Mobile UI Screen
    participant LocalDB as Local SQLite (op-sqlite)
    participant Sync as Background Sync Worker
    participant API as Fastify Backend API
    participant S3 as Object Storage (S3)

    Note over Worker,LocalDB: Worker in basement with 0 bars of signal
    Worker->>UI: Ticks Checklist & Takes Photo Proof
    UI->>LocalDB: 1. Update local cached_tasks table (Immediate UI update)
    UI->>LocalDB: 2. INSERT into outbox_mutations {mutation_id, action, payload, status: 'PENDING'}
    UI->>LocalDB: 3. INSERT into media_upload_queue {photo_id, file_path, status: 'PENDING'}
    UI-->>Worker: Show "Completed (Offline - Queued for Sync)"

    Note over Worker,Sync: Worker exits basement; 4G connectivity restored
    Sync->>LocalDB: Check pending outbox items
    Sync->>API: POST /api/v1/sync/batch {mutations: [...]}
    API->>API: Process mutations idempotently (using mutation_id)
    API-->>Sync: Return sync acknowledgement {success: true, updated_entities: [...]}
    Sync->>LocalDB: Mark outbox mutations as SYNCED (or delete)
    
    Sync->>LocalDB: Check pending media uploads
    Sync->>API: POST /api/v1/media/presigned-url {photo_id, mime_type}
    API-->>Sync: Return pre-signed S3 PUT URL
    Sync->>S3: Binary upload directly to S3
    Sync->>API: POST /api/v1/media/confirm {photo_id, task_id}
    Sync->>LocalDB: Mark photo as UPLOADED
```

---

## 5. Core Architectural Invariants for Offline Resilience

1. **Client-Generated UUIDs (No Auto-Increment IDs):**
   - All entities created offline (e.g., visit check-ins, task notes, photo proofs) generate standard RFC 4122 UUIDv4 identifiers locally on the mobile device. This allows local relational links (linking a photo to a visit) to be established before the server ever sees the record.
2. **Deterministic Mutation Outbox Table:**
   ```sql
   CREATE TABLE outbox_mutations (
     id TEXT PRIMARY KEY,               -- UUIDv4 client mutation id
     workspace_id TEXT NOT NULL,
     entity_type TEXT NOT NULL,         -- 'TASK', 'VISIT', 'ATTENDANCE'
     entity_id TEXT NOT NULL,
     action_type TEXT NOT NULL,         -- 'UPDATE_STATUS', 'CHECK_ITEM'
     payload_json TEXT NOT NULL,        -- serialized mutation payload
     client_recorded_at TEXT NOT NULL,  -- ISO-8601 device hardware timestamp
     retry_count INTEGER DEFAULT 0,
     status TEXT DEFAULT 'PENDING',     -- 'PENDING', 'PROCESSING', 'FAILED'
     created_at TEXT NOT NULL
   );
   ```
3. **Idempotent Server Ingestion:**
   - Every mutation sent to `/api/v1/sync/batch` includes the `client_mutation_id`.
   - The backend records processed IDs in an `idempotency_keys` table. If a network blip causes the client to resend a batch, the server recognizes the ID and returns the cached success response without re-executing state transitions.
4. **Decoupled Binary Upload Queue:**
   - Photos, attachments, and signatures are queued in a separate `media_upload_queue` table.
   - Text mutations (status transitions, checklist ticks) are small (< 2 KB) and sync instantly over 2G/3G connections.
   - Heavy image binaries (100–350 KB) upload in the background with exponential backoff and resume capabilities, preventing large files from blocking operational status updates.

---

## 6. Consequences & Mitigations

- **Consequence:** Stale data can exist on device if assigned tasks were cancelled by a manager while worker was offline.  
  *Mitigation:* Upon reconnect, the inbound sync pull runs first to refresh active task states before replaying invalid outbound mutations. Detailed conflict resolution rules are codified in [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](file:///workspace/oprino/docs/architecture/SYNC-CONFLICT-MATRIX.md).
- **Consequence:** Clock drift or manipulated device time on the mobile device.  
  *Mitigation:* The client records both the device local time and monotonic boot uptime. The server cross-verifies client timestamps against server receipt time; anomalies exceeding 15 minutes are flagged in audit logs.
- **Reversal Cost:** Low to Medium. Standard SQLite schemas are portable across any mobile framework or native layer.
