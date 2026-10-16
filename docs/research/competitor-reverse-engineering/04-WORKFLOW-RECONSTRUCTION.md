# Competitor & Oprino Workflow Reconstruction

**Document:** End-to-End User Experience & Operational Flow Analysis  
**Auditor:** Senior UX Research Lead & SaaS Product Architect  
**Date:** October 15, 2026  

---

## 1. Workflow 1: Owner Creates Organization & Workspace

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant Web as Web Dashboard (Next.js 15)
    participant Auth as Auth Engine (Better Auth)
    participant API as Fastify API
    participant DB as PostgreSQL 17 (PostGIS)

    Owner->>Web: Navigate to /auth/signup (Email, Password, Name)
    Web->>Auth: POST /api/auth/sign-up/email
    Auth->>DB: INSERT INTO users (hash password, generate UUID)
    Auth-->>Web: Session Token (HTTPOnly Cookie + Bearer)
    Owner->>Web: Enter Workspace Name (e.g. "Apex Industrial Ops")
    Web->>API: POST /v1/workspaces (Authorization Header)
    API->>DB: BEGIN Transaction
    API->>DB: INSERT INTO workspaces (name, retention=30d)
    API->>DB: INSERT INTO roles (Owner template with wildcard permissions)
    API->>DB: INSERT INTO workspace_memberships (userId, workspaceId, role=Owner)
    API->>DB: COMMIT Transaction
    API-->>Web: Workspace Entity Created (id, name, slug)
    Web-->>Owner: Redirect to Authenticated Dashboard Shell
```

* **Actor:** Business Owner (`roles.name = 'OWNER'`).
* **Validation & Rules:** Workspace creation must be atomic. If role generation fails, entire workspace is rolled back.
* **Competitor Comparison:**
  - *TaskOPad:* Requires company phone number, department name, and triggers WhatsApp OTP verification during onboarding.
  - *Unolo:* Requires corporate email domain verification and prompts for fleet size (1–10, 11–50, 50+).

---

## 2. Workflow 2: Owner Onboards & Invites Employees

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant Web as Web Dashboard (/team)
    participant API as Fastify API
    participant DB as PostgreSQL 17

    Owner->>Web: Upload Bulk Employees CSV (Name, Email, Role, Phone)
    Web->>Web: Client-side validation (detect duplicate emails, regex RFC 5322)
    Web->>API: POST /v1/workspaces/members/bulk (multipart/json)
    API->>DB: BEGIN Transaction (SET LOCAL app.current_workspace_id)
    loop For each valid employee
        API->>DB: INSERT INTO workspace_invitations (token_hash, expires_at=7d, status='PENDING')
    end
    API->>DB: COMMIT Transaction
    API-->>Web: Return 201 Created (total_imported, invitation_links)
    Web-->>Owner: Display Invitation Management Table with Copyable Links
```

* **Actor:** Owner / Admin (`members.invite`).
* **Business Rule (BLK-002/003):** Invitation tokens are hashed with SHA-256 in the database; single-use only; expire in 7 days.
* **Competitor Comparison:**
  - *TaskOPad:* Sends direct WhatsApp template message with employee credentials.
  - *Unolo:* Sends SMS with deep link to install `smartsense.co.in.sensephone` from Google Play.

---

## 3. Workflow 3: Manager Creates and Assigns Task with Checklists

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Field Manager
    participant Web as Web Dashboard (/tasks/new)
    participant API as Fastify API
    participant DB as PostgreSQL 17

    Manager->>Web: Select Customer & Site, Enter Title, Checklists & Assignee
    Manager->>Web: Toggle: [x] Requires Photo Proof, [x] Requires Customer Signature
    Web->>API: POST /v1/tasks (x-workspace-id header)
    API->>DB: BEGIN Transaction (SET LOCAL app.current_workspace_id)
    API->>DB: INSERT INTO tasks (status='PENDING', version=1, requiresPhotoProof=true)
    API->>DB: INSERT INTO task_assignees (taskId, userId)
    API->>DB: INSERT INTO task_checklist_items (taskId, title, isCompleted=false)
    API->>DB: COMMIT Transaction
    API-->>Web: Task Created HTTP 201
    Web-->>Manager: Display in Task Board / Route Calendar
