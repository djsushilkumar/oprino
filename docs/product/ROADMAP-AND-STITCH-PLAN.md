# OPRINO — Phased Roadmap, Module Inventory & Google Stitch Plan

**Document Status:** CANONICAL REVISED DRAFT — READY FOR OWNER SIGN-OFF  
**Version:** 2.0 (Phase 0 Rework Baseline)  
**Historical Audit Branch:** `docs/phase-0-documentation-reconciliation`  
**Official GitHub PR Branch:** `docs/phase-0-documentation-baseline` ([PR #10](https://github.com/djsushilkumar/oprino/pull/10))  
**Base Commit:** `87883a0` (`origin/main`)  
**Date:** October 17, 2026  
**Auditor:** Principal Architect & Engineering Lead  

---

## 1. Comprehensive Module Inventory

| Module Code | Module Name | Primary Responsibilities | Target Surfaces | Key Database Entities (Actual Schema) |
|---|---|---|---|---|
| **MOD-01** | **Tenancy & IAM** | Single-company tenant isolation, 5-stage verification, transactional RLS. | API, Web, Mobile | [`tenants.ts`](../../packages/database/src/schema/tenants.ts) (`workspaces`, `workspace_memberships`, `roles`, `role_permissions`), [`users.ts`](../../packages/database/src/schema/users.ts) (`users`, `sessions`, `accounts`) |
| **MOD-02** | **Device Governance** | Hardware-free UUIDv4 token registration, session binding, remote device lock. | API, Mobile, Web | [`tenants.ts`](../../packages/database/src/schema/tenants.ts) (`workspace_memberships`), [`users.ts`](../../packages/database/src/schema/users.ts) (`sessions.installation_id`) |
| **MOD-03** | **Attendance Engine** | Biometric selfie, GPS coordinates, geofence check, shift duration calculation. | Mobile, Web, API | [`attendance.ts`](../../packages/database/src/schema/attendance.ts) (`attendance_sessions`, `attendance_events`, `attendance_policies`, `shift_schedules`) |
| **MOD-04** | **Telemetry Pipeline** | 30s/25m GPS batching, SSE live radar stream, 90-day retention pruning. | Mobile, API, Worker, Web | [`telemetry.ts`](../../packages/database/src/schema/telemetry.ts) (`telemetry_points`, `daily_travel_summaries`, `geofences`), [`tenants.ts`](../../packages/database/src/schema/tenants.ts) (`workspaces.location_retention_days`) |
| **MOD-05** | **Task State Engine** | 7-stage state transitions, mandatory checklists, recurrence generation. | Mobile, Web, API, Worker | [`tasks.ts`](../../packages/database/src/schema/tasks.ts) (`tasks`, `task_checklists`, `recurring_task_templates`) |
| **MOD-06** | **Advanced PM** | Projects, milestones, Finish-to-Start dependencies, Gantt and Kanban views. | Web, API | `projects`, `project_milestones`, `task_dependencies` (Scheduled Phase 2) |
| **MOD-07** | **Sales CRM** | Leads, custom pipeline stages, customer sites, quotations, sales orders. | Web, Mobile, API | `crm_leads`, `crm_pipelines`, `crm_quotations`, `crm_orders` (Scheduled Phase 2), [`customers.ts`](../../packages/database/src/schema/customers.ts) (`customers`, `customer_sites`) |
| **MOD-08** | **Field Operations** | Decoupled site visits, daily stop sequencing, travel time tracking. | Mobile, Web, API | [`field_operations.ts`](../../packages/database/src/schema/field_operations.ts) (`visits`, `visit_notes`, `visit_check_ins`), [`customers.ts`](../../packages/database/src/schema/customers.ts) |
| **MOD-09** | **Proof of Work** | Raster watermark burning, on-glass signature canvas, manager review queue. | Mobile, API, Web | [`field_operations.ts`](../../packages/database/src/schema/field_operations.ts) (`task_proofs`, `customer_signatures`), [`tasks.ts`](../../packages/database/src/schema/tasks.ts) |
| **MOD-10** | **Advanced HR** | Leave balances, claim categories, expense receipts, GPS conveyance mileage. | Mobile, Web, API | `hr_leaves`, `hr_expenses` (Scheduled Phase 2), [`telemetry.ts`](../../packages/database/src/schema/telemetry.ts) (`daily_travel_summaries`) |
| **MOD-11** | **Collaboration** | Contextual task comments, file attachments, notifications, bulletins. | Web, Mobile, API | [`tasks.ts`](../../packages/database/src/schema/tasks.ts) (`task_comments`), [`notifications.ts`](../../packages/database/src/schema/notifications.ts) (`notifications`), `company_broadcasts` |
| **MOD-12** | **No-Code Automation**| Event triggers, dynamic form schema builder, SLA escalation trees. | Web, API, Worker | `automation_rules`, `custom_forms`, `form_submissions` (Scheduled Phase 2) |
| **MOD-13** | **Integrations** | WhatsApp dispatch alerts, Tally export, webhooks, streaming CSV exports. | API, Web | `workspace_webhooks`, `integration_configs` (Scheduled Phase 2) |
| **MOD-14** | **BI & Reporting** | Attendance rosters, SLA compliance, visit audit sheets, technician ranking. | Web, API | Materialized analytics queries, streaming CSV endpoints |
| **MOD-15** | **Billing & Subscriptions**| 7-day trial, Razorpay active-seat metering, plan quotas, grace periods. | Web, API | `subscriptions`, `billing_invoices`, `tenant_quotas` (Scheduled Phase 2) |
| **MOD-16** | **Platform Super Admin**| Standalone global tenant console, VM cluster health, billing metrics. | Web Super Admin, API | `system_metrics`, `global_audit_logs` (Scheduled Phase 2) |

---

## 2. Approved Google Stitch Design Sequence & Screen Inventory (116 Canonical Screens)

### 2.1 Approved Design Workflow Sequence
To ensure maximum operational efficiency and dispatch-first management oversight, Google Stitch UI/UX design proceeds strictly in the following sequence:

```
Step 1: Oprino Design System & Core Component Tokens (Asset: `assets/16261881246790250535`)
   │
   ▼
Step 2: Company Owner/Admin Web Dashboard (56 Screens: WEB-01 to WEB-56)
   │
   ▼
Step 3: Unified Flutter Mobile Application (46 Screens: MOB-01 to MOB-46)
   │
   ▼
Step 4: Platform Super Admin Web Console (14 Screens: ADM-01 to ADM-14)
   │
   ▼
Step 5: Full-Platform Design QA & Owner Approval Gate
```

*(Note: Total Scope expanded from 104 to **116 Canonical Screens** to natively incorporate all 12 missing collaboration, approvals, document vault, support, quota, and executive mobile workflows without ID collisions).*

---

### 2.2 Screen Inventory Lifecycle Governance (Q40)

To maintain absolute transparency and prevent treating a screen list as finished code, every screen transitions through 5 explicit lifecycle states:

1. **Inventory Documented:** Screen ID, surface, title, and operational purpose defined. (Current: 116/116 Complete).
2. **Screen-Level Contract Completed:** API endpoints, request/response Zod contracts, permissions, and loading/error states documented. (Phase 1 Initial Deliverable).
3. **Google Stitch Design Produced:** High-fidelity interactive component layout created in Google Stitch. (Phase 1 In-Progress).
4. **Design QA Passed:** Cross-surface design review, contrast audit, touch target verification, and edge cases signed off by Lead Architect. (Phase 1 Exit).
5. **Owner Approved:** Formal sign-off by Product Owner prior to Antigravity feature coding. (Phase 2 Entry Gate).

---

### 2.3 Surface 1: Company Owner/Admin Web Dashboard (56 Screens: WEB-01 to WEB-56)
1. **WEB-01:** Workspace Sign In (Email & Password with HttpOnly session cookie)
2. **WEB-02:** Workspace Registration & 7-Day Free Trial Creation
3. **WEB-03:** Invitation Password Setup (Single-use token verification)
4. **WEB-04:** Password Reset Request & Confirmation Flow
5. **WEB-05:** Executive Operations Overview Dashboard (Live status cards, attendance KPI, SLA count)
6. **WEB-06:** Real-Time Live Radar Map (Full screen with Leaflet/Carto vector tiles & worker pins)
7. **WEB-07:** Historical Breadcrumb Route Playback (Slider controls, dwell markers, speed graph)
8. **WEB-08:** Attendance Management Dashboard (Daily punch status, late arrivals, missing punches)
9. **WEB-09:** Attendance Timesheet Calendar Grid (Monthly employee drilldown)
10. **WEB-10:** Attendance Regularization Supervisory Approval Queue
11. **WEB-11:** Shift Rostering & Working Window Scheduler (Multi-shift calendar)
12. **WEB-12:** Task Dispatch Matrix (Kanban board: Assigned, In-Progress, Completed, Verified)
13. **WEB-13:** Task Creation Modal (Customer linking, checklist attachment, priority, due date)
14. **WEB-14:** Task Detail Inspector (Checklist completion status, comment timeline, audit trail)
15. **WEB-15:** Proof of Work Verification Queue (Watermarked photo zoom & signature check)
16. **WEB-16:** Recurring Task Template Studio (Cron patterns: Daily, Weekly, Monthly)
17. **WEB-17:** Advanced Project Management: Portfolio Overview (Projects list, budget hours, health)
18. **WEB-18:** Advanced Project Management: Milestone Hierarchy View (`Project → Milestone → Task`)
19. **WEB-19:** Advanced Project Management: Interactive Gantt Timeline (FS/SS dependencies, critical path)
20. **WEB-20:** Sales CRM: Visual Deal Pipeline (Drag-and-drop Kanban: New, Qualified, Proposal, Won, Lost)
21. **WEB-21:** Sales CRM: Customer Account Detail (Sites, assets, service history)
22. **WEB-22:** Sales CRM: Product & Service Catalog Manager (SKUs, standard rates)
23. **WEB-23:** Sales CRM: Quotation Studio (Line-item builder, PDF generator)
24. **WEB-24:** Sales CRM: Sales Order Management Grid
25. **WEB-25:** Customer Site Directory & Geofence Polygon Editor (Interactive map)
26. **WEB-26:** Field Visits Dispatch & Daily Stop Sequencing Matrix
27. **WEB-27:** Leave Management Administration Studio (Team balances, approvals)
28. **WEB-28:** Expense Claims Review & Audit Inbox (Receipt photo viewer, approvals)
29. **WEB-29:** GPS Conveyance & Travel Mileage Audit Sheet (Per-km calculation)
30. **WEB-30:** Team Member Directory (Role assignment, active devices, status)
31. **WEB-31:** Employee Onboarding & Invitation Modal (Single invite & bulk CSV upload)
32. **WEB-32:** Employee Profile & Device Governance Modal (Device lock/revoke button)
33. **WEB-33:** Company Operational Broadcasts & Bulletin Composer
34. **WEB-34:** No-Code Automation Workflow Studio (Rule builder)
35. **WEB-35:** Dynamic Form Builder Studio (Drag-and-drop field palette)
36. **WEB-36:** Form Submission Inspection Studio
37. **WEB-37:** Reporting Studio: Attendance & Timesheet Summary (CSV/PDF)
38. **WEB-38:** Reporting Studio: Task SLA & Completion Audit
39. **WEB-39:** Reporting Studio: Field Visit & Time-on-Site Audit
40. **WEB-40:** Reporting Studio: Field Conveyance & Mileage Reimbursement Log
41. **WEB-41:** Reporting Studio: Sales Pipeline & Order Revenue Summary
42. **WEB-42:** Integrations Hub: WhatsApp Business API Setup
43. **WEB-43:** Integrations Hub: Tally / ERP Data Export Generator
44. **WEB-44:** Integrations Hub: Webhook Configuration & Secret Key Manager
45. **WEB-45:** Workspace Settings: General & Company Profile
46. **WEB-46:** Workspace Settings: Attendance & Biometric Policy Enforcer
47. **WEB-47:** Workspace Settings: Location Tracking & 90-Day Retention Selector (30/90/180 options)
48. **WEB-48:** Workspace Settings: Custom Roles & RBAC Permission Matrix Studio
49. **WEB-49:** Workspace Settings: Subscription & Razorpay Billing Management [Proposed Phase 2 API]
50. **WEB-50:** Workspace Settings: Plan Invoices & Active-Seat Metering Overview [Proposed Phase 2 API]
51. **WEB-51:** Team Collaboration & Department Channels Chat Studio [Proposed Phase 2 API]
52. **WEB-52:** Unified Supervisory Approvals Inbox (Attendance, Proofs, Leaves, Expenses, Orders) [Proposed Phase 2 API]
53. **WEB-53:** Central Company Document Vault & Service Files Repository [Proposed Phase 2 API]
54. **WEB-54:** Bilingual Help Center, Guided Tours & Support Ticket Portal [Proposed Phase 2 API]
55. **WEB-55:** Subscription Add-On & Quota Manager (Modular add-ons, storage, WhatsApp packs) [Proposed Phase 2 API]
56. **WEB-56:** Custom BI Report Builder Studio (Drag-and-drop metrics builder, pivot tables, scheduled CSV/PDF exports) [Proposed Phase 2 API]

---

### 2.4 Surface 2: Unified Flutter Mobile Application (46 Screens: MOB-01 to MOB-46)
The unified mobile app dynamically renders screens and tabs based on the authenticated role (`OWNER`, `ADMIN`, `MANAGER`, `FIELD_WORKER`):
1. **MOB-01:** Splash Screen & Brand Welcome
2. **MOB-02:** Sign In (Email & Password with validation)
3. **MOB-03:** One-Time Invitation Activation & Password Setup
4. **MOB-04:** Device Registration & UUIDv4 Binding Screen
5. **MOB-05:** Administrative Device Revocation Screen (Hardened Lock)
6. **MOB-06:** Worker Home Dashboard (Duty status pill, assigned tasks, visit itinerary)
7. **MOB-07:** Attendance Punch Sheet (Live camera selfie preview + GPS accuracy pill)
8. **MOB-08:** Attendance History & Monthly Timesheet Calendar
9. **MOB-09:** Attendance Regularization Request Sheet
10. **MOB-10:** Task List View (Segmented: `Today`, `Upcoming`, `Completed`, `Pending Verification`)
11. **MOB-11:** Task Search & Quick Filter Drawer
12. **MOB-12:** Task Detail Screen (Status progression stepper, priority badge, due date)
13. **MOB-13:** Task Checklist Execution Sheet (Step-by-step ticks)
14. **MOB-14:** Task Attachments & Service Document Viewer
15. **MOB-15:** Task Comment & Activity Timeline Sheet
16. **MOB-16:** Geotagged Camera Photo Proof Sheet (Live watermark overlay preview)
17. **MOB-17:** On-Glass Customer Signature Sheet (Canvas, signer name, phone)
18. **MOB-18:** Proof Submission Confirmation Dialog
19. **MOB-19:** Customer Site Visit List (Daily sequenced stops)
20. **MOB-20:** Site Visit Detail & Navigation Map View
21. **MOB-21:** Site Visit Check-In / Check-Out Sheet
22. **MOB-22:** Daily Itinerary Route Reordering Sheet
23. **MOB-23:** CRM Lead Quick-Add Sheet (Field Sales)
24. **MOB-24:** CRM Lead Pipeline Kanban View
25. **MOB-25:** CRM Client Account Directory
26. **MOB-26:** CRM Product Catalog & Price Lookup
27. **MOB-27:** CRM Field Quotation & Order Booking Sheet
28. **MOB-28:** Leave Application & Balance Viewer
29. **MOB-29:** Expense Claim Submission Sheet (Receipt camera capture)
30. **MOB-30:** Travel Conveyance Mileage Dashboard (Duty-hours distance summary)
31. **MOB-31:** Company Operational Broadcasts & Safety Feed
32. **MOB-32:** In-App Notification Center Drawer (SSE badges)
33. **MOB-33:** Offline Mutation Sync Status Sheet (Outbox queue status)
34. **MOB-34:** Employee Profile, Shift Details & Document Vault
35. **MOB-35:** Manager Supervisor Home Dashboard
36. **MOB-36:** Manager Team Live Operational Map (GPS coordinates pill)
37. **MOB-37:** Manager Task Verification & Approval Queue
38. **MOB-38:** Manager Attendance Regularization Review Sheet
39. **MOB-39:** Manager Expense & Leave Approval Sheet
40. **MOB-40:** Quick Action Emergency Punch-Out & Help Sheet [Implemented API]
41. **MOB-41:** Team Channels & Direct Messaging Chat Sheet [Proposed Phase 2 API]
42. **MOB-42:** Manager Unified Approvals Inbox Sheet [Proposed Phase 2 API]
43. **MOB-43:** Company Document Vault & Service Files Sheet [Proposed Phase 2 API]
44. **MOB-44:** In-App Bilingual Support & Diagnostic Ticket Sheet [Proposed Phase 2 API]
45. **MOB-45:** Owner Mobile Executive Cockpit & Real-Time Cash Flow / KPI Radar [Proposed Phase 2 API]
46. **MOB-46:** Admin Mobile Member & Device Governance Hardening Sheet [Proposed Phase 2 API]

---

### 2.5 Surface 3: Platform Super Admin Web Console (14 Screens)
1. **ADM-01:** Super Admin Login & MFA Challenge Shell
2. **ADM-02:** Platform Global Metrics Dashboard (Total tenants, active seats, MRR)
3. **ADM-03:** Tenant Management Directory (Search, plan tier, trial status, active users)
4. **ADM-04:** Tenant Detail Inspector (Usage breakdown, active databases, storage volume)
5. **ADM-05:** Tenant Subscription Override Modal (Manual trial extension, seat quota edit)
6. **ADM-06:** Global User Directory & Device Inventory
7. **ADM-07:** Global System Health & Container Cluster Status (Oracle VM monitor)
8. **ADM-08:** Global Telemetry Pipeline Throughput & SSE Metrics Monitor
9. **ADM-09:** Background Queue Studio (BullMQ job failure rates, retry worker)
10. **ADM-10:** Global Audit Log & Security Forensics Browser
11. **ADM-11:** Razorpay Payment Gateway Transaction & Webhook Log
12. **ADM-12:** System Announcement & Global Notification Dispatcher
13. **ADM-13:** Global Feature Flag Configuration Studio
14. **ADM-14:** Database Backup Snapshot & Disaster Recovery Status Dashboard

---

### 2.6 Detailed Screen Contracts for Crucial Operational Modules (Q40)

To ensure zero ambiguity during Phase 1 Google Stitch design, detailed screen contracts are defined below for essential modules:

#### Contract 1: Team Collaboration, Chat & Operational Channels (`MOD-11`)
- **Primary Screens:** `WEB-51` (Team Collaboration & Department Channels Chat Studio), `WEB-33` (Company Operational Broadcasts & Bulletin Composer), `MOB-41` (Team Channels & Messaging Sheet), `MOB-31` (Company Broadcasts & Safety Feed), `MOB-15` (Task Comment & Activity Timeline Sheet).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `GET /v1/channels` — List workspace public and department channels (`#general`, `#operations`, `#safety-alerts`).
  - `GET /v1/channels/:id/messages` — Paginated message history with cursor-based pagination.
  - `POST /v1/channels/:id/messages` — Send message with optional file attachment (`media_url`, `file_type`).
  - `GET /v1/notifications/stream` — Real-time Server-Sent Events (SSE) stream for instant dispatch alerts and `@mentions`.
- **UI Contract Elements:**
  - Pinned announcement banners with high-contrast Mint/Navy badges.
  - Read-receipt indicators, rich text / checklist rendering, and tap-to-dial phone number recognition.
  - Emergency safety alert modal with mandatory "Acknowledge" button.

#### Contract 2: Unified Cross-Module Approvals Inbox (`MOD-03`, `MOD-05`, `MOD-09`, `MOD-10`)
- **Primary Screens:** `WEB-52` (Unified Supervisory Approvals Inbox), `WEB-10` (Attendance Regularization), `WEB-15` (Proof of Work), `WEB-27` (Leave Management), `WEB-28` (Expense Claims), `MOB-42` (Manager Unified Approvals Inbox Sheet), `MOB-37`–`MOB-39` (Manager Review Sheets).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `GET /v1/approvals/pending` — Consolidated supervisory queue aggregated across 4 types: `ATTENDANCE_REGULARIZATION`, `PROOF_VERIFICATION`, `LEAVE_REQUEST`, `EXPENSE_CLAIM`.
  - `POST /v1/approvals/:id/decide` — Atomic decision endpoint: `{ decision: "APPROVED" | "REJECTED", remark: string }`.
- **UI Contract Elements:**
  - Unified badge counter on Web header and Mobile Manager tab.
  - Split-view inspector: Side-by-side comparison of original punch vs requested punch, receipt photo vs claimed amount, watermarked photo vs task requirement.
  - One-click batch approval for verified items with optimistic UI rollback on network error.

#### Contract 3: Workspace File & Document Vault (`MOD-11`, `MOD-08`)
- **Primary Screens:** `WEB-53` (Central Company Document Vault & Service Files Repository), `WEB-21` (Customer Account Documents), `MOB-43` (Company Document Vault & Service Files Sheet), `MOB-14` (Task Attachments & Service Document Viewer).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `POST /v1/storage/upload-ticket` — Returns presigned S3 direct-upload URL for OCI Object Storage.
  - `GET /v1/documents?entity_type=...&entity_id=...` — Filtered document metadata list (`id`, `name`, `size_bytes`, `mime_type`, `uploaded_by`, `uploaded_at`).
  - `DELETE /v1/documents/:id` — Soft-delete with audit logging.
- **UI Contract Elements:**
  - File category chips: `Contracts`, `SOP PDFs`, `Service Blueprints`, `Tax / Invoices`, `Site Photos`.
  - In-app PDF/image viewer with zoom, rotation, and offline caching via Drift SQLite.

#### Contract 4: Bilingual Help, Support & Contextual Knowledge Base (`MOD-01`, `MOD-16`)
- **Primary Screens:** `WEB-54` (Bilingual Help Center, Guided Tours & Support Ticket Portal), `MOB-44` (In-App Bilingual Support & Diagnostic Ticket Sheet), Contextual Help Drawer Modals across Web.
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `GET /v1/help/articles?lang=en|hi` — Searchable bilingual support articles and FAQs.
  - `POST /v1/support/tickets` — Submit support ticket with automated diagnostic bundle (app version, OS, battery %, pending outbox count, user ID).
- **UI Contract Elements:**
  - Contextual tooltip anchors (`?` icon) on complex forms (e.g. geofence radius, cron recurrence syntax, RLS roles).
  - Bilingual video/GIF walkthrough clips demonstrating core workflows (Punch-in, Proof Capture, Offline Sync).

#### Contract 5: Integration Hub & Connectors Studio (`MOD-13`)
- **Primary Screens:** `WEB-42` (WhatsApp Setup), `WEB-43` (Tally/ERP Export), `WEB-44` (Webhooks Manager).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `POST /v1/integrations/whatsapp/test` — Send test template alert via WhatsApp Business Cloud API.
  - `GET /v1/reports/tally-export` — Streaming CSV formatted for Tally XML/CSV import schema.
  - `POST /v1/integrations/webhooks` — Register webhook URL with HMAC-SHA256 secret generation and event subscription checkboxes (`task.completed`, `attendance.punched_in`, `order.booked`).
- **UI Contract Elements:**
  - Event payload preview inspector with JSON syntax highlighting and "Send Test Event" button.
  - Webhook delivery health log: 200 OK green pills vs 5xx red retry badges with full request/response headers.

#### Contract 6: Bilingual Onboarding & Invites Lifecycle (`MOD-01`)
- **Primary Screens:** `WEB-02` (Registration), `WEB-03` (Invite Activation), `WEB-31` (Employee Invites Modal), `MOB-01`–`MOB-04` (Splash, Auth & UUID Device Binding).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `POST /v1/workspaces/invites` — Generate single-use invitation cryptographic tokens.
  - `POST /v1/auth/invites/activate` — Redeem token, set password, bind device installation ID.
- **UI Contract Elements:**
  - Persistent language selector pill (`English` / `हिंदी`) at top-right of all auth and onboarding screens.
  - 3-step progressive onboarding checklist: 1. Setup Company Details ➔ 2. Invite First Team Member ➔ 3. Download Mobile App.

#### Contract 7: Plan Management, Quotas & Active-Seat Metering (`MOD-15`)
- **Primary Screens:** `WEB-49` (Subscription & Razorpay), `WEB-50` (Plan Invoices & Active-Seat Metering).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `GET /v1/billing/usage` — Real-time consumption vs plan caps: `{ active_seats: 18, seat_quota: 25, storage_mb: 2400, storage_cap_mb: 10000, gps_retention_days: 90 }`.
  - `POST /v1/billing/checkout` — Generate Razorpay Order ID for seat upgrade or annual plan switch.
- **UI Contract Elements:**
  - Visual usage progress bars with amber warning states at 80% quota and red warning at 100%.
  - Prorated seat addition calculator previewing immediate charge vs next monthly invoice.
  - Grace period banner (7 days remaining before read-only lockout) with prominent "Pay Now" Razorpay CTA.

---

### 2.7 Google Stitch Design System & Project Links (Q39, Q64)

#### Approved Design System Tokens (OPRINO Brand Kit v1.3)
- **Design Tokens Repository:** [`Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.json`](../../Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.json)
- **Palette:**
  - Primary Navy: `#0F172A`
  - Cobalt: `#164CFF`
  - Ocean: `#087DE5`
  - Mint: `#20BAAA`
  - Deep Blue: `#1235A4`
  - Slate: `#475569`
  - Paper: `#F8FAFC`
  - Border: `#DDE5EF`
- **Typography:**
  - Headings: `Space Grotesk`
  - Body Text: `Manrope`
  - Wordmark: `Unbounded Medium 500`
- **Canva Brand Asset Links:**
  - [Full Oprino Brand Kit Folder](https://www.canva.com/folder/FAHW5FSpPw8)
  - [Oprino Brand Guidelines v1.3](https://www.canva.com/d/AjCAR5Ldpw5Rs3X)
  - [16 Vector Logo Variations](https://www.canva.com/d/QpEXUO4bO9PK8Vu)

#### Google Stitch Design Project Status & Live MCP Integration
* **Stitch Project ID:** `9824638464962009415`
* **Stitch Project URL:** [https://stitch.withgoogle.com/projects/9824638464962009415](https://stitch.withgoogle.com/projects/9824638464962009415)
* **Applied Design System Asset:** `assets/16261881246790250535` (`Oprino Enterprise Design System v1.3`)
* **MCP Integration:** Connected to official Google Stitch MCP Server (`https://stitch.googleapis.com/mcp`) via authenticated API Key.

> [!IMPORTANT]
> **No Fake Claims Invariant:**  
> A markdown inventory of screen names is NOT a designed user interface.  
> 1. All 116 screens have completed **State 1 (Inventory Documented)** and essential modules have completed **State 2 (Screen-Level Contracts Specified)**.
> 2. The official Google Stitch project has been created and bound to the Oprino Enterprise Design System tokens (`assets/16261881246790250535`).
> 3. Visual layout execution proceeds in the mandatory order:
>    **Design System Tokens (Done) → Company Web Dashboard (56 screens) → Flutter Mobile (46 screens) → Platform Super Admin (14 screens) → Design QA Gate.**
> 4. Actual Stitch screen IDs and thumbnail download URLs are reported directly from the Stitch MCP tool outputs as screens are generated.

#### Phase 1 Google Stitch Design Execution Registry

| Screen ID | Screen Title | Device | Stitch Screen ID | HTML Code Asset | High-Res Visual Prototype | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DS-01** | Oprino Enterprise Design System v1.3 | Design System | `assets/16261881246790250535` | Tokens Applied | [Applied to Project](https://stitch.withgoogle.com/projects/9824638464962009415) | Active |
| **WEB-01** | Workspace Sign In (v3 Clean) | Desktop Web | `85048fdfa0164ce5acee6b4490da34c1` | `files/f162d6a428c640c2aac37ce4eaefbf04` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1X9jqhcboSEiX3ZfVm-rFXnQdSeRxUOYx-HhPCd6OvU8xPcl3f-Z89vvQguO_O8Xexjmh_s1qVYe-q3dOKnit5PQAe68uNY-zVgAmcvfWSzNUr7AxT-V8mU7YRODv034jF-CtFh3pYtck_9TQs4tlmS4g1EodbMKHCCTBXHjEFhNxPYkRs3WlYPEcT2kXv3bulLK7cuKpcNIHMq4huZD5yE9-Pd5Cfkj7XU30mN-GotenSMsJBgEyd7OwM) | Generated (Active) |
| **WEB-02** | Workspace Registration & 7-Day Free Trial (v3 Clean) | Desktop Web | `22f1e30b111b4c9b9aacfb9e994349cc` | `files/90d9bdd35f8d4d52a7c8ae08266041ad` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Wg2WLqGn0sGUdY05E2PCd5IxBeF6y2zvmhuh_spO2LijiUJ4tpxAnBssBC18mx129lZtO9ARX8Vp3ZRRqnriaQb44VmSnrknNlF1FEcZ44DU3Aahxij8heqo8fJvuoD_okSrWnbMyX0W_UIFzTp7W8iJLRfZbXVwz2X0cUUlWKu5WxbxQnLhyrWHOTApY9fn-G7yHf0kGv85-PA5xtayGwrniZXcalMXYLf43FvPJToCQkufKgCHRoyxo) | Generated (Active) |
| **WEB-03** | Invitation Activation & Password Setup | Desktop Web | `4ada864726254facae7e18e61d946f7f` | `files/64eed1c1b9e640f58a20f7045aab7fb2` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WFKyt0b0DnxLVeElrM8lHN_R3fQyNC9bK3dL0NDcSi-KFlwAIJOYO47YAttPm2F8aZAC9kRHvfNKmmNpmak22OyCr-tyPkr7NO7PGjdezPnLHZ9XLjyooWVrXa8_XWDbfLlo3vSgVkneLuWrrHHMSGT-lKtNkssn03-22X5tZJjvDYlR_zad3iYfJNNJEdk70Nu5kZG_8nJqPff6yvjrm5wbCVMXbxH7UK1DXF4mglKuvaKolz-OhXrVk) | Generated (Active) |
| **WEB-04** | Password Reset & Recovery Flow | Desktop Web | `b529fd4578964ddd866ab45115922172` | `files/74a76d767ea844a68205a4a8de8b542b` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WruX3M8BUbPe7Pq3tRUfx9E5KH0YiXcgqMDRBUdt1waWnITI0bJffgZKmfilXhS43QfqgtNZmZnOH19dIWse4zKKy1QWeAAUDejwW119ynBu0MB0M-5EIvQ7PYGEY_zb0CdTLeV4YpGU_7q3WEy6AlCx-Sh8PMAbvpBJ-Ih0S55ImI_B_90bgjvyYUzPfQEJhLvQBVseuy8m4-sTJQVYq-9sSjfgy-OQXnE3s63RLCflVppdfIPylySoU) | Generated (Active) |
| **WEB-05** | Executive Operations Overview Cockpit | Desktop Web | `78ae05e1af044a5593b047c6e5ad3415` | `files/1f630da44c474758be6b676a873f0aab` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VpF2lV3wx-8xX3hRl6fF7R7DIGu0cjGfS8UY3rW8kZZ7Gc0-4MwU0XPE-WiOaMGaM_MsTbI8EPcDtNkFHX1HdqjhactfIbir6QjgBCW29v16xrSPvRFAcKWfMue4dsYSlB2vZiLf9O-DwjFJxyw-YGg84jpcnhHwvmm3vttEfAxbUmcw_nKLUEI5aId8Fgd6CSGTJaUlTxsJPus2D3dB94r_Z00Shx7cSpFQa2VmBKY03Qncppt7bSBa8) | Generated (Active) |
| **WEB-06** | Real-Time Live Radar Map | Desktop Web | `98b0dfc9e7f34b719df32125357c2de4` | `files/16d9066121934a87abe96af062991f9a` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VWyyD7Sb5V3MGwyA26YDXqH3abLs1MrJ6GxdZt00bSPPYFIzYTnXu5MH1N5bcnHQeU2jLXnpnQcI6XkmlWNsCeVV2yHS0Y1l3jzrVOL5lqK3EpuH2Yew4o3FjPHQR6A3FH6egL_aFFFmrRjLgF4jC1gQXAYbDkWW6Q1-JsdhcnaHlnJ1GcWOgqFA2Dk2qv9Wam51F0m1N3WRH-RIJ5MAwrjItjJ4HcFpmIR0mEjNxeqNemyfdq1aoe) | Generated (Active) |
| **WEB-07** | Historical Breadcrumb Route Playback | Desktop Web | `edcfb51e32534fc182d7a401edd5ea6d` | `files/7ba1d804c846428eafa7cc023537184a` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WUMU1QyrWkSx2Q4hxUBCffrivFCl4oLG_lSRg1ZY8Opz1ZJt5xWMyoa0q5oXsT_b6VFTNACzGkvnrA3dNggGNAr0kDwye7mVWg0_JmaOmyg2Cz38Kp9-9CmDKyBBB7GCwBBKfA7YUJo3M_BLlatzfchLB9-caSFvb8sKB-EVgo2KJfZZoFNeneiqH43H0WI6icqTQTG7zmLSh9mFkh1-ygZTHenAvz1HctvjpF6rZtsAguGYOvSRqqZbU) | Generated (Active) |
| **WEB-08** | Attendance Management Dashboard | Desktop Web | `d27f660dc346417889cf8c6fb194a3af` | `files/497ea4bbca694a5285cbe8bb9bef66fc` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XrLSDu50yy6ZavMMSDHOu4Htx934G-EtTzI98KM7i8DktetjdrY2_sJ12Th-AZT4xvGmrbmFoSB9zcUfq7tgNXOHE1GJ7ePp4ihZdCQjg44KW6BDNucks-uxRhMGZ1F5mBWnJSlOuIm8I9Jv_QnyJyxBEk7J03EshrchQxGRrEA-m9Gh2m_b2lUsPB2RiO_9ecGKZ9BiYnFUFR3QeVwWJxObXSKwndIIalxUBXxAz90LcrvQ_r0aWKMlE) | Generated (Active) |
| **WEB-09** | Monthly Attendance Timesheet Calendar Grid | Desktop Web | `b45ea27c2f914d23be7232a367ea0234` | `files/ee39ace1969f449fb9ad52d0805bf815` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WgtB9j7TPnj-BIeGBQH-u3xtmSKxYYPY5g7lQtC39TrVZNLux3qxp_DFFTKBMUCdBlwy_1htJ-OnVx5uoXPtYwx_OPrs-7DXQ7LS7fA_MEq-DQH34kpUOXb5ZS6403YbBo8wJfJ2OW6SPgydkbMZbEM6k9YfFul5Vh5asXe-Qx6ovajQRycdvW9nuStpyvQKHIsFdDtpZwyYEGwLWPNsJr0-SLBjkwMRf0z9Ey2TpzmDsY4zIi6mrlrA) | Generated (Active) |
| **WEB-10** | Attendance Regularization Supervisory Approval Queue | Desktop Web | `1219cecf339e4df494d70ee91b915a0d` | `files/7fc3eb220cb045b68d947be51c7e19d8` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WTM48_PVYfvy-33paF6ew86DyI9lHPRTmN95wb7uEp28eKEpjcW4KwuVYi6on8M2dDJcOupRP6RepaAVt7xLJ0hFjwockCrA3PUE7AfRurKmgEujZC07sHoxZWiHFmvdn13bkI9VgRNeprNeHlPU_-mlVEbFxaCZXMKKCq2RHXvy91wUkeeEtpovgkejG-si9n3XB46X3VI8Q4CfpPOzwplGDrH-BJrX13Vnfn-YHxf7P4W0wUCD-uxp0) | Generated (Active) |
| **WEB-11** | Shift Rostering & Working Window Scheduler | Desktop Web | `7f326a561d8f489bb308a8e37b7228a5` | `files/18680a05cedf43a8a7c723d103755acb` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XYMtU5LCF0moTdjYDFl3Mcu9MLgE5jYqtiUXa7QmSF2FSx2T0-53_6fFx15Lzg9ompg8UTsaptl6UuBNoalvKtH_92qd5jGOCVq7xPeWMk4Nts7r_JI5LwxfoniskqzqmcRqP8t6fQwLRdChGGAvMoZOp-MVm3UQkl7d-go-WXI32btGO0lvZr9MRm7JLVw8zuvu8JAviFXLMHUzdJTrHUKjrPpYFJglcDNNg5vidmhDpN6DX9-MM3uw) | Generated (Active) |
| **WEB-12** | Task Dispatch Matrix Kanban | Desktop Web | `44233e9028ad43469441bf44869bf971` | `files/db3f5b4f6dd0412d862f090272b27837` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UtYNVEqP6e2opoUXkzB6eK3r6RxpMgyWoty5vK2_ms15ZupZJpfvoZ0eH4PlfECVhGhu8LMNhHutIm9wEmCt0KaCv3LSQsw5HAThgYR-pqgkFturPdjsqBuXDP-46bu0zPJUOjtsWj4rsNPg7YEFquSzqJd4f-lzZPPGs52TfZD_hMMEQ-IZ0YwiY5l5_yhT1Ogm5P7IVMy8nYz2mpuQPhkMBfz1oF-h8PHNmpRINOKofi1_6IkiwCWWc) | Generated (Active) |
| **WEB-13** | Task Creation & Multi-Worker Dispatch Wizard | Desktop Web | `5fd800f0997840958dd455b07e052405` | `files/41b91fbcce144d94a875303cb33d9c15` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UtBEn1g0rP-Zi0FM_HEESZrDVu5i4kqlC4xT6jT_f6XSh1YVfvGwJYtyujCU0ekpIiANPIvrdO4OQZTHn1MPd774a0NE0vDajGi7E1RDuAw43ePEucTi-UmNuR9i_p2LVdIbU23csHwDNKA8hvH3-2Oqci-g9gKL-KGDXYpg-V8E_VNHVLfR9ko0uhAa4F_bUqcieB7hkFks-2BPah0ARKYQEJbfYH6-DfJio1-v97T2XTdPtMQ7RvMZs) | Generated (Active) |
| **WEB-14** | Task Detail Inspector & Real-Time Workspace | Desktop Web | `19bd3a93cd2e41efa5e57244b88a8468` | `files/fc8183c258c24406ad6ebee50b313fd1` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Uu1Na-WGjks1fpUE0TCJ2Wzag6qBGSMtzjSZ7ogTLO9UwX5OKA-dOCP0GWCAckXPxYDB4Bph9mmVwEUcp0MjrgvYYXxZvzkC7OLppc7G8B2dWRgVl5HdMPYvUQ0WcbB_tzYJh4aZIRGpVEgUT5brkN44hhpOxnM04TzvgN6K9IlUFC2JheS3Bt2uQzfvkR_2_DGjchENo-OL74xgohWs5y1EBxTIf2ZzZGxGke-fXY33Cp7Zb2GM_9Wxg) | Generated (Active) |
| **WEB-15** | Proof of Work Supervisory Verification Queue | Desktop Web | `a770a74c513d4bb08b7ca60401756dfe` | `files/381347766b4e44c9b26353d69b9877f6` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WrXsvj3HNLwxRddnfE0pc7-GJ6VjTVCHbQAG59GX2kXYl1tH2gBu1O0dTsnndOLBGnmDyl8YiCCQ8xBAn_aJNUwLMuYH0Xgsex7MN3iBpgPnTZcx0Lfy_owij2zrv1ZH91-HIbBFQUdqaA0iZlDvToJChZLhfITuioGQOPk1B65Z305VvHJAQEU1SScVRas_7hX9L9BHWa8V6T6RApnVMF7SrCrAxfyia5SRcyKI24fVeoI4vFixRxHw) | Generated (Active) |
| **WEB-16** | Recurring Task Template Studio | Desktop Web | `dcfee7062cf74af8ab23b7d74770d068` | `files/677638b1f2c042a3a0e195a0d7bfb220` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Wz6FmjGuAkA6n3izD3dq2PsFrzsWwnL7d2LUOAE8Ouz-CPQqzDF-K8WLU6a-5DcAx3jmiyFPx0ZB88m1OB-17gIYsxMHjt-V87MLulIjAjkyONkOyXfAqW9U26TYu9Ztv-fgxfg-xjL7kffdoAKpSUiDaBYZILPl_LIduPg9w3MwR21tImBLDjTcu9FtVjRStlP9rTMAj6rcEJrLNz_TweO1UOc-j88hM--tHA0hwdKx3QhDplNtilDw) | Generated (Active) |
| **WEB-17** | Advanced Project Portfolio Overview | Desktop Web | `887d486a053d4661abf1329db3c72778` | `files/0d070fd85c8442a6a337ec38c24ad692` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XINnSlM_cMGDJdOvaI5WXalpYSFndUtATBpjcszTGdXQaUBmTNUs-Uj96kkNhk5OqE5CEDYDmYK_lrS2mL6n-yQBaGVEgIqzaX8VR33ZFfYqMDcKkTcSG2mdRzr_dmPDwP69fn7QegJMQTBWLgagouYe31mh20cn-7XksAJm1YanicAWjDS3_Pj5DSAzIkspDrgC_dLu8bOqs5UPHvB0hwvj824kpHnaUJK6QTEcuLeoD1oTKRh9cC_aU) | Generated (Active) |
| **WEB-18** | Advanced Project Milestone Hierarchy | Desktop Web | `4629555140b84caf95017e8ab0b23425` | `files/235e42422ab24bec94bc1ed11b76a6be` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UE5EEVmxHEqKwWr3cMQdEOxRRUgnJ9aEuc6CApBJiaR-t1UnZ0feCBvAw6sitZaMTlOY2uRyNisGS-FuIJ1wOEydF2DWRuSIH_pu3ufTuwP9-F76Ra38gwTUHnUxrw58SuoMwS--OiMfIlfelCZU0M4m6k9hAR94iCiFUV2HU6xWdvXr1AtjKeacqW43R0r5G5K9HeUmWtqmtu7IDUyUab6TLqfG5CvIysoBSHAx6o_OebneJCVToTng) | Generated (Active) |
| **WEB-19** | Advanced Project Management Gantt Timeline | Desktop Web | `a1773b03570a4cd7afbe2ec3e0266692` | `files/d468663f735b40f8ac0a453825e1579e` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UQN1TUTEtBTcf7tGEfshb7T6hTE-sXQJW5zSCTUebp52ApZmUWXKQBBNi8-eB-UlNeLtfbzxB9XkTBgdKbKZFhLYMIKygWey2AkVaVTs7QSaR1vjiE53pTP8-nA4P6kSNfXnMMGcbaPJ7wZSVnN4A9yX1QkbfBl8RX0M2xMGZh5uEK-WlxXjwC0lGQ716edHEEx6Bd-tPw6HubzP0qkoCQfG3PhGf_Y1-tuEL8uh-xklKVHhhGMTis6-4) | Generated (Active) |
| **WEB-20** | Sales CRM Visual Deal Pipeline | Desktop Web | `82323c5505e3427c93abc3bc6c576604` | `files/61d4ddbc09934f029f2f5c566dbb9ad0` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WU8-tVQtGKUjGWkJc6Oo9rH_f7_IqoypQKhOkNIYColOzSu0w12o-FMHF2hgvxEwJAtdeqTR96abrGRaReT1CFL2rao08zgFLQFqZpM7GYkmDc7suCs-2QssEWWH5Lhk4Z9xEM8ZxhxisNLdm8tLP0QSjImfHy0ZBLO6Ewqa0OAbP-3pBDm5i8S5ia9VQzoiLCcplKU_uQb0T0KNdV-s0HwXMVlaaa5hPybkgKg5TDjv0MmTVXKbpMjw) | Generated (Active) |
| **WEB-21** | Sales CRM Customer Account Detail & Sites | Desktop Web | `3d061b813d2d465e91acbc5052ac749f` | `files/1c59b4f188ce401396bbccbf01beed31` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Xa1vJLht-t-VZX8fl5Omn5TSdjgR8PVl21K3LFxyLrJR-x63ZneJFxxozVqJRvAQzGlH8rJKX3pqee4XIbR9PR7DmRgfYXMsTLbEd6gY_xUbi5YnUVfRqWMSzhvYb3XdmbL02OqeW-mBMCTpdqGeGVLQ5vFoiyCcPDIU0GxGLX6kQZdr_yyG_MCwaR16c_1PU__m2-1XF3AuFqCHMoL8OhEIkYmE6JPGc8_1QHFWR0xGo6FnsP7hL0Q8Q) | Generated (Active) |
| **WEB-22** | Sales CRM Product & Service Catalog | Desktop Web | `2b1970123d8d4dfebed69af9f72e8145` | `files/f90b0f34a39e47668cfdb5b20d2c26dc` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VhGSqT5zx62g1k0z0lo9fhS5GZwjp9Aurv3MqkQ2Y1es1aZiUnN13DdkFNiO2mEEuKLURwWMzTtczR39HA6cYin3u43xQEhgFS9oeoQ3PygBKyOctnlRGxUMUfia0azVqSfd8bhTh7Pt5foQx5gbz3UnqfRRscfUV_KwJbV9eLXxPrg5gdIzGHRjYfwoo83d5jNp0eysWIHAxWjCKCP1D3InOmeE6mzJwcP2QDQSF6Kau_gy7y6q1ptw) | Generated (Active) |
| **WEB-23** | Sales CRM Quotation Studio & Line Builder | Desktop Web | `05797731ea534e028ee42963c3182484` | `files/77e418937420429f9ff200e0017e7a19` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1X05QwX4tpNKeDdhn0bl5EBWMcZbJ_Gpj5E1gk5ifVRKYlDqP-LMzUpjsxNH7GvedL9bSF2EMtkYxBBT7_9ShK8VNY3qFwO6Bhw3nezUOvZE_DqopJe97_GEpHw7Kq-QO7esKK1pTgB5w5torgsAax-NWOCVQ7U_LHNlKnh2VFuupHEZkye4Xt8wV2P2lvaZcpl1SgJWcE9gGXACiu6vAQ4c_ynXkcF5VTOTe_x7kUScK9yfl4187EflA) | Generated (Active) |
| **WEB-24** | Sales Order Management Grid | Desktop Web | `d26e7b9dfdef43c2bb2b50115efbd91c` | `files/a54ae220fb4445e089ebdf43b6befbaa` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VAfoAvQwNGEHl6UF0EYv5RIojeJSIS7oDXMGdlKozfj8JaAttJyPfBdFFaAJ9XqjYACzK8-pkTJ0FY1YIym24EGb5V-Y0vPpIsw2QgGyepfhDJ_7Xx_fNUE7CZTuehKD9gl0dT-cnITpUBq3AJMiZdCYVw9-JRx4pswChnqi8RLVSLOyfy_hbvApD4kvcAIMlT2AkVu0b8LVz_KpQ6mt7hHXsYu9Dt2FWO6hbi9PdM7LeVQumeuU6Kb5M) | Generated (Active) |
| **WEB-25** | Customer Site Directory & Geofence Polygon Editor | Desktop Web | `e5de93b6e68d407d88bd71306cdbbe75` | `files/739102bf57cc4aad9b63fe5c9c180334` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VXW_K_gXo_3B5zK8t7xwDyvV6DAmeQ7qgXFMEnE3uV_AJ-GxInDqaCogDSEtFasUkTriRj105ERDyY5meYaOR-48FrQ-mIYF7Zh4F1qR0nqcihxbDHsqxyytySuy_22R-_qJkD7evb4-jMxXoybjL-7H1BhqdCRuiqUfMtLN0Q9WPd9KvxZNvLlLYZ75fdedpbBK5r4xqyW946mgpQcxxU5iXoq6QQD2nHkIxZhEzx9r6eXFfcIifTsDU) | Generated (Active) |
| **WEB-26** | Field Visits Dispatch & Daily Stop Sequencing | Desktop Web | `ef6b4ddd83214816a3cf334ab289fa4c` | `files/b6ea037cb6c24650a843e11de7908636` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UcIV8ttM_y-OBCEQMroet1fUHwVgkE4QbHKVPCfVnUtSkxm-AzdiFxLbfGt5DF2VU0rHfjZs_woo55c8pRLZ0tn51nv09niIAvujw16Zaf2mXV68GTE_4pZHwW80ETfrWP-mAwQfDt1cmuZDhLXhgMnITW9mRCtb9wOA0nGVrbgwqpdUgnEXzHiMUAnQFikKDLF9Pz7S2IGY4Qvt18OwFNavuxgEy2I9QQH9dZ12SryZpPMDiBp6ilHQg) | Generated (Active) |
| **WEB-27** | Leave Management Administration Studio | Desktop Web | `97ac693319614178b3f733a08305c43a` | `files/d056c8cf637b4e3294ba362480114524` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WPZra2P5JgeB41wdMnFTI_YxSLO8jX1MmITdfdNsLiJZQIzKsTZXP1qKvn9HKdOICEY5hmhD3XYpoTZsw-hnTENKoD0IgaWKahX-9e2MHfAdfSyxAxpFKTQbYDXf1BZ2IRNnT6enEj3ZSfEiEX93xMC6v0auqjb2vkGhIgAJLWx2Z1S3N6J-HerkSRLzi9fBhl2Mxjzfng1Hmvyh4Yj5JiQSpY9Kz3sd-TK0cFjkWtfMf6v4WLH3sitQ) | Generated (Active) |
| **WEB-28** | Expense Claims Review & Audit Inbox | Desktop Web | `43bdcfa82df146ef9112aaaf8657d507` | `files/d11e33ae01004793aaceddbf85f7a6ce` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WTw-_PVMLtEDgIOpHIWhLUCEGxjlMZm99wh85LenKCwRNJhkkd8Mh9Dzqh5LrUSULHk5kmh51U4mmHYfnFnqV2bOz2OD2-1Kh0PhdsP0pE65qSrhbKmzLg-XgnbfUZoy-oXZY3juPgE9iX1kxwUoQ7xD7VcYRBO37I2L79zo9dzYRCU-sIgnSPbz1BgZzFXl0A6oBAAE12Kgx5wBr7MeGpTLVYqComnSJKIsyIWvuP69V55FtyN7fs7Zc) | Generated (Active) |
| **WEB-29** | GPS Conveyance & Travel Mileage Audit | Desktop Web | `50777f62992c4b109763d80394598446` | `files/681cafa46860462286e67ea4cfc6936e` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WurtfiTBZ2kc4diQkpNQnectyA_GXKFrbqk8UqsaC6k40GUIfF0KCnraYnx0uGVjjRRMRP1LQbjEnhbAMTJv53RbxUoyrhUhtAcoZcQNYm7iG_xLxmLVnOGK7bHu_XHx8e5HBSFnJJndRnYsFS44VVZxXql7H6wiH6igRHXzXH049qC9A7G6V1910ed4PP2IaoO_6nUCP3ygEWiQoU80SEoNnLzpQBVW1dUkuG2j0DUIaNA6BfrG67vPM) | Generated (Active) |
| **WEB-30** | Team Member Directory & Governance | Desktop Web | `d0607b32949b4b7f9d71b7c8f72a7309` | `files/a8952a0e65104817ab0d32058cd980cb` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UHlvRmjjoXwilU4zHYfSxBi6UNF4fMuTsr5joO5ntNNBblGcFWYxVgwW6dO2lDqZcAyAy3C3bR0-jGRJXhKIgHll_t3X5vCbIEZaGosybW_x4bljvstlxyg4agUtScu4WG1C1ZyI5TXqoghEBOhmByzRsY3CeT73dxNQsezHNniNuVwZRsZlGuBjnV-joWvEzdXg47o8VXMi4t4oSma3jgxDFvo1xtyCD2D0cqNgdNmXiN6llfmhq2IFE) | Generated (Active) |
| **WEB-31** | Employee Onboarding & Invitation Modal | Desktop Web | `ab9fe371227c4da1a724d70553117ab5` | `files/dd47d359e4de42158fb74209efb8a817` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1U53nBsPHJWZrG_zKBZGACtDWyIQTrKdP-9YRlsgGqG4pE_l3o4NF4ptzse8hsw667ok0tpZKRiNfDPJizgabHC1RAtgYivVttT6ZpYdXlV4UTFI2MfIEX9BTyycdcwZ95Vhpu0VsCI-W_PWl4SZwRIgKz7hJrWzw0NUHQ5pciR_36Fy0qjMv-MZ2jKIFVOzwoMne16LYaAqDfFf7H1KpbSs64MJQ9GeX2XD6MeGg4P2PxyA9JpkddCEQ) | Generated (Active) |
| **WEB-32** | Employee Profile & Device Governance Modal | Desktop Web | `b0b7bcca0cf54919ba61533cdf8a27a8` | `files/780fd41fc94a419e9499b4a6177c4242` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Ui-pXHe6wYCHG4VNmcrQk44ehCVvH4pz-lbzZiVRWWJXbr0-QZEnkqyTKoJzAA65YRQLWygEHUfF50ZcpjKZ1-VjwFJzSmLFIlgSeTm56rM_QwuSSoPMo-Roycfdz_OyltO6P-pSHGw7ot_qEFYzmMywauRiFKD3GnwAS161kjh9euskE9lrdUSC9BSHp3xR0u7Sl6RFwxtpwKm9h8wxU9B2r4Kc98X4bwdp4snJjppljcJWGQI8wyWP8) | Generated (Active) |
| **WEB-33** | Company Operational Broadcasts & Bulletin Composer | Desktop Web | `31a3e7122cab463584efb4133fdb59a7` | `files/5eedb23aa6284c5a93c114057796c12b` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XP85xjyeutVuJxM6jQfrkumtSa6WOsd6PZMxadarHc0b7zX7d0a1jMgj31U5H_UM-c8KnOEjyDQ-SXiIh-E0-k9MJ5e_CHWfSwFqgWWKUFpqxGSCMpqncarjcpvnu-qX0LoBrC-NUBOad4f2juR9-8RZGfqKIIVjpZYM4izEi3hZuT681HfMcxV1BAJq05KV8A2JBpHL_08Y_jtIzpwRueySqAVBAj9XRhhg7ntF_gBOqmLjVVSoqzVA) | Generated (Active) |
| **WEB-34** | No-Code Automation Workflow Studio | Desktop Web | `a08d378a0b024a7aaefe61b126290346` | `files/9f952a2f21084b9e88a8f78b512db9ee` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UWE1LdXtdYuK8oxlKk4sKcGYuyYd_JQ9zUztMYyjxNRj_6I3QSNf3N5ybMYizLRiw62WoJaqptzd84QEY0TqHEtareJsADa2Xez8ytPaACasbCfW5voOUFIn7aEkGa1qKeIpnLWjIEwP_CEvHLWVSuJcb3jvoUGIWH1qY7d6rCEMOqNnksB1npr1gzjZeaLk0wBkhdJI9dauip75E9usseQg86B-IuxgxjLobU20pMHrR_GQEIH5w3flw) | Generated (Active) |
| **WEB-35** | Dynamic Form Builder Studio | Desktop Web | `ac2769e2b8f34fcfa2e82c1b457067fc` | `files/7fe5747d06d04a72b7f2b0d118791e1e` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1X7Kz4eXxDIs2o092vBsQEXaXgcyiIjDpFgwLlx6iWRjRaH_jdMN8LSB97Ro2b7RUjQ_-AlZKVHYPJ6TYpomoM1AyqON1XEfltCCs0s6D_1Pe9NQf1RJ5TfravXbj0EmM2x4rXYpGpwM2Dare47jGbQGLtuzRv8VRJBan8EOS-K0dG_cyGaRUXMkOZ7wf5zaFvMQg7Vf5oscqM4TgOUgF9l4FKOnk0YKpEdGz1AvwbRg4SF0BbWSc6kTos) | Generated (Active) |
| **WEB-36** | Form Submission Inspection Studio | Desktop Web | `e0ec97c971994517adf5b96017e85fff` | `files/6918045cabc14b478dc5e116638c7b33` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VUzgvOvW978ZKhSLVhnywFIlSUwi9PUQUkqYznZYNNqVYKmULtazJONbatwJ1efPjRwYVru57qxNC8p_dCupLhnBWVaxg5E2ctB20xB4HuVYopfLyrteX2OgNKyxUs3f2nZkn32ocS2F9CmJOcG7sMxRkatpkLBDwHk4tV_SlIIe-145mtR00s6OYln9Ll6xXxFYS2w7mjXEFdwEV3yNVK6-bh_Yt-xn9UELLMxtEtGL1_tKn4PomK-9E) | Generated (Active) |
| **WEB-37** | Reporting Studio Attendance & Timesheet Summary | Desktop Web | `3e667d2a34854a3f973dc156384a9237` | `files/2aa64fde8769468ab09310f014d40fdc` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WeGHA8qUkW7qeBIgBPhLaQUCSQWDVXlTrBph3wA9y_KSxwCqGiOflc2Qsg_tovhHBu5WlYjKEC_giyV6mBPA095NH3oYt6eyR7vyZtlgLKjVmAtZnnUjm2xEsaanZVTwLT6JL2vgc5q-2oYn4r43hWuCoSAJVi-uiCI6RBl9ErGcIMz3GfrzYInTUC__LRjuya6h432Qx8wXwDZ3boOuuZoof5PrGhtIsWIjXwhW6xUpmYLM2HbogQYdo) | Generated (Active) |
| **WEB-38** | Reporting Studio Task SLA & Completion Audit | Desktop Web | `d2b66aae56cc42948c6a6635dd409ab9` | `files/d7e5cff06c4d40fa85a98ca9a888b027` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1W3qF4gmbjN9Kv1yCURPfByIn-QhAbQ5Z7TX27dJU3Vm9KQGnxSASSqjfu7w5fDmheMw6SYimn9z99WTNVQs5M183J850UyZoZaq4mAfUfq20tZ-BUZ9mpgxRWpDuqCW0-tqELdAlRKPr4IQUCJNm9yAVqLio7xxtLBCE87XWD6jOWCju41t1f9k6CiPnOvjFlQFvF3VDSa3KEVBFRcdpN11jkYhHk9eY0gm7GP4qggUNEZDyQXCODZvA) | Generated (Active) |
| **WEB-39** | Reporting Studio Field Visit & Time-on-Site Audit | Desktop Web | `17f876c39a804c9f9b8563d98e0ac50e` | `files/20156a84c99a46b999eb653467acd8a6` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VmxOhCDMDW0Nx8j4xljz4JrW6KA-onj9zQ51oM5IIptX-xvqIHY9p0pDvQxTXSPDU1dp2gFwx67-Ip1qsPBDtwcgl1T01WLJ0E8kbXnJo51t0IckLd7tqKfqm-WZOT1MsbZ6mLxb5aHmyOIXcdQk1BEYhpH20qlULFDNNTvqiYI2hPFVZbgLsvg8fgyZu5EJwXIeCiXr9HpLBKQVJUv6uIdFVw_qW-ItLaEt9oaJzyYchBQVEFdEaGKi8) | Generated (Active) |
| **WEB-40** | Reporting Studio Field Conveyance & Mileage Log | Desktop Web | `f203621d79c84373893f8cb8453092c1` | `files/3f4713bf620b498faac3ec757e0e4006` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WKc0XSsR5n09Gy5_9am2qDP-6hXULm6mT9QcedDmF_LqC_9BUzxKZjD5DXREclgqAuadn5uUkRskThxx3PDvYP1ha4ktFs8z6XSShgc0WAm_OuqJf9wJCsePGhEc5SzTiEq331CJTNZhoRxzxSN_3ZHtxsAxVFj0LqhZUh4sabbGnraDsVVHlVKlEKgciohmQfQoxjkydjY6QBv-7CMzYkpnXvG2b8GEuQsTiswM1A-DUFLNxJdZBoCnM) | Generated (Active) |
| **WEB-41** | Reporting Studio Sales Pipeline & Order Revenue | Desktop Web | `abcb4333bd894ce88772f3bf6899a362` | `files/35601d33938f4d029187790ccb428dd7` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1X_mON7HZd1ng-FchYlC-H3AN5f4GhAZDU7VMgB_Psw1Z7jTnOtaxy1dh5FHlnHnSpFgxJ7MH1h9EKYtjgZepFpQAKNYPu5Ig8yTH2g7zKIevaEBR0ccW_i0SrzITyjy3JTbR0e38yt2WPAYdbzFxalwwtyyOB1PnVno_pEI6aRUa3zFnSeCAvTkjzCOVEWXOYVC2mJh5PFkNsIp5L3hde-VydfrbH-fwmQ9nXuxGTklvIKFlirwD2uQA) | Generated (Active) |
| **WEB-42** | Integrations Hub WhatsApp Business API Setup | Desktop Web | `58c27e3f7fb24362b4908cf8f6a6d14c` | `files/7a40fdbcc884424a85ca02dce88d5cbe` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Wg-Tp2YatLDo64nhv8pmCxAeseAdqH29cg58-3t8mUkYWWDbwCQjiPmWUriuNV3VQKI0X0_Q5PzSLyBJAWF_mPOCffyFfWhVvesfvDecGzBC96Kd5qZ5yofQsgLBkrBQU_INBustMOwJVJ7ailZOJQkEsmgbuVPjPL4pw8QAhgZXJygB0bSc_13KoJlCBg-SdMoIa8qzMAP6ookFQtGyFLXGO3-oDXM1i_9J_xUy-pOc9oG6tKq-EbrOI) | Generated (Active) |
| **WEB-43** | Integrations Hub Tally & ERP Data Export | Desktop Web | `74921bcdffe246588422ea42aea6b4a1` | `files/c5ae9e679e374e8caad5827d4a733b49` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XNyqRMFoy8AnASiXZdDQCkAlFXuiNPoNscA3Ssdn1xMJleL_mqTQjoYM-UVeRDvYBt_eoF5CeGZ6lPRW9JvBUdVApp2bnJluos9q7eEdnZxyF4OZ_FSz2hAIrfg0m_eQU0h9Ul5qSmr8q7JG6RHzmP9QW2Cpk386k4AjMqyxhIb6YrlVgCLtykTsGE9OXkWp6wbIo6XIMjDQ98gYGgsL3coXoSOK18n2yDkuWV2T5BAYK2qZxewpbc2xo) | Generated (Active) |
| **WEB-44** | Integrations Hub Webhooks & API Keys Manager | Desktop Web | `0fddaef972ef40b0a13764894c6b60b1` | `files/2a4ffa41efb04d418eaaecb04456dbcf` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WZMze6pjDMaVtwswKVfUBRjFLuVgVXXWHytBf3nqUk0N13cbsMZgpLlYzBX_2JWZaJDCrFVxv9HsxU0V002RGlzAiVXZNsFfQ7t0PAbPpbrDuBcd8_NRAVx3p5GsqN4BfScnSTqPXLbP3wxHQvZgQ-H3CY3Dwm11MhikUlQNrellAZQYFjGN5ZKQxwcc2WAEfalC6_fRFY1Rb40C8robVvWS5oxyN5LgQqXLsapib18JgIPzKd4VxgHdo) | Generated (Active) |
| **WEB-45** | Workspace Settings General & Company Profile | Desktop Web | `a57898ec701a4f3eb50037ccf3d8f0d5` | `files/5a6ccd3c495047bd82c9983eedde40d7` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1W9LQP_HIlWlOWEM63yLQBCXFDEyzcR_didY0fXxF47JcRHm58AH4AV55wAoRtUKmauA42yBXC4qliofwhsv7uHJ8c-FuZtyq84I4fnULUl5K7kwHWBoeABBKC7vnAe6FCeV4qyxAo-kPGgJpkHmb6O3tz2I5-MCzz3iOdCr0epvJyMyghyFepctNVzLPYj59gKoPGkTpRTXhP6h-KrZpX3ZAacJLzElgRq-wcCVGO_PAZvJ_dB66mgrjc) | Generated (Active) |
| **WEB-46** | Workspace Settings Attendance & Biometric Policy Enforcer | Desktop Web | `aeaaad4f920f48efa2e9c8d7f9aae052` | `files/5186cfb8d531471bb20c9ca04168d6eb` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1X95hhoZ8As2BgZpE6KAZIiHcreCrBF8T8or5-2HjHynDg6ds8aSBMlAjLttNUWjM9_-zSKYuvku1GSS-snKTVMN52Va0d36c1Iz_0hqTak5d0R_7zQLxxv7zy7Pwk_dLXdLHRi2ijM6sSC3PJiL78UVnmh8p1rAvDTrqYBomooWAiQUGbQYqU6CK111PfwAxAjCCqfJ34qbhfcj1HTyuDqkUWZH8Z-1e0WrCYdYDjkt_5nAoS3GWHIdJs) | Generated (Active) |
| **WEB-47** | Workspace Settings Location Tracking & Retention Policies | Desktop Web | `97d61076580e4a05bfbddd4001bd96a5` | `files/9be22bf427424bd6bab7c34d4d1959bd` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VxLyx1mnvc_5udOwY-TFWyQngX_6FsHExWBCqU7ehRpQSvbMZinsG3KgramoBsSM7BsbMYOSRd2T8Xk_VTj0pgnKJOgymLBG3caPQCpBzPbLlCU862o85tCImCqoq-33D3b_Kp7VfNszZ12L40I3yJeOMarHjgeLJ_cIBvPW0v8R2fbiZlFChPCPzVGTPYsmPYa8bCo1BzijFE7i0sdAW-RqacgK1vnCVOFSU5X67GDxtG6JU4t_0dsg) | Generated (Active) |
| **WEB-48** | Workspace Settings Roles & RBAC Matrix Studio | Desktop Web | `89eb767698a5408ebdadc2855d24176b` | `files/7f4fb987e199412ab844db9b57398c9d` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VPTV3Do-nqZ684cnpzCm-gQAelMFSVIdhBZRkF5fibXDTgu7Vc8FQ8nldm8ohAG6Tt01d6rWtYqAp4S3ji66JSTXDTkRXImbrTf13cjhJXmI5Y5AI9PYvKbeYD_rWmhVukJIvOSpzDUTpU5a3kPLDIaihyH9Cd_pCggP9WZd8PhqVh2AdF-77B8oQWln61GwHy8saSCiMVI_ywkrbYhJpif3d8hh-6qC9RWhlZoQW3vQB1TBTzLKNdfQ) | Generated (Active) |
| **WEB-49** | Workspace Settings Subscription & Razorpay Billing Management [Proposed Phase 2 API] | Desktop Web | `9e277e0febdc4fd286df26d13c24ec41` | `files/aa69ab5d0ed245deb82a4924c5348969` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VRFm_pl0JjmQmkJVnUnoHYZL2kyHnQSr879dF16Ixj6q6UyGXqwlkNlXrrv_ti4F3XQgkfIyZKLJ4BUGqVRw43skUnmkDAL-RnBu-mTuoYTTXgC6-hBs1aRnW0Df90JB8ME8qx7Dy_1cIQry37MKbh7Y4puUTgOJPRwArRl1iSqM7nNldpCYLAf8hpaU2Fw6MtBJk-3QpgIhyPdc4YQ4t9FYCIti0K0xNnRqrO1P62BQeo2XfGHBX97iM) | Generated (Active) |
| **WEB-50** | Workspace Settings Plan Invoices & Active-Seat Metering Overview [Proposed Phase 2 API] | Desktop Web | `6f7913c9615d4a0c8366c3dbcbd93afe` | `files/8632690b9aac4aef9dd40ea56ae1b1f8` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1U1fCh3JYAn9gAgultW-dR3kCjuOyfu0KhupK-PWWWhFxhN1gB_31JKVC5gFb3qYNt1S8lGyPCsOrGi5jo3iL7nUPDs2736ZZJiaZHzWXODYIhbq00gO7hWaSOQ8c9tayQrpQhrvcrD-HN484V5WgD8HFUejvKLP_M3HYs9epfoqH1533O1xLo9b2XOBI4HTF1x1_2raUabBlysDhFIiETjhEF4YGf8VjydD5aSpOXI4V-U-SIa1l2YQQ) | Generated (Active) |
| **WEB-51** | Team Collaboration & Department Channels Chat Studio [Proposed Phase 2 API] | Desktop Web | `55ac4d1e59b847bc9ad5eda9cabee1cd` | `files/a9e82008c49a4ab1a622ee2e0003df6e` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Xm99FIQQlqXPMkPWBm5bE4jJnNcR9ku8RHQPkXBtwUgyWbjZWsPgxZFnHvkpBbpBet8i-NtVHioXS9dgUqt0HdWBbEdJHNQ-44WZUrD60ReMfkm77luXWrWcHZnBYn3KPYhLvFSrJAnOubS9ENrn4DagxX-Te18WeCFMYECmKAhYWmNZAU_cH2wbSLviH-y0ZOqfYL50qtnara4z1bqz8fYfSbV5Os7KfiaMUYNrpQKscrJVmn7FAPAQ) | Generated (Active) |
| **WEB-52** | Unified Supervisory Approvals Inbox [Proposed Phase 2 API] | Desktop Web | `bc36fc974d084d68ba7c9509c6cc390f` | `files/5b6a5d6b7f93498495ac3cdfff692292` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UMWWv0VJhR3v8zQ-5Lj1PQ-HxawCAK9D71ys3-0nB1IcuPtzgjJbiJyf7jTBv45tfQHCtpooZrpcA9ob1A8Z1Bky86WpVSPbF73NcxbbZhVWAtfYvWiyo164wsc_o4V5IGKyOK0N55rRMpWl0dXv_M96EVbE-aBtu9_rQDvqfw4P3aT0wzfAoaOnWBdozMjadWwFBDd6Zu8-DwTx3VqUGZV6HdTmAmhhnJRr8TLlgXGdcMnilF1iDddLA) | Generated (Active) |
| **WEB-53** | Central Company Document Vault & Service Files [Proposed Phase 2 API] | Desktop Web | `c924e4f0537646e38c613dc186d88425` | `files/ca66b8cf3e864f878f3a88f4353e4434` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Wxp456UZVGOOfGW-o3RkR8VZZbhm968rGH1priHB9gLbh3WQVj42XvRXcF-RYWnSbLlxLRkKgzu2n_ismTzVs92LScj-Dp-UwHrdGQeFY9CDfd49pV63nnHa8trMjfhEz5US044sCNP_rMlkKASfAanlglov0STnwWPNeDC3dSuLB5I3AnzijP6LgAKQ-mvTbP_5sNndHkQlya9cP-FWLXiMsm2IzpE4WzUqVnFhNMg6bGV8vGmWmQRg0) | Generated (Active) |
| **WEB-54** | Bilingual Help Center & Support Ticket Portal [Proposed Phase 2 API] | Desktop Web | `485a3e66942545b2ad15f34413e86fd2` | `files/aa81bb9b514140c096dadce1096cdbba` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UPfU0yU99Lkcq4oGAI17dXN8QiRaSRpSAyZl3VJXx5XSuXNxqzHo41YmqX9Zcehej43V7jmILUBz6bNL3e_LewbTqRdp20n73_wUqfEW77ES4dOqVq4HoExvDe28wfGFqIpY1BACjW42N85nr0ZCV1U1Y5TrO71EXt29Ypi8jbOz6yIvtBoHVS8nRNURSmzFZRByt6FeiGUN2G3phR281gwzDVRglNf6AahpDElavT8NWJ8SAsWSTYNQ) | Generated (Active) |
| **WEB-55** | Subscription Add-On & Quota Manager [Proposed Phase 2 API] | Desktop Web | `9eaaafe2870f47ac8db22ef171354c74` | `files/ce042c88a51e48faa8bbd0bdd62e3aaa` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WrwJFTB-7nwWQ4eHbOpT1p2gOBlL5Jo4vG17hYuS4lXkUXUyrLVt1nFE0M3w0MALmNWvYldot46t83WUmBji8qGSSrrbbdFVB6GtBQ2ZDFwjVgOb9CDJUvD6_SfQd_1PXPzY8H1EVXE8MtnyfpMr6_bj_a2rn5UdkGWisWXPEmijIoWE8wjU9Vh9sJC9nn4w-hl9lDacvQ2vsFaBBCC3lEoYpWQ7xiKeAcJx9yKdjKWhNhz22g2w6y9EA) | Generated (Active) |
| **WEB-56** | Custom BI Report Builder Studio [Proposed Phase 2 API] | Desktop Web | `fb59c6f7bfb9404ba1159a785d550cf4` | `files/b3f14ce1f52147329919eef6a9b40cdb` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1U-VjJhOafCgvPJTQoQzVy8im0dAUIYCbv8-hr378xY4tuIFbOP1_IpKHcnxsW9XLxmUCWxJo4o_DB6jPDzeg_F5m-gtPm3NOqFz1hYtzfqfYwGQjM4MrtmDald3ELQ7vKgcKQWD4oxEas0F3g_12U2bQnB6IwIRMP9hjBGZQgjpHbc8i4D6BhWLtZ84GPy1pY6Wc747q8z_ZrvuTDv_PtrIojYA3T_U7WUkDmGxJUdBKWf5AzrtvJBeKw) | Generated (Active) |
| **WEB-01-Dark** | Workspace Sign In (Dark Theme Variant) | Desktop Web | `16fdf1fbe17744aa92d9290978f8c06d` | Generated Variant | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XiIdztGidvNd36_Ay9HH4HQ6mmpCBCk_M8NcBEaR0ZZUXKBj-69UeIrJYGF0YWL3nMh6QVdGlMapZ5DmiCLt8S0g_0QQxxKi_cxmeDlF4otreJqYFB0fQVFvFdKamjIP6aRt2bbjL0tW3kqn2mSNEYgtwDhTWrsulVg5s9Gd_s_G3_5SpyXUaS_0eNNa8ZeEn4McStC4de_d7uRV9vkWsNQsdchoM7e_E1A-tV2CgBTWzpruQzNbW1Xf0) | Generated (Active) |

