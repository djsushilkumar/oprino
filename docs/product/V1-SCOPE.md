# Oprino V1 Scope & Feature Boundary Document

**Document:** V1 Scope Classification & Feature Boundaries  
**Phase:** 00 — Pre-Development Freeze  
**Status:** APPROVED & FROZEN (Stakeholder Sign-Off Recorded)  
**Strategic Principle:** Optimize V1 for a clean, reliable, sellable operational core for multi-industry SMBs without unnecessary complexity, bloat, or premature technology commitments.

---

## 1. Classification Framework

Every proposed capability is categorized into one of four rigid boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MUST           Non-negotiable for V1 launch. Required to deliver the core   │
│                 value proposition and close paying SMB customers.          │
├─────────────────────────────────────────────────────────────────────────────┤
│  SHOULD         High-value capabilities targeted for immediate fast-follow   │
│                 or V1.1 polish once the core feedback loop is established.   │
├─────────────────────────────────────────────────────────────────────────────┤
│  LATER          Advanced field intelligence, optimization, enterprise SSO,   │
│                 and automated workflows deferred to V2 and V3 roadmaps.     │
├─────────────────────────────────────────────────────────────────────────────┤
│  OUT OF SCOPE   Explicit non-goals. Banned from Oprino product architecture  │
│                 to avoid becoming bloated CRM/ERP/Accounting software.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Feature Matrix

### 2.1 Attendance & Duty Hours
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Simple Punch In / Out** | **MUST** | Foundational baseline for all mobile/distributed operations. |
| **GPS-Verified Punch In / Out** | **MUST** | Core requirement for verifying field presence. |
| **Selfie-Verified Punch In / Out** | **MUST** | Visual anti-buddy punching capability for SMB owners. |
| **Geofence-Restricted Attendance** | **SHOULD** | Restrict punch-in to specific customer site or office radius. |
| **Clear Tracking State Visibility** | **MUST** | Legal & privacy requirement; worker sees clear `Tracking ON` / `Tracking OFF` state, start/stop times, and policy. *(Persistent banner is a UX candidate).* |
| **Inviolable Duty-Hours Tracking Rule** | **MUST** | Non-negotiable product rule: off-duty location tracking must NEVER occur. Permitted tracking activates on punch-in and stops on punch-out. |
| **Live Operational Map (Web/Manager)** | **MUST** | Shows who is on duty, last known location, and active task. |
| **Breadcrumb Route Trail (Historical)**| **MUST** | Day-by-day playback of duty-hours movement for audit. |
| **Configurable Location Retention** | **MUST** | Approved default retention: 30 days. Configurable policy options: 7, 30, 90, 180 days, and extended/custom retention. |
| **Shift & Duty Hours Scheduling** | **SHOULD** | Basic shift hours to flag late punches. |
| **Multiple Shift Rostering** | **LATER** | Complex rotating shifts for 24/7 manufacturing/security. |

### 2.2 Task Management & Assignment
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Core Task Attributes (Title, Due, Assignee, Priority)**| **MUST** | Minimal operational unit of work. |
| **Default Field Workflow** | **MUST** | `Assigned` → `Accepted` → `En Route` → `Arrived` → `In Progress` → `Completed` → `Verified`. |
| **Task Checklists (Sub-items)** | **MUST** | Step-by-step procedures for distributed field and site staff. |
| **Task Photos & File Attachments** | **MUST** | Before/after photos, work orders, service sheets, documents. |
| **Task Comments & Activity Log** | **MUST** | Contextual operational updates between manager and assignee. |
| **Task Mentions (@username)** | **SHOULD** | Notifications on direct operational callouts. |
| **Assign to Single Employee** | **MUST** | Primary dispatch pattern. |
| **Assign to Multiple Employees** | **SHOULD** | Collaborative multi-worker jobs. |
| **Unassigned Queue / Pool** | **SHOULD** | First-available operator claim pool. |
| **Recurring Tasks (Daily / Weekly)** | **MUST** | Essential for routine maintenance, recurring audits, site visits. |
| **Task Dependencies (Finish-to-Start)**| **LATER** | Heavy project management concept; confusing for SMB field ops. |
| **Custom Field Builder for Tasks** | **LATER** | Defer until form engine matures in V2. |

### 2.3 Visits & Customer / Site Operations
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Separation of Tasks vs Visits** | **MUST** | Tasks and visits are separate concepts. A task can have 0, 1, or multiple visits. |
| **Visit Check-In / Check-Out** | **MUST** | Timestamps, coordinates, and duration per site visit. |
| **Customer & Site Directory (Optional Module)**| **MUST** | Hierarchy: Customer → multiple physical Sites. Can be disabled if not needed. |
| **Visit Notes & Photos** | **MUST** | On-site observation capture. |
| **Planned Visit Sequencing** | **SHOULD** | Order of stops for the day (Stop 1, Stop 2, Stop 3). |
| **Automated Beat / Route Optimization**| **LATER** | Algorithmic shortest-path routing belongs in V2. |
| **Customer Coordinate Auto-Capture** | **SHOULD** | "Set site location from current device GPS" for quick setup. |