```

* **Actor:** Manager (`tasks.create`).
* **Business Rule:** Optimistic Concurrency Control (OCC) initialized with `version = 1`.

---

## 4. Workflow 4: Employee Receives Assignment & Views Schedule

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter Mobile App
    participant Drift as Local Drift SQLite v4
    participant API as Fastify API

    Mobile->>API: GET /v1/tasks?assignedTo=me&status=PENDING,IN_PROGRESS
    API-->>Mobile: HTTP 200 OK (Tasks with nested checklists, customer sites)
    Mobile->>Drift: Upsert local tasks and customer site coordinates
    Drift-->>Mobile: Reactive Stream updates UI
    Mobile-->>Tech: Display Today's Work Queue with Priority Badges
```

* **Offline Fallback:** If internet is unavailable, Mobile reads directly from cached Drift SQLite tables without blocking user.

---

## 5. Workflow 5: Employee Starts Duty & Records Selfie Attendance

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter Mobile App
    participant GPS as Device Sensor (geolocator)
    participant Camera as Physical Front Camera
    participant R2 as Cloudflare R2 / S3
    participant API as Fastify API

    Tech->>Mobile: Tap "Punch In"
    Mobile->>GPS: Obtain High-Accuracy GPS Fix (accuracy <= 50m)
    Mobile->>Camera: Capture Front-Facing Verification Selfie
    Mobile->>API: POST /v1/media/attendance-selfie-url
    API-->>Mobile: Presigned PUT URL + durable fileKey
    Mobile->>R2: Direct HTTP PUT Binary Upload (JPEG bytes)
    Mobile->>API: POST /v1/attendance/punch-in (selfieMediaKey, lat, lon)
    API->>API: Verify Selfie exists in R2 & verify duty hours
    API->>API: SET attendance_session = 'ON_DUTY'
    API-->>Mobile: HTTP 200 OK (Session Started)
    Mobile->>Mobile: Start Background Location Pipeline (Duty Hours Tracking Active)
```

* **Core Privacy Invariant:** Tracking begins **strictly after** authoritative server confirmation of `punch-in`.
* **Competitor Comparison:**
  - *Unolo:* Uses Unolo Facelock to match biometric embeddings locally or via cloud ML.
  - *TaskOPad:* Verifies whether location falls within office geofence.

---

## 6. Workflow 6: Dispatch Stop Sequencing & Travel to Customer Site

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter App
    participant Map as MapLibre / Radar Map
    participant API as Fastify API

    Tech->>Mobile: Open "Today's Visits"
    Mobile->>API: GET /v1/visits?status=PLANNED
    API-->>Mobile: List of visits with stopSequence (1, 2, 3...)
    Tech->>Mobile: Tap "Navigate to Stop 1"
    Mobile->>Mobile: Intent launch external turn-by-turn navigation (Google Maps / Waze)
    Mobile->>API: Post telemetry breadcrumbs (recordedAt, lat, lon, speed, heading)
```

---

## 7. Workflow 7: Employee Performs Geofenced Check-In at Site

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter App
    participant API as Fastify API
    participant DB as PostgreSQL 17 (PostGIS)

    Tech->>Mobile: Arrive at site, tap "Check In to Visit"
    Mobile->>API: POST /v1/visits/:id/check-in (lat, lon, accuracy)
    API->>DB: Query ST_DWithin(site.coordinates, ST_MakePoint(lon, lat), site.geofence_radius)
    alt Inside Geofence (Distance <= Radius)
        API->>DB: UPDATE visits SET status='CHECKED_IN', checkInTime=NOW()
        API-->>Mobile: HTTP 200 (Check-in Verified)
    else Outside Geofence (Distance > Radius)
        API-->>Mobile: HTTP 400 Bad Request (Outside Site Geofence Boundary)
    end
```

* **Competitor Invariant (Unolo):** Unolo blocks form submission entirely if outside geofence. Oprino enforces this boundary at API layer.

---

## 8. Workflow 8: Mandatory Checklists & Proof of Work Capture

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter App
    participant Canvas as Signature Canvas
    participant Watermark as Watermark Engine
    participant R2 as Cloudflare R2
    participant API as Fastify API

    loop For each mandatory checklist item
        Tech->>Mobile: Check off item (e.g. "Breaker Isolated")
    end
    Tech->>Mobile: Capture Photo Proof (Back Camera)
    Mobile->>Watermark: Burn Lat, Lon, Time, Task Title into Pixel Buffer
    Tech->>Canvas: Customer Signs Screen on Glass
    Canvas->>Canvas: Convert raw pointer strokes to 32-bit PNG binary
    Mobile->>R2: Direct HTTP PUT presigned upload for Photo & Signature
    Mobile->>API: POST /v1/media/confirm (photoKey, signatureKey, signerName)
    API-->>Mobile: Proof Confirmed & Linked to Task
```

