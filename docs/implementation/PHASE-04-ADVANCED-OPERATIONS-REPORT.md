# Oprino Phase 04 Implementation Report: Advanced Scheduling, Dispatch Routing, Conflict Resilience & Operational Analytics

**Phase:** Phase 04 Advanced Scheduling, Dispatch Routing, Conflict Resilience & Operational Analytics  
**Status:** COMPLETED & VERIFIED  
**Date:** October 2026  
**Audience:** System Architects, Security Auditors, Engineering Leads, AI Agents  

---

## 1. Executive Summary

Phase 04 delivers the complete **Advanced Scheduling, Dispatch Routing, Offline Conflict Resilience, and Operational Analytics Suite** for Oprino, spanning all tiers of the polyglot monorepo: PostgreSQL database with PostGIS, `@oprino/contracts`, Fastify backend API, `@oprino/worker`, Next.js 15 web operations console, and Flutter 3.47 mobile field application.

All core architectural invariants and product PRD mandates have been strictly implemented and verified:
- **Offline Conflict Matrix Rules ([`SYNC-CONFLICT-MATRIX.md`](../architecture/SYNC-CONFLICT-MATRIX.md)):** The batch sync engine (`POST /v1/sync/mutations`) executes authoritative resolution rules:
  1. *Punch-Out Hardware Override:* A punch-out always terminates duty state regardless of competing queued punches.
  2. *Managerial Cancellation Precedence:* A task canceled or reassigned on the web dashboard immediately takes precedence over offline technician in-progress transitions (`REJECTED_STALE`).
  3. *Checklist Union Merging:* Checklist item completions are merged as a union set, preserving completed checks from both mobile and web.
  4. *Visit Chronological Ground Truth:* Visit check-ins and check-outs are sequenced strictly by device GPS timestamp and immutable audit history.
  5. *Proof Immutability:* Geotagged photos and digital signatures are append-only and cannot be overwritten.
- **Dispatch Route Stop Sequencing:** Multi-stop daily routing is enabled via `sequenceOrder` and `routeDate` columns on `visits`, backed by `PUT /v1/visits/sequence`. Both the Next.js Web Console and Flutter mobile app display stop sequence badges (`Stop #1`, `Stop #2`), and dispatchers can reorder routes interactively with immediate persistence.
- **Recurring Task Generation Engine:** Reusable task templates support daily, weekly, and monthly recurrence schedules with automatic next-run computation and cron-driven batch spawning via BullMQ worker job `tasks.recurring.generate`.
- **Shift Roster & SLA Enforcement:** Managers assign multi-user shift rosters across date ranges, and BullMQ worker job `tasks.sla.check_overdue` continuously flags overdue tasks and triggers priority dispatch alerts.
- **Operational Analytics & Streaming CSV Export:** Computes employee attendance summaries, duty hours, late arrivals, task resolution SLA metrics, and visit duration averages. Supports streaming CSV downloads (`/v1/reports/export/csv`) and customer/site bulk CSV imports.
- **In-App Notification Center:** Full operational notification lifecycle (`TASK_ASSIGNED`, `TASK_OVERDUE`, `PROOF_REJECTED`, `MISSED_SHIFT`, `SYSTEM`) with unread badge counter, popover tray, and mark-as-read endpoints.
- **Drift SQLite Migration v4 on Mobile:** Local SQLite schema version 4 incorporates `sequenceOrder` and `routeDate` into `cachedVisits` and provides batch outbox flushing (`processOutboxBatch`) to sync pending offline queues atomically.
- **Strict Duty-Hours & Tenancy Preservation:** Off-duty location tracking remains impossible. All queries enforce transaction-scoped `SET LOCAL app.current_workspace_id`.

---

## 2. Database Schema & Migration Details

### 2.1 Applied Migration
- **Migration ID:** `0004_phase_04_advanced_operations`
- **Location:** `packages/database/drizzle/0004_phase_04_advanced_operations.sql`
- **Target Engine:** PostgreSQL 17/18 with PostGIS 3.5/3.6

### 2.2 Table Definitions & Tenancy Scope

All Phase 04 tables and columns are strictly **TENANT-SCOPED**:

| Table / Column | Scope | Description |
|---|---|---|
| `visits.sequence_order` | **TENANT-SCOPED** | Integer stop order for daily dispatch sequence (`1`, `2`, `3`). |
| `visits.route_date` | **TENANT-SCOPED** | Text/date string (`YYYY-MM-DD`) grouping stops by assigned day. Index: `visits_workspace_user_route_idx`. |
| `recurring_task_templates` | **TENANT-SCOPED** | Recurring task blueprints (`title`, `recurrence_frequency`: `DAILY`/`WEEKLY`/`MONTHLY`, `recurrence_interval`, `days_of_week`, `time_of_day`, `next_run_at`, `is_active`). |
| `shift_rosters` | **TENANT-SCOPED** | Shift scheduling assignments (`user_id`, `shift_id`, `roster_date`, `shift_name`, `planned_start_time`, `planned_end_time`). |
| `sync_mutation_records` | **TENANT-SCOPED** | Audit log for offline sync deduplication and conflict tracking (`mutation_id`, `idempotency_key`, `status`, `conflict_action`, `resolution_note`). |
| `notifications` | **TENANT-SCOPED** | In-app user notifications (`user_id`, `type`, `title`, `body`, `entity_type`, `entity_id`, `is_read`, `read_at`). |

