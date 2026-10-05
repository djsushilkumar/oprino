# ADR-009: Offline-First Mobile Storage & Synchronization Architecture (Flutter Baseline)

**Status:** APPROVED (Updated for Modern Drift Native SQLite Architecture)  
**Date:** October 2026 (Revised & Re-Architected)  
**Deciders:** Lead Systems Architect, Mobile Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))  
**Underlying Framework:** Flutter Stable (Phase 01C Scaffolding; Reference Baseline: Flutter 3.47 / Stable Dart Toolchain) ([`ADR-001`](file:///workspace/oprino/docs/architecture/ADR-001-mobile-framework.md))  
**Superseded Storage:** `op-sqlite` (React Native-specific driver superseded)  
**Selected Storage Architecture:** **Drift + SQLite (`package:drift` + `package:sqlite3` with bundled native SQLite)**

---

## 1. Context & Problem Statement

Field workers and mobile operators frequently work in environments with degraded or zero cellular connectivity: building basements, steel-reinforced industrial plants, elevators, and remote rural facilities.
The Phase 00 frozen product requirements mandate:
- **Offline-First Execution:** Employees must be able to view their assigned agenda, transition task states (`Accepted` → `En Route` → `Arrived` → `In Progress` → `Completed`), update checklists, capture photo proofs, record customer signatures, and punch attendance while completely offline.
- **Reliable Delta Synchronization:** When connectivity returns, the local queue must replay safely to the server without duplicate executions, state corruption, or data loss.
- **Idempotency & Determinism:** Network drops during an upload must not result in duplicate tasks, double attendance punches, or lost field notes.
- **Large Attachment Handling:** Photo proofs and signature captures must be handled asynchronously so large binary uploads do not block operational text/status updates.

Following the stakeholder decision to build Oprino mobile with Flutter, the previous React Native-specific SQLite driver (`op-sqlite`) is removed, and local database options for Flutter are evaluated under modern Dart persistence architectures.

---

## 2. Alternatives Evaluated (Flutter Local Persistence)

### Alternative A: Drift + SQLite (`package:drift` + `package:sqlite3` with Bundled Native SQLite)
- **Overview:** Modern, type-safe, reactive persistence library for Dart/Flutter built directly on top of SQLite using official native bindings.
- **Architecture Pipeline:**
  ```text
  Flutter Domain Layer
        ↓
      Drift
        ↓
  package:sqlite3
        ↓
  Bundled Native SQLite
  ```
- **Key Technical Capabilities:**
  - **ACID Transactions:** Full native SQLite transaction semantics with savepoints, nested transactions, and rollback safety.
  - **Compile-Time Type Safety:** SQL queries written in Dart or `.drift` files are analyzed and verified at compile-time by `drift_dev`, eliminating runtime SQL syntax errors and schema mismatches.
  - **Step-by-Step Schema Migrations:** Declarative schema migrations with built-in automated migration verification tests (`drift_dev schema verify`).
  - **Isolate-Safe Background Execution:** Modern Drift architecture supports dedicated background database execution via `NativeDatabase.createInBackground(...)`. Heavy queries, offline outbox serialization, and synchronization tasks execute on a dedicated background isolate without blocking the main UI thread.
  - **Direct Native Performance:** Direct C-level interaction via `package:sqlite3` bypasses Flutter platform channel serialization completely, delivering sub-millisecond query execution.
  - **Testability:** In-memory execution (`NativeDatabase.memory()`) allows lightning-fast unit and repository testing in pure Dart on local developer workstations and CI runners without launching mobile emulators.

### Alternative B: Raw sqflite (`sqflite`)
- **Overview:** Traditional Flutter SQLite plugin communicating across native Android/iOS platform channels.
- **Pros:** Mature community package.
- **Cons:**
  - Untyped raw SQL strings: Typos and type mismatches fail only at runtime.
  - Platform Channel Overhead: Marshaling data across platform channels adds serialization latency on large datasets.
  - Weak Background Isolate Support: Accessing the database from background isolates is complex because platform channels require an active Flutter engine.
  - Manual Migrations: Lacks automated schema migration verification tools.

### Alternative C: ObjectBox (`objectbox`)
- **Overview:** High-performance NoSQL object database written in C/C++.
- **Pros:** Blazing fast raw object read/write benchmarks.
- **Cons:**
  - Non-relational model: Lacks native SQL relational joins, composite foreign keys, and cascading deletes.
  - Outbox Pattern Friction: Modeling complex relational outbox dependencies (task → checklists → signatures → attachments) requires custom transactional logic.
  - Proprietary native engine / commercial licensing considerations.

### Alternative D: Isar Database (`isar`)
- **Overview:** Fast NoSQL document database developed for Flutter.
- **Pros:** Clean Dart-centric query syntax.
- **Cons:**
  - Governance & Maintenance Instability: Project suffered prolonged development hiatuses, abandoned releases, and maintainer turnover.
  - Non-relational structure unsuited for relational outbox modeling with strict foreign key constraints.

---

## 3. Comparative Evaluation Matrix (Flutter Persistence)

| Evaluation Criterion | Weight | Drift + SQLite | Raw sqflite | ObjectBox | Isar |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. ACID Transactions & Outbox Safety** | 20% | **10 / 10** | 8.5 / 10 | 7 / 10 | 6 / 10 |
| **2. Relational Queries & Foreign Keys** | 15% | **10 / 10** | 9 / 10 | 5 / 10 | 4 / 10 |
| **3. Schema Migrations & Verifier Tooling**| 15% | **10 / 10** | 6 / 10 | 6.5 / 10 | 5 / 10 |
| **4. Background Isolate Concurrency** | 15% | **10 / 10** | 5 / 10 | 8 / 10 | 7 / 10 |
| **5. Native Query Performance** | 10% | **9.5 / 10** | 7 / 10 | **10 / 10** | 9.5 / 10 |
| **6. Unit Testability (In-Memory CI)** | 10% | **10 / 10** | 6 / 10 | 8 / 10 | 7.5 / 10 |
| **7. Ecosystem Stability & Maintenance** | 10% | **10 / 10** | 8.5 / 10 | 7.5 / 10 | 4 / 10 |
| **Weighted Total** | **100%** | **9.93 / 10** | **7.30 / 10** | **6.95 / 10** | **5.75 / 10** |

---

## 4. Decision

**Adopt Drift + SQLite (`package:drift` + `package:sqlite3` with Bundled Native SQLite) as the Exclusive Mobile Local Storage & Offline Outbox Engine.**

### Explicit Engine Separation (Domain SQLite vs. Geolocation SDK):
1. **Application Domain SQLite (`drift`):**
   - Strictly dedicated to business entities: cached tasks, checklists, attendance punch-in/out records, customer site visits, proof photos/signatures, draft forms, notes, and the `outbox_mutations` queue.
   - Manages local business state transitions and offline operational continuity.
   - Utilizes `NativeDatabase.createInBackground(...)` to isolate database I/O from the Flutter UI thread.
2. **Background Geolocation SDK Native Persistence:**
   - As established in [`ADR-008`](file:///workspace/oprino/docs/architecture/ADR-008-background-location.md), high-frequency continuous location breadcrumbs are stored and managed exclusively within Transistor Software's native SQLite queue and uploaded directly via its native HTTP client to `/v1/telemetry/locations`.
   - Continuous GPS breadcrumbs are **NEVER** duplicated into the application's Drift domain outbox, avoiding competing sync engines and double-write overhead.

### Architectural Schema & Synchronization Workflow:

```mermaid
sequenceDiagram
    autonumber
    actor Worker as Field Worker (Offline)
    participant UI as Mobile UI Screen (Flutter)
    participant DriftDB as Drift SQLite (NativeDatabase.createInBackground)
    participant SyncIsolate as Background Sync Worker
    participant API as Fastify Backend API
    participant S3 as Object Storage (MinIO / S3)

    Note over Worker,DriftDB: Worker in basement with 0 bars of signal
    Worker->>UI: Ticks Checklist & Takes Photo Proof
    UI->>DriftDB: 1. Update local cached_tasks table (Immediate UI update via Drift Stream)
    UI->>DriftDB: 2. INSERT into outbox_mutations {mutation_id, action, payload, status: 'PENDING'}
    UI->>DriftDB: 3. INSERT into media_upload_queue {photo_id, file_path, status: 'PENDING'}
    UI-->>Worker: Show "Completed (Offline - Queued for Sync)"

    Note over Worker,SyncIsolate: Worker exits basement; 4G connectivity restored
    SyncIsolate->>DriftDB: Check pending outbox items (via background isolate connection)
    SyncIsolate->>API: POST /v1/sync/mutations via Dio {mutations: [...]}
    API->>API: Process mutations idempotently (using mutation_id)
    API-->>SyncIsolate: Return sync acknowledgement {success: true, updated_entities: [...]}
    SyncIsolate->>DriftDB: Mark outbox mutations as SYNCED (or delete)
    
    SyncIsolate->>DriftDB: Check pending media uploads
    SyncIsolate->>API: POST /v1/media/presigned-url {photo_id, mime_type}
    API-->>SyncIsolate: Return pre-signed S3 PUT URL
    SyncIsolate->>S3: Binary upload directly to S3
    SyncIsolate->>API: POST /v1/media/confirm {photo_id, task_id}
    SyncIsolate->>DriftDB: Mark photo as UPLOADED
```

---

## 5. Core Architectural Invariants for Offline Resilience

1. **Client-Generated UUIDv4 Identifiers:**
   - All entities created offline (visit check-ins, task notes, photo proofs) generate standard RFC 4122 UUIDv4 identifiers locally on the mobile device. This allows local relational links (e.g. linking a signature to a task) to be established before the server ever receives the record.
2. **Deterministic Mutation Outbox Table (Drift Schema Definition):**
   ```dart
   class OutboxMutations extends Table {
     TextColumn get id => text()(); // UUIDv4 client mutation id
     TextColumn get workspaceId => text()();
     TextColumn get entityType => text()(); // 'TASK', 'VISIT', 'ATTENDANCE'
     TextColumn get entityId => text()();
     TextColumn get actionType => text()(); // 'UPDATE_STATUS', 'CHECK_ITEM'
     TextColumn get payloadJson => text()(); // serialized mutation payload
     DateTimeColumn get clientRecordedAt => dateTime()(); // device hardware timestamp
     IntColumn get retryCount => integer().withDefault(const Constant(0))();
     TextColumn get status => text().withDefault(const Constant('PENDING'))();
     DateTimeColumn get createdAt => dateTime()();

     @override
     Set<Column> get primaryKey => {id};
   }
   ```
3. **Idempotent Server Ingestion:**
   - Every mutation sent to `/v1/sync/mutations` includes the `client_mutation_id`.
   - Fastify records processed IDs in an `idempotency_keys` table. If network disruption causes the client to resend a batch, Fastify returns the cached success response without re-executing state transitions.
4. **Decoupled Binary Upload Queue:**
   - Photos, attachments, and signatures are queued in a separate `media_upload_queue` table.
   - Text mutations (status transitions, checklist ticks) are small (< 2 KB) and sync instantly over 2G/3G connections.
   - Heavy image binaries (100–350 KB) upload in the background with exponential backoff and resume capabilities, preventing large files from blocking operational status updates.

---

## 6. Consequences & Mitigations

- **Consequence:** Code generation step required (`dart run build_runner build`) for Drift tables.  
  *Mitigation:* Integrated into developer toolchains and CI pre-build scripts. Drift's incremental generator executes in < 3 seconds on standard codebases.
- **Consequence:** Stale data can exist on device if assigned tasks were cancelled by a manager while worker was offline.  
  *Mitigation:* Upon reconnect, the inbound sync pull runs first to refresh active task states before replaying invalid outbound mutations. Detailed conflict resolution rules are codified in [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](file:///workspace/oprino/docs/architecture/SYNC-CONFLICT-MATRIX.md).
- **Consequence:** Clock drift or manipulated device time on the mobile device.  
  *Mitigation:* The client records both the device local time and monotonic boot uptime. The server cross-verifies client timestamps against server receipt time; anomalies exceeding 15 minutes are flagged in audit logs.
