# 08 — Oprino Technical Architecture Recommendations

**Author:** Senior SaaS Product Architect & Systems Engineer  
**Context:** Oprino Technical Architecture & Scalability Specification  
**Deployment Target:** Oracle Cloud Ampere A1 (ARM64, 4 OCPU, 24 GB RAM, 200 GB NVMe Storage)  
**Date of Specification:** October 2026  
**Status:** Complete  

---

## 1. Architectural Principles & System Blueprint

To guarantee sub-second API latencies, high-throughput spatial telemetry ingestion, rock-solid multi-tenant data isolation, and total offline resilience, the Oprino production architecture is organized into four distinct operational planes:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                OPRINO SYSTEM TOPOLOGY (ARM64 VPS)                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   [ Mobile App (Drift SQLite) ]                 [ Web Dashboard (Next.js 14) ]                   │
│               │ (Direct R2 PUT)                             │                                    │
│               ▼                                             ▼                                    │
│   [ Cloudflare R2 Storage ]                   [ Caddy Reverse Proxy (HTTPS / HTTP/3) ]           │
│   (Zero-Egress Media Store)                                 │                                    │
│                                           ┌─────────────────┴─────────────────┐                  │
│                                           ▼                                   ▼                  │
│                             [ Fastify API Gateway (Node 20) ]       [ Next.js SSR Web Node ]     │
│                             - Zod Schema Validation                 - Role-Based Portal Pages    │
│                             - Tenant Context (AsyncLocalStorage)    - Split-Pane Live Map        │
│                             - Active Shift Duty Guard                                            │
│                                           │                                                      │
│                        ┌──────────────────┴──────────────────┐                                   │
│                        ▼                                     ▼                                   │
│           [ Redis 7 (In-Memory) ]               [ PostgreSQL 16 + PostGIS 3.4 ]                  │
│           - Active Shift Tokens                 - Row-Level Security (RLS)                       │
│           - BullMQ Telemetry Queues             - Partitioned Spatial Breadcrumbs                │
│           - Pub/Sub Live Map SSE                - Core Relational Data Model                     │
│                        │                                                                         │
│                        ▼                                                                         │
│           [ BullMQ Telemetry Worker ]                                                            │
│           - GPS Batch Ingestion                                                                  │
│           - Geofence ST_DWithin Calculation                                                      │
│           - 30-Day Automated Partition Pruner                                                    │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenant Database Architecture & Spatial PostGIS Schema

### 2.1 5-Stage Tenant Isolation Enforcement
In accordance with ADR-002, all PostgreSQL queries must enforce workspace boundary isolation:
1. **JWT Verification:** Claims extracted and validated via Zod schema.
2. **Session Context Propagation:** Propagated through Node.js `AsyncLocalStorage`.
3. **Transaction-Scoped Session Setting:** Every transactional pool client executes:
   ```sql
   SET LOCAL app.current_workspace_id = 'ws_alpha_821';
   ```
4. **PostgreSQL Row-Level Security (RLS):**
   ```sql
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation_policy ON tasks
     FOR ALL
     USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
   ```
5. **Drizzle ORM Query Wrappers:** API services automatically inject `eq(schema.tasks.workspaceId, currentWorkspaceId)` as a redundant defense-in-depth clause.

---

### 2.2 Conceptual PostGIS Spatial Schema

