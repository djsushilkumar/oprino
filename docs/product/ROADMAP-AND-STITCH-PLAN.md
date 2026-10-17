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
- **Primary Screens:** `WEB-33` (Company Operational Broadcasts & Bulletin Composer), `MOB-31` (Company Broadcasts & Safety Feed), `MOB-15` (Task Comment & Timeline Sheet).
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
- **Primary Screens:** `WEB-10` (Attendance Regularization), `WEB-15` (Proof of Work), `WEB-27` (Leave Management), `WEB-28` (Expense Claims), `MOB-37`–`MOB-39` (Manager Review Sheets).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `GET /v1/approvals/pending` — Consolidated supervisory queue aggregated across 4 types: `ATTENDANCE_REGULARIZATION`, `PROOF_VERIFICATION`, `LEAVE_REQUEST`, `EXPENSE_CLAIM`.
  - `POST /v1/approvals/:id/decide` — Atomic decision endpoint: `{ decision: "APPROVED" | "REJECTED", remark: string }`.
- **UI Contract Elements:**
  - Unified badge counter on Web header and Mobile Manager tab.
  - Split-view inspector: Side-by-side comparison of original punch vs requested punch, receipt photo vs claimed amount, watermarked photo vs task requirement.
  - One-click batch approval for verified items with optimistic UI rollback on network error.

#### Contract 3: Workspace File & Document Vault (`MOD-11`, `MOD-08`)
- **Primary Screens:** `WEB-21` (Customer Account Documents), `MOB-14` (Task Attachments & Service Document Viewer), `WEB-45` (Company Vault).
- **Surface Bindings [PROPOSED PHASE 2 SPECIFICATION - NOT YET LIVE IN API]:**
  - `POST /v1/storage/upload-ticket` — Returns presigned S3 direct-upload URL for OCI Object Storage.
  - `GET /v1/documents?entity_type=...&entity_id=...` — Filtered document metadata list (`id`, `name`, `size_bytes`, `mime_type`, `uploaded_by`, `uploaded_at`).
  - `DELETE /v1/documents/:id` — Soft-delete with audit logging.
- **UI Contract Elements:**
  - File category chips: `Contracts`, `SOP PDFs`, `Service Blueprints`, `Tax / Invoices`, `Site Photos`.
  - In-app PDF/image viewer with zoom, rotation, and offline caching via Drift SQLite.