##### Superseded Historical Screen Audit Log (Preserved for Compliance Traceability)
* `WEB-01-v1` (`7eb6b39001484e08a564f5b636b36df6`): Initial prototype superseded by `WEB-01` (v2) to remove unverified compliance badges and align English/हिंदी localization.
* `WEB-01-v2` (`1ff1be71b0c54878a11e6fcb264efd08`): Superseded by v3 (`85048fdfa0164ce5acee6b4490da34c1`) to replace unsupported live Google/Okta SSO buttons with proposed enterprise specification tag.
* `WEB-02-v1` (`c2138ba25a2d4d059ed4b07b9ddb1246`): Initial prototype superseded by `WEB-02` (v2) to eliminate SOC-2/SLA/60s claims and add bilingual English/हिंदी toggles with fictional data.
* `WEB-02-v2` (`7fd35d613d6644fbb6854cf5348f6d8d`): Superseded by v3 (`22f1e30b111b4c9b9aacfb9e994349cc`) to strictly remove unverified legal entity claims ("Oprino Technologies Inc.").
* `WEB-08-predecessor` (`7f326a561d8f489bb308a8e37b7228a5`): Reassigned to its canonical ID `WEB-11` (Shift Rostering & Working Window Scheduler) to eliminate semantic mismatch.
* `WEB-09-variant` (`e3d1e0451689405ab2a01689e7382599` - Daily Attendance & Shift Punch Audit): Preserved as daily audit variant; canonical `WEB-09` generated as Monthly Timesheet Calendar Grid (`b45ea27c2f914d23be7232a367ea0234`).
* `WEB-11-variant` (`7327234092004480b360f66717df7789` - Timesheet Summary & Overtime Payroll Calculator): Preserved as advanced payroll summary variant / prototype for `WEB-37`.
* `WEB-28-prototype` (`dec28efeb08e41bdabb977a28b890fed`): Superseded by canonical dashboard `WEB-28` (`43bdcfa82df146ef9112aaaf8657d507`) due to lack of HTML code asset and image-only layout in predecessor.

