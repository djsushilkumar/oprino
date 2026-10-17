# OPRINO — Requirements Conflict Register

**Document Status:** CANONICAL REVISED DRAFT — READY FOR OWNER SIGN-OFF  
**Version:** 2.0 (Phase 0 Rework Baseline)  
**Historical Audit Branch:** `docs/phase-0-documentation-reconciliation`  
**Official GitHub PR Branch:** `docs/phase-0-documentation-baseline` ([PR #10](https://github.com/djsushilkumar/oprino/pull/10))  
**Base Commit:** `87883a0` (`origin/main`)  
**Date:** October 17, 2026  
**Auditor:** Principal Architect & Engineering Lead  

---

## 1. Conflict Classification & Resolution Framework

This register tracks every material conflict between the historical frozen V1 Scope ([`V1-SCOPE.md`](./V1-SCOPE.md), [`OPRINO-MASTER-PRD.md`](./OPRINO-MASTER-PRD.md)) and the approved 65-decision full-platform requirements baseline:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  RECONCILIATION SUMMARY: 10 MANDATORY REVIEWER CORRECTIONS FULLY RESOLVED                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  CR-01: Full Sales CRM (Leads, Pipelines, Field Sales, Orders, Quotes) RESTORED. (Q19)                 │
│  CR-02: Advanced Project Management with Gantt, Milestones, Dependencies RESTORED. (Q18)              │
│  CR-03: Strict Single-Company Tenancy (1 User = 1 Company; no global account switching). (Q03, Q14)   │
│  CR-04: Default 90-Day GPS Retention (Options: 30 / 90 / 180 days; no cold raw archive). (Q49)        │
│  CR-05: 7-Day Trial (Read-Only Expiry) & Razorpay Active-Seat Metering (₹129/₹249/₹449). (Q06–Q10, Q58)│
│  CR-06: Target Infrastructure: Single Oracle ARM VM (Ampere A1) with Docker Prod + Staging. (Q33–Q35) │
│  CR-07: Full Scope: Advanced HR, Automation, Integrations, Super Admin, Correct DR (RPO 4h/RTO 8h). (Q60) │
│  CR-08: Phased Workflow: Documentation -> Google Stitch (104 Screens, Q39) -> Antigravity Sprints. (Q39) │
│  CR-09: Mobile Client: ONE unified Flutter app for all 4 roles. Separate Web Super Admin. (Q29, Q30)  │
│  CR-10: Document Integrity: Reconciled existing docs; no redundant new trees or duplicate ADRs.       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Itemized Conflict Reconciliations

### CR-01: Sales CRM & Pipeline Management
- **Historical Frozen V1 Position:** `V1-SCOPE.md §3` explicitly categorized "Sales Pipeline & Deal CRM" as strictly *OUT OF SCOPE / PROHIBITED*.
- **Superseding Decision (Q19):** Full Sales CRM is approved as a core commercial engine. Includes Lead Capture, Pipeline Stages (`New`, `Contacted`, `Qualified`, `Proposal`, `Won`, `Lost`), Field Sales Visits, Contacts, Product & Price Catalogs, Quotations with PDF generation, and Field Order Booking.
- **Resolution:** Restored and documented in [`OPRINO-MASTER-PRD-V2.md §8`](./OPRINO-MASTER-PRD-V2.md#8-sales-crm--field-sales-engine) and Module `MOD-07`. Scheduled for Phase 2 implementation.

### CR-02: Advanced Project Management & Gantt Visualizations
- **Historical Frozen V1 Position:** `V1-SCOPE.md §3` designated "Heavy Project Management, Gantt charts, and Task Dependencies" as *OUT OF SCOPE / LATER*.
- **Superseding Decision (Q18):** Advanced Project Management is approved. Supports multi-tier `projects`, `project_milestones`, Finish-to-Start (FS) and Start-to-Start (SS) task dependencies, interactive Gantt timelines, and Kanban boards on Web Console.
- **Resolution:** Restored and documented in [`OPRINO-MASTER-PRD-V2.md §4.4–4.5`](./OPRINO-MASTER-PRD-V2.md#44-project-management-hierarchy) and Module `MOD-06`. Stitch Screen WEB-19 designated for Gantt.

### CR-03: Multi-Tenant Account Model & User Isolation
- **Prior Draft Mistake:** Proposed cross-workspace accounts, organization hierarchies, and header workspace switching.
- **Superseding Decision (Q03, Q14):** Strict **1-User-to-1-Company** tenancy model enforced. Every user account belongs strictly to one company workspace. A person working for two separate companies must hold two distinct accounts with distinct email credentials. No cross-tenant data leakage or global account switching. PostgreSQL transactional RLS (`SET LOCAL app.current_workspace_id`) is strictly preserved.
- **Schema Reality & Resolution:** Formally codified as the controlling policy in [`OPRINO-MASTER-PRD-V2.md §2.1`](./OPRINO-MASTER-PRD-V2.md#21-security--multi-tenancy). In the actual local schema ([`packages/database/src/schema/users.ts`](../../packages/database/src/schema/users.ts) and [`tenants.ts`](../../packages/database/src/schema/tenants.ts)), `users` is global and membership is modeled via `workspace_memberships` with compound unique `(workspace_id, user_id)`. The strict 1-account-to-1-company invariant is **NOT YET IMPLEMENTED** at the schema level and will be enforced via unique constraint and invite rejection tests in Phase 2.

### CR-04: GPS History Retention & Pruning Lifecycle
- **Prior Draft Mistake:** Retained 30-day default and invented a mandatory cold raw coordinate archive in Cloudflare R2 with a 365-day retention option.
- **Superseding Decision (Q49):** GPS raw history retention default is **90 days**. Company-selectable policy options are **30 days, 90 days, or 180 days**. No 365-day option and no mandatory cold raw coordinate archival. BullMQ scheduled pruning (`telemetry.retention.prune`) hard-deletes coordinates beyond the tenant's selected retention window while preserving aggregate daily travel mileage summaries.
- **Schema Reality & Resolution:** Formally codified in [`OPRINO-MASTER-PRD-V2.md §3.7`](./OPRINO-MASTER-PRD-V2.md#37-retention-rules). In the actual schema ([`packages/database/src/schema/tenants.ts`](../../packages/database/src/schema/tenants.ts)), `location_retention_days` already exists on `workspaces` with default 30. The worker ([`services/worker/src/worker.ts`](../../services/worker/src/worker.ts)) respects this field. A safe migration to 90-day default and 30/90/180 options is proposed for Phase 2 without modifying the database in Phase 0.

### CR-05: Trial Period, Payment Gateway & Seat Metering
- **Prior Draft Mistake:** Cited 14-day trials and unmetered seat structures.
- **Superseding Decision (Q06, Q07, Q08, Q09, Q10, Q57, Q58):** **7-day free trial** with zero upfront payment. Upon trial expiration without payment, the workspace switches to **read-only mode** (data preserved, but punch-in, task creation, and mutations blocked). Payment processor is **Razorpay** with verified webhooks, auto-invoicing, and a 7-day renewal grace period. Active-user monthly pricing:
  - **Starter:** ₹129 / user / month
  - **Growth:** ₹249 / user / month
  - **Business:** ₹449 / user / month
  - **Enterprise:** Custom negotiated rate
  - *(All rates provisional before applicable taxes, subject to commercial validation; policy document only, not billing code).*
- **Resolution:** Documented in [`OPRINO-MASTER-PRD-V2.md §14`](./OPRINO-MASTER-PRD-V2.md#14-commercial-pricing--subscription-lifecycle) and Module `MOD-15`.

### CR-06: Target Hosting Infrastructure & Safe Migration
- **Prior Draft Mistake:** Retained long-term multi-cloud sprawl across Render, Neon, Upstash, and Vercel.
- **Superseding Decision (Q33, Q34, Q35):** Target production infrastructure is a single **Oracle Cloud Infrastructure (OCI) ARM VM (Ampere A1, 4 OCPU, 24GB RAM)** running Docker Compose. The VM hosts two fully isolated stacks (`production` and `staging`), each with its own PostgreSQL 17 + PostGIS, Redis 7, Fastify API, BullMQ worker, and Next.js Web Console, fronted by a unified Caddy reverse proxy with automatic SSL. Media storage utilizes OCI Object Storage with an S3-compatible adapter. **Safe Migration Invariant:** Existing Render/Vercel/Neon/Upstash services remain completely intact and active until the Oracle VM stack is deployed, tested, and owner-approved.
- **Resolution:** Documented in [`OPRINO-TECHNICAL-ARCHITECTURE-V2.md §3`](../architecture/OPRINO-TECHNICAL-ARCHITECTURE-V2.md#3-target-infrastructure-topology-oracle-arm-vm) and Module `MOD-16`.

### CR-07: Disaster Recovery Planning Targets (Calibrated for Pilot)
- **Prior Draft Mistake:** Invented unrealistic guaranteed SLAs of RPO 1 hour and RTO 4 hours.
- **Superseding Decision (Q60):** Approved pilot planning targets (not guaranteed SLAs) are:
  - **Recovery Point Objective (RPO):** 4 hours
  - **Recovery Time Objective (RTO):** 8 hours
  - Encrypted off-VM backups, verified restore drills, runbooks, and offline sync reconciliation.
  - Targets require real recovery drill testing; they are planning targets, not contractually guaranteed SLAs.
- **Resolution:** Corrected in [`OPRINO-MASTER-PRD-V2.md §15.2`](./OPRINO-MASTER-PRD-V2.md#152-disaster-recovery) and [`OPRINO-TECHNICAL-ARCHITECTURE-V2.md §3.4`](../architecture/OPRINO-TECHNICAL-ARCHITECTURE-V2.md#34-disaster-recovery--backup-topology).

### CR-08: Development Workflow & Design Gates
- **Prior Draft Mistake:** Planned immediate feature coding, R2 wiring, and FCM setup during Phase 0.
- **Superseding Decision (Q31, Q37, Q39, Q63, Q64, Q65):** Strict phased gating enforced. Master Documentation must be completed and owner-approved first. Next, the complete full-platform Google Stitch UI/UX design baseline (all 104 screens) must be designed, reviewed, and approved following the sequence: **Design System → Company Web Dashboard → Flutter Mobile → Super Admin → QA**. Only then will planned phased feature coding begin in Antigravity.
- **Resolution:** Formalized in [`ROADMAP-AND-STITCH-PLAN.md`](./ROADMAP-AND-STITCH-PLAN.md).

### CR-09: Mobile Client Architecture
- **Prior Draft Mistake:** Proposed a separate "Manager Mobile Application."
- **Superseding Decision (Q29, Q30):** **ONE unified Flutter mobile application** serving all four company roles (`OWNER`, `ADMIN`, `MANAGER`, `FIELD_WORKER`). The mobile application dynamically adjusts its navigation, tabs, and permissions based on the authenticated user's assigned role. Platform Super Admin is delivered strictly as a separate desktop web portal.
- **Resolution:** Formalized in [`OPRINO-MASTER-PRD-V2.md §1.2`](./OPRINO-MASTER-PRD-V2.md#12-supported-surfaces) and Stitch Mobile Screen Inventory (Screens MOB-01 to MOB-40).

### CR-10: Documentation Hierarchy & De-duplication
- **Prior Draft Mistake:** Duplicated ADRs across multiple directories and created confusing report hierarchies.
- **Superseding Decision (Q38, Q43):** Reconciled documentation within existing canonical directories (`docs/product/`, `docs/architecture/`, `docs/agent/`). Preserved all 21 approved ADRs and historical audit reports. Established `docs/PROJECT-STATUS-HI.md` as the single owner-facing dashboard.
- **Resolution:** Formalized in [`docs/README.md`](../README.md) and Section 3 of this document.
