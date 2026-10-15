# Oprino Phase 01A Technical Architecture Freeze Checklist (Reconciled)

**Phase:** Phase 01A — Technical Architecture Research, Technology Selection & ADR Freeze  
**Date:** October 2026 (Reconciled)  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md))\
**Architectural Baseline:** [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](./OPRINO-TECHNICAL-ARCHITECTURE.md)\
**Current Governance State:** **READY FOR STAKEHOLDER TECHNICAL ARCHITECTURE APPROVAL**  
**Stakeholder Technical Architecture Approval:** **PENDING**  
**Implementation Permission:** **NOT YET GRANTED**

---

## 1. Absolute Prohibition Verification

During Phase 01A, strict prohibitions against premature implementation were maintained:

- [x] **No Monorepo Scaffolding:** No application directories, frameworks, or build configurations were scaffolded.
- [x] **No Application Packages Installed:** No `npm install`, `pnpm add`, or dependencies added to the workspace.
- [x] **No Production Source Code:** No application components, screens, controllers, or business logic were written.
- [x] **No Database Migrations or Schemas Applied:** No live PostgreSQL/Supabase tables, migrations, or DDL scripts executed.
- [x] **No Backend APIs Implemented:** No live routes or controllers were coded.
- [x] **No Infrastructure Configured or Deployed:** No cloud resources, VPCs, or servers provisioned.
- [x] **No Authentication / RBAC Coded:** Architectural designs only; zero production authorization code deployed.
- [x] **No Background Location Tracking Code:** Zero native tracking modules implemented.
- [x] **Zero Product Scope Reinterpretation:** Technology decisions adapted strictly to the frozen Phase 00 PRD; product requirements were never modified to fit technology shortcuts.

---

## 2. Critical Architecture Reconciliation Checklist

- [x] **Runtime Baseline Selection Policy:**
  - Pinned Active-LTS version-selection policy recorded: *"Pin current approved LTS at Phase 01C scaffolding and keep it within supported lifecycle."* ([`ADR-003`](./ADR-003-backend-platform.md)).
- [x] **PostgreSQL & PostGIS Engine Evaluation:**
  - Preferred greenfield baseline: PostgreSQL 18 with current stable PostGIS 3.6.x GA (PG17 fallback permitted only for documented hosting limitations; PG19 beta/RC strictly prohibited) ([`ADR-004`](./ADR-004-database-geospatial.md)).
- [x] **Durable Domain Events & Outbox Pattern:**
  - Transactional Outbox pattern implemented in PostgreSQL (`outbox_events`). Redis Pub/Sub scoped strictly to ephemeral real-time fan-out ([`ADR-015`](./ADR-015-domain-events.md)).
- [x] **Domain SQLite vs. Geolocation SDK Persistence Separation:**
  - Drift + SQLite (`drift` with `package:sqlite3` / Bundled Native SQLite) strictly handles application domain entities (tasks, punches, visits, checklists, outbox mutations). Transistor SDK (`flutter_background_geolocation`) handles continuous location telemetry via its internal native SQLite queue ([`ADR-008`](./ADR-008-background-location.md), [`ADR-009`](./ADR-009-offline-sync.md)).
- [x] **Measurable SLO Targets & Device Validation Matrix:**
  - Replaced ungrounded guarantees with testable SLOs: battery drain (< 0.5%/hr stationary, < 1.5–2.5%/hr active), live-map delivery latency (< 2–3s p95). Device validation matrix covers Samsung, Xiaomi, Oppo, Vivo, Pixel, and iPhone ([`ADR-008`](./ADR-008-background-location.md), [`LOCATION-PIPELINE.md`](./LOCATION-PIPELINE.md)).
- [x] **Duty-Hours Privacy Enforcement Boundaries:**
  - 3-Boundary control: Acquisition control (explicit punch-out immediate stop + safe local deadline safety mechanism), Local persistence control (native queue post-duty purge), and Server ingestion control (zero-trust active shift check). Phase 01B spike defined to validate BOTH Android aggressive OEM/Doze and iOS suspended scheduler behavior ([`PRIVACY-ARCHITECTURE.md`](./PRIVACY-ARCHITECTURE.md), [`ADR-008`](./ADR-008-background-location.md)).
- [x] **Multi-Tier Telemetry Retention & Least-Privileged Maintenance:**
  - Comprehensive deletion across primary tables, replicas, backups/PITR (35-day rolling), exports, and logs. Derived mileage governed by a separate 3-year policy. Application workers restricted to security-definer procedure `telemetry.prune_expired_partitions()` with zero direct DDL permissions ([`RETENTION-ARCHITECTURE.md`](./RETENTION-ARCHITECTURE.md)).
