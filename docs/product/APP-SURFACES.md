# Oprino Application Surfaces & Information Architecture

**Document:** Application Surfaces & Information Architecture (IA)  
**Phase:** 00 — Pre-Development Freeze (Final Reconciliation)  
**Status:** Documented & Verified Against Current Product Plan (Subject to Stakeholder Approval)  
**Notice:** Functional information architecture only. Does not mandate specific UI frameworks or frontend technologies (Phase 01).

---

## 1. Surface Strategy

Oprino deploys three distinct application surfaces tailored to multi-industry operational personas:
1. **Employee Mobile App (iOS / Android):** Optimized for field technicians, mobile agents, and site workers. Fast, offline-first, thumb-driven execution with maximum battery and data efficiency.
2. **Owner / Manager Mobile App (iOS / Android):** Designed for managers on the move. Immediate operational visibility, push approvals, live map oversight, and quick task assignment.
3. **Owner / Manager Web Dashboard (Desktop Web):** Central command and dispatch center. Multi-monitor support, high-density tables, bulk imports, deep reports, and global policy administration.

---

## 2. Surface 1: Employee Mobile App (iOS & Android)

Designed for distributed and deskless employees. Simple bottom-tab navigation with prominent duty status awareness.

```
┌─────────────────────────────────────────────────────────────┐
│             TRACKING STATE / DUTY STATUS (UX CANDIDATE)     │
│      [🟢 Duty ON • Tracking Active (Started 09:02 AM)]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ACTIVE SCREEN VIEW                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Home / Today]   [Tasks]   [Visits]   [History]   [Profile]│
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Navigation & Screen Breakdown

#### 1. Tracking Status Visibility (Approved Product Requirement)
- **Approved Requirement:** Employees must always clearly know whether tracking is **ON** or **OFF**, when tracking started, when tracking stopped, and the applicable company policy.
- **UX Candidate for Design Phase:** A persistent top-bar banner/pill indicator:
  - `Duty ON`: Mint green pill with text *"Tracking Active • Started at HH:MM AM"*.
  - `Duty OFF`: Neutral slate pill with text *"Off Duty • Location Tracking Inactive"*.
- **Interaction:** Tapping the indicator opens the Attendance Punch action sheet.

#### 2. Home / Today Screen (`/today`)
- **Punch In/Out Hero Card:** Displays current shift status, accumulated duty hours, and primary Action Button (`PUNCH IN` / `PUNCH OUT`).
- **Today's Overview:** Metrics summary: Assigned Tasks (Total / Completed / In Progress), Scheduled Visits.
- **Next Up Card:** Highlights the immediate next task or visit with a one-tap `Accept` or map navigation CTA.
- **Recent Activity:** Quick timeline of today's logged events.

#### 3. Tasks Screen (`/tasks`)
- **Filters:** `Today`, `Upcoming`, `Completed`, `Overdue`.
- **Task Card:** Title, Priority badge (Urgent, High, Normal), Customer/Site name, Due Time, Workflow Status chip (`Assigned`, `Accepted`, `En Route`, `Arrived`, `In Progress`, `Completed`).
- **Task Detail View (`/tasks/:id`):**
  - Workflow status transition buttons (one-tap state progression).
  - Detailed task instructions, customer contact phone (tap-to-call).
  - Subtask checklist with interactive checkboxes.
  - Linked site location with map thumbnail and navigation launcher.
  - Attachments section (view PDF/images uploaded by manager).
  - Task comment thread (text + photo notes).
  - `Submit Proof & Complete` primary button.

#### 4. Visits Screen (`/visits`)
- **Daily Visit Itinerary:** Chronological sequence of client or facility stops.
- **Visit Card:** Customer name, Site address, Scheduled window, Status (`Scheduled`, `Checked In`, `Completed`).
- **Visit Detail View (`/visits/:id`):**
  - `Check In` CTA (enforces proximity check to site coordinates if policy requires).
  - Site contact info, gate access instructions.
  - On-site visit notes and observations.
  - `Check Out & Log Proof` CTA (captures end timestamp and duration).

#### 5. Proof Submission Flow (Modal / Action Sheet)
- **Capture Geotagged Photo:** In-app camera preview embedding watermark (timestamp, coordinates, task ID).
- **Checklist Confirmation:** Visual list of required checklist items.
- **Customer On-Glass Signature:** Canvas for client signature with signee name and phone number.
- **Completion Notes:** Multi-line text field for operational observations.

#### 6. History & Attendance Screen (`/history`)
- **Monthly Attendance Calendar:** Visual indicators for present, absent, late punch, and approved leave.
- **Daily Breakdown List:** Punch-in time, punch-out time, total duty duration, regularized status.
- **Task History Archive:** Filterable list of all completed tasks and verified proof logs.

#### 7. Notifications Center (`/notifications`)
- Push notification inbox: New task assigned, manager approved proof, schedule change, company announcements.

#### 8. Profile & Device Health Screen (`/profile`)
- Employee name, ID, phone, department, assigned manager.
- Local synchronization status (e.g., *"All items synced"* or *"3 items pending upload"*).
- Manual sync trigger.
- Device permissions diagnostic (Location, Camera, Battery Optimization status).
- Privacy policy link and duty tracking transparency disclosure.
- Secure Logout.

---

## 3. Surface 2: Owner / Manager Mobile App (iOS & Android)

Optimized for rapid supervisory oversight, quick approvals, and field visibility while away from the desk.

```
┌─────────────────────────────────────────────────────────────┐
│                 TOP BAR (Branch / Team Selector)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ACTIVE SCREEN VIEW                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Overview]   [Live Map]   [Tasks]   [Approvals]   [More]   │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Navigation & Screen Breakdown