```sql
-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations / Clients Geofence Table
CREATE TABLE client_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address_text TEXT NOT NULL,
    geofence_center GEOMETRY(Point, 4326) NOT NULL,
    geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_locations_spatial ON client_locations USING GIST (geofence_center);
CREATE INDEX idx_client_locations_tenant ON client_locations (workspace_id);

-- 2. Shift / Attendance Sessions
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    punch_in_at TIMESTAMPTZ NOT NULL,
    punch_out_at TIMESTAMPTZ,
    punch_in_location GEOMETRY(Point, 4326),
    punch_out_location GEOMETRY(Point, 4326),
    selfie_media_key VARCHAR(512),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, IRREGULAR
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attendance_user_shift ON attendance_sessions (workspace_id, user_id, status);

-- 3. Partitioned Location Telemetry (GPS Breadcrumbs)
-- Partitioned by month for efficient 30-day drop operations
CREATE TABLE location_breadcrumbs (
    id BIGSERIAL,
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    attendance_session_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    coordinate GEOMETRY(Point, 4326) NOT NULL,
    accuracy_meters REAL NOT NULL,
    speed_mps REAL,
    bearing REAL,
    battery_level SMALLINT,
    is_mock BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

-- Spatial and tenant compound index on partitions
CREATE INDEX idx_breadcrumbs_spatial_tenant 
    ON location_breadcrumbs USING GIST (coordinate);
CREATE INDEX idx_breadcrumbs_lookup 
    ON location_breadcrumbs (workspace_id, user_id, recorded_at DESC);
```

---

## 3. High-Throughput GPS Ingestion Pipeline

To prevent thousands of concurrent field GPS updates from exhausting database connections, telemetry is ingested through an asynchronous, memory-buffered BullMQ pipeline:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GPS BATCH INGESTION WORKFLOW                         │
│                                                                        │
│  1. Mobile Client POST /telemetry/locations/batch (10–30 points)       │
│  2. Fastify Route:                                                     │
│     - Verify JWT & Workspace Context                                   │
│     - Check Redis Key: `active_duty:${workspaceId}:${userId}`          │
│       * IF OFF_DUTY: Return HTTP 403 (Zero DB Writes)                  │
│       * IF ON_DUTY: Push batch to Redis Stream `queue:telemetry`       │
│  3. Return HTTP 202 Accepted to Mobile Device (< 15ms response)        │
│  4. BullMQ Telemetry Worker:                                           │
│     - Dequeues batches with concurrency = 4                            │
│     - Executes bulk COPY / batch INSERT into PostgreSQL                │
│     - Publishes latest coordinate to Redis Pub/Sub for Web SSE Map     │
└────────────────────────────────────────────────────────────────────────┘
```

### 30-Day Automated Data Retention Pruning
In compliance with Oprino's strict privacy rules, raw GPS coordinates older than 30 days are automatically deleted without impacting relational audit records:
```sql
-- Scheduled Daily via pg_cron or BullMQ Cron Job
CREATE OR REPLACE PROCEDURE prune_expired_gps_breadcrumbs()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM location_breadcrumbs
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    -- Optimize storage reclaiming
    RAISE NOTICE 'Expired GPS breadcrumbs older than 30 days pruned.';