#### Contract 4: Bilingual Help, Support & Contextual Knowledge Base (`MOD-01`, `MOD-16`)
- **Primary Screens:** `WEB-02`, `MOB-40` (Help & Support Action Sheet), Help Drawer Modal across Web.
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
| **WEB-05** | Executive Operations Overview Cockpit | Desktop Web | `78ae05e1af044a5593b047c6e5ad3415` | `files/1f630da44c474758be6b676a873f0aab` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VpF2lV3wx-8xX3hRl6fF7R7DIGu0cjGfS8UY3rW8kZZ7Gc0-4MwU0XPE-WiOaMGaM_MsTbI8EPcDtNkFHX1HdqjhactfIbir6QjgBCW29v16xrSPvRFAcKWfMue4dsYSlB2vZiLf9O-DwjFJxyw-YGg84jpcnhHwvmm3vttEfAxbUmcw_nKLUEI5aId8Fgd6CSGTJaUlTxsJPus2D3dB94r_Z00Shx7cSpFQa2VmBKY03Qncppt7bSBa8) | Generated (Active) |
| **WEB-06** | Real-Time Live Radar Map | Desktop Web | `98b0dfc9e7f34b719df32125357c2de4` | `files/16d9066121934a87abe96af062991f9a` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1VWyyD7Sb5V3MGwyA26YDXqH3abLs1MrJ6GxdZt00bSPPYFIzYTnXu5MH1N5bcnHQeU2jLXnpnQcI6XkmlWNsCeVV2yHS0Y1l3jzrVOL5lqK3EpuH2Yew4o3FjPHQR6A3FH6egL_aFFFmrRjLgF4jC1gQXAYbDkWW6Q1-JsdhcnaHlnJ1GcWOgqFA2Dk2qv9Wam51F0m1N3WRH-RIJ5MAwrjItjJ4HcFpmIR0mEjNxeqNemyfdq1aoe) | Generated (Active) |
| **WEB-12** | Task Dispatch Matrix Kanban | Desktop Web | `44233e9028ad43469441bf44869bf971` | `files/db3f5b4f6dd0412d862f090272b27837` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UtYNVEqP6e2opoUXkzB6eK3r6RxpMgyWoty5vK2_ms15ZupZJpfvoZ0eH4PlfECVhGhu8LMNhHutIm9wEmCt0KaCv3LSQsw5HAThgYR-pqgkFturPdjsqBuXDP-46bu0zPJUOjtsWj4rsNPg7YEFquSzqJd4f-lzZPPGs52TfZD_hMMEQ-IZ0YwiY5l5_yhT1Ogm5P7IVMy8nYz2mpuQPhkMBfz1oF-h8PHNmpRINOKofi1_6IkiwCWWc) | Generated (Active) |
| **WEB-13** | Task Creation & Multi-Worker Dispatch Wizard | Desktop Web | `5fd800f0997840958dd455b07e052405` | `files/41b91fbcce144d94a875303cb33d9c15` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UtBEn1g0rP-Zi0FM_HEESZrDVu5i4kqlC4xT6jT_f6XSh1YVfvGwJYtyujCU0ekpIiANPIvrdO4OQZTHn1MPd774a0NE0vDajGi7E1RDuAw43ePEucTi-UmNuR9i_p2LVdIbU23csHwDNKA8hvH3-2Oqci-g9gKL-KGDXYpg-V8E_VNHVLfR9ko0uhAa4F_bUqcieB7hkFks-2BPah0ARKYQEJbfYH6-DfJio1-v97T2XTdPtMQ7RvMZs) | Generated (Active) |
| **WEB-14** | Task Detail Inspector & Real-Time Workspace | Desktop Web | `19bd3a93cd2e41efa5e57244b88a8468` | `files/fc8183c258c24406ad6ebee50b313fd1` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Uu1Na-WGjks1fpUE0TCJ2Wzag6qBGSMtzjSZ7ogTLO9UwX5OKA-dOCP0GWCAckXPxYDB4Bph9mmVwEUcp0MjrgvYYXxZvzkC7OLppc7G8B2dWRgVl5HdMPYvUQ0WcbB_tzYJh4aZIRGpVEgUT5brkN44hhpOxnM04TzvgN6K9IlUFC2JheS3Bt2uQzfvkR_2_DGjchENo-OL74xgohWs5y1EBxTIf2ZzZGxGke-fXY33Cp7Zb2GM_9Wxg) | Generated (Active) |
| **WEB-15** | Proof of Work Supervisory Verification Queue | Desktop Web | `a770a74c513d4bb08b7ca60401756dfe` | `files/381347766b4e44c9b26353d69b9877f6` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WrXsvj3HNLwxRddnfE0pc7-GJ6VjTVCHbQAG59GX2kXYl1tH2gBu1O0dTsnndOLBGnmDyl8YiCCQ8xBAn_aJNUwLMuYH0Xgsex7MN3iBpgPnTZcx0Lfy_owij2zrv1ZH91-HIbBFQUdqaA0iZlDvToJChZLhfITuioGQOPk1B65Z305VvHJAQEU1SScVRas_7hX9L9BHWa8V6T6RApnVMF7SrCrAxfyia5SRcyKI24fVeoI4vFixRxHw) | Generated (Active) |
| **WEB-16** | Recurring Task Template Studio | Desktop Web | `dcfee7062cf74af8ab23b7d74770d068` | `files/677638b1f2c042a3a0e195a0d7bfb220` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1Wz6FmjGuAkA6n3izD3dq2PsFrzsWwnL7d2LUOAE8Ouz-CPQqzDF-K8WLU6a-5DcAx3jmiyFPx0ZB88m1OB-17gIYsxMHjt-V87MLulIjAjkyONkOyXfAqW9U26TYu9Ztv-fgxfg-xjL7kffdoAKpSUiDaBYZILPl_LIduPg9w3MwR21tImBLDjTcu9FtVjRStlP9rTMAj6rcEJrLNz_TweO1UOc-j88hM--tHA0hwdKx3QhDplNtilDw) | Generated (Active) |
| **WEB-17** | Advanced Project Portfolio Overview | Desktop Web | `887d486a053d4661abf1329db3c72778` | `files/0d070fd85c8442a6a337ec38c24ad692` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XINnSlM_cMGDJdOvaI5WXalpYSFndUtATBpjcszTGdXQaUBmTNUs-Uj96kkNhk5OqE5CEDYDmYK_lrS2mL6n-yQBaGVEgIqzaX8VR33ZFfYqMDcKkTcSG2mdRzr_dmPDwP69fn7QegJMQTBWLgagouYe31mh20cn-7XksAJm1YanicAWjDS3_Pj5DSAzIkspDrgC_dLu8bOqs5UPHvB0hwvj824kpHnaUJK6QTEcuLeoD1oTKRh9cC_aU) | Generated (Active) |
| **WEB-18** | Advanced Project Milestone Hierarchy | Desktop Web | `4629555140b84caf95017e8ab0b23425` | `files/235e42422ab24bec94bc1ed11b76a6be` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UE5EEVmxHEqKwWr3cMQdEOxRRUgnJ9aEuc6CApBJiaR-t1UnZ0feCBvAw6sitZaMTlOY2uRyNisGS-FuIJ1wOEydF2DWRuSIH_pu3ufTuwP9-F76Ra38gwTUHnUxrw58SuoMwS--OiMfIlfelCZU0M4m6k9hAR94iCiFUV2HU6xWdvXr1AtjKeacqW43R0r5G5K9HeUmWtqmtu7IDUyUab6TLqfG5CvIysoBSHAx6o_OebneJCVToTng) | Generated (Active) |
| **WEB-19** | Advanced Project Management Gantt Timeline | Desktop Web | `a1773b03570a4cd7afbe2ec3e0266692` | `files/d468663f735b40f8ac0a453825e1579e` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1UQN1TUTEtBTcf7tGEfshb7T6hTE-sXQJW5zSCTUebp52ApZmUWXKQBBNi8-eB-UlNeLtfbzxB9XkTBgdKbKZFhLYMIKygWey2AkVaVTs7QSaR1vjiE53pTP8-nA4P6kSNfXnMMGcbaPJ7wZSVnN4A9yX1QkbfBl8RX0M2xMGZh5uEK-WlxXjwC0lGQ716edHEEx6Bd-tPw6HubzP0qkoCQfG3PhGf_Y1-tuEL8uh-xklKVHhhGMTis6-4) | Generated (Active) |
| **WEB-20** | Sales CRM Visual Deal Pipeline | Desktop Web | `82323c5505e3427c93abc3bc6c576604` | `files/61d4ddbc09934f029f2f5c566dbb9ad0` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WU8-tVQtGKUjGWkJc6Oo9rH_f7_IqoypQKhOkNIYColOzSu0w12o-FMHF2hgvxEwJAtdeqTR96abrGRaReT1CFL2rao08zgFLQFqZpM7GYkmDc7suCs-2QssEWWH5Lhk4Z9xEM8ZxhxisNLdm8tLP0QSjImfHy0ZBLO6Ewqa0OAbP-3pBDm5i8S5ia9VQzoiLCcplKU_uQb0T0KNdV-s0HwXMVlaaa5hPybkgKg5TDjv0MmTVXKbpMjw) | Generated (Active) |
| **WEB-07** | Historical Breadcrumb Route Playback | Desktop Web | `edcfb51e32534fc182d7a401edd5ea6d` | `files/7ba1d804c846428eafa7cc023537184a` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WUMU1QyrWkSx2Q4hxUBCffrivFCl4oLG_lSRg1ZY8Opz1ZJt5xWMyoa0q5oXsT_b6VFTNACzGkvnrA3dNggGNAr0kDwye7mVWg0_JmaOmyg2Cz38Kp9-9CmDKyBBB7GCwBBKfA7YUJo3M_BLlatzfchLB9-caSFvb8sKB-EVgo2KJfZZoFNeneiqH43H0WI6icqTQTG7zmLSh9mFkh1-ygZTHenAvz1HctvjpF6rZtsAguGYOvSRqqZbU) | Generated (Active) |
| **WEB-08** | Attendance Management Dashboard | Desktop Web | `d27f660dc346417889cf8c6fb194a3af` | `files/497ea4bbca694a5285cbe8bb9bef66fc` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XrLSDu50yy6ZavMMSDHOu4Htx934G-EtTzI98KM7i8DktetjdrY2_sJ12Th-AZT4xvGmrbmFoSB9zcUfq7tgNXOHE1GJ7ePp4ihZdCQjg44KW6BDNucks-uxRhMGZ1F5mBWnJSlOuIm8I9Jv_QnyJyxBEk7J03EshrchQxGRrEA-m9Gh2m_b2lUsPB2RiO_9ecGKZ9BiYnFUFR3QeVwWJxObXSKwndIIalxUBXxAz90LcrvQ_r0aWKMlE) | Generated (Active) |
| **WEB-09** | Monthly Attendance Timesheet Calendar Grid | Desktop Web | `b45ea27c2f914d23be7232a367ea0234` | `files/ee39ace1969f449fb9ad52d0805bf815` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WgtB9j7TPnj-BIeGBQH-u3xtmSKxYYPY5g7lQtC39TrVZNLux3qxp_DFFTKBMUCdBlwy_1htJ-OnVx5uoXPtYwx_OPrs-7DXQ7LS7fA_MEq-DQH34kpUOXb5ZS6403YbBo8wJfJ2OW6SPgydkbMZbEM6k9YfFul5Vh5asXe-Qx6ovajQRycdvW9nuStpyvQKHIsFdDtpZwyYEGwLWPNsJr0-SLBjkwMRf0z9Ey2TpzmDsY4zIi6mrlrA) | Generated (Active) |
| **WEB-10** | Attendance Regularization Supervisory Approval Queue | Desktop Web | `1219cecf339e4df494d70ee91b915a0d` | `files/7fc3eb220cb045b68d947be51c7e19d8` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1WTM48_PVYfvy-33paF6ew86DyI9lHPRTmN95wb7uEp28eKEpjcW4KwuVYi6on8M2dDJcOupRP6RepaAVt7xLJ0hFjwockCrA3PUE7AfRurKmgEujZC07sHoxZWiHFmvdn13bkI9VgRNeprNeHlPU_-mlVEbFxaCZXMKKCq2RHXvy91wUkeeEtpovgkejG-si9n3XB46X3VI8Q4CfpPOzwplGDrH-BJrX13Vnfn-YHxf7P4W0wUCD-uxp0) | Generated (Active) |
| **WEB-11** | Shift Rostering & Working Window Scheduler | Desktop Web | `7f326a561d8f489bb308a8e37b7228a5` | `files/18680a05cedf43a8a7c723d103755acb` | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XYMtU5LCF0moTdjYDFl3Mcu9MLgE5jYqtiUXa7QmSF2FSx2T0-53_6fFx15Lzg9ompg8UTsaptl6UuBNoalvKtH_92qd5jGOCVq7xPeWMk4Nts7r_JI5LwxfoniskqzqmcRqP8t6fQwLRdChGGAvMoZOp-MVm3UQkl7d-go-WXI32btGO0lvZr9MRm7JLVw8zuvu8JAviFXLMHUzdJTrHUKjrPpYFJglcDNNg5vidmhDpN6DX9-MM3uw) | Generated (Active) |
| **WEB-01-Dark** | Workspace Sign In (Dark Theme Variant) | Desktop Web | `16fdf1fbe17744aa92d9290978f8c06d` | Generated Variant | [View Visual](https://lh3.googleusercontent.com/aida/AEtjO1XiIdztGidvNd36_Ay9HH4HQ6mmpCBCk_M8NcBEaR0ZZUXKBj-69UeIrJYGF0YWL3nMh6QVdGlMapZ5DmiCLt8S0g_0QQxxKi_cxmeDlF4otreJqYFB0fQVFvFdKamjIP6aRt2bbjL0tW3kqn2mSNEYgtwDhTWrsulVg5s9Gd_s_G3_5SpyXUaS_0eNNa8ZeEn4McStC4de_d7uRV9vkWsNQsdchoM7e_E1A-tV2CgBTWzpruQzNbW1Xf0) | Generated (Active) |

##### Superseded Historical Screen Audit Log (Preserved for Compliance Traceability)
* `WEB-01-v1` (`7eb6b39001484e08a564f5b636b36df6`): Initial prototype superseded by `WEB-01` (v2) to remove unverified compliance badges and align English/हिंदी localization.
* `WEB-01-v2` (`1ff1be71b0c54878a11e6fcb264efd08`): Superseded by v3 (`85048fdfa0164ce5acee6b4490da34c1`) to replace unsupported live Google/Okta SSO buttons with proposed enterprise specification tag.
* `WEB-02-v1` (`c2138ba25a2d4d059ed4b07b9ddb1246`): Initial prototype superseded by `WEB-02` (v2) to eliminate SOC-2/SLA/60s claims and add bilingual English/हिंदी toggles with fictional data.
* `WEB-02-v2` (`7fd35d613d6644fbb6854cf5348f6d8d`): Superseded by v3 (`22f1e30b111b4c9b9aacfb9e994349cc`) to strictly remove unverified legal entity claims ("Oprino Technologies Inc.").
* `WEB-08-predecessor` (`7f326a561d8f489bb308a8e37b7228a5`): Reassigned to its canonical ID `WEB-11` (Shift Rostering & Working Window Scheduler) to eliminate semantic mismatch.
* `WEB-09-variant` (`e3d1e0451689405ab2a01689e7382599` - Daily Attendance & Shift Punch Audit): Preserved as daily audit variant; canonical `WEB-09` generated as Monthly Timesheet Calendar Grid (`b45ea27c2f914d23be7232a367ea0234`).
* `WEB-11-variant` (`7327234092004480b360f66717df7789` - Timesheet Summary & Overtime Payroll Calculator): Preserved as advanced payroll summary variant / prototype for `WEB-37`.

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