### 2.3 Row-Level Security Policies
Every table executes:
```sql
ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE shift_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_rosters FORCE ROW LEVEL SECURITY;
ALTER TABLE sync_mutation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_mutation_records FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

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

## 3. Contracts & OpenAPI 3.1 Specification

### 3.1 New Schemas in `@oprino/contracts`
- **Sync:** `SyncMutationEnvelopeSchema`, `SyncBatchRequestSchema`, `SyncMutationResultSchema`, `SyncBatchResponseSchema`.
- **Visits:** `ReorderVisitsRequestSchema` (`userId`, `routeDate`, `orderedVisitIds`).
- **Tasks & Templates:** `RecurringTaskTemplateSchema`, `CreateRecurringTaskTemplateRequestSchema`, `UpdateRecurringTaskTemplateRequestSchema`, `ListRecurringTaskTemplatesResponseSchema`.
- **Attendance & Rosters:** `ShiftRosterSchema`, `AssignShiftRosterRequestSchema`, `ListShiftRostersResponseSchema`.
- **Reports:** `AttendanceReportResponseSchema`, `TaskSlaReportResponseSchema`, `VisitReportResponseSchema`, `BulkImportResultSchema`.
- **Notifications:** `NotificationSchema`, `ListNotificationsResponseSchema`, `MarkNotificationReadResponseSchema`.

### 3.2 Registered Endpoints
- `POST /v1/sync/mutations` — Atomic batch offline sync with conflict matrix resolution.
- `PUT /v1/visits/sequence` — Set route order for daily technician stops.
- `GET /v1/tasks/templates` & `POST /v1/tasks/templates` — Recurring task template CRUD.
- `GET /v1/attendance/rosters` & `POST /v1/attendance/rosters` — Shift roster management.
- `GET /v1/reports/attendance` — Attendance summaries, hours, and late minutes.
- `GET /v1/reports/tasks` — Task resolution rate and SLA overdue metrics.
- `GET /v1/reports/visits` — Visit duration and completion compliance.
- `GET /v1/reports/export/csv` — Streaming CSV export for spreadsheet integration.
- `POST /v1/reports/import/csv` — Bulk CSV import of customers and customer sites.
- `GET /v1/notifications` — In-app notification list with unread counter.
- `PATCH /v1/notifications/{id}/read` & `POST /v1/notifications/read-all` — Read state management.

---

## 4. Backend Services & Background Worker

### 4.1 Fastify Services (`services/api/src/services/`)
- **`SyncService`:** Executes conflict resolution rules, records deduplication hashes in `sync_mutation_records`, and returns status codes (`APPLIED`, `APPLIED_OVERRIDE`, `MERGED_PARTIAL`, `REJECTED_STALE`, `DUPLICATE_ACK`).
- **`SchedulingService`:** Computes template recurrence intervals, queries active rosters, and binds users to shifts.
- **`ReportService`:** Runs SQL aggregations across attendance sessions, task SLA resolution timestamps, and field visits. Streams RFC 4180 CSV exports.
- **`NotificationService`:** Dispatches in-app notifications and manages read receipts.
- **`VisitService` (extended):** Executes atomic stop reordering within single transaction.

### 4.2 BullMQ Background Workers (`services/worker/src/worker.ts`)
- **`tasks.recurring.generate`:** Queries active recurring task templates whose `nextRunAt <= NOW()`, creates new tasks with associated checklists and assignees, and advances `nextRunAt` based on recurrence frequency.
- **`tasks.sla.check_overdue`:** Queries in-progress/assigned tasks where `dueAt < NOW()`, creates `TASK_OVERDUE` in-app notifications, and flags assignees.

---

## 5. Web Console UI & Mobile Client

### 5.1 Next.js 15 Web Console (`apps/web`)
- **`NotificationBell` (`apps/web/src/components/NotificationBell.tsx`):** Header popover with unread counter badge, alert category indicators, and "Mark all read".
- **`ReportsPage` (`apps/web/src/app/reports/page.tsx`):** Tabbed analytics dashboard with Attendance Summaries, Task SLAs, and Visit Metrics plus streaming CSV download.
- **Route Sequencing (`apps/web/src/app/visits/page.tsx`):** Interactive "Reorder Stops" mode with Up/Down buttons and "Save Route Order" action. Displays stop sequence badges (`Stop #1`).

### 5.2 Flutter 3.47 Mobile Field Client (`apps/mobile`)
- **Drift SQLite Migration v4:** Added `sequenceOrder` and `routeDate` columns to `cachedVisits`.
- **Batch Outbox Flushing (`SyncService.processOutboxBatch`):** Transmits offline outbox mutations in batches of 25 to `/v1/sync/mutations` with server conflict resolution.
- **Stop Sequence Badges (`VisitsView`):** Renders sequence badges (`Stop #1`, `Stop #2`) next to status chips on visit cards.

---

## 6. Verification & Quality Gates

| Check / Gate | Target | Result | Status |
|---|---|---|---|
| Monorepo Typecheck | `pnpm turbo typecheck` (8 pkgs, 9 tasks) | 0 errors | **PASSED** |
| OpenAPI 3.1 & Dart Client | `pnpm --filter @oprino/contracts build` | 0 errors | **PASSED** |
| Phase 04 Unit & Contract Suite | `services/api/src/phase-04.unit.test.ts` | 10 / 10 tests passed | **PASSED** |
| Next.js 15 Production Build | `pnpm --filter @oprino/web build` | 14 / 14 static pages compiled | **PASSED** |
| Drift SQLite Mobile Schema | Schema version 4 migration & mapping | Consistent | **PASSED** |
| Tenant Isolation Policies | RLS on all 4 new tables | Active & Forced | **PASSED** |

---

## 7. Next Steps: Phase 05 Production Hardening & Launch Readiness

With Phase 04 fully complete, the system is prepared for **Phase 05**:
1. Production environment configuration & secrets orchestration (Doppler/Infisical).
2. End-to-end load testing, rate limiting, and BullMQ worker queue monitoring.
3. Final physical OEM Android APK build and device testing pipeline.