### 2.4 Proof of Work (PoW) & Verification
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Geotagged & Timestamped Photo Proof**| **MUST** | Core defense against unverified job sign-offs. |
| **Work Completion Notes** | **MUST** | Summary description of work performed. |
| **Customer Digital Signature (on-glass)**| **MUST** | Client sign-off upon completion. |
| **Mandatory Checklist Completion** | **MUST** | Prevent task completion until all required check items are ticked. |
| **Manager Verification Step** | **MUST** | Manager can review, approve, or reject submitted proof of work. |
| **Customer OTP Verification** | **LATER** | Requires external SMS gateway infrastructure; defer to V2. |
| **Custom Dynamic Inspection Forms** | **LATER** | Complex multi-page schema builders belong in V2. |

### 2.5 Offline-First Mobile Capabilities
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Offline-First Core Workflow Execution**| **MUST** | Employee mobile app must support offline-first execution of approved core workflows (viewing assigned tasks, status updates, checklist items, photos, signatures, and attendance events), with reliable conflict-aware synchronization after connectivity returns. *(Technology selection belongs to Phase 01).* |
| **Offline Attendance Event Logging** | **MUST** | Offline punch-in records verified timestamp and device coordinates for later sync. |
| **Offline Proof & Photo Capture** | **MUST** | Capture photos and sign-offs without cellular connection; upload upon reconnection. |

### 2.6 Manager & Web Dashboard Operations
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Live Map with Employee Status Markers**| **MUST** | Duty-hours operational overview of active team members. |
| **Operational Alerts & Exception Engine**| **SHOULD** | Flag overdue tasks, missed duty start, or extended stationary stops. |
| **Daily Attendance Summary Report** | **MUST** | Summary of present, late, absent, and hours logged (CSV / PDF). |
| **Task Completion & Verification Report**| **MUST** | Summary of completed, rejected, and pending verification tasks. |
| **Customer Visit Log Report** | **MUST** | Audit log of all site visits with check-in/out times & duration. |
| **Bulk CSV Import (Employees & Sites)** | **MUST** | Fast onboarding for 20–100 employees in minutes. |
| **Multi-Company / Multi-Workspace Support**| **MUST** | One user account can manage multiple legal entities separately. |
| **Projects (Lightweight Grouping Tag)**| **SHOULD** | Group tasks by client contract, event, or site project. |

### 2.7 Device Integrity, Security & Admin
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Multi-Tenant Data Isolation** | **MUST** | Strict tenant partitioning on all queries. |
| **Default Roles & Configurable Permissions**| **MUST** | Owner/Admin, Manager, Employee with configurable permissions. *(Specific RBAC data modeling belongs to Phase 01).* |
| **Mock-Location & Spoofing Flags** | **SHOULD** | Flag suspected fake GPS apps in audit log (do not hard block). |
| **Single Active Device per Employee** | **SHOULD** | Prevent credentials sharing between workers. |
| **Audit Logs for Sensitive Changes** | **MUST** | Record manager overrides, edits, and deletions. |
| **Enterprise SSO (SAML, Okta, Azure AD)**| **LATER** | Mid-market SMBs use email/phone OTP; SSO belongs in V3. |

### 2.8 Conveyance, Expenses & Messaging
| Feature Item | Classification | Rationale & Functional Scope |
|---|:---:|---|
| **Lightweight Leave Management** | **SHOULD** | Leave types, balance, apply/approve (keeps SMB operations clean). |
| **Basic Expense Claim & Receipts** | **SHOULD** | Upload receipt photo against task or visit. |
| **Automatic GPS Conveyance (Distance x Rate)**| **LATER** | Requires robust map snapping and odometer logic; V1.5/V2. |
| **In-App & Push Notifications** | **MUST** | Task assigned, approaching due date, manager approval/rejection. |
| **Email Digest Notifications** | **MUST** | Daily operational summary for business owners. |
| **WhatsApp Notifications** | **LATER** | WhatsApp Business API integration deferred to V2. |
| **Direct Peer-to-Peer Chat** | **LATER** | Distracting in V1; task comments fulfill operational communication. |
| **SOS / Field Worker Emergency Button**| **LATER** | Dedicated worker safety module in V2. |

---

## 3. Explicit Out-of-Scope (Prohibited)

The following areas are strictly **OUT OF SCOPE** for all versions of Oprino:
1. **Sales Pipeline & Deal CRM:** No lead scoring, cold email sequencing, or sales quotas.
2. **Double-Entry Accounting & General Ledger:** No invoicing, tax returns, balance sheets, or banking integrations.
3. **Full Payroll Calculation Engine:** No salary slip generation, tax deductions, PF/ESI withholding, or direct bank transfer execution (Oprino exports verified duty hours instead).
4. **Warehouse Inventory & Stock Management:** No barcoding of warehouse bins, restocking triggers, or inventory valuation.
5. **Full HRMS Suite:** No 360-degree appraisals, candidate recruiting, or grievance boards.
6. **Heavy Enterprise Project Management:** No Gantt charts, critical path calculations, or sprint burndowns.