---

## 3. Phased Execution Roadmap

```mermaid
gantt
    title Oprino Master Execution Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 0: Baseline
    Master Docs Reconciliation & Conflict Resolution :done, p0_1, 2026-10-17, 1d
    Owner Baseline Approval Gate                     :active, p0_2, 2026-10-17, 1d
    section Phase 1: Google Stitch
    Google Stitch Design System & Tokens Setup      :p1_1, after p0_2, 2d
    Company Owner/Admin Web Dashboard (56 Screens)  :p1_2, after p1_1, 5d
    Unified Flutter Mobile UI Prototypes (46 Screens):p1_3, after p1_2, 4d
    Super Admin Web Console Prototypes (14 Screens) :p1_4, after p1_3, 2d
    Owner Full-Platform Design Approval Gate        :p1_5, after p1_4, 1d
    section Phase 2: Antigravity Sprints
    Sprint 2A: Test Repair & Foundation Hardening    :p2_1, after p1_5, 3d
    Sprint 2B: Full Sales CRM Engine                :p2_2, after p2_1, 5d
    Sprint 2C: Advanced Project Management & Gantt  :p2_3, after p2_2, 5d
    Sprint 2D: Advanced HR, Expenses & Conveyance   :p2_4, after p2_3, 4d
    Sprint 2E: Dynamic RBAC & No-Code Automation    :p2_5, after p2_4, 4d
    Sprint 2F: Razorpay Billing & Seat Metering     :p2_6, after p2_5, 4d
    section Phase 3: QA & Field Trials
    Multi-OEM Battery Benchmark (< 3%/hr)           :p3_1, after p2_6, 3d
    Field Walking Offline Queue Drainage Trial      :p3_2, after p3_1, 3d
    section Phase 4: Oracle ARM Migration
    Docker Staging Deploy on OCI Ampere A1          :p4_1, after p3_2, 2d
    Staging E2E Regression Verification             :p4_2, after p4_1, 2d
    Controlled Production Cutover                   :p4_3, after p4_2, 1d
```

