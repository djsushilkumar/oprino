# Oprino Product Definition

**Product Name:** Oprino  
**Classification:** Multi-Industry Task Management + Workforce Management + Field Operations SaaS Platform for SMBs  
**Phase:** 00 — Pre-Development Freeze  
**Status:** APPROVED & FROZEN (Stakeholder Sign-Off Recorded)  
**Target Market:** Small and Medium Businesses (5–500 employees; core sweet spot: 10–200 employees) across diverse mobile and distributed operations.

---

## 1. Product Statement

> **Oprino is a mobile-first workforce operations platform for SMBs that connects task management, attendance, and field-force operations into a single, cohesive workflow.**

SMB owners and operational managers struggle with fragmented tools: WhatsApp for ad-hoc coordination, paper/Excel for attendance, unverified phone calls for field status, and disconnected spreadsheets for tasks. Oprino unifies these operational threads into one intuitive, accountable system across diverse industries.

---

## 2. Multi-Industry Scope & Target Market

Oprino is designed as a **horizontal, multi-industry operational platform**, not a vertical-specific tool limited solely to field service or HVAC.

### Target Organization Size
- **Supported Range:** Approximately 5–500 employees.
- **Primary Optimization Sweet Spot:** 10–200 employees.

### Potential Industries & Operational Use Cases
- **Field Service & Repair** (Equipment servicing, residential and commercial maintenance)
- **Maintenance & Asset Upkeep** (Preventive checks, recurring facility plant inspections)
- **Installation & Commissioning** (Telecom, electronics, solar, HVAC, appliance installation)
- **Facility Management & Housekeeping** (Janitorial, multi-site hygiene, infrastructure operations)
- **Field Sales & Client Servicing** (Direct B2B merchant onboarding, channel visits, demos)
- **Distribution & Last-Mile Operations** (Local delivery, stock dispatch, fulfillment runs)
- **Inspections & Audits** (Compliance checks, food safety audits, quality assurance)
- **Collections & Recovery** (Field collection agents, loan verification, document pickup)
- **Security Operations & Patrols** (Guard tours, checkpoint logging, premises security)
- **Merchandising & Retail Execution** (Shelf audit, planogram compliance, POS displays)
- **Property & Real Estate Site Operations** (Tenant inspections, property handovers, maintenance)
- **Construction Support & Site Coordination** (Contractor supervision, material drop-off verification)
- **Multi-Location SMB Operations** (Franchise branches, multi-store manager visits)
- **Any business managing mobile, deskless, or distributed employees.**

---

## 3. Core Product Principles

### 3.1 Non-Negotiable Principle: Duty-Hours Visibility & Privacy
> **Owners should be able to manage work and understand what their employees are doing and where they are during duty hours only. Off-duty employee location tracking must NEVER occur.**

- **Strict Boundary:** Tracking activates when permitted duty starts (e.g., confirmed punch-in) and continuous tracking stops immediately when duty ends (e.g., punch-out).
- **Clear Tracking State Transparency:** Employees must always clearly know whether tracking is **ON** or **OFF**, exactly when tracking started, when tracking stopped, and the applicable company policy. *(Specific UI mechanisms, such as persistent banners or status chips, represent UX candidates for the design phase).*
- **Peer Location Visibility (Stakeholder Approved):** Employee-to-employee live location visibility is **OFF** by default. Duty-hours employee location may be accessed only by authorized roles (`Owner/Admin`, `Manager`, and explicitly permitted custom roles). Any future peer/team location-sharing capability requires an explicit company policy and permission.
- **Ethical Monitoring:** Surveillance outside authorized duty hours is strictly prohibited at the product requirement level and must not be weakened by implementation choices.

### 3.2 Operational Pragmatism for SMBs
- **Mobile-First for Workers:** Mobile interfaces designed for fast, thumb-driven, one-handed operational execution by distributed and deskless employees.
- **Offline-First Execution:** The employee mobile app must support offline-first execution of approved core workflows (viewing assigned tasks, status changes, checklist updates, photo proof, signatures, and attendance events), with reliable conflict-aware synchronization after connectivity returns. *(Technology selection belongs to Phase 01).*
- **Zero-Friction Onboarding:** Operational staff can be added in minutes via phone/email or bulk import without requiring lengthy enterprise training.

