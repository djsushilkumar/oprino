# Oprino — Data Flow Architecture

**Document:** Complete Monorepo Data Flow Specification  
**Auditor:** Principal Software Architect  
**Branch:** `release/v1-stabilization`  

---

## 1. Authentication & Session Resolution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Web / Mobile Client
    participant API as Fastify API Gateway
    participant Plugin as Auth Plugin (Better Auth)
    participant DB as PostgreSQL
    participant RLS as PostgreSQL RLS Engine

    User->>API: 1. Request with Cookie (Web) or Bearer Token (Mobile)
    API->>Plugin: 2. Validate token & extract session
    Plugin->>DB: 3. Verify session in `session` table
    Plugin-->>API: 4. Attach `request.user` & `request.activeWorkspaceId`
    API->>API: 5. Verify Route RBAC (`Domain:Action:Scope`)
    API->>DB: 6. Begin Transaction
    API->>DB: 7. SET LOCAL app.current_workspace_id = activeWorkspaceId
    DB->>RLS: 8. Lock query scope to current tenant
    API->>DB: 9. Execute domain query
    DB-->>API: 10. Return filtered rows
    API->>DB: 11. Commit Transaction (Connection context reset)
    API-->>User: 12. Send JSON response
```

---

## 2. Media Upload & Verification Flow (Direct Presigned Upload)

To protect API servers from high-bandwidth image payloads, all media (attendance selfies, task photo proofs, digital signatures) follows a direct S3/R2 presigned upload pattern:

```mermaid
sequenceDiagram
    autonumber
    actor Mobile as Field Worker (Mobile)
    participant API as Fastify API
    participant R2 as Private S3/R2 Bucket
    participant DB as PostgreSQL
    actor Mgr as Manager (Web)

    Mobile->>API: 1. POST /v1/media/upload-url { purpose: 'ATTENDANCE_SELFIE', mimeType: 'image/jpeg' }
    API->>API: 2. Verify user owns target entity & active shift
    API->>API: 3. Generate random secure key: `workspaces/{ws}/media/{uuid}.jpg`
    API->>API: 4. Create 15-minute Presigned PUT URL with HMAC signature
    API-->>Mobile: 5. Return { uploadUrl, fileKey }
    Mobile->>R2: 6. PUT binary JPEG directly to R2 (Client watermarked)
    R2-->>Mobile: 7. 200 OK (Object stored privately)
    Mobile->>API: 8. POST /v1/attendance/punch-in { selfieMediaKey: fileKey, coords }
    API->>R2: 9. HEAD request to verify object exists & size > 0
    API->>DB: 10. Record verified attendance session
    API-->>Mobile: 11. 200 OK (Punch In confirmed)
    
    Note over Mgr,R2: Later, during Manager Review:
    Mgr->>API: 12. GET /v1/media/download-url?fileKey=...
    API->>API: 13. Verify Manager belongs to same workspace
    API->>API: 14. Generate 15-minute Presigned GET URL
    API-->>Mgr: 15. Return { downloadUrl }
    Mgr->>R2: 16. Fetch image directly from R2 to browser modal
```

---

## 3. Real-Time Telemetry & Live Map Streaming Flow

```mermaid
sequenceDiagram
    autonumber
    actor Mobile as Field Mobile (Foreground Service)
    participant API as Fastify API (Ingest)
    participant DB as PostgreSQL + PostGIS
    participant Redis as Redis Pub/Sub
    participant SSE as Fastify API (SSE Stream)
    actor Mgr as Manager (Web Live Map)

    Mobile->>API: 1. POST /v1/telemetry/locations (Batch of GPS points)
    API->>API: 2. Verify active duty session (Duty Boundary Check)
    alt If Employee is Off-Duty
        API-->>Mobile: 3a. 403 Forbidden (OFF_DUTY_TRACKING_PROHIBITED)
    else If Employee is On-Duty
        API->>DB: 3b. Filter points (accuracy < 50m) & insert to telemetry table
        API->>DB: 4. Roll points into travel summary (distance & time)
        API->>Redis: 5. PUBLISH `workspace:{ws}:locations` { userId, lat, lng, timestamp }
        API-->>Mobile: 6. 200 OK { acceptedIds, rejectedIds }
    end

    Note over Mgr,SSE: Meanwhile on the Manager Dashboard:
    Mgr->>API: 7. POST /v1/telemetry/stream-ticket (Request streaming access)
    API-->>Mgr: 8. Return short-lived (60s) single-use ticket
    Mgr->>SSE: 9. GET /v1/telemetry/stream?ticket=XYZ (EventSource connection)
    SSE->>Redis: 10. SUBSCRIBE `workspace:{ws}:locations`
    Redis-->>SSE: 11. Location update event received
    SSE-->>Mgr: 12. Push SSE event to browser
    Mgr->>Mgr: 13. MapLibre updates field worker pin smoothly on map
```

---

## 4. Offline Queue & Reconciliation Flow

When a field employee operates in zero-connectivity areas:

```mermaid
flowchart TD
    A[Worker triggers action<br/>Punch In / Checklist / Photo] --> B{Network Available?}
    B -- Yes --> C[Standard Fastify HTTP Request]
    B -- No --> D[Save mutation to local Drift SQLite<br/>Table: CachedLocations / OutboxQueue]
    D --> E[Write photo binary to persistent<br/>Application Support Directory]
    E --> F[Show Optimistic UI State:<br/>🟠 OFFLINE PENDING]
    F --> G[Network Restored via Connectivity Monitor]
    G --> H[SyncService drains OutboxQueue sequentially]
    H --> I{Upload succeeds with 200 OK?}
    I -- Yes --> J[Delete local temporary photo binary]
    J --> K[Remove mutation from OutboxQueue]
    K --> L[Update UI: 🟢 SERVER CONFIRMED]
    I -- No (4xx Rejection) --> M[Rollback optimistic state<br/>Trigger user retry alert]
```
