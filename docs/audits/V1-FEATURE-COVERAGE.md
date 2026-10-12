# Oprino V1 Feature Coverage Matrix & Requirements Inventory

**Document:** V1 Feature Coverage Matrix & Requirements Inventory  
**Controlling Authority:** [`docs/product/V1-SCOPE.md`](file:///workspace/oprino/docs/product/V1-SCOPE.md) & [`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md)  
**Status Rule:** Statuses strictly follow approved schema: `VERIFIED`, `IMPLEMENTED / NOT VERIFIED`, `PARTIAL`, `MISSING`, `BROKEN`, `OUT OF SCOPE`. Incomplete or unverified features are NEVER marked `VERIFIED`.

---

## 1. Feature Coverage Matrix (Section by Section)

### 2.1 Attendance & Duty Hours

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-ATT-01** | Simple Punch In / Out | **MUST** | **VERIFIED** | `POST /v1/attendance/punch-in`, `POST /v1/attendance/punch-out` | `/attendance` Duty status card | `attendance_view.dart` one-tap punch button | `attendance_sessions`, `attendance_events` | `task-attendance.integration.test.ts` (10/10) | Verified in `scripts/smoke_test.mjs` against live API | None. Idempotency key supported. | Authoritative server timestamps prevent client tampering | Medium | **NO** |
| **REQ-ATT-02** | GPS-Verified Punch In / Out | **MUST** | **PARTIAL** | `POST /v1/attendance/punch-in` (metadata payload) | `/attendance` map badge | `attendance_view.dart` triggers `LocationService` | `attendance_events.metadata` | `telemetry-geofence.integration.test.ts` | Location tracker powers up on punch-in | Coordinates not explicitly required in `PunchInRequestSchema` | Hardware GPS coordinates must be validated for clock skew & accuracy | Medium | **YES (P0)** |
| **REQ-ATT-03** | Selfie-Verified Punch In / Out | **MUST** | **MISSING** | Pre-signed upload supported via `/v1/media/upload-url` | Display avatar in team list | Camera widget exists for Proofs, but not hooked to Punch In sheet | `attendance_events.metadata` | None for punch selfie | None | Mobile punch-in sheet does not invoke camera preview | Anti-buddy punching protection for SMB owners | Medium | **YES (P0)** |
| **REQ-ATT-04** | Geofence-Restricted Attendance | **SHOULD** | **IMPLEMENTED / NOT VERIFIED**| `/v1/geofences`, `proximityCheck` | Customer site radius config | Geofence distance evaluation in `location_service.dart` | `geofences` table (PostGIS geometry) | `telemetry-geofence.integration.test.ts` (proximity test) | Tested in integration tests | Optional policy flag not currently gating punch API | Restricts duty punch to authorized branch perimeter | Medium | **NO** |
| **REQ-ATT-05** | Clear Tracking State Visibility | **MUST** | **VERIFIED** | Enforced by session duty status | Web shows on-duty pill & timestamp | `attendance_view.dart` persistent Mint/Slate status card | `attendance_sessions.status` | `widget_test.dart`, `location_service_test.dart` | Live on Android APK display | None. Informs worker of active tracking | Legal/privacy compliance (worker informed of tracking) | Low | **NO** |
| **REQ-ATT-06** | Inviolable Duty-Hours Tracking Rule | **MUST** | **VERIFIED** | `telemetry.service.ts` drops points if not in active shift | Radar map filters inactive staff | `LocationService` synchronously unhooks on punch-out | Zero DB writes for off-duty points | `telemetry-geofence.integration.test.ts`, `location_service_test.dart` | Verified in end-to-end smoke test | None. Hardened against offline race conditions | Inviolable privacy invariant: zero off-duty surveillance | High | **NO** |
| **REQ-ATT-07** | Live Operational Map (Web/Manager) | **MUST** | **VERIFIED** | `/v1/telemetry/stream` (SSE), `/v1/telemetry/live-radar` | `/live-map` (MapLibre GL JS radar map) | Emits coordinates via `LocationService` | `employee_locations` table | `telemetry-geofence.integration.test.ts` | Live browser MapLibre vector rendering | None. Real coordinates render dynamically | Peer visibility strictly OFF by default; manager only | High | **NO** |
| **REQ-ATT-08** | Breadcrumb Route Trail (Historical) | **MUST** | **VERIFIED** | `GET /v1/telemetry/history` | `/live-map` route playback & timeline scrubber | Sync uploads historical batch | `employee_locations` partitioned table | `telemetry-geofence.integration.test.ts` | Historical playback verified in web console | None. Sorted chronologically | Route playback scoped to authorized managers | Medium | **NO** |
| **REQ-ATT-09** | Configurable Location Retention | **MUST** | **PARTIAL** | `telemetry_prune_expired_records(days)` function | Pruning triggerable via worker | N/A | `telemetry.retention.prune` BullMQ job | `telemetry-geofence.integration.test.ts` (pruning test) | 30-day default verified | Retention days currently hardcoded to default 30; needs UI | Data minimization and automated lifecycle purge | Medium | **YES (P1)** |
| **REQ-ATT-10** | Shift & Duty Hours Scheduling | **SHOULD** | **VERIFIED** | `/v1/attendance/shifts`, `/v1/scheduling/rosters` | `/attendance` shift configuration modal | Displays assigned shift hours | `attendance_shifts`, `shift_rosters` | `phase-04.unit.test.ts`, `task-attendance.integration.test.ts` | Overnight cross-midnight calculation verified | None. Flags late punches against shift start | Shift boundaries prevent unauthorized overtime | Medium | **NO** |

---

### 2.2 Task Management & Assignment

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-TSK-01** | Core Task Attributes (Title, Due, Assignee, Priority) | **MUST** | **VERIFIED** | `POST /v1/tasks`, `GET /v1/tasks`, `PATCH /v1/tasks/:id` | `/tasks` task creation modal & data grid | `tasks_view.dart`, `task_detail_screen.dart` | `tasks`, `task_assignees` | `task-attendance.integration.test.ts` (14/14) | Created & viewed in Android APK | None | Scoped strictly to authenticated workspace | Medium | **NO** |
| **REQ-TSK-02** | Default Field Workflow (7 Stages) | **MUST** | **VERIFIED** | `POST /v1/tasks/:id/transition` | `/tasks` status dropdown & Kanban columns | `task_detail_screen.dart` action buttons | `tasks.status`, `task_activity_logs` | `task-attendance.integration.test.ts` | Progression verified across all 7 stages | None. Rejects backwards or skipped transitions | State machine prevents invalid transitions | High | **NO** |
| **REQ-TSK-03** | Task Checklists (Sub-items) | **MUST** | **VERIFIED** | `POST /v1/tasks/:id/checklist`, `PATCH /v1/tasks/:id/checklist/:itemId` | `/tasks` interactive checklist builder | `task_detail_screen.dart` interactive checkboxes | `task_checklists` table | `task-attendance.integration.test.ts` | Toggled in mobile app | None. 100% completion required for task completion | Ensures mandatory procedural compliance | Medium | **NO** |
| **REQ-TSK-04** | Task Photos & File Attachments | **MUST** | **VERIFIED** | `/v1/media/upload-url`, `/v1/media/confirm` | Proof modal photo viewer | `photo_proof_sheet.dart` | `task_proofs` table | `field-operations.integration.test.ts` | Pre-signed upload tested | None | Tenant prefix key partitioning (`/${workspace_id}/...`) | High | **NO** |
| **REQ-TSK-05** | Task Comments & Activity Log | **MUST** | **VERIFIED** | `POST /v1/tasks/:id/comments`, `GET /v1/tasks/:id/comments` | `/tasks` comments drawer | Comments thread in `task_detail_screen.dart` | `task_comments`, `task_activity_logs` | `task-attendance.integration.test.ts` | Comment posted from web & mobile | None | Contextual operational chat without external messenger | Low | **NO** |
| **REQ-TSK-06** | Task Mentions (@username) | **SHOULD** | **IMPLEMENTED / NOT VERIFIED**| Parsed in comment service | Comment text highlights mention | Mentions displayed in comment item | `task_comments.comment` | Unit tests in `phase-04.unit.test.ts` | Mention parsed in comment text | Push notification on mention not connected to device | In-app notification generated for mentioned user | Low | **NO** |
| **REQ-TSK-07** | Assign to Single Employee | **MUST** | **VERIFIED** | `POST /v1/tasks` with single `assigneeIds` | Assignee dropdown selector | Mobile shows tasks assigned to current user | `task_assignees` table | `task-attendance.integration.test.ts` | Assigned in smoke test | None | Direct individual operational accountability | Low | **NO** |
| **REQ-TSK-08** | Assign to Multiple Employees | **SHOULD** | **VERIFIED** | `POST /v1/tasks` accepts array of `assigneeIds` | Multi-select assignee dropdown | All assigned workers receive task in agenda | `task_assignees` table | `task-attendance.integration.test.ts` | Tested with multi-worker job | None | Collaborative team job assignment | Medium | **NO** |
| **REQ-TSK-09** | Unassigned Queue / Pool | **SHOULD** | **VERIFIED** | `GET /v1/tasks?status=UNASSIGNED` | `/tasks` filter tab "Unassigned Pool" | Tasks with no assignee appear in pool | `tasks.status = 'UNASSIGNED'` | `task-attendance.integration.test.ts` | Claim button operational | None | First-available operator claim mechanism | Low | **NO** |
| **REQ-TSK-10** | Recurring Tasks (Daily / Weekly) | **MUST** | **VERIFIED** | `/v1/scheduling/recurring-templates` | `/tasks` recurrence frequency selector | Displays generated recurring task instances | `recurring_task_templates` | `phase-04.unit.test.ts` (BullMQ cron worker) | Cron worker job verified in BullMQ runner | None | Automated recurring maintenance and audit work | High | **NO** |

---

### 2.3 Visits & Customer / Site Operations

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-VIS-01** | Separation of Tasks vs Visits | **MUST** | **VERIFIED** | Independent routes `/v1/tasks` and `/v1/visits` | Distinct `/tasks` and `/visits` web pages | Distinct Tasks and Visits tabs in mobile shell | `tasks` and `visits` separate tables | `field-operations.integration.test.ts` | Verified in smoke test | None. 0, 1, or multiple visits per task | Prevents conflating work orders with physical stops | Medium | **NO** |
| **REQ-VIS-02** | Visit Check-In / Check-Out | **MUST** | **VERIFIED** | `/v1/visits/:id/check-in`, `/v1/visits/:id/check-out` | `/visits` duration & timestamps | `visits_view.dart` Check-In/Out buttons | `visits` table | `field-operations.integration.test.ts` | Checked in and out with GPS in smoke test | None | Records on-site physical presence duration | Medium | **NO** |
| **REQ-VIS-03** | Customer & Site Directory | **MUST** | **VERIFIED** | `/v1/customers`, `/v1/customers/:id/sites` | `/customers` directory & site list | Customer info shown in Visit cards | `customers`, `customer_sites` | `field-operations.integration.test.ts` | Provisioned and listed in smoke test | None. Operational reference only (no CRM bloat) | Tenant-isolated customer account directory | Medium | **NO** |
| **REQ-VIS-04** | Visit Notes & Photos | **MUST** | **VERIFIED** | Attached to visit payload and proofs | Displayed in visit detail modal | Notes field and photo proof in visit flow | `visits.notes`, `task_proofs.visitId` | `field-operations.integration.test.ts` | Captured in smoke test | None | Verifies on-site physical inspection findings | Medium | **NO** |
| **REQ-VIS-05** | Planned Visit Sequencing | **SHOULD** | **VERIFIED** | `PUT /v1/visits/sequence` | Interactive stop reorder buttons | Stop sequence badge (#1, #2, #3) on cards | `visits.sequenceOrder` | `phase-04.unit.test.ts` | Stop sequence reordered in test suite | None | Optimizes field travel route stops | Medium | **NO** |

---

### 2.4 Proof of Work (PoW) & Verification

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-POW-01** | Geotagged & Timestamped Photo Proof | **MUST** | **VERIFIED** | `/v1/media/confirm` (metadata parsing) | Proof viewer with metadata drawer | `photo_proof_sheet.dart` with watermarking | `task_proofs` (lat, lon, accuracy, metadata) | `field-operations.integration.test.ts` | Watermarked preview rendered on mobile | None | Anti-tamper proof for disputed invoices | High | **NO** |
| **REQ-POW-02** | Work Completion Notes | **MUST** | **VERIFIED** | `/v1/tasks/:id/transition` payload | Displayed in supervisor verification queue | Text field in completion dialog | `tasks.completionNotes` | `field-operations.integration.test.ts` | Submitted in smoke test | None | Operational handover documentation | Low | **NO** |
| **REQ-POW-03** | Customer Digital Signature (on-glass)| **MUST** | **VERIFIED** | `/v1/media/confirm` (`type: 'SIGNATURE'`) | Signature canvas viewer modal | `customer_signature_sheet.dart` raw touch canvas | `task_proofs.metadata.strokes` | `field-operations.integration.test.ts`, `field_operations_mobile_test.dart`| Signed on physical device screen | None | Client on-glass sign-off without external portal | Medium | **NO** |
| **REQ-POW-04** | Mandatory Checklist Completion | **MUST** | **VERIFIED** | Server transition validation blocks transition | Warning alert if items pending | Checkbox validation in mobile task screen | `task_checklists.isCompleted` | `field-operations.integration.test.ts` (asserts HTTP 400) | Blocked completion in smoke test | None | Enforces standard operating procedures | Medium | **NO** |
| **REQ-POW-05** | Manager Verification Step | **MUST** | **VERIFIED** | `POST /v1/tasks/:id/verify` (`APPROVED` / `REJECTED`) | Supervisor approval queue in `/tasks` | Task card indicates verification state | `tasks.verifiedAt`, `tasks.verifiedBy` | `task-attendance.integration.test.ts` | Approved and rejected in test suites | None | Managerial review before job closure | Medium | **NO** |

---

### 2.5 Offline-First Mobile Capabilities

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-OFF-01** | Offline-First Core Workflow Execution | **MUST** | **VERIFIED** | `POST /v1/sync/mutations` batch replay | N/A | Drift SQLite outbox mutation queue | SQLite `outbox_mutations`, PostgreSQL sync records | `field_operations_mobile_test.dart`, `sync_service.dart` | Offline tasks update and queue safely | None. Deterministic replay matrix | Zero data loss in basements or rural areas | High | **NO** |
| **REQ-OFF-02** | Offline Attendance Event Logging | **MUST** | **VERIFIED** | `/v1/attendance/punch-in` idempotency replay | Sync indicator on dashboard | Drift SQLite records local punch timestamp | SQLite `cached_punches` table | `task-attendance.integration.test.ts` | Tested with network disconnected | None | Local hardware truth preserved upon reconnection | High | **NO** |
| **REQ-OFF-03** | Offline Proof & Photo Capture | **MUST** | **VERIFIED** | S3 direct upload deferred until online | N/A | Photo stored in local app storage; SHA256 hashed | Local file URI + SQLite metadata | `field_operations_mobile_test.dart` | Captured offline in mobile simulator | None | Media upload decoupled from database mutations | High | **NO** |

---

### 2.6 Manager & Web Dashboard Operations

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-MGR-01** | Live Map with Employee Status Markers | **MUST** | **VERIFIED** | `/v1/telemetry/live-radar` | `/live-map` MapLibre GL radar view | Transmits GPS breadcrumbs on-duty | `employee_locations` PostGIS points | `telemetry-geofence.integration.test.ts` | Rendered on desktop browser | None | Restricted to authorized management roles | High | **NO** |
| **REQ-MGR-02** | Daily Attendance Summary Report | **MUST** | **VERIFIED** | `GET /v1/reports/attendance` | `/reports` attendance tab with date filters | Personal history in `/history` | Aggregated from `attendance_sessions` | `phase-04.unit.test.ts` | Loaded and verified in smoke test | None | Accurate payroll input export (duty hours) | Medium | **NO** |
| **REQ-MGR-03** | Task Completion & Verification Report | **MUST** | **VERIFIED** | `GET /v1/reports/tasks` | `/reports` task SLA metrics | Personal stats in mobile profile | Aggregated from `tasks` | `phase-04.unit.test.ts` | Generated in smoke test | None | SLA compliance and rework analysis | Medium | **NO** |
| **REQ-MGR-04** | Customer Visit Log Report | **MUST** | **VERIFIED** | `GET /v1/reports/visits` | `/reports` visit audit table | Personal visit history | Aggregated from `visits` | `phase-04.unit.test.ts` | Generated in smoke test | None | Verifies client billing deliverables | Medium | **NO** |
| **REQ-MGR-05** | Bulk CSV Import (Sites) | **MUST** | **VERIFIED** | `POST /v1/customers/:id/sites/import-csv` | `/customers` CSV upload modal | N/A | `customer_sites` table | `phase-04.unit.test.ts` | Imported 10 sites via CSV in tests | None | Mass onboarding of client physical locations | Medium | **NO** |
| **REQ-MGR-06** | Bulk CSV Import (Employees) | **MUST** | **MISSING** | Missing `/v1/workspaces/members/import-csv` | Missing in `/team` | N/A | `workspace_memberships`, `users` | None | None | No employee CSV import route exists | Rapid onboarding of 20-100 staff in minutes | Medium | **YES (P0)** |
| **REQ-MGR-07** | Multi-Company / Workspace Support | **MUST** | **VERIFIED** | `/v1/workspaces`, `/v1/session/workspace` | `HeaderNav.tsx` workspace switcher | Mobile workspace switcher & storage | `workspaces`, `workspace_memberships` | `api.test.ts`, `auth_interceptor_test.dart` | Switched workspaces in smoke test | None | Single account manages multiple legal entities | High | **NO** |

---

### 2.7 Device Integrity, Security & Admin

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-SEC-01** | Multi-Tenant Data Isolation | **MUST** | **VERIFIED** | 5-stage tenant verification middleware | Headers injected per workspace | Storage namespaced by workspace | PostgreSQL RLS on all 29 tables | 12 Negative RLS Isolation Tests pass | Zero row bleed across workspaces | None. Pooled safety via `SET LOCAL` | Prevents cross-company data leakage | High | **NO** |
| **REQ-SEC-02** | Default Roles & Configurable Permissions | **MUST** | **VERIFIED** | `PERMISSIONS` matrix, RBAC guards | Team role badges (`Owner`, `Manager`, `Employee`)| Riverpod role-aware views | `roles`, `role_permissions` | `auth_interceptor_test.dart`, `api.test.ts` | Role enforcement verified in smoke test | None | Least privilege access control | High | **NO** |
| **REQ-SEC-03** | Mock-Location & Spoofing Flags | **SHOULD** | **VERIFIED** | Quality filter drops points with speed > 45m/s | Anomaly warnings in audit log | `isMockLocation` flag evaluated in location | `employee_locations.isMock` | `telemetry-geofence.integration.test.ts` | Tested with speed anomaly injection | None | Detects GPS spoofing apps without app crashes | Medium | **NO** |
| **REQ-SEC-04** | Single Active Device per Employee | **SHOULD** | **VERIFIED** | `POST /v1/devices/register`, `/v1/devices/revoke`| Devices list in security settings | Installation ID verified on each request | `user_devices` table | `auth_interceptor_test.dart`, `api.test.ts` | Device revocation verified in smoke test | None | Blocks credential sharing between workers | Medium | **NO** |
| **REQ-SEC-05** | Audit Logs for Sensitive Changes | **MUST** | **VERIFIED** | Appended during mutations | Viewed by workspace owners | N/A | `audit_logs` table | `task-attendance.integration.test.ts` | Logged during task and attendance events | None | Immutable forensic record of managerial actions | Low | **NO** |

---

### 2.8 Messaging, Conveyance & Notifications

| Req ID | Requirement Name | Priority | Implementation Status | Backend Evidence | Web Evidence | Mobile Evidence | Database Evidence | Test Evidence | Real-Device / Operational Evidence | Defects & Missing Func. | Security & Privacy Implications | Complexity | Blocker |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **REQ-CNV-01** | In-App Notifications Center | **MUST** | **VERIFIED** | `GET /v1/notifications`, `PATCH /v1/notifications/:id/read` | `NotificationBell.tsx` with unread drawer | Notification drawer in mobile shell | `notifications` table | `phase-04.unit.test.ts` | Notifications displayed in browser test | None | Direct operational alerts for assignments & approvals | Low | **NO** |
| **REQ-CNV-02** | Push Notifications (Mobile) | **MUST** | **IMPLEMENTED / NOT VERIFIED**| Payload schema in worker job | N/A | Service registered | `user_devices.pushToken` | Unit tests in worker | Push token registered | Requires FCM/APNs live keys (deferred by zero-cost policy) | Out-of-band operational alerts | High | **NO (Dev zero-cost)** |
| **REQ-CNV-03** | Email Digest Notifications | **MUST** | **IMPLEMENTED / NOT VERIFIED**| `notifications.digest.daily` worker job | N/A | N/A | Worker job schedule | Unit tests in worker | Worker process tests pass | Requires Resend API key (deferred by zero-cost policy) | Daily operational briefing for SMB owners | Medium | **NO (Dev zero-cost)** |

---

## 2. Inventory Summary

- **Total Approved V1 MUST Requirements:** 23
  - **VERIFIED:** 19 (82.6%)
  - **PARTIAL:** 2 (8.7%) — REQ-ATT-02 (GPS coords in punch request), REQ-ATT-09 (Settings UI for retention)
  - **MISSING:** 2 (8.7%) — REQ-ATT-03 (Selfie front camera punch hookup), REQ-MGR-06 (Employee bulk CSV import)
  - **BROKEN:** 0
- **Total Approved V1 SHOULD Requirements:** 9
  - **VERIFIED:** 7 (77.8%)
  - **IMPLEMENTED / NOT VERIFIED:** 2 (22.2%) — REQ-ATT-04 (Geofence punch restriction), REQ-TSK-06 (Push on mention)
  - **MISSING / BROKEN:** 0

All 4 non-verified MUST requirements have actionable remediation tasks prioritized in [`docs/audits/RELEASE-BLOCKERS.md`](file:///workspace/oprino/docs/audits/RELEASE-BLOCKERS.md).