---

## 4. Supported Platforms

| Platform | Target Audience | Primary Focus |
|---|---|---|
| **Employee Android App** | Field staff, technicians, site agents, mobile workers | Attendance punch, task execution, visit navigation, proof submission, tracking status transparency. |
| **Employee iOS App** | Field staff & mobile workers using Apple devices | Parity with Android employee experience. |
| **Owner/Manager Android App** | Supervisors, area managers, on-the-go business owners | Live operational overview, approvals, quick task assignment, alerts, duty-hours team visibility. |
| **Owner/Manager iOS App** | Supervisors, area managers, on-the-go business owners | Parity with Android manager mobile experience. |
| **Owner/Manager Web Dashboard**| Business owners, dispatchers, HR/operations managers | Central command, live operational map, scheduling, reports, configuration, bulk data management. |

---

## 5. The Primary Product Loop

The core operational loop of Oprino unites planning, execution, and verification:

```mermaid
flowchart LR
    A["1. Plan"] --> B["2. Assign"]
    B --> C["3. Check In"]
    C --> D["4. Work"]
    D --> E["5. Visit"]
    E --> F["6. Verify"]
    F --> G["7. Complete"]
    G --> H["8. Review"]
    H -.-> A
```

1. **Plan:** Managers define tasks, shifts, recurring schedules, and required customer/site visits.
2. **Assign:** Work is dispatched to an individual employee, multiple assignees, a team, or an unassigned pool.
3. **Check In:** Employee punches in for duty (validating policy: simple, GPS, selfie, or geofence). Permitted tracking activates.
4. **Work:** Employee views today’s agenda, updates task progress (`Assigned` → `Accepted` → `En Route` → `Arrived` → `In Progress`).
5. **Visit:** Employee conducts on-site customer, facility, or branch visits, recording arrival at client coordinates.
6. **Verify:** Employee submits mandatory proof of work (geotagged photo, checklist, digital signature, notes).
7. **Complete:** Task and visits are marked complete with verified timestamps and audit trails.
8. **Review:** Manager reviews completed tasks, inspects exceptions, approves time/visits, and generates operational reports.

---

## 6. Explicit Non-Goals (What Oprino is NOT)

To maintain product focus, prevent scope creep, and ensure a lean, sellable V1, Oprino explicitly rejects becoming any of the following software categories:

| Prohibited Domain | Why Oprino Will NOT Build This | Where Oprino Stops Instead |
|---|---|---|
| **CRM & Sales Pipeline** | Complex lead scoring, opportunity stages, and drip campaigns distract from operational execution. | Oprino supports a lightweight **Customer & Site Directory** purely for operational dispatch and visits. |
| **Inventory Management** | Stock levels, SKU reorder triggers, warehouse bin tracking, and supply chain logistics require deep domain software. | Tasks can link reference notes; external inventory integration is deferred to future webhook/API connections. |
| **Accounting & Invoicing** | Tax calculations, ledger books, GST/VAT, balance sheets, and invoicing are handled by dedicated accounting software. | Oprino captures operational conveyance and verified work logs; data can be exported to accounting tools. |
| **Full Payroll Software** | Tax deductions, statutory withholdings, payslip generation, and bank disbursements are outside our scope. | Oprino provides verified attendance and duty-hour export files for third-party payroll software. |
| **Full HRMS** | Performance appraisals, employee lifecycle, benefits administration, and grievance management clutter SMB workflows. | Oprino provides lightweight leave/absence management and basic employee profiles only. |
| **Full ERP Suite** | Manufacturing resource planning, procurement, and heavy enterprise modules ruin SMB simplicity. | Oprino focuses strictly on daily workforce execution. |
| **Customer Self-Service Portal**| Giving external clients login portals creates huge support and UX complexity in V1. | Proof of work and completed service reports can be shared via PDF or direct links. |
| **Full Project Management Suite**| Gantt charts, sprint planning, Kanban boards, and complex resource leveling (ClickUp/Asana/Jira) confuse field teams. | Oprino provides an optional lightweight **Project Grouping** tag for related operational tasks. |