END;
$$;
```

---

## 4. Offline-First Synchronization & Conflict Resolution

Field workers execute tasks and record attendance in areas with spotty connectivity. The mobile app operates as an autonomous, offline-first client.

### 4.1 Mobile Drift SQLite Schema
The mobile client maintains a local SQLite database with an `outbox_mutations` table:

```sql
CREATE TABLE outbox_mutations (
    id TEXT PRIMARY KEY,               -- Client-generated UUID
    client_sequence INTEGER NOT NULL,  -- Monotonic counter
    mutation_type TEXT NOT NULL,       -- 'PUNCH_IN', 'START_VISIT', 'COMPLETE_VISIT'
    payload JSON NOT NULL,             -- Mutation parameters
    status TEXT NOT NULL,              -- 'PENDING', 'SYNCING', 'FAILED'
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);
```

### 4.2 Conflict Resolution Invariants:
1. **Idempotency Keys:** Every mutation includes a unique `mutation_id` (UUIDv4). The Fastify API maintains an idempotency table; re-sent mutations return the existing processed record without re-executing state transitions.
2. **Monotonic Sequence Enforcement:** Mutations must be processed in client sequence order per task.
3. **State Machine Conflicts:**
   - If a manager reassigns or cancels a task while the field executive was offline completing it: **The Field Completion Wins**. The server accepts the proof of work, transitions the task to `COMPLETED`, and logs an administrative audit notice to the manager.
4. **Offline Proof-of-Work Media:**
   - Photos are saved to the device sandbox.
   - When network resumes, the sync service fetches a presigned R2 URL, uploads the photo, receives confirmation, and then flushes the `COMPLETE_VISIT` mutation referencing the uploaded `media_key`.

---

## 5. Deployment Topology: Oracle Cloud Ampere A1 (ARM64)

The deployment target is a self-contained, high-performance Oracle Cloud Ampere A1 VPS:
- **Specifications:** 4 ARM64 vCPUs (Neoverse-N1), 24 GB RAM, 200 GB NVMe Storage, 4 Gbps Network.
- **Operating System:** Ubuntu 24.04 LTS (aarch64).

### 5.1 Resource Allocation Matrix

| Service Container | Base Image (ARM64) | CPU Allocation | Memory Limit | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Caddy** | `caddy:2-alpine` | 0.5 OCPU | 512 MB | Reverse proxy, automatic Let's Encrypt SSL, HTTP/3, Brotli/Gzip. |
| **Fastify API** | `node:20-alpine` | 1.5 OCPU | 4096 MB | Core REST API gateway, Zod validation, RLS context. |
| **Web Dashboard** | `node:20-alpine` | 0.5 OCPU | 2048 MB | Next.js 14 SSR & Webhook handler. |
| **PostgreSQL + PostGIS**| `postgis/postgis:16-3.4-alpine` | 1.0 OCPU | 10240 MB | Relational database, PostGIS spatial indexing, 8GB shared_buffers. |
| **Redis 7** | `redis:7-alpine` | 0.5 OCPU | 2048 MB | In-memory cache, active shift tracker, BullMQ queues. |
| **BullMQ Worker** | `node:20-alpine` | 0.5 OCPU | 2048 MB | Asynchronous telemetry batcher & notification dispatcher. |
| **Vector / Fluent** | `timberio/vector:latest-alpine` | 0.2 OCPU | 512 MB | Structured JSON log aggregator to local rotation. |

---

### 5.2 Production Docker Compose Configuration

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp" # HTTP/3
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api
      - web

  api:
    image: oprino-api:production-arm64
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_URL=postgresql://oprino_user:${DB_PASSWORD}@postgres:5432/oprino_db
      - REDIS_URL=redis://redis:6379
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_BUCKET=oprino-production-media
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 4096M
    depends_on:
      - postgres
      - redis

  web:
    image: oprino-web:production-arm64
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXT_PUBLIC_API_URL=https://api.oprino.in
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2048M

  postgres:
    image: postgis/postgis:16-3.4-alpine
    restart: always
    environment:
      - POSTGRES_USER=oprino_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=oprino_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init-postgis.sh:/docker-entrypoint-initdb.d/init-postgis.sh:ro
    command: >
      postgres 
      -c shared_buffers=8GB 
      -c effective_cache_size=16GB 
      -c work_mem=64MB 
      -c maintenance_work_mem=1GB 
      -c max_connections=200
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 10240M

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --maxmemory 1800mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2048M

  worker:
    image: oprino-worker:production-arm64
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://oprino_user:${DB_PASSWORD}@postgres:5432/oprino_db
      - REDIS_URL=redis://redis:6379
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2048M
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:
```

---

## 6. Security, Hardening & Observability Invariants

1. **Non-Root Container Execution:** All Docker containers run as unprivileged `node` or `postgres` user accounts.
2. **Encrypted Network Mesh:** Container-to-container communication occurs over an internal Docker bridge network (`oprino-net`); only ports 80/443 on Caddy are exposed to the public Internet.
3. **Structured JSON Telemetry & Audit Logs:** Every security, state transition, and authentication event is emitted as structured JSON containing `workspace_id`, `actor_user_id`, `ip_address`, `event_type`, and `timestamp`.
4. **Health Check Probes:**
   - Fastify provides `/health/liveness` and `/health/readiness` (validating database pool ping and Redis connection).
   - Unhealthy containers are automatically restarted by the Docker daemon.

---
*End of Document 08 — Oprino Technical Architecture Recommendations*
