# OPRINO Master Product Requirement Document (PRD v2)

**Document Status:** CANONICAL REVISED DRAFT — READY FOR OWNER SIGN-OFF  
**Version:** 2.0 (Phase 0 Rework Baseline)  
**Controlling Decision Register:** Authoritative Q01 – Q65 Approved Baseline  
**Historical Audit Branch:** `docs/phase-0-documentation-reconciliation`  
**Official GitHub PR Branch:** `docs/phase-0-documentation-baseline` ([PR #10](https://github.com/djsushilkumar/oprino/pull/10))  
**Base Commit:** `87883a0` (`origin/main`)  
**Date:** October 17, 2026  
**Auditor:** Principal Architect & Engineering Lead  

---

## 1. Platform Vision & Supported Surfaces

### 1.1 Platform Vision & Scope (Q01, Q02)
**Oprino** is an enterprise-grade, cloud-native, offline-first workforce operations, field task management, Sales CRM, and project management SaaS platform designed for multi-industry businesses (10 to 500+ employees).  
Oprino executes the complete operational lifecycle:  
**Acquire Lead → Track Pipeline → Send Quote → Confirm Order → Plan Project & Milestones → Dispatch Tasks → Biometric GPS Punch-In (Duty Tracking ON) → Execute Field Visits & Checklists → Capture Watermarked Proof & Signatures → Manager Verification → Conveyance & Timesheet Audit → Punch-Out (Duty Tracking HARD CUTOFF).**

### 1.2 Supported Surfaces (Q28, Q29, Q30)
1. **Unified Mobile Application (Flutter):** Single cross-platform mobile client serving all four company roles (`OWNER`, `ADMIN`, `MANAGER`, `FIELD_WORKER`). Navigation, actions, and supervisory tabs dynamically adjust based on the authenticated role.
2. **Web Management Console (Next.js 15):** High-density desktop operations console for business owners, dispatchers, and project managers.
3. **Platform Super Admin Web Portal (Next.js 15):** Dedicated standalone web console for platform operators managing global tenants, billing health, system telemetry, and compliance.

---

## 2. Security, Multi-Tenancy & Identity Governance

### 2.1 Security & Multi-Tenancy (Q03, Q14, Q27, Q48)
- **Mathematical RLS Isolation:** Shared database, shared schema with mandatory PostgreSQL 17 Row-Level Security (RLS) on all tenant entities. Every query executes within a database transaction scoped with `SET LOCAL app.current_workspace_id = :workspaceId`.
- **Strict Single-Company Tenancy Policy (Q14):** Every user account belongs strictly to **one company workspace**. A person belonging to two separate companies must hold two distinct accounts with distinct email credentials. No cross-tenant data leakage or global account switching.
  - *Schema & Implementation Reality:* In the current codebase ([`packages/database/src/schema/users.ts`](../../packages/database/src/schema/users.ts) and [`tenants.ts`](../../packages/database/src/schema/tenants.ts)), `users` is a global table and tenancy is modeled via `workspace_memberships` with compound unique `(workspace_id, user_id)`. Session context tracks `activeWorkspaceId`. The strict 1-account-to-1-company invariant is **NOT YET IMPLEMENTED** at the schema level and will be enforced via unique constraint and invite rejection tests in Phase 2.

### 2.2 Authentication Framework (Q13, Q27)
- Self-hosted **Better Auth** with HttpOnly Cookie Backend-for-Frontend (BFF) on Web Console (anti-XSS) and Bearer token plugin for Flutter Mobile clients.
- Rate-limited authentication endpoints with brute-force protection.

### 2.3 Roles & Permissions (Q03, Q04, Q25)
- 4 default company roles: `OWNER`, `ADMIN`, `MANAGER`, and `FIELD_WORKER`.
- Extensible role permissions schema supporting granular capability flags (`tasks.create`, `proofs.verify`, `location.read`, `billing.manage`).

### 2.4 Device Governance (Q13, Q27)
- Mobile devices register with a cryptographically random **UUIDv4 installation identifier** stored in secure hardware-backed storage (`flutter_secure_storage`).
- Administrators can instantly revoke compromised devices from the Web Console, immediately locking the mobile app.

### 2.5 Onboarding Lifecycle (Q05, Q12, Q53)
- Employee invitations use single-use cryptographic SHA-256 tokens; invitees set their own passwords upon activation.
- Bulk onboarding supports sanitized CSV uploads (up to 100 employees per batch) with formula injection protection (`=`, `+`, `-`, `@` escaping).

---

## 3. Attendance, Duty-Hours & Biometrics

### 3.1 Duty-Hours Privacy Boundary (Q15, Q17, Q61)
- **Non-Negotiable Privacy Invariant:** Off-duty location tracking must **NEVER** occur. Tracking activates strictly on verified attendance punch-in and terminates immediately and synchronously on punch-out.
- The mobile app terminates location listeners; the API drops any accidental out-of-duty coordinates with zero database writes.

### 3.2 Attendance Policies (Q15)
- Configurable per company: `SIMPLE`, `GPS_REQUIRED`, `SELFIE_REQUIRED`, and `GPS_AND_SELFIE_REQUIRED`.

### 3.3 Biometric Selfie Attendance (Q15)
- Front-facing camera live preview captures employee selfie during punch-in/out. Prevents buddy punching with anti-replay hash validation.

### 3.4 Geofencing (Q15, Q17, Q48)
- Circular and polygon geofences configured around customer sites and company offices. Evaluated via PostGIS `ST_DWithin`. Punches outside boundary are flagged or blocked per policy.

### 3.5 Shift Rostering (Q16)
- Multi-shift scheduling with predefined duty hours, grace periods, automatic late arrival flags, and overtime duration calculation.

### 3.6 Attendance Regularization (Q16)
- Employee-initiated correction requests for missed punches with manager approval queue and full audit logging.

### 3.7 Retention Rules (Q49)
- **Approved Default Retention:** **90 days** of raw GPS breadcrumb history.
- **Company-Selectable Options:** **30 days, 90 days, or 180 days**.
- **Existing Schema Field & Safe Migration:** The `workspaces` table in [`packages/database/src/schema/tenants.ts`](../../packages/database/src/schema/tenants.ts) already has `location_retention_days` with default 30. In Phase 2, a safe migration will change the schema default to 90 days and restrict allowed values to `[30, 90, 180]`. The BullMQ retention worker ([`services/worker/src/worker.ts`](../../services/worker/src/worker.ts)) already respects this field. No 365-day option and no mandatory raw coordinate cold archival.

---

## 4. Advanced Task & Project Management Engine (Q18)

### 4.1 Task Lifecycle Engine (Q01, Q18)
- Strict 7-stage state transitions: `ASSIGNED` → `ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED` → `VERIFIED`.
- Optimistic concurrency locking prevents duplicate or conflicting updates.

### 4.2 Checklists (Q18)
- Step-by-step checklist items with mandatory completion gates. Tasks cannot transition to `COMPLETED` if required items remain unchecked.

### 4.3 Recurring Tasks (Q18)
- Scheduled automated task generation based on cron patterns (Daily, Weekly, Monthly) managed by BullMQ workers.

### 4.4 Project Management Hierarchy (Q01, Q18)
- Multi-tier relational structure: `Project → Milestones → Tasks → Visits`.
- Tracks project target deadlines, assigned teams, budgets, and progress completion percentages.

### 4.5 Gantt Timelines & Dependencies (Q18)
- Finish-to-Start (FS) and Start-to-Start (SS) task dependencies.
- Interactive Gantt timeline visualization and drag-and-drop Kanban boards on the Web Management Console.

### 4.6 SLA Monitoring (Q18, Q23)
- Automated deadline monitoring, grace period warnings, and multi-level managerial escalation triggers upon breach.

---

## 5. Field Operations, Site Visits & Proof of Work

### 5.1 Site Visits Architecture (Q17, Q18, Q19)
- Decoupled physical visit logging. Tasks and visits are independent entities; 1 task may link 0, 1, or multiple site visits.

### 5.2 Visit Lifecycle (Q17, Q19)
- Verified GPS check-in/out timestamps, horizontal accuracy validation, and automated on-site dwell time calculation.

### 5.3 Stop Sequencing (Q17, Q18)
- Manager-defined daily itinerary stop order (`Stop 1, Stop 2, Stop 3`) with interactive mobile reordering (`PUT /v1/visits/sequence`).

### 5.4 Watermarked Photo Proofs (Q18, Q19, Q27)
- Live camera photos burned with permanent raster watermark (GPS coordinates, timestamp, accuracy, and task ID) before direct binary upload.

### 5.5 Customer Digital Signatures (Q18, Q19)
- Touch canvas captures on-glass customer signature, rasterized to high-resolution PNG with client signer name and phone verification.

### 5.6 Proof Verification Queue (Q04, Q18)
- Dedicated supervisor review inbox. Completed tasks remain in `PENDING_VERIFICATION` until approved (`VERIFIED`) or rejected with feedback (`REJECTED`).

---

## 6. Offline-First Mobile Synchronization

### 6.1 Offline-First Architecture (Q27, Q28, Q29)
- Unified Flutter mobile app utilizes a durable local Drift SQLite outbox queue.
- Attendance punches, task updates, checklist items, photos, and signatures execute locally with zero connectivity and drain automatically upon network reconnection.

### 6.2 Conflict Resolution (Q27, Q28)
- Event timestamps govern mutation execution; API enforces idempotency keys and version checks (HTTP 409) governed by [`SYNC-CONFLICT-MATRIX.md`](../architecture/SYNC-CONFLICT-MATRIX.md).

---

## 7. Live Operational Map & Telemetry Pipeline

### 7.1 Real-Time Live Map (Q17, Q22)
- Unidirectional Server-Sent Events stream (`/v1/telemetry/stream`) backed by Upstash Redis Pub/Sub; eliminates heavy mobile WebSocket battery drain.

### 7.2 Breadcrumb Playback (Q17, Q22)
- Day-by-day historical playback of verified duty-hours travel trails with stationary stop markers.

### 7.3 Peer Privacy (Q27, Q61)
- Peer location opacity is **OFF by default**. Mobile field workers cannot see peer coordinates. Live map access is restricted to Manager, Admin, and Owner roles.

### 7.4 Telemetry Ingestion (Q17, Q32)
- Battery-optimized mobile GPS engine: 30-second interval / 25-meter distance filter during active duty. Batches up to 30 coordinates per HTTP payload (`POST /v1/telemetry/points`).

### 7.5 Map Tiles (Q33)
- Zero API billing costs for base map rendering; Web uses Leaflet/MapLibre with Carto vector tiles; Mobile uses Flutter Map with raster tile caching.

---

## 8. Sales CRM & Field Sales Engine (Q19)

### 8.1 Lead Management (Q01, Q19)
- Multi-channel lead capture (manual, website webhook, bulk import, mobile field entry) with source attribution.

### 8.2 Sales Pipelines (Q19)
- Visual drag-and-drop Kanban pipeline with customizable deal stages (`New`, `Contacted`, `Qualified`, `Proposal`, `Won`, `Lost`).

### 8.3 Customer Directory (Q01, Q19)
- Commercial billing accounts (`customers`) linked to one or more physical operational branches (`customer_sites`).

### 8.4 Contacts & Interactions (Q19)
- Multi-contact directory per customer with phone, email, designation, and comprehensive activity interaction timeline.

### 8.5 Product Catalog (Q19)
- Standardized product SKUs, billable service offerings, base unit rates, and tax/GST rate configurations.

### 8.6 Quotation Studio (Q19)
- Itemized quotation builder with margin/discount controls, branded PDF generation, and client email dispatch.

### 8.7 Sales Orders (Q18, Q19)
- On-field order confirmation, customer signature capture, and one-click handoff to project dispatch and task execution.

### 8.8 Field Sales Mobile (Q19, Q29)
- Unified mobile app supports field sales agents: quick lead creation, site visit check-ins, product browsing, and order booking.

---

## 9. Advanced HR, Leave & Field Conveyance

### 9.1 Leave Management (Q16, Q20)
- Leave balance tracking, customizable leave types (Casual, Sick, Earned), mobile application, and supervisory approval queue.

### 9.2 Expense Management (Q20)
- Multi-category expense reporting (Fuel, Meals, Stay, Toll) with camera receipt upload tied to tasks or visits.

### 9.3 Conveyance Calculation (Q16, Q20)
- Automated fuel reimbursement computed by multiplying Haversine distance rollups from duty-hours breadcrumbs by vehicle per-km rate.

### 9.4 Employee Records (Q20)
- Secure repository for employee identity documents, driver licenses, and trade certifications with expiry alert triggers.

---

## 10. Team Collaboration & Operational Communications

### 10.1 Task Collaboration (Q21)
- Contextual discussion threads and activity audit timelines anchored to individual tasks.
- Operational callouts with `@username` mentions.

### 10.2 Notification Drawer (Q21, Q50)
- Centralized in-app notification center on Web and Mobile with unread badge counters and real-time SSE dispatch.

### 10.3 Broadcasts (Q21)
- Pinned company-wide operational announcements and safety bulletins displayed on mobile home feeds.

---

## 11. No-Code Automation & Dynamic Forms

### 11.1 Automation Engine (Q23)
- Rule-based workflow engine: `WHEN event occurs AND conditions met THEN execute action` (e.g., auto-assign tasks, send alerts).

### 11.2 Custom Forms (Q18, Q23)
- Drag-and-drop form schema builder supporting Text, Number, Dropdown, Photo, Signature, and GPS field types for site inspections.

### 11.3 Email Delivery (Q50)
- Transactional email dispatch for team invitations, task assignments, password resets, and daily owner digests.

---

## 12. Integrations & Interoperability

### 12.1 WhatsApp Integration (Q50)
- WhatsApp Business API integration for automated customer dispatch alerts, technician details, and arrival ETAs.

### 12.2 Accounting Adapters (Q16, Q24, Q54)
- Formatted ledger and payroll exports compatible with Tally Prime, Zoho Books, and QuickBooks.

### 12.3 Webhooks & API (Q24, Q47, Q55)
- HMAC-signed outbound webhooks on domain events and secure REST API documented via OpenAPI 3.1.

---

## 13. Business Intelligence & Reporting Studio

### 13.1 Analytics Studio (Q22, Q54)
- High-density management dashboards and streaming server-side CSV/PDF exports for:
  - Daily & Monthly Attendance Timesheets
  - Task SLA Compliance & Completion Ratios
  - Customer Visit Logs & Time-on-Site Audits
  - Field Travel & Conveyance Payout Logs
  - Sales Pipeline Conversion & Order Revenue

---

## 14. Commercial Pricing & Subscription Lifecycle

### 14.1 Pricing Tiers (Q06, Q11, Q56, Q57)
- **Provisional Pricing Policy (Q57 - Policy Document, Not Billing Code):**
  Provisional monthly active-user pricing (before applicable taxes, subject to commercial validation):
  - **Starter:** ₹129 / user / month
  - **Growth:** ₹249 / user / month
  - **Business:** ₹449 / user / month
  - **Enterprise:** Custom negotiated pricing
  - *(Commercial validation remains pending; billing code scheduled for Phase 2).*

### 14.2 Payment Lifecycle (Q07, Q08, Q09, Q10, Q55, Q58)
- **7-Day Free Trial:** Full feature access with zero upfront payment.
- **Trial Expiration Lock:** Upon trial end without an active subscription, workspace transitions to **read-only mode** (data preserved, new mutations blocked).
- **Payment Processing:** Integrated **Razorpay** subscriptions with verified webhooks, auto-invoicing, and active-seat metering.
- **Grace Period:** 7-day paid-renewal grace period before subscription suspension.

---

## 15. Security, Compliance, DR & Data Rights

### 15.1 Security Governance (Q27, Q59)
- Connection-pool-safe transactional RLS, secure single-use invitation tokens, input sanitization, and structured incident response runbooks.

### 15.2 Disaster Recovery Planning Targets (Q60)
- **Pilot Planning Targets (Not Guaranteed SLAs):**
  - **Recovery Point Objective (RPO):** 4 hours
  - **Recovery Time Objective (RTO):** 8 hours
  - Encrypted off-VM automated database backups (GPG), verified restore drills, runbooks, and offline sync reconciliation.
  - Targets are operational benchmarks calibrated for pilot validation, not contractually guaranteed customer SLAs.

### 15.3 Privacy Compliance & DPDP Readiness (Q61)
- Strict duty-hours privacy cutoff, zero off-duty data storage, and employee personal data export / right to be forgotten workflows.

---

## 16. Pilot Strategy & Multi-Industry Scope

### 16.1 Pilot Strategy (Q35, Q62)
- Controlled multi-industry field pilot across HVAC, facilities management, electrical, and cleaning SMBs (10–200 employees) validating offline reliability and battery performance (< 3%/hr).

---

## 17. Governance, Stitch QA & Phased Authorization Gates

### 17.1 Governance Gates (Q36, Q37, Q63)
- Phase 0 baseline audit and reconciliation approved by Product Owner prior to design or coding.

### 17.2 Stitch Design QA (Q31, Q39, Q40, Q64)
- **Approved Stitch Design Sequence (Q39):** Design System → Company Owner/Admin Web Dashboard → Unified Flutter Mobile App → Platform Super Admin → Design QA / Handoff.
- **5-Stage Screen Lifecycle (Q40):** Inventory Documented → Screen-Level Contracts → Google Stitch Designs → Design QA → Owner Approval.
- Complete high-fidelity Google Stitch design baseline covering all 104 screens approved prior to Antigravity feature coding.

### 17.3 Requirements Freeze (Q37, Q65)
- Strict zero scope creep. The 65-decision requirements baseline is frozen as the controlling specification. Phased execution proceeds only upon explicit owner authorization.
