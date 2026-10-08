# Oprino Phase 02C Implementation Report: GPS Location Pipeline, Geofencing & Tracking Engine

**Phase:** Phase 02C GPS Location Pipeline, Geofencing & Tracking Engine  
**Status:** COMPLETED & VERIFIED  
**Date:** October 2026  
**Audience:** System Architects, Security Auditors, Engineering Leads, AI Agents  

---

## 1. Executive Summary

Phase 02C implements the enterprise-grade **GPS Location Pipeline, Geofencing, and Tracking Engine** for Oprino, completing the field workforce telemetry backbone across the database, Fastify API, BullMQ background worker, Next.js 15 operations web dashboard, and Flutter mobile application.

All core architectural invariants and product PRD mandates have been strictly implemented and verified:
- **Duty-Hours-Only Tracking Invariant:** Off-duty employee location tracking must **NEVER** occur. Points recorded while off-duty or outside active authorized work shifts are hard-dropped at both mobile client and server ingestion boundaries with zero database writes. Peer location visibility remains strictly **OFF by default** (`location.read` restricted to managers/owners).
- **Multi-Tenant Row-Level Security (RLS) Isolation:** All telemetry tables (`employee_locations`, `geofences`, `daily_travel_summaries`) enforce PostgreSQL Row-Level Security (`ENABLE` and `FORCE ROW LEVEL SECURITY`) isolated to `app.current_workspace_id`.
- **Transaction-Scoped Database Safety:** Every tenant operation executes within isolated transactions using `SET LOCAL app.current_workspace_id` to guarantee zero cross-tenant leakage across pooled PostgreSQL connections.
- **Strict 30-Day Data Retention Pruning:** Raw telemetry breadcrumbs isolate with timestamp indexing and are pruned on a schedule via the security-definer PostgreSQL procedure `telemetry_prune_expired_records(p_retention_days INT)` and the BullMQ worker job `telemetry.retention.prune`.
- **Real-Time Stream & Quality Filtering:** High-throughput ingestion route `POST /v1/telemetry/locations` enforces spatial quality gates (`accuracy <= 50m`, `speed <= 45m/s` to eliminate GPS bounce and teleportation anomalies), performs real-time Haversine distance rollup, and broadcasts live worker updates via Redis Pub/Sub and Server-Sent Events (`GET /v1/telemetry/stream`).
- **Contract Single Source of Truth:** `@oprino/contracts` Zod schemas compile to OpenAPI 3.1 and automatically generate typed Dart Dio models and API clients.

---

## 2. Database Schema & Migration Details

### 2.1 Applied Migration
- **Migration ID:** `0002_sticky_starfox`
- **Location:** `packages/database/drizzle/0002_sticky_starfox.sql`
- **Target Engine:** PostgreSQL 17/18 with PostGIS 3.5/3.6

### 2.2 Table Definitions & Tenancy Scope

All Phase 02C telemetry tables are strictly **TENANT-SCOPED**:

| Table Name | Scope | Description |
|---|---|---|
| `employee_locations` | **TENANT-SCOPED** | High-velocity breadcrumbs (`user_id`, `session_id`, `latitude`, `longitude`, `accuracy`, `speed`, `heading`, `battery_level`, `activity_type`, `recorded_at`). |
| `geofences` | **TENANT-SCOPED** | Spatial boundaries (`name`, `description`, `latitude`, `longitude`, `radius_meters`, `geofence_type`: `OFFICE` / `CUSTOMER_SITE` / `CHECKPOINT`, `is_active`). |
| `daily_travel_summaries` | **TENANT-SCOPED** | Aggregated daily travel rollups (`user_id`, `date`, `total_distance_meters`, `total_duration_minutes`, `points_count`). |

### 2.3 Row-Level Security Policies
Every table executes:
```sql
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations FORCE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_travel_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_travel_summaries FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON <table_name>
AS PERMISSIVE FOR ALL
USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
)
WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
);
```

### 2.4 Retention Pruning Stored Procedure
```sql
CREATE OR REPLACE FUNCTION telemetry_prune_expired_records(p_retention_days INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM employee_locations
  WHERE recorded_at < (NOW() - (p_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;
```

---

## 3. RBAC Permissions Matrix

New permissions added to `services/api/src/auth/permissions.ts`:

| Permission | Description | Assigned Default Roles |
|---|---|---|
| `location.read` | View live positions and route history of field workers | `Owner`, `Manager` |
| `location.record` | Transmit own GPS breadcrumbs during active duty shifts | `Owner`, `Manager`, `Employee` |
| `geofences.read` | View workspace geofences and check proximity | `Owner`, `Manager`, `Employee` |
| `geofences.manage`| Create, edit, and deactivate workspace geofences | `Owner`, `Manager` |

**Invariant Enforcement:** `Employee` role does NOT hold `location.read`. Peer visibility remains strictly **OFF by default**.

---

## 4. Backend API & Ingestion Engine (`services/api`)

### 4.1 Telemetry Endpoints
- `POST /v1/telemetry/locations`: Batch breadcrumb ingestion (up to 200 points). Enforces active duty shift verification; quality filters (`accuracy <= 50m`, `speed <= 45m/s`); updates daily travel distance via Haversine rollup; broadcasts live positions over Redis Pub/Sub.
- `GET /v1/telemetry/live`: Returns latest live positions for all on-duty workers in the workspace. Restricted to `location.read`.
- `GET /v1/telemetry/history`: Returns historical breadcrumbs and total distance for a specific worker and date (`YYYY-MM-DD`). Restricted to `location.read`.
- `GET /v1/telemetry/stream`: Server-Sent Events (SSE) stream delivering real-time worker movement updates.

### 4.2 Geofencing Endpoints
- `GET /v1/geofences`: Lists active workspace geofences.
- `POST /v1/geofences`: Creates a geofence with specified radius and type.
- `POST /v1/geofences/check-proximity`: Computes exact distance from provided coordinates and returns `isInside` flag.

---

## 5. Background Worker Retention Job (`services/worker`)

Handled in `services/worker/src/worker.ts`:
- Queue: `default`
- Job: `telemetry.retention.prune`
- Action: Executes `telemetry_prune_expired_records(days)` via transaction-safe PostgreSQL pool, logging pruned record count.

---

## 6. Web Live Radar Operations Map (`apps/web`)

Path: `apps/web/src/app/live-map/page.tsx`
- **Vector Radar Canvas:** Custom SVG coordinate-space radar map projecting worker positions and geofences.
- **Real-Time SSE Streaming:** Subscribes to `/v1/telemetry/stream` with automatic fallback to polling.
- **Worker Inspection Drawer:** Displays battery levels, speed, accuracy, duty session duration, and active task.
- **Route History Playback:** Interactive scrubber displaying historical breadcrumb trails, total distance, and duration.
- **Interactive Geofence Modal:** Create operational site boundaries directly from the dashboard.

---

## 7. Mobile Location Service & Offline Engine (`apps/mobile`)

Path: `apps/mobile/lib/core/location/location_service.dart`
- **Riverpod State Architecture:** Provides `isTrackingActiveProvider`, `latestLocationProvider`, and `nearbyGeofencesProvider`.
- **Duty-Hours-Only Enforcement:**
  - `startTracking(workspaceId)` activates upon `ON_DUTY` punch in.
  - `stopTracking()` immediately and synchronously unhooks GPS sensors and purges buffers upon `OFF_DUTY` punch out.
  - Off-duty fixes are hard-dropped with zero buffer retention and zero network requests.
- **Attendance UI Status Card (`attendance_view.dart`):**
  - High-visibility `TRACKING ACTIVE` / `STANDBY (OFF)` status indicator.
  - Real-time geofence proximity chip (`Inside Geofence: HQ Campus (15m)` / `Nearest Site: North Depot (320m)`).
  - Explicit Duty-Hours Privacy Guarantee confirmation badge.

---

## 8. Verification & Quality Gate Results

| Test Suite / Quality Gate | Result | Status |
|---|---|---|
| Backend API Tests (`services/api`) | 57 / 57 passed | **PASSED** |
| Generated Dart API Tests (`generated/dart-api`) | 10 / 10 passed | **PASSED** |
| Mobile Flutter Tests (`apps/mobile`) | 18 / 18 passed | **PASSED** |
| Mobile Analyzer (`flutter analyze`) | 0 issues | **PASSED** |
| Monorepo Typecheck (`pnpm turbo typecheck`) | 8 packages clean | **PASSED** |
| Monorepo ESLint (`pnpm lint`) | 0 errors | **PASSED** |
