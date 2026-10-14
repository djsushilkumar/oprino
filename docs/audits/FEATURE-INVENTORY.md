# Oprino V1 Feature Inventory & Implementation Verification

**Document:** Authoritative Feature Inventory, Verification Matrix & Implementation Audit  
**Audit Date:** October 14, 2026  
**Auditor Roles:** Principal Software Architect, Senior Full-Stack Engineer, QA Auditor  
**Product Baselines:** [`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md) and [`docs/product/V1-SCOPE.md`](../product/V1-SCOPE.md)  
**Allowed Statuses:** `VERIFIED` | `IMPLEMENTED BUT NOT VERIFIED` | `PARTIAL` | `MISSING` | `BROKEN` | `DEFERRED`  

---

## 1. Summary Status Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODULE INVENTORY SUMMARY                                                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Authentication & Workspace Management:       VERIFIED                               │
│ 2. Employee Management & Bulk CSV Onboarding:   VERIFIED                               │
│ 3. Roles & Permissions (RBAC & RLS):            VERIFIED                               │
│ 4. Task Management & Workflows:                 VERIFIED                               │
│ 5. Attendance & Shifts (Selfie & GPS):          VERIFIED                               │
│ 6. GPS Tracking & Geofencing (Duty Engine):     VERIFIED                               │
│ 7. Live Map & Route History:                    VERIFIED                               │
│ 8. Offline Mobile Synchronization (Drift):      VERIFIED                               │
│ 9. Customers & Customer Sites:                  VERIFIED                               │
│ 10. Visits & Field Operations:                  VERIFIED                               │
│ 11. Proof of Work & Media Storage:              PARTIAL (Mock storage backend)         │
│ 12. Notifications (In-App, Push, Email):        PARTIAL (In-app verified, Push/Email ms)│
│ 13. Reports & Operational Analytics:            VERIFIED                               │
│ 14. Company Settings & Retention Policies:      VERIFIED                               │
│ 15. SaaS Subscription & Billing Engine:         DEFERRED (Post-Pilot)                  │
│ 16. Web Dashboard & Employee Self-Service:      PARTIAL (Web works, role-trim pending) │
│ 17. Android & iOS Release Packaging:            PARTIAL (Android builds, signing/iOS ms)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Module Audits

### Module 1: Authentication and Workspace Management
- **What it does (in simple language):** Allows users to register, log in, create company workspaces, switch between different companies they belong to, and register their mobile installation with a unique ID.
- **Planned Functionality:** Multi-tenant workspace creation, email/password signup/signin via Better Auth, session governance, active workspace switching, and random UUIDv4 device installation authorization.
- **Implemented Functionality:** Full Better Auth authentication with Bearer token plugin; multi-workspace creation, switching, and membership resolution; device installation tracking with instant server-side revocation.
- **Backend Implementation Path:** `services/api/src/auth/better-auth.ts`, `services/api/src/routes/auth.ts`, `services/api/src/routes/workspaces.ts`, `services/api/src/services/device.service.ts`.
- **Web Implementation Path:** `apps/web/src/app/auth/signin/page.tsx`, `apps/web/src/app/auth/signup/page.tsx`, `apps/web/src/app/onboarding/workspace/page.tsx`, `apps/web/src/lib/api.ts`.
- **Mobile Implementation Path:** `apps/mobile/lib/features/auth/`, `apps/mobile/lib/core/storage/secure_storage_service.dart`, `apps/mobile/lib/core/network/auth_interceptor.dart`.
- **Current Test Evidence:** 8 Better Auth session tests, device revocation tests, and 5 multi-tenant isolation tests pass.
- **Missing Functionality:** OAuth social login (Google/Apple), deferred to V2.
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Maintain test coverage.

---

### Module 2: Employee Management & Bulk CSV Onboarding
- **What it does:** Allows administrators to invite new workers individually or in bulk via CSV, send secure activation links, change roles, assign managers, and suspend departed workers.
- **Planned Functionality:** Member roster, secure invitation links, bulk CSV import (up to 100 employees), CSV formula injection sanitization, member status changes (`active`, `suspended`, `removed`), and Last-Active-Owner protection.
- **Implemented Functionality:** Fully implemented in `feat/v1-blockers-remediation` (BLK-002, BLK-003, BLK-005). Shared developer password removed; 256-bit single-use cryptographic invitation tokens; `/auth/activate` self-password setup; CSV upload with partial error reporting; suspension with instant device revocation.
- **Backend Implementation Path:** `services/api/src/routes/workspaces.ts`, `services/api/src/services/workspace.service.ts`, `packages/contracts/src/schemas/workspace.ts`.
- **Web Implementation Path:** `apps/web/src/app/team/page.tsx`, `apps/web/src/app/auth/activate/page.tsx`.
- **Mobile Implementation Path:** N/A (Admin management performed on Web).
- **Current Test Evidence:** 16 automated integration tests pass in `services/api/src/v1-blockers.integration.test.ts`.
- **Missing Functionality:** Automated email dispatch of activation links (currently copied manually).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Integrate email service (Resend) for automated invitation delivery.

---

### Module 3: Roles and Permissions (RBAC & RLS)
- **What it does:** Guarantees that employees only access features and data they are permitted to see, and ensures complete separation between different tenant companies.
- **Planned Functionality:** 5-stage zero-trust tenant verification, transaction-scoped `SET LOCAL app.current_workspace_id` PostgreSQL Row-Level Security, default roles (`Owner`, `Admin`, `Manager`, `Employee`), custom roles, and permission guards.
- **Implemented Functionality:** Complete PostgreSQL RLS across all 29 public tables; default-deny database rules; Fastify route preHandlers `requireWorkspace` and `requirePermission`; negative test matrix.
- **Backend Implementation Path:** `packages/database/src/schema/`, `services/api/src/middleware/auth.ts`, `services/api/src/tests/rls.integration.test.ts`.
- **Web Implementation Path:** `apps/web/src/lib/api.ts` passes `X-Workspace-Id` header on all requests.
- **Mobile Implementation Path:** `apps/mobile/lib/core/network/auth_interceptor.dart` injects `X-Workspace-Id`.
- **Current Test Evidence:** 5 dedicated RLS multi-tenant isolation tests pass; 122 API domain integration tests enforce RBAC.
- **Missing Functionality:** Custom role creation UI on web (default roles fully operational).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Add custom role builder in Web Settings.

---

### Module 4: Task Management & Workflows
- **What it does:** Allows managers to create operational tasks with checklists, due dates, priority levels, and assign them to workers; workers update task status from their phone.
- **Planned Functionality:** Task creation, assignee dispatch, default field state machine (`ASSIGNED` → `ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED` → `VERIFIED`), interactive checklist sub-items, comments, and optimistic concurrency version locking.
- **Implemented Functionality:** Full task state machine with integer version checks (returns HTTP 409 Conflict on concurrent update); mandatory checklist completion enforced before completion; task activity comments; recurring task cron generator.
- **Backend Implementation Path:** `services/api/src/routes/tasks.ts`, `services/api/src/services/task.service.ts`, `services/worker/src/worker.ts`.
- **Web Implementation Path:** `apps/web/src/app/tasks/page.tsx`, `apps/web/src/lib/api.ts`.
- **Mobile Implementation Path:** `apps/mobile/lib/features/tasks/presentation/tasks_view.dart`, `apps/mobile/lib/core/database/database.dart`.
- **Current Test Evidence:** 15 task domain integration tests pass with optimistic locking verification.
- **Missing Functionality:** Multi-assignee collaborative task claiming pool (scheduled for V1.1).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Multi-worker task assignment.

---

### Module 5: Attendance and Shifts (Selfie & GPS)
- **What it does:** Allows workers to punch in and out to record their working hours, verified with GPS coordinates and front-camera selfies to prevent buddy punching.
- **Planned Functionality:** Idempotent punch in/out, shift definitions, overnight shifts with grace periods, GPS verification, front-camera selfie verification, anti-replay protection, and workspace policy enforcement.
- **Implemented Functionality:** Full attendance lifecycle; company-configurable policies (`SIMPLE`, `GPS_REQUIRED`, `SELFIE_REQUIRED`, `GPS_AND_SELFIE_REQUIRED`); anti-replay detection rejecting duplicate selfie keys across sessions; mobile `AttendanceSelfieSheet`; manager team attendance overview.
- **Backend Implementation Path:** `services/api/src/routes/attendance.ts`, `services/api/src/services/attendance.service.ts`, `packages/database/src/schema/attendance.ts`.
- **Web Implementation Path:** `apps/web/src/app/attendance/page.tsx`, `apps/web/src/app/settings/page.tsx`.
- **Mobile Implementation Path:** `apps/mobile/lib/features/attendance/presentation/attendance_view.dart`, `apps/mobile/lib/features/attendance/presentation/widgets/attendance_selfie_sheet.dart`.
- **Current Test Evidence:** 7 BLK-004 automated integration tests pass; attendance punch idempotency verified.
- **Missing Functionality:** Leave request and regularization approval workflow (SHOULD scope).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Physical field validation of camera permissions on low-end Android devices.

---

### Module 6: GPS Tracking & Geofencing (Duty Engine)
- **What it does:** Records worker location only during active duty shifts, filters out inaccurate GPS noise, detects circular office geofence entry, and enforces strict worker privacy.
- **Planned Functionality:** Inviolable duty-hours-only invariant (off-duty points hard-dropped with zero DB writes); accuracy filter (`<= 50m`); anomaly speed drop (`<= 45m/s`); Haversine daily travel summary; circular geofences with proximity checking.
- **Implemented Functionality:** Open-source `geolocator` foreground tracking service with persistent notification; API telemetry ingestion pipeline with batch deduplication; PostGIS point columns; Redis Pub/Sub broadcast; geofence proximity API.
- **Backend Implementation Path:** `services/api/src/routes/telemetry.ts`, `services/api/src/routes/geofences.ts`, `services/api/src/services/telemetry.service.ts`, `services/api/src/services/geofence.service.ts`.
- **Web Implementation Path:** `apps/web/src/app/live-map/page.tsx`.
- **Mobile Implementation Path:** `apps/mobile/lib/core/location/location_service.dart`.
- **Current Test Evidence:** 18 Phase 02C & BLK-001 integration tests pass; off-duty drops confirmed with 0 DB writes.
- **Missing Functionality:** Polygon (multi-point) geofence shapes (circular geofences fully functional).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Physical Android battery consumption benchmark under Doze mode.

---

### Module 7: Live Map & Route History
- **What it does:** Displays on-duty workers on an interactive map in the Web dashboard, showing their live location and historical daily breadcrumb trail.
- **Planned Functionality:** MapLibre GL JS web map, Server-Sent Events (SSE) live location stream, worker selection inspector, and historical playback trail.
- **Implemented Functionality:** Real-time SSE streaming endpoint (`/v1/telemetry/stream`) secured with single-use cryptographic tickets; SVG and MapLibre fallback live radar; route playback scrubber; worker status sidebar.
- **Backend Implementation Path:** `services/api/src/routes/telemetry.ts`, `services/api/src/services/pubsub.service.ts`.
- **Web Implementation Path:** `apps/web/src/app/live-map/page.tsx`.
- **Mobile Implementation Path:** N/A (Manager oversight view on Web).
- **Current Test Evidence:** 5 SSE streaming and ticket single-use integration tests pass.
- **Missing Functionality:** Mobile live map view for managers on the go (web dashboard fully operational).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Mobile manager radar tab in Flutter app.

---

### Module 8: Offline Mobile Synchronization (Drift SQLite)
- **What it does:** Enables workers to punch in, accept tasks, tick checklist items, and complete visits without an internet connection, automatically uploading pending changes when back online.
- **Planned Functionality:** Client-side SQLite database using Drift; durable outbox mutation queue; deterministic conflict resolution rules (managerial cancellation precedence, checklist union merging, punch-out hardware override); reactive UI streams.
- **Implemented Functionality:** Drift schema with tables for tasks, checklist items, attendance punches, visits, and outbox mutations; `SyncService` with exponential backoff and background drain; pending sync badge in mobile AppBar.
- **Backend Implementation Path:** `services/api/src/routes/sync.ts`, `services/api/src/services/sync.service.ts`.
- **Web Implementation Path:** N/A (Web is online-first).
- **Mobile Implementation Path:** `apps/mobile/lib/core/database/database.dart`, `apps/mobile/lib/core/sync/sync_service.dart`.
- **Current Test Evidence:** 14 mobile offline synchronization tests pass in `apps/mobile/test/`.
- **Missing Functionality:** Background isolate sync when app is terminated.
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Field testing with simulated airplane mode toggles on physical hardware.

---

### Module 9: Customers and Customer Sites
- **What it does:** Maintains a directory of clients and their physical office or facility locations, complete with GPS coordinates and geofence radii.
- **Planned Functionality:** Customer CRUD, Customer Site CRUD (1:N relationship), address and coordinate management, geocoding fallback, and bulk CSV customer import.
- **Implemented Functionality:** Full REST endpoints for Customers and Sites; PostGIS coordinate storage; site geofence radius; CSV bulk customer/site import API.
- **Backend Implementation Path:** `services/api/src/routes/customers.ts`, `services/api/src/services/customer.service.ts`, `packages/database/src/schema/customers.ts`.
- **Web Implementation Path:** `apps/web/src/app/customers/page.tsx`, `apps/web/src/lib/api.ts`.
- **Mobile Implementation Path:** Linked via task and visit details.
- **Current Test Evidence:** 8 customer and site integration tests pass.
- **Missing Functionality:** Customer portal login (explicit non-goal for V1).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Google Places API address autocomplete in web site modal.

---

### Module 10: Visits & Field Operations
- **What it does:** Represents physical visits to customer sites, separate from tasks; supports arrival check-in, departure check-out, duration tracking, and day-route stop ordering.
- **Planned Functionality:** Separation of Tasks vs Physical Visits (0, 1, or N visits per task); check-in and check-out with GPS stamping; day-route stop sequencing (`Stop 1`, `Stop 2`, `Stop 3`).
- **Implemented Functionality:** Visit lifecycle (`SCHEDULED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`); proximity validation against site coordinates on check-in; `PUT /v1/visits/sequence` reordering endpoint; mobile visit action sheet.
- **Backend Implementation Path:** `services/api/src/routes/visits.ts`, `services/api/src/services/visit.service.ts`, `packages/database/src/schema/field_operations.ts`.
- **Web Implementation Path:** `apps/web/src/app/visits/page.tsx`, `apps/web/src/lib/api.ts`.
- **Mobile Implementation Path:** `apps/mobile/lib/features/visits/presentation/visits_view.dart`.
- **Current Test Evidence:** 12 visit lifecycle and sequencing integration tests pass.
- **Missing Functionality:** Algorithmic traveling-salesperson route optimization (deferred to V2).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Drag-and-drop stop reordering UI on mobile.

---

### Module 11: Proof of Work & Media Storage
- **What it does:** Captures photos, client signatures on glass, and notes to prove work was completed, allowing supervisors to inspect and approve or reject submissions.
- **Planned Functionality:** Watermarked camera photo capture (timestamp, coordinates, task ID), digital signature pad on glass, pre-signed direct upload to S3/R2 with tenant prefix isolation, supervisor verification queue (`VERIFIED`, `REJECTED`).
- **Implemented Functionality:** Mobile `CustomerSignatureSheet` and `PhotoProofSheet`; supervisor verification API; tenant prefix path barrier validation (`${workspaceId}/...`).
- **Backend Implementation Path:** `services/api/src/routes/media.ts`, `services/api/src/services/media.service.ts`.
- **Web Implementation Path:** `apps/web/src/app/tasks/page.tsx` proof inspector modal.
- **Mobile Implementation Path:** `apps/mobile/lib/features/tasks/presentation/widgets/customer_signature_sheet.dart`.
- **Current Test Evidence:** 9 proof confirmation and supervisor verification integration tests pass.
- **Missing Functionality:** **REAL S3 / R2 BLOB STORAGE INTEGRATION.** The backend currently uses `/v1/media/mock-upload/*` which discards binary payloads.
- **Known Bugs:** Uploaded images and signatures cannot be downloaded or viewed in production until cloud storage is wired.
- **Production Readiness Status:** **PARTIAL**
- **Next Required Work:** Wire AWS S3 SDK or Cloudflare R2 client in `MediaService.ts` and set production bucket environment variables.

---

### Module 12: Notifications (In-App, Push, Email)
- **What it does:** Alerts workers when tasks are assigned, approaching due dates, or rejected; alerts managers when proof is submitted.
- **Planned Functionality:** PostgreSQL in-app notifications, FCM v1 Android push notifications, APNs iOS push notifications, Resend email notifications for digests and invitations.
- **Implemented Functionality:** PostgreSQL `notifications` table with tenant isolation; REST endpoints for fetching unread count, marking read, and marking all read; Web header notification bell drawer.
- **Backend Implementation Path:** `services/api/src/routes/notifications.ts`, `services/api/src/services/notification.service.ts`, `packages/database/src/schema/notifications.ts`.
- **Web Implementation Path:** `apps/web/src/components/NotificationBell.tsx`.
- **Mobile Implementation Path:** In-app notification polling.
- **Current Test Evidence:** 6 notification integration tests pass.
- **Missing Functionality:**
  - **FCM v1 / APNs Push:** No Firebase SDK or Apple Push client in code.
  - **Email Delivery:** No Resend or SMTP provider in code.
- **Known Bugs:** None (in-app works; external channels simply not wired).
- **Production Readiness Status:** **PARTIAL**
- **Next Required Work:** Implement `PushNotificationService` with Firebase Admin SDK and `EmailService` with Resend.

---

### Module 13: Reports & Operational Analytics
- **What it does:** Generates operational summaries for payroll, attendance compliance, task completion rates, and customer visit histories with CSV download.
- **Planned Functionality:** Relational aggregations in PostgreSQL, streaming CSV export, daily attendance report, task SLA completion report, and customer visit audit report.
- **Implemented Functionality:** Endpoints `/v1/reports/attendance`, `/v1/reports/tasks`, `/v1/reports/visits`, and streaming `/v1/reports/export/csv`; Next.js reporting page with date range filters and metric cards.
- **Backend Implementation Path:** `services/api/src/routes/reports.ts`, `services/api/src/services/report.service.ts`.
- **Web Implementation Path:** `apps/web/src/app/reports/page.tsx`.
- **Mobile Implementation Path:** N/A (Manager report view on Web).
- **Current Test Evidence:** 7 reporting aggregation and streaming CSV tests pass.
- **Missing Functionality:** PDF renderer for formatted executive summary sheets (scheduled for V1.1).
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** PDF generation via BullMQ worker.

---

### Module 14: Company Settings & Retention Policies
- **What it does:** Allows business owners to configure company-wide attendance rules (simple vs selfie vs GPS) and data retention duration for location history.
- **Planned Functionality:** Configurable location retention (7, 30, 90, 180 days); attendance policy configuration; tenant-isolated nightly purging.
- **Implemented Functionality:** Fully implemented in `feat/v1-blockers-remediation` (BLK-006). `GET /v1/workspaces/settings` and `PATCH /v1/workspaces/settings`; nightly BullMQ worker iterates workspaces and prunes telemetry per policy; Web `/settings` page.
- **Backend Implementation Path:** `services/api/src/routes/workspaces.ts`, `services/worker/src/worker.ts`, `packages/database/src/schema/tenants.ts`.
- **Web Implementation Path:** `apps/web/src/app/settings/page.tsx`.
- **Mobile Implementation Path:** N/A (Admin configuration on Web).
- **Current Test Evidence:** 4 BLK-006 integration tests pass.
- **Missing Functionality:** Custom retention periods (>180 days) for enterprise compliance.
- **Known Bugs:** None.
- **Production Readiness Status:** **VERIFIED**
- **Next Required Work:** Maintain test coverage.

---

### Module 15: SaaS Subscription & Billing Readiness
- **What it does:** Manages plan tiers (Starter, Growth, Business, Enterprise), user seats, billing cycles, and automated payment collection.
- **Planned Functionality:** Self-service checkout, Stripe/Razorpay webhooks, seat overage enforcement, and tier feature gating.
- **Implemented Functionality:** Pricing strategy documented in `docs/business/PRICING-STRATEGY.md`. Zero database tables, zero payment gateway code, and zero subscription webhooks exist in the monorepo.
- **Backend Implementation Path:** None.
- **Web Implementation Path:** None.
- **Mobile Implementation Path:** None.
- **Current Test Evidence:** None.
- **Missing Functionality:** The entire billing and subscription infrastructure.
- **Known Bugs:** N/A.
- **Production Readiness Status:** **DEFERRED**
- **Next Required Work:** Integrate Stripe / Razorpay checkout after pilot customer validation.

---

### Module 16: Web Dashboard & Employee Self-Service
- **What it does:** The primary browser application for managing operations, scheduling, and monitoring field staff.
- **Planned Functionality:** Comprehensive desktop command center for Owners/Managers; limited self-service portal for Employees (viewing their own assigned tasks, personal attendance calendar, and profile).
- **Implemented Functionality:** 14 Next.js App Router pages; responsive CSS grid layout; dynamic API URL resolver; real-time attendance review; live radar map.
- **Backend Implementation Path:** Fastify API endpoints.
- **Web Implementation Path:** `apps/web/src/`.
- **Mobile Implementation Path:** N/A.
- **Current Test Evidence:** 7 Web auth flow tests pass; Next.js 15 production build succeeds.
- **Missing Functionality:** Header navigation currently displays manager links (`/live-map`, `/team`, `/settings`) to Employee users, which throw 403 Forbidden when clicked.
- **Known Bugs:** Lack of client-side role navigation guard.
- **Production Readiness Status:** **PARTIAL**
- **Next Required Work:** Filter navigation items in `HeaderNav.tsx` based on the user's role.

---

### Module 17: Android and iOS Release Packaging & Signing
- **What it does:** Packages the Flutter mobile codebase into signed production application binaries ready for distribution on Google Play Store and Apple App Store.
- **Planned Functionality:** Automated signing pipelines, keystore secret injection, R8 code shrinking, ProGuard reflection rules, and TestFlight / Play Console deployment.
- **Implemented Functionality:** Build scripts (`apps/mobile/scripts/build-release-apk.ps1`/`.sh`); ProGuard rules for Drift and SQLite; GitHub Actions release workflow `.github/workflows/mobile-release.yml`.
- **Backend Implementation Path:** N/A.
- **Web Implementation Path:** N/A.
- **Mobile Implementation Path:** `apps/mobile/android/`, `apps/mobile/ios/`.
- **Current Test Evidence:** Release APK compilation tested in CI.
- **Missing Functionality:**
  - Production release keystore (currently uses ephemeral debug keystores).
  - iOS release build workflow (no Fastlane, no provisioning profile, no TestFlight).
- **Known Bugs:** Release APK is debug-signed and cannot be published to Google Play.
- **Production Readiness Status:** **PARTIAL**
- **Next Required Work:** Generate official production upload keystore, configure GitHub Actions secrets, and set up Fastlane for iOS.
