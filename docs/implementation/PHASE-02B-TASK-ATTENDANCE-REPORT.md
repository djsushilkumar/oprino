# Oprino Phase 02B Implementation Report: Task & Attendance Domain

**Phase:** Phase 02B Core Domain Workflows  
**Status:** COMPLETED & VERIFIED  
**Date:** October 2026  
**Audience:** System Architects, Security Auditors, Engineering Leads, AI Agents  

---

## 1. Executive Summary

Phase 02B implements the core field operational domains of Oprino: **Task Lifecycle Management** and **Attendance & Shift Governance**, backed by an offline-first mobile sync engine and a responsive Next.js 15 web operations dashboard.

All core architectural invariants and product baseline requirements have been strictly upheld:
- **Duty-Hours-Only Tracking Invariant:** Peer location visibility remains strictly OFF by default; zero background location tracking is activated outside verified on-duty sessions.
- **PostgreSQL Row-Level Security (RLS) Isolation:** Every tenant table (`attendance_shifts`, `attendance_sessions`, `attendance_events`, `tasks`, `task_assignees`, `task_checklist_items`) enforces PostgreSQL Row-Level Security (`ENABLE` and `FORCE ROW LEVEL SECURITY`) isolated to `app.current_workspace_id`.
- **Transaction-Scoped Connection Safety:** All tenant operations execute within transactions using `SET LOCAL app.current_workspace_id` to prevent cross-tenant leakage across pooled PostgreSQL connections.
- **Optimistic Concurrency Control:** Task state mutations enforce optimistic concurrency locking via an integer `version` column, returning HTTP 409 Conflict upon concurrent modification races.
- **Idempotency & Replay Protection:** Attendance punch events require and enforce client-generated UUID `idempotencyKey` values, safely deduplicating network replays and offline sync bursts.
- **Overnight Shift Support:** Shift schedules explicitly model overnight intervals crossing midnight (e.g. 22:00 to 06:00) with configurable grace periods.
- **Single Source of Truth Contracts:** Zod schemas in `@oprino/contracts` compile to OpenAPI 3.1 and automatically generate typed Dart Dio models and API clients.

---

## 2. Database Schema & Migration Details

### 2.1 Applied Migration
- **Migration ID:** `0001_early_misty_knight`
- **Location:** `packages/database/drizzle/0001_early_misty_knight.sql`
- **Target Engine:** PostgreSQL 17/18 with PostGIS 3.5/3.6

### 2.2 Table Definitions & Tenancy Scope

All Phase 02B tables are strictly **TENANT-SCOPED**:

| Table Name | Scope | Description |
|---|---|---|
| `attendance_shifts` | **TENANT-SCOPED** | Configurable shift schedules (`name`, `start_time`, `end_time`, `is_overnight`, `crosses_midnight`, `grace_period_mins`). |
| `attendance_sessions` | **TENANT-SCOPED** | Work sessions representing employee duty cycles (`duty_status`: `ON_DUTY` / `OFF_DUTY` / `ON_BREAK`, `punch_in_at`, `punch_out_at`, `duration_minutes`). |
| `attendance_events` | **TENANT-SCOPED** | Immutable audit records of punch events (`event_type`: `PUNCH_IN` / `PUNCH_OUT` / `BREAK_START` / `BREAK_END`, `latitude`, `longitude`, `accuracy_meters`, `device_installation_id`). |
| `tasks` | **TENANT-SCOPED** | Field and internal tasks (`title`, `description`, `status`: `DRAFT` / `ASSIGNED` / `ACCEPTED` / `EN_ROUTE` / `ARRIVED` / `IN_PROGRESS` / `COMPLETED` / `VERIFIED` / `CANCELLED`, `priority`: `LOW` / `MEDIUM` / `HIGH` / `URGENT`, `version`, `due_at`). |
| `task_assignees` | **TENANT-SCOPED** | Many-to-many task assignments linking tasks to workspace members with assignment roles (`LEAD` / `ASSISTANT`). |
| `task_checklist_items` | **TENANT-SCOPED** | Sequential or ad-hoc subtasks/items (`title`, `is_completed`, `completed_by_user_id`, `completed_at`, `sort_order`). |

### 2.3 Row-Level Security Policies
Every table executes:
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;

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

---

## 3. API Contracts & Route Architecture

### 3.1 Task Management Endpoints
- `POST /v1/tasks` — Create task with assignees and checklist items (requires `tasks.create`).
- `GET /v1/tasks` — List tasks with filters (`status`, `priority`, `assigneeId`).
- `GET /v1/tasks/:id` — Retrieve task detail with assignees and checklist items.
- `PATCH /v1/tasks/:id/status` — Transition task status with optimistic concurrency control (`expectedVersion`).
- `PATCH /v1/tasks/:id/checklist/:itemId` — Toggle checklist item completion status.