### Phase Details & Gates

1. **Phase 0: Documentation Baseline & Sign-Off (Current):**
   - Reconcile all 65 decisions, Master PRD v2, Architecture v2, Conflict Register, and Q01–Q65 matrix.
   - **Gate:** Owner sign-off on documentation baseline.
2. **Phase 1: Full-Platform Google Stitch Design Baseline:**
   - Execute complete high-fidelity UI/UX interactive prototype covering all 116 canonical screens following the approved sequence: Design System → Web Dashboard (56) → Mobile App (46) → Super Admin (14) → QA.
   - **Gate:** Owner sign-off on Google Stitch UI/UX design baseline.
3. **Phase 2: Antigravity Phased Feature Engineering:**
   - Sequential development sprints following the design specifications.
   - Repair mobile `widget_test.dart` expectation; implement Sales CRM, Gantt PM, Advanced HR, and Razorpay billing.
4. **Phase 3: QA & Multi-OEM Field Validation:**
   - Execute end-to-end integration test suites across all 16 modules.
   - Conduct real-device battery benchmarks on Xiaomi HyperOS and Samsung OneUI (< 3%/hr).
5. **Phase 4: Target Infrastructure Migration & Controlled Pilot:**
   - Spin up isolated Docker Compose production & staging stacks on OCI Ampere A1.
   - Verify staging; execute approved database cutover from Neon; onboard pilot SMBs.