#### 1. Overview Screen (`/manager/overview`)
- **Live Team Pulse:** Total Employees, On Duty Now, Traveling/En Route, Idle, Absent/Off Duty.
- **Critical Action Items:** Pending Approvals counter (Proof submissions, leave requests, attendance edits).
- **Today's Operations Metric Cards:**
  - Tasks: Completed / Total (%)
  - Visits: Checked In / Scheduled (%)
  - Exceptions: Overdue tasks, Late punches.
- **Quick Action Floating Button (+):** Create Task, Broadcast Notice, Check in Worker.

#### 2. Live Map Screen (`/manager/map`)
- **Interactive Map View:** Markers for all on-duty team members with custom avatars/pins.
- **Worker Mini-Card (On Marker Tap):** Name, battery level, current task, time at current location, and *View Route Trail* CTA.
- **Route Trail View:** Plays back the employee's duty-hours breadcrumbs for today.

#### 3. Tasks Management Screen (`/manager/tasks`)
- **Views:** List view and Kanban stage view (`Unassigned`, `In Progress`, `Pending Verification`, `Completed`).
- **Filter Bar:** By Assignee, Priority, Customer, Due Date.
- **Task Creation Flow:** Title, description, due date/time, assignee picker, checklist builder, customer/site link, mandatory proof rules.

#### 4. Approvals Inbox Screen (`/manager/approvals`)
- **Proof of Work Approvals:** Side-by-side view of submitted work order, photo proof (with metadata watermark), and customer signature. `Approve` or `Reject with Reason`.
- **Attendance Regularizations:** Employee requests to fix missed punches with justification.
- **Leave Requests:** Single-tap approve or deny.

#### 5. Employees Directory (`/manager/employees`)
- Searchable list of team members with real-time duty status chip (`On Duty`, `Off Duty`).
- Individual Employee Profile: Today's agenda, current location, phone call shortcut, assigned tasks.

#### 6. Alerts & Exception Center (`/manager/alerts`)
- Feed of operational anomalies: Late arrivals, overdue tasks, extended stationary periods during duty.

---

## 4. Surface 3: Owner / Manager Web Dashboard (Desktop Web)

A dense, powerful operations console designed for desktop browsers with keyboard shortcuts and multi-tab workflows.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [oprino]   [Workspace: Main Branch ▼]             [Search ⌘K]   [🔔 3]   [Avatar ▼]  │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT AREA                                                       │
│              │                                                                         │
│ • Dashboard  │  [Breadcrumb: Operations / Live Map]                                    │
│ • Live Map   │                                                                         │
│ • Tasks      │  ┌─────────────────────────────────┐  ┌──────────────────────────────┐  │
│ • Visits     │  │                                 │  │ Active Staff (18 / 24)       │  │
│ • Attendance │  │                                 │  │ • Rahul S. (At Client A)     │  │
│ • Customers  │  │         INTERACTIVE MAP         │  │ • Amit K. (En Route)         │  │
│ • Sites      │  │                                 │  │ • Priya M. (Idle 15m)        │  │
│ • Employees  │  │                                 │  │                              │  │
│ • Leave      │  │                                 │  │ [Filter by Team ▼]           │  │
│ • Reports    │  └─────────────────────────────────┘  └──────────────────────────────┘  │
│ • Policies   │                                                                         │
│ • Settings   │                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Navigation & Screen Breakdown

