# Oprino Commercial Pricing Strategy & Packaging Plan

**Document:** Commercial Packaging, Tier Architecture & Add-on Strategy  
**Phase:** 00 — Pre-Development Freeze  
**Status:** APPROVED & FROZEN (Stakeholder Sign-Off Recorded)  
**Notice:** Strategic commercial framework. No currency amounts or final pricing packages are frozen during Phase 00.

---

## 1. Commercial Philosophy & Pricing Model

Oprino employs a **Hybrid SaaS Pricing Model** combining:
1. **Tiered Seat Packaging:** Base monthly subscription scaled by the number of active employee seats across multi-industry SMBs.
2. **Modular Add-ons:** High-value, specialized capabilities (e.g., automated conveyance, route optimization, WhatsApp alerts) decoupled from the core platform to keep entry pricing accessible for cost-conscious SMBs.

### Core Principles
- **No Per-Task or Per-Punch Metering:** Predictable billing is critical for SMB owners. Operational usage (number of tasks assigned, pings logged during duty) is unlimited within the plan tier.
- **Pay Only for Active Workforce:** Flexible seat licensing allowing businesses to adjust seat counts seasonally.
- **14-Day Full-Featured Trial:** Self-serve onboarding with access to the Growth tier without requiring credit card details upfront.

---

## 2. Packaging Tiers Architecture

```mermaid
graph LR
    T1["Starter Tier<br/>(5–15 Users)"] --> T2["Growth Tier<br/>(15–50 Users)"]
    T2 --> T3["Business Tier<br/>(50–200 Users)"]
    T3 --> T4["Enterprise Tier<br/>(200–500+ Users)"]
```

### 2.1 Starter Tier (Target: 5–15 Employees)
*Designed for small contractors, local shops, and micro-teams transitioning off paper/WhatsApp.*
- **Included Features:**
  - Simple Punch In / Out (Standard GPS timestamp).
  - Basic Task Management (Title, Due Date, Assignee, Priority).
  - Default 7-stage field task workflow.
  - Photo Proof of Work & basic completion notes.
  - Employee Mobile App (iOS / Android).
  - Web Dashboard with daily attendance list & task view.
  - Configurable location trail retention (approved default: 30 days; tier options: 7, 30, 90, 180 days, extended).
  - Email support.
- **Limits:** Max 15 active users; 1 company branch; standard notifications only.

### 2.2 Growth Tier (Target: 15–50 Employees) — *The Flagship Sweet Spot*
*Designed for established regional SMBs with active mobile or distributed teams (field service, installation, delivery, facility management, retail audits).*
- **Everything in Starter, plus:**
  - Selfie-Verified Attendance & GPS validation.
  - Live Operational Map on Web & Manager Mobile App.
  - Breadcrumb Route History for active duty hours.
  - Customer & Multi-Site Directory.
  - Multiple Task Assignees & Recurring Task Automation.
  - On-Glass Customer Signatures & Required Task Checklists.
  - Manager Mobile App for real-time approvals.
  - Configurable location history retention (e.g., 30 days / plan policy).
  - Bulk CSV import for employees and customer sites.
  - Multi-team / department grouping.

### 2.3 Business Tier (Target: 50–200 Employees)
*Designed for multi-branch organizations requiring rigorous operational governance, multi-level hierarchy, and automated compliance.*
- **Everything in Growth, plus:**
  - Geofence-Restricted Attendance (customer site or branch boundary).
  - Multi-Branch Hierarchy (Company → Branch → Team → Supervisor).
  - Operational Exception Engine (late arrivals, idle stops, overdue SLA alerts).
  - Shift & Duty Hours Scheduling Planner.
  - Lightweight Leave & Absence Management module.
  - Configurable location history retention (e.g., 90 days / plan policy).
  - Comprehensive CSV / Excel & PDF operational export suite.
  - Priority chat and phone support.

### 2.4 Enterprise Tier (Target: 200–500+ Employees)
*Designed for large distributed operations, multi-city logistics, and corporate security/audit firms requiring custom terms and deep security.*
- **Everything in Business, plus:**
  - Unlimited Branches, Regions, and Organizational Hierarchies.
  - Custom Role & Configurable Permissions Engine (Supervisor, Area Manager, etc.).
  - Configurable Location Retention (180+ days / custom purge rules).
  - Dedicated Account Manager & Guided Implementation Onboarding.
  - Custom SLA uptime guarantee (99.9%).
  - API & Webhook access (for ERP/HRMS synchronization).

---

## 3. High-Value Modular Add-ons

Add-ons allow Oprino to maximize Average Revenue Per User (ARPU) without forcing smaller customers to pay for complex tools they don't need:

| Add-on Module | Scope & Functionality | Target Customers | Target Milestone |
|---|---|---|:---:|
| **1. Expense & Conveyance Management** | Automatic GPS distance calculation for duty travel, vehicle per-km reimbursement rates, receipt photo upload, and manager approval workflow. | Field service, sales agents, couriers. | **V1.5** |
| **2. Route & Beat Planning** | Multi-stop sequencing, daily itinerary planning, and route adherence tracking. | Delivery teams, recurring maintenance technicians. | **V2.0** |
| **3. WhatsApp & SMS Business Alerts** | Automated notification dispatch directly to employee and manager WhatsApp/SMS (new tasks, critical exceptions, shift reminders). | Field teams with low email usage. | **V2.0** |
| **4. Advanced Analytics & Custom Reports** | Cross-branch productivity benchmarks, travel-efficiency ratios, automated weekly executive email digests. | Business owners & executive operations heads. | **V2.0** |
| **5. AI Operational Assistant** | Natural language operational querying (*"Which technician is closest to Sector 18?"*), automated photo proof verification, and anomaly detection. | Tech-forward SMBs and enterprise fleets. | **V3.0** |

---

## 4. Expansion & Monetization Levers

1. **User Expansion:** As SMBs hire more mobile employees, monthly recurring revenue (MRR) grows organically with active seat counts.
2. **Tier Upgrades:** Companies naturally graduate from Starter → Growth → Business as they scale from single-city to regional operations.
3. **Annual Prepayment Incentive:** Standard 15%–20% discount for annual upfront commitments, driving immediate cash flow and locking in low churn.
