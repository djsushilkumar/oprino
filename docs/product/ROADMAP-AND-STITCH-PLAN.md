# OPRINO — Phased Roadmap, Module Inventory & Google Stitch Plan

**Document Status:** CANONICAL REVISED DRAFT — READY FOR OWNER SIGN-OFF  
**Version:** 2.0 (Phase 0 Rework Baseline)  
**Branch:** `docs/phase-0-documentation-reconciliation`  
**Parent Commit:** `53bc209`  
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

## 2. Approved Google Stitch Design Sequence & Screen Inventory (104 Screens)

### 2.1 Approved Design Workflow Sequence
To ensure maximum operational efficiency and dispatch-first management oversight, Google Stitch UI/UX design proceeds strictly in the following sequence:

```
Step 1: Oprino Design System & Core Component Tokens
   │
   ▼
Step 2: Company Owner/Admin Web Dashboard (50 Screens: WEB-01 to WEB-50)
   │
   ▼
Step 3: Unified Flutter Mobile Application (40 Screens: MOB-01 to MOB-40)
   │
   ▼
Step 4: Platform Super Admin Web Console (14 Screens: ADM-01 to ADM-14)
   │
   ▼
Step 5: Full-Platform Design QA & Owner Approval Gate
```

*(Note: Company Web Dashboard strictly precedes Mobile Application to establish comprehensive administrative, dispatch, and CRM data contracts before mobile client consumption).*

---

### 2.2 Screen Inventory Lifecycle Governance (Q40)

To maintain absolute transparency and prevent treating a screen list as finished code, every screen transitions through 5 explicit lifecycle states:

1. **Inventory Documented:** Screen ID, surface, title, and operational purpose defined. (Current: 104/104 Complete).
2. **Screen-Level Contract Completed:** API endpoints, request/response Zod contracts, permissions, and loading/error states documented. (Phase 1 Initial Deliverable).
3. **Google Stitch Design Produced:** High-fidelity interactive component layout created in Google Stitch. (Phase 1 In-Progress).
4. **Design QA Passed:** Cross-surface design review, contrast audit, touch target verification, and edge cases signed off by Lead Architect. (Phase 1 Exit).
5. **Owner Approved:** Formal sign-off by Product Owner prior to Antigravity feature coding. (Phase 2 Entry Gate).

---

### 2.3 Surface 1: Company Owner/Admin Web Dashboard (50 Screens)
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
49. **WEB-49:** Workspace Settings: Subscription & Razorpay Billing Management
50. **WEB-50:** Workspace Settings: Plan Invoices & Active-Seat Metering Overview

---

### 2.4 Surface 2: Unified Flutter Mobile Application (40 Screens)
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
40. **MOB-40:** Quick Action Emergency Punch-Out & Help Sheet

---

### 2.5 Surface 3: Platform Super Admin Web Console (14 Screens)
91. **ADM-01:** Super Admin Login & MFA Challenge Shell
92. **ADM-02:** Platform Global Metrics Dashboard (Total tenants, active seats, MRR)
93. **ADM-03:** Tenant Management Directory (Search, plan tier, trial status, active users)
94. **ADM-04:** Tenant Detail Inspector (Usage breakdown, active databases, storage volume)
95. **ADM-05:** Tenant Subscription Override Modal (Manual trial extension, seat quota edit)
96. **ADM-06:** Global User Directory & Device Inventory
97. **ADM-07:** Global System Health & Container Cluster Status (Oracle VM monitor)
98. **ADM-08:** Global Telemetry Pipeline Throughput & SSE Metrics Monitor
99. **ADM-09:** Background Queue Studio (BullMQ job failure rates, retry worker)
100. **ADM-10:** Global Audit Log & Security Forensics Browser
101. **ADM-11:** Razorpay Payment Gateway Transaction & Webhook Log
102. **ADM-12:** System Announcement & Global Notification Dispatcher
103. **ADM-13:** Global Feature Flag Configuration Studio
104. **ADM-14:** Database Backup Snapshot & Disaster Recovery Status Dashboard

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
    Company Owner/Admin Web Dashboard (50 Screens)  :p1_2, after p1_1, 5d
    Unified Flutter Mobile UI Prototypes (40 Screens):p1_3, after p1_2, 4d
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
   - Execute complete high-fidelity UI/UX interactive prototype covering all 104 screens following the approved sequence: Design System → Web Dashboard → Mobile App → Super Admin → QA.
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