- [x] **Zero-Trust Multi-Tenancy & Pooled Connection Safety:**
  - 5-Stage verification pipeline: Authenticated Identity -> Membership Check -> Active Context -> Transaction-Scoped `SET LOCAL app.current_workspace_id` -> RLS Enforcement. Automated negative isolation test suite defined ([`ADR-005`](./ADR-005-multitenancy.md), [`SECURITY-ARCHITECTURE.md`](./SECURITY-ARCHITECTURE.md)).
- [x] **Reopened ADR-006 Authentication:**
  - Selected Application-Owned Audited Framework (Better Auth) with PostgreSQL persistence and Redis session cache. Native session management via Web cookies and Flutter Dio / `flutter_secure_storage`; layered device governance without custom crypto primitives ([`ADR-006`](./ADR-006-authentication.md)).
- [x] **Parameterized Infrastructure Cost Model:**
  - Complete line-item accounting across 5 scale profiles (10, 50, 200, 500, 2,500 active employees), separating fixed platform baseline from variable usage costs. Perpetual Transistor SDK license decoupled from monthly per-user cloud hosting costs ($15.89 down to $0.403/user/mo) ([`INFRA-COST-MODEL.md`](./INFRA-COST-MODEL.md)).
- [x] **Realistic Maps Architecture & Cost Boundaries:**
  - Separated mobile SDK rendering ($0), web vector tile infrastructure (MapTiler/PMTiles ~$25/mo), geocoding with database caching, and OS deep-link turn-by-turn navigation ($0) ([`ADR-011`](./ADR-011-maps-geospatial-provider.md)).
- [x] **Scope Drift Removal:**
  - Eradicated non-baseline scope drift (invoices, payroll compliance, billing compliance, customer SMS alerts) across all specifications. Preserved employee on-glass customer signatures ([`OPRINO-TECHNICAL-ARCHITECTURE.md`](./OPRINO-TECHNICAL-ARCHITECTURE.md)).
- [x] **Managed Redis HA Topology:**
  - Pinned single managed Redis instance with primary/replica high-availability and persistence (AOF/RDB), rejecting distributed Redis Cluster complexity for initial SMB scale ([`ADR-003`](./ADR-003-backend-platform.md), [`ADR-014`](./ADR-014-background-jobs.md)).
- [x] **Accurate Audit Log Terminology:**
  - Redefined as "Append-Only for Application Roles". Documented privileged break-glass procedures, infrastructure administration boundaries, and backup retention ([`AUDIT-LOG-ARCHITECTURE.md`](./AUDIT-LOG-ARCHITECTURE.md)).
- [x] **New ADR-020 Mobile Packaging Strategy:**
  - Authored ADR-020 comparing unified role-aware application vs. separate store binaries; recommended One Unified Role-Aware App ("Oprino") accommodating SMB working foremen and supervisors ([`ADR-020`](./ADR-020-mobile-packaging.md)).
- [x] **Mobile Framework Pivot to Flutter (Stakeholder Directive):**
  - Superseded React Native with Flutter Stable (Ref Baseline: Flutter 3.47 / Stable Dart) across 14 technical dimensions ([`ADR-001`](./ADR-001-mobile-framework.md)).
  - Re-evaluated offline persistence and approved Drift + SQLite (`drift` with `package:sqlite3` / Bundled Native SQLite) ([`ADR-009`](./ADR-009-offline-sync.md)).
  - Upgraded background location to Transistor Software `flutter_background_geolocation` ([`ADR-008`](./ADR-008-background-location.md)).
  - Established OpenAPI 3.1 as the formal cross-language contract boundary, compiling strongly-typed Dart clients via `openapi-generator-cli dart-dio` ([`CONTRACT-STRATEGY.md`](./CONTRACT-STRATEGY.md), [`ADR-018`](./ADR-018-api-style.md)).
  - Restructured repository layout to a polyglot monorepo (Turborepo/pnpm for TS, standalone pub for Flutter/Dart) ([`ADR-017`](./ADR-017-monorepo.md)).
  - Defined 5 new Phase 01B spikes validating Flutter location, Drift sync, Better Auth REST, OpenAPI Dart generation, and secure storage lifecycle.

---

## 3. Deliverables Inventory Verification (20 ADRs + 14 System Specs)

