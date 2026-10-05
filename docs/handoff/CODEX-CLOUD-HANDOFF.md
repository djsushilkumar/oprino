# Oprino — Codex Cloud Handoff Specification

**Project:** Oprino  
**Category:** Multi-Industry Task Management + Workforce Management + Field Operations SaaS for SMBs  
**Target Market:** SMBs with 5–500 employees (optimized primarily for 10–200 employees)  
**Date of Handoff:** October 2026  
**Repository State:** Baseline Planning & Reconciled Technical Architecture

---

## 1. Current Project Governance & Status

- **Phase 00 (Product Planning, Scoping & Brand Freeze):** **APPROVED & FROZEN** by stakeholder sign-off.
- **Phase 01A (Technical Architecture Research & ADR Freeze):** **APPROVED & FROZEN**.
- **Phase 01B (Technical Validation Spikes):** **CONDITIONALLY CLOSED** (Physical OEM mobile validation formally deferred to mobile release gate).
- **Pre-Phase-01C Repository Cleanup:** **COMPLETED**.
- **Phase 01C (Production Monorepo Scaffolding):** **COMPLETED & VERIFIED** ([`docs/architecture/PHASE-01C-SCAFFOLDING-REPORT.md`](file:///workspace/oprino/docs/architecture/PHASE-01C-SCAFFOLDING-REPORT.md)).
- **Next Milestone Gate:** **READY FOR CORE V1 IMPLEMENTATION** (Awaiting explicit stakeholder authorization).

---

## 2. Controlling Authorities

### Primary Product Authority:

The single, authoritative source of truth for all product requirements, feature classifications, business rules, and non-goals is:

- [`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md)

### Primary Technical Architecture Authority:

The system architecture, component topologies, and physical designs are governed by:

- [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md)
- [`docs/architecture/ADR/README.md`](file:///workspace/oprino/docs/architecture/ADR/README.md) (Register of ADR-001 through ADR-020)
- [`docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md`](file:///workspace/oprino/docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md)

---

## 3. Mandatory Supporting Documents for Codex & Agents

Before modifying code or configuration, Codex and all coding agents **MUST** read and understand:

### A. Product Baseline & Boundaries

1. [`docs/product/V1-SCOPE.md`](file:///workspace/oprino/docs/product/V1-SCOPE.md) — Strict classification of MUST, SHOULD, LATER, and OUT-OF-SCOPE features for V1.
2. [`docs/product/PRODUCT-DEFINITION.md`](file:///workspace/oprino/docs/product/PRODUCT-DEFINITION.md) — Core principles, target multi-industry SMB market, and explicit non-goals.
3. [`docs/product/APP-SURFACES.md`](file:///workspace/oprino/docs/product/APP-SURFACES.md) — Surfaces: Unified Mobile App (Field & Manager modes) and Web Dashboard.
4. [`docs/product/ROLES-AND-PERMISSIONS-PLAN.md`](file:///workspace/oprino/docs/product/ROLES-AND-PERMISSIONS-PLAN.md) — Default and custom RBAC permissions model.

### B. Core Architecture & Invariant Specifications

5. [`docs/architecture/PRIVACY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/PRIVACY-ARCHITECTURE.md) — 3-boundary duty-hours controls, safe local deadline strategy, and off-duty privacy enforcement.
6. [`docs/architecture/RETENTION-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/RETENTION-ARCHITECTURE.md) — 30-day default location retention, multi-tier deletion lifecycle, and least-privileged maintenance procedure.
7. [`docs/architecture/LOCATION-PIPELINE.md`](file:///workspace/oprino/docs/architecture/LOCATION-PIPELINE.md) — Separation of domain SQLite vs. Transistor SDK native persistence; measurable SLO targets; device validation matrix.
8. [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](file:///workspace/oprino/docs/architecture/SYNC-CONFLICT-MATRIX.md) — Offline-first conflict resolution rules for all entities.
9. [`docs/architecture/SECURITY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/SECURITY-ARCHITECTURE.md) — 5-tier defense-in-depth model, 5-stage tenant verification, and transaction-scoped `SET LOCAL` RLS.
10. [`docs/architecture/CONTRACT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/CONTRACT-STRATEGY.md) — Single source of truth `@oprino/contracts` schema strategy.
11. [`docs/architecture/INFRA-COST-MODEL.md`](file:///workspace/oprino/docs/architecture/INFRA-COST-MODEL.md) — Parameterized SMB infrastructure economics and margin targets.

### C. Authoritative Brand System

12. [`docs/brand/OPRINO-BRAND-SYSTEM.md`](file:///workspace/oprino/docs/brand/OPRINO-BRAND-SYSTEM.md) — Canonical logo variations, color tokens, typography scales, and spacing units derived from `Oprino-Brand-Kit/`.

---

## 4. Invariant Rules for Autonomous & Assisted Development

1. **Frozen Baseline Immutability:** Phase 00 product requirements cannot be silently changed or reinterpreted. Technology must adapt to product requirements, never vice-versa.
2. **ADR Governance:** All architectural decisions are frozen in ADR-001 through ADR-020. Any material change to database technology, frameworks, protocols, or storage patterns requires an explicit new or superseding ADR.
3. **Duty-Hours Privacy Invariant:** **Off-duty employee location tracking must NEVER be an intended Oprino behavior.** Tracking occurs strictly within active authorized shifts. Peer location visibility remains **OFF BY DEFAULT**.
4. **Scope Creep Prohibition:** Oprino is a task management and field workforce operational platform. Do **NOT** introduce:
   - CRM or customer pipeline management
   - Heavy warehouse inventory management
   - Statutory payroll calculation or payroll compliance engines
   - Full general accounting or invoicing/billing engines
   - Standalone customer web portals
   - Complex Gantt-chart enterprise project management
5. **Customer On-Glass Signatures:** Customer signatures on glass are an operational proof-of-work item captured directly on the field worker's physical mobile screen. They do not constitute a customer portal or require customer login credentials.
6. **Zero Plaintext Secrets:** Never commit `.env` files, credentials, private keys, or tokens. Use Doppler/Infisical or environment variables validated via Zod schemas.
7. **Connection Pool Safety:** In multi-tenant database queries, never issue session-level `SET app.current_workspace_id`. Always execute within transactions using `SET LOCAL` to eliminate cross-tenant connection pool leaks.

---

## 5. Next Intended Milestones & Next Gate

The repository has completed Phase 01C Production Monorepo Scaffolding and Stabilization:

1. **Phase 00:** **APPROVED & FROZEN**.
2. **Phase 01A (Flutter Technical Architecture):** **APPROVED & FROZEN**.
3. **Phase 01B (Spikes & Validation):** **CONDITIONALLY CLOSED** (Physical OEM testing deferred to mobile release-validation gate).
4. **Phase 01C (Production Monorepo Scaffolding & Stabilization):** **COMPLETED & VERIFIED**.
   - Turborepo / pnpm 11 workspace operational
   - Next.js 15 web app, Fastify API, BullMQ worker, PostgreSQL/PostGIS database layer
   - Unified Flutter 3.47 mobile app with Drift SQLite offline outbox
   - Canonical design token generator (Web CSS + Flutter Dart)
   - Zod -> OpenAPI 3.1 -> Dart Dio API client pipeline
   - Zero IDE diagnostic errors & zero CLI validation errors
5. **Next Gate:** **READY FOR CORE V1 IMPLEMENTATION (Phase 02)**.

> [!WARNING]
> Do NOT begin Phase 02 Core V1 feature implementation until explicit stakeholder authorization is provided.