### 3.2 Attendance & Shift Endpoints
- `POST /v1/attendance/punch-in` — Idempotent employee punch in with optional GPS coordinates and installation ID.
- `POST /v1/attendance/punch-out` — Idempotent employee punch out with authoritative server duration calculation.
- `GET /v1/attendance/current` — Get current user duty state (`ON_DUTY` / `OFF_DUTY`), active session, and duration.
- `GET /v1/attendance/shifts` — List configured workspace shifts.
- `POST /v1/attendance/shifts` — Create new shift template (requires `attendance.manage`).
- `GET /v1/attendance/team` — Manager overview of all team members' live duty statuses (requires `attendance.team.read`).

---

## 4. Mobile Client Implementation (`apps/mobile`)

### 4.1 UI Architecture
- **Attendance Tab (`attendance_view.dart`):**
  - High-visibility duty indicator card (`ON DUTY` / `OFF DUTY`).
  - Active duty duration counter using high-performance Flutter `Ticker`.
  - Primary action buttons: **Punch In (Start Duty)** and **Punch Out (End Duty)** with loading feedback.
  - Active shift schedule details and duty-hours-only privacy banner.
  - Offline mode notice banner with sync indicators.
- **Tasks Tab (`tasks_view.dart`):**
  - Segmented status groups: *To Do*, *In Progress*, and *Completed*.
  - Task search filter and priority chips.
  - Assigned task cards displaying title, description, priority, due date, and checklist progress.
- **Task Detail Screen (`task_detail_screen.dart`):**
  - Interactive status transition action bar (`Accept` -> `En Route` -> `Arrive` -> `Complete`).
  - Interactive checklist with optimistic toggle updates.
  - Verification workflow (managers with `tasks.verify` can verify completed tasks).

### 4.2 Offline-First Sync Engine (`sync_service.dart`)
- **Drift SQLite Outbox:** Local persistent database caching tasks, attendance sessions, and pending mutations.
- **Optimistic Updates:** UI responds immediately; mutation is written to local outbox.
- **Background Outbox Processing:** Automatically drains mutations to the backend when online.
- **Reactive Streams:** Drift `.watch()` queries feed Riverpod providers for immediate UI updates.

---

## 5. Web Dashboard Implementation (`apps/web`)

- Built with Next.js 15 App Router and Oprino Design Tokens:
  - `/tasks` — Task management interface with status tabs, priority filters, task creation modal with dynamic checklist builder, and status transition controls.
  - `/attendance` — Real-time team duty board showing all members' duty states, active sessions, personal punch controls, and shift definitions.
  - `HeaderNav.tsx` — Unified navigation bar linking Dashboard, Tasks, and Attendance with active route indicators.

---

## 6. Test & Quality Gate Verification Matrix

| Quality Gate | Tool / Command | Result | Notes |
|---|---|---|---|
| Monorepo Typecheck | `pnpm turbo typecheck` | **PASSED** (9/9) | 0 TypeScript compilation errors |
| Monorepo Linter | `pnpm lint` | **PASSED** (0 err) | ESLint clean across all workspaces |
| Web Integration Tests | `pnpm --filter @oprino/web test` | **PASSED** (7/7) | Web onboarding and auth tests pass |
| Worker Tests | `pnpm --filter @oprino/worker test` | **PASSED** (2/2) | Worker environment and queues pass |
| API Integration Tests | `pnpm --filter @oprino/api test` | **PASSED** (45/45) | Includes all 25 Phase 02B domain tests |
| Contracts Generation | `pnpm --filter @oprino/contracts generate` | **PASSED** | Deterministic OpenAPI & Dart client export |
| Dart API Client Tests | `dart test` | **PASSED** (8/8) | Task and Attendance model serialization |
| Flutter Analyzer | `flutter analyze` | **PASSED** (0 err) | 0 errors, 0 warnings across mobile app |
| Flutter Tests | `flutter test` | **PASSED** (14/14) | Widget tests, storage, auth, and sync engine pass |
| Web Production Build | `pnpm --filter @oprino/web build` | **PASSED** (10/10) | Next.js 15 static page generation succeeds |

---

## 7. Next Milestone Gate

With Phase 02B verified, the repository is ready for:
- **Phase 02C / Phase 03: GPS Location Pipeline, Geofencing & Tracking Engine (Transistor Background Geolocation integration, duty-boundary cutoffs, 30-day retention pruning).**