### Architecture Decision Records (20 of 20 Complete)
- [x] [`ADR-001: Mobile Application Framework Selection`](./ADR-001-mobile-framework.md)
- [x] [`ADR-002: Web Application Framework & Dashboard Stack`](./ADR-002-web-stack.md)
- [x] [`ADR-003: Backend Platform, Runtime & Service Architecture`](./ADR-003-backend-platform.md)
- [x] [`ADR-004: Database Engine, Geospatial Architecture & Version Selection`](./ADR-004-database-geospatial.md)
- [x] [`ADR-005: Multi-Tenancy Architecture, Isolation Flow & Pooled RLS`](./ADR-005-multitenancy.md)
- [x] [`ADR-006: Authentication, Session Management & Multi-Company Tenancy`](./ADR-006-authentication.md)
- [x] [`ADR-007: Authorization Model & Role-Based Access Control`](./ADR-007-authorization.md)
- [x] [`ADR-008: Mobile Background Location & Duty-Hours Tracking Architecture`](./ADR-008-background-location.md)
- [x] [`ADR-009: Offline-First Mobile Storage & Synchronization Architecture`](./ADR-009-offline-sync.md)
- [x] [`ADR-010: Realtime Operational Visibility Architecture`](./ADR-010-realtime.md)
- [x] [`ADR-011: Maps & Geospatial Services Architecture & Cost Model`](./ADR-011-maps-geospatial-provider.md)
- [x] [`ADR-012: File Storage, Proof-of-Work Media & Watermarking Pipeline`](./ADR-012-file-storage.md)
- [x] [`ADR-013: Push Notification, In-App Alerting & Messaging Architecture`](./ADR-013-notifications.md)
- [x] [`ADR-014: Background Job Processing, Schedulers & Workflows`](./ADR-014-background-jobs.md)
- [x] [`ADR-015: Durable Domain Events & Transactional Outbox Architecture`](./ADR-015-domain-events.md)
- [x] [`ADR-016: Observability, Structured Logging, Metrics & Error Tracking`](./ADR-016-observability.md)
- [x] [`ADR-017: Monorepo Architecture, Package Layout & Build Tooling`](./ADR-017-monorepo.md)
- [x] [`ADR-018: API Architecture, Protocol Selection, Contracts & Error Handling`](./ADR-018-api-style.md)
- [x] [`ADR-019: Operational Reporting, Data Aggregation & Export Architecture`](./ADR-019-reporting.md)
- [x] [`ADR-020: Mobile Application Packaging Strategy (Unified vs. Separate)`](./ADR-020-mobile-packaging.md)
- [x] [`docs/architecture/ADR/README.md`](./ADR/README.md) (Canonical ADR Register Index)

### System Architecture & Technical Specifications (14 of 14 Complete)
- [x] [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](./OPRINO-TECHNICAL-ARCHITECTURE.md) (Master C4 Architecture)
- [x] [`docs/architecture/TECHNOLOGY-DECISION-MATRIX.md`](./TECHNOLOGY-DECISION-MATRIX.md) (20-Decision Matrix)
- [x] [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](./SYNC-CONFLICT-MATRIX.md) (Offline Conflict Resolution Rules)
- [x] [`docs/architecture/LOCATION-PIPELINE.md`](./LOCATION-PIPELINE.md) (End-to-End Tracking Pipeline)
- [x] [`docs/architecture/PRIVACY-ARCHITECTURE.md`](./PRIVACY-ARCHITECTURE.md) (3-Boundary Privacy Controls)
- [x] [`docs/architecture/SECURITY-ARCHITECTURE.md`](./SECURITY-ARCHITECTURE.md) (Defense-in-Depth Specification)
- [x] [`docs/architecture/THREAT-MODEL.md`](./THREAT-MODEL.md) (STRIDE Threat Model & Mitigations)
- [x] [`docs/architecture/AUDIT-LOG-ARCHITECTURE.md`](./AUDIT-LOG-ARCHITECTURE.md) (Append-Only Audit Logging)
- [x] [`docs/architecture/TESTING-STRATEGY.md`](./TESTING-STRATEGY.md) (Quality Assurance Framework)
- [x] [`docs/architecture/ENVIRONMENT-STRATEGY.md`](./ENVIRONMENT-STRATEGY.md) (4-Tier Environment Topology)
- [x] [`docs/architecture/CONTRACT-STRATEGY.md`](./CONTRACT-STRATEGY.md) (Single Source of Truth Contracts)
- [x] [`docs/architecture/RETENTION-ARCHITECTURE.md`](./RETENTION-ARCHITECTURE.md) (Multi-Tier Data Lifecycle & Purge)
- [x] [`docs/architecture/INFRA-COST-MODEL.md`](./INFRA-COST-MODEL.md) (Parameterized Unit Economics)
- [x] [`docs/architecture/FAILURE-MODES.md`](./FAILURE-MODES.md) (Field Failure Modes & Recovery Runbooks)
- [x] [`docs/architecture/TECHNICAL-RISK-REGISTER.md`](./TECHNICAL-RISK-REGISTER.md) (Prioritized Technical Risks)

---

## 4. Final Governance Status

```
================================================================================
Phase 01A Status: READY FOR STAKEHOLDER TECHNICAL ARCHITECTURE APPROVAL
Stakeholder Technical Architecture Approval: PENDING
Implementation Permission: NOT YET GRANTED
Do NOT begin Phase 01B until approved by stakeholder.
================================================================================
```