---

## 9. Workflow 9: Task Transition to COMPLETED

```mermaid
stateDiagram-v2
    [*] --> PENDING: Manager Creates Task
    PENDING --> IN_PROGRESS: Tech Starts Work
    IN_PROGRESS --> BLOCKED: Incomplete Checklist or Missing Proof
    BLOCKED --> IN_PROGRESS: Tech Completes Items
    IN_PROGRESS --> COMPLETED: All Checklist Items [x] & Proof Verified
    COMPLETED --> VERIFIED: Supervisor Queue Approval
    COMPLETED --> REJECTED: Supervisor Finds Fault
    REJECTED --> IN_PROGRESS: Reopened for Remediation
```

* **Mandatory Completion Invariant:** The API strictly verifies:
  `SELECT count(*) FROM task_checklist_items WHERE task_id = :id AND is_completed = false;`
  If count > 0, HTTP 400 is returned: *"All mandatory checklist items must be completed before marking task as completed."*

---

## 10. Workflow 10: Supervisor Review & Verification Queue

```mermaid
sequenceDiagram
    autonumber
    actor Sup as Field Supervisor
    participant Web as Web Dashboard (/tasks/verification)
    participant API as Fastify API

    Sup->>Web: Open Verification Queue
    Web->>API: GET /v1/tasks?status=COMPLETED&verificationStatus=PENDING
    API-->>Web: Return Tasks with Watermarked Photo Proofs & Signatures
    Sup->>Web: Inspect Geotagged Photo & Customer Signature
    alt Proof is Genuine
        Sup->>Web: Click "Approve Proof"
        Web->>API: POST /v1/tasks/:id/verify (status='VERIFIED')
    else Proof is Fraudulent / Blurred
        Sup->>Web: Click "Reject Proof" (Enter reason)
        Web->>API: POST /v1/tasks/:id/verify (status='REJECTED', reason)
    end
```

---

## 11. Workflow 11: Shift End, Punch-Out & Privacy Cutoff

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter App
    participant Service as Background Location Service
    participant API as Fastify API

    Tech->>Mobile: Tap "Punch Out"
    Mobile->>API: POST /v1/attendance/punch-out (idempotencyKey)
    API->>API: Record punchOutTime, calculate total duration
    API->>API: SET attendance_session = 'OFF_DUTY'
    API-->>Mobile: HTTP 200 OK (Session Terminated)
    Mobile->>Service: SYNCHRONOUS UNHOOK - Stop background GPS sensor
    Note over Mobile,API: PRIVACY INVARIANT: Subsequent telemetry is rejected (HTTP 403) with 0 DB writes
```

---

## 12. Workflow 12: Offline Operation & Durable Synchronization

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Field Technician
    participant Mobile as Flutter App
    participant Drift as Local SQLite (Drift v4)
    participant Sync as Mobile SyncService
    participant API as Fastify API

    Note over Tech,Drift: Technicians enter basement / metal warehouse (No Internet)
    Tech->>Mobile: Check off checklist item & capture site notes
    Mobile->>Drift: INSERT INTO sync_mutation_outbox (mutationType, payload, status='PENDING')
    Drift-->>Mobile: Optimistic UI update (Instant feedback)
    Note over Tech,Drift: Technician exits basement (Network Restored)
    Sync->>Sync: Connectivity change detected (Active 4G/WiFi)
    Sync->>Drift: SELECT * FROM sync_mutation_outbox WHERE status='PENDING'
    Sync->>API: POST /v1/sync/batch (mutations array)
    API->>API: Execute SYNC-CONFLICT-MATRIX idempotency & merge logic
    API-->>Sync: HTTP 200 OK (all mutations accepted)
    Sync->>Drift: DELETE FROM sync_mutation_outbox (Queue drained)
```