#### 1. Top Bar
- Company / Workspace Switcher (Multi-tenant toggle).
- Global Universal Search (`⌘K` / `Ctrl+K`): Instantly jump to any Employee, Task, Customer, or Site.
- Real-time Notifications Bell with unread counter.
- User Profile menu: Preferences, Personal profile, Logout.

#### 2. Operations Dashboard (`/admin/dashboard`)
- High-level KPIs: Active Workforce, Task On-Time Completion Rate, Visits Completed Today, Pending Verifications.
- Operational Trends: Completion curves, peak check-in hours chart.
- Quick Exceptions widget: Highlighting blocked tasks and unassigned work.

#### 3. Live Operational Map (`/admin/live-map`)
- Full-screen high-resolution vector/tile map. *(Mapping technology provider to be selected in Phase 01).*
- **Split-Pane Layout:**
  - Left/Center: Map showing real-time clustered employee markers and client sites.
  - Right Rail: Live feed of active workers with live search, battery level, current duty duration, and last ping timestamp.
- **Historical Breadcrumb Inspector:** Date & time scrubber to inspect an employee's exact path during duty hours. (Strictly disables scrubbing outside duty hours).

#### 4. Task Management Console (`/admin/tasks`)
- **Table View:** High-density table with multi-column sorting, filtering, bulk assignment, and CSV export.
- **Kanban View:** Visual workflow pipeline (`Assigned`, `Accepted`, `En Route`, `Arrived`, `In Progress`, `Completed`, `Verified`).
- **Task Detail Drawer:** Complete task inspection, proof photos lightbox, signature inspection, audit log, and comment stream.
- **Task Template Library:** Reusable task blueprints with pre-built checklists and proof policies.

#### 5. Attendance Management (`/admin/attendance`)
- **Daily Attendance Grid:** Who is present, on leave, absent, or late.
- **Timesheet View:** Weekly and monthly aggregate hours, overtime flags, and late deductions.
- **Regularization Queue:** Manager interface to approve manual punch corrections with employee justification.
- **Shift & Duty Hours Planner:** Define standard duty hours, shifts, and weekly off policies.

#### 6. Customer & Site Directory (`/admin/customers`)
- **Customer Accounts:** Client profiles, primary contacts, contract references. Can be disabled if organization does not manage client sites.
- **Physical Sites / Branches:** Addresses, coordinates, gate entry notes, primary site contact.
- **Customer Activity History:** Complete history of all tasks and visits performed at each site.

#### 7. Employee Management & Teams (`/admin/employees`)
- Employee roster with status, phone, assigned role (Owner, Manager, Employee), and branch/team assignment.
- **Bulk CSV Import Wizard:** Download sample CSV, upload 100+ employees, map columns, preview, and invite.
- Organization Structure builder: Define Branches, Departments, and Teams.

#### 8. Reports & Analytics Studio (`/admin/reports`)
- **Attendance & Punctuality Report:** Detailed daily/monthly punch logs with late arrival minutes (Excel/PDF).
- **Task SLA & Completion Report:** Breakdown by team, individual worker, and priority.
- **Customer Visit Audit Report:** Time spent at client sites, verified GPS coordinates vs site geofence.
- **Duty-Hours Conveyance Distance Report (V1.5):** Total kilometers traveled during duty hours for travel reimbursement.

#### 9. Company Policies & Settings (`/admin/settings`)
- **Attendance Rules:** Toggle mandatory GPS, mandatory selfie, or geofence boundary rules.
- **Tracking & Privacy Rules:** Configure ping frequency, idle thresholds, and automated location purge policy (7, 30, 90, 180 days, or custom).
- **Proof of Work Rules:** Configure organization-wide mandatory proof requirements (photo, signature, checklist).
- **Billing & Subscription:** View active tier (Starter, Growth, Business, Enterprise), user seat count, payment method, and invoices.
