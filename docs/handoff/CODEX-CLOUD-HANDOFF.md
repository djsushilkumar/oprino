# Oprino — Codex Cloud Handoff Specification

**Project:** Oprino  
**Category:** Multi-Industry Task Management + Workforce Management + Field Operations SaaS for SMBs  
**Target Market:** SMBs with 5–500 employees (optimized primarily for 10–200 employees)  
**Date of Handoff:** October 15, 2026\
**Repository State:** V1 release candidate stabilized; commercial launch gated

---

## 1. Current Project Governance & Status

- **Phase 00 (Product Planning, Scoping & Brand Freeze):** **APPROVED & FROZEN** by stakeholder sign-off.
- **Phase 01A (Technical Architecture Research & ADR Freeze):** **APPROVED & FROZEN**.
- **Phase 01B (Technical Validation Spikes):** **CONDITIONALLY CLOSED** (Physical OEM mobile validation formally deferred to mobile release gate).
- **Pre-Phase-01C Repository Cleanup:** **COMPLETED**.
- **Phase 01C (Production Monorepo Scaffolding):** **COMPLETED & VERIFIED** ([`docs/architecture/PHASE-01C-SCAFFOLDING-REPORT.md`](../architecture/PHASE-01C-SCAFFOLDING-REPORT.md)).
- **Phase 02A (Identity, Workspace & Multi-Tenant Foundation):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-02A-IDENTITY-TENANCY-REPORT.md`](../implementation/PHASE-02A-IDENTITY-TENANCY-REPORT.md)).
- **Phase 02B (Task & Attendance Domain Implementation):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-02B-TASK-ATTENDANCE-REPORT.md`](../implementation/PHASE-02B-TASK-ATTENDANCE-REPORT.md)).
- **Phase 02C (GPS Location Pipeline, Geofencing & Tracking Engine):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-02C-LOCATION-PIPELINE-REPORT.md`](../implementation/PHASE-02C-LOCATION-PIPELINE-REPORT.md)).
- **Phase 03 (Field Operations, Customer Sites, Visits & Proof of Work):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-03-FIELD-OPERATIONS-REPORT.md`](../implementation/PHASE-03-FIELD-OPERATIONS-REPORT.md)).
- **Phase 04 (Advanced Scheduling, Dispatch Routing & Analytics):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-04-ADVANCED-OPERATIONS-REPORT.md`](../implementation/PHASE-04-ADVANCED-OPERATIONS-REPORT.md)).
- **Phase 05 (Production Hardening, Monitoring & Launch Readiness):** **COMPLETED & VERIFIED** ([`docs/implementation/PHASE-05-PRODUCTION-HARDENING-REPORT.md`](../implementation/PHASE-05-PRODUCTION-HARDENING-REPORT.md)).
- **Current Milestone State:** **V1 RELEASE CANDIDATE STABILIZED — COMMERCIAL LAUNCH GATED**. Earlier phase completion reports are historical evidence, not launch approval. The [October 15 launch checklist](../releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md) and [release candidate report](../releases/V1-RELEASE-CANDIDATE-REPORT.md) record the outstanding gates: production S3/R2 credentials, Android release signing, physical background GPS validation, and owner acceptance.
- **Latest local project check (`d35b8f3`, October 15):** Lint, typecheck, and builds passed across 18 tasks (13 cached); API 182 passed / 4 live R2 tests skipped; web 7 passed; worker 2 passed; Flutter analysis clean and 60 tests passed. These results do not establish live deployment or physical-device readiness.

---

## 2. Controlling Authorities

### Primary Product Authority:

The single, authoritative source of truth for all product requirements, feature classifications, business rules, and non-goals is:

- [`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md)

### Primary Technical Architecture Authority:

The system architecture, component topologies, and physical designs are governed by:

- [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](../architecture/OPRINO-TECHNICAL-ARCHITECTURE.md)
- [`docs/architecture/ADR/README.md`](../architecture/ADR/README.md) (Register of ADR-001 through ADR-021)
- [`docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md`](../architecture/PHASE-01A-FREEZE-CHECKLIST.md)

---

## 3. Mandatory Supporting Documents for Codex & Agents

Before modifying code or configuration, Codex and all coding agents **MUST** read and understand:

### A. Product Baseline & Boundaries

1. [`docs/product/V1-SCOPE.md`](../product/V1-SCOPE.md) — Strict classification of MUST, SHOULD, LATER, and OUT-OF-SCOPE features for V1.
2. [`docs/product/PRODUCT-DEFINITION.md`](../product/PRODUCT-DEFINITION.md) — Core principles, target multi-industry SMB market, and explicit non-goals.
3. [`docs/product/APP-SURFACES.md`](../product/APP-SURFACES.md) — Surfaces: Unified Mobile App (Field & Manager modes) and Web Dashboard.
4. [`docs/product/ROLES-AND-PERMISSIONS-PLAN.md`](../product/ROLES-AND-PERMISSIONS-PLAN.md) — Default and custom RBAC permissions model.

### B. Core Architecture & Invariant Specifications

5. [`docs/architecture/PRIVACY-ARCHITECTURE.md`](../architecture/PRIVACY-ARCHITECTURE.md) — 3-boundary duty-hours controls, safe local deadline strategy, and off-duty privacy enforcement.
6. [`docs/architecture/RETENTION-ARCHITECTURE.md`](../architecture/RETENTION-ARCHITECTURE.md) — 30-day default location retention, multi-tier deletion lifecycle, and least-privileged maintenance procedure.
7. [`docs/architecture/LOCATION-PIPELINE.md`](../architecture/LOCATION-PIPELINE.md) — Pipeline requirements, measurable SLO targets, and device validation matrix. Read with [ADR-021](../architecture/ADR-021-zero-cost-gps-pipeline.md), which supersedes the Transistorsoft dependency for development and pilot operations with geolocator and a durable Drift queue.
8. [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](../architecture/SYNC-CONFLICT-MATRIX.md) — Offline-first conflict resolution rules for all entities.
9. [`docs/architecture/SECURITY-ARCHITECTURE.md`](../architecture/SECURITY-ARCHITECTURE.md) — 5-tier defense-in-depth model, 5-stage tenant verification, and transaction-scoped `SET LOCAL` RLS.
10. [`docs/architecture/CONTRACT-STRATEGY.md`](../architecture/CONTRACT-STRATEGY.md) — Single source of truth `@oprino/contracts` schema strategy.
11. [`docs/architecture/INFRA-COST-MODEL.md`](../architecture/INFRA-COST-MODEL.md) — Parameterized SMB infrastructure economics and margin targets.

### C. Authoritative Brand System

12. [`docs/brand/OPRINO-BRAND-SYSTEM.md`](../brand/OPRINO-BRAND-SYSTEM.md) — Canonical logo variations, color tokens, typography scales, and spacing units derived from `Oprino-Brand-Kit/`.

---

## 4. Invariant Rules for Autonomous & Assisted Development

1. **Frozen Baseline Immutability:** Phase 00 product requirements cannot be silently changed or reinterpreted. Technology must adapt to product requirements, never vice-versa.
2. **ADR Governance:** Consult ADR-001 through ADR-021 and honor explicit superseding decisions. Any material change to database technology, frameworks, protocols, or storage patterns requires an explicit new or superseding ADR.
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

## 5. Historical Milestones & Current Release Gate

The milestones below retain the verification recorded at each phase. Older SDK choices, cloud health probes, APK builds, and test totals are historical; they do not replace the current release gates in section 1 or the October 15 launch checklist.

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
5. **Phase 02A (Identity, Workspace & Multi-Tenant Foundation):** **COMPLETED & VERIFIED**.
   - Production PostgreSQL RLS with transaction-scoped tenant isolation.
   - Better Auth authentication for Web and Mobile (Bearer plugin).
   - Atomic workspace creation, membership lifecycle, and default RBAC templates.
   - Pure random UUIDv4 device/installation governance with immediate server revocation.
   - Web owner onboarding & authenticated dashboard shell (Next.js 15).
   - Flutter authenticated app shell with GoRouter redirects and revocation wipe.
   - Full quality gates passed: TypeScript, ESLint, Prettier, PostgreSQL RLS tests, API tests, Flutter analyze/test, and debug APK build.
6. **Phase 02B (Task & Attendance Domain Implementation):** **COMPLETED & VERIFIED**.
   - PostgreSQL RLS tenant isolation across tasks, task assignees, checklist items, attendance shifts, sessions, and punch events.
   - Optimistic concurrency control for task transitions with integer version check (HTTP 409 Conflict).
   - Overnight shift support with configurable grace periods and cross-midnight handling.
   - Idempotent punch in/out with authoritative server-calculated durations and duplicate replay deduplication.
   - Offline-first Flutter mobile client with Drift SQLite outbox mutation queue and reactive Streams.
   - Next.js 15 Web operational management pages for Tasks and Attendance with real-time status visibility.
   - Full quality gates passed: TypeScript, ESLint, API integration tests (45/45), Flutter analyze (0 err), Flutter tests (14/14), Dart API tests (8/8), and Next.js production build.
7. **Phase 02C (GPS Location Pipeline, Geofencing & Tracking Engine):** **COMPLETED & VERIFIED**.
   - PostgreSQL RLS tenant isolation across `employee_locations`, `geofences`, and `daily_travel_summaries` with PostGIS point support.
   - Strict Duty-Hours-Only Tracking Invariant enforced at mobile client and API ingestion boundary (off-duty points hard-dropped with zero DB writes).
   - Peer location visibility strictly OFF by default (`location.read` restricted to managers/owners).
   - Ingestion quality gates (`accuracy <= 50m`, `speed <= 45m/s` anomaly drop) with Haversine distance rollup.
   - Real-time Redis Pub/Sub broadcast and Server-Sent Events (`/v1/telemetry/stream`).
   - 30-day retention pruning via `telemetry_prune_expired_records(days)` and BullMQ worker job `telemetry.retention.prune`.
   - Web Live Radar Map (`/live-map`) with SVG coordinate space, SSE live streaming, worker inspector, and route scrubber.
   - Mobile `LocationService` with reactive Riverpod providers, synchronous unhook on punch out, and Attendance View status card.
   - Full quality gates passed: TypeScript, ESLint, API integration tests (57/57), Flutter analyze (0 err), Flutter tests (18/18), Dart API tests (10/10), and Next.js production build.
8. **Phase 03 (Field Operations, Customer Sites, Visits & Proof of Work):** **COMPLETED & VERIFIED**.
   - PostgreSQL RLS tenant isolation across `customers`, `customer_sites`, `visits`, and `task_proofs`.
   - Separation of Tasks vs Physical Site Visits (0, 1, or multiple visits per task).
   - Mandatory Checklist Item Completion invariant strictly enforced before task can transition to `COMPLETED`.
   - Proof of Work Engine with geotagged watermarked photos, on-glass customer signatures, and supervisor verification queue (`VERIFIED` / `REJECTED`).
   - ADR-012 Pre-signed direct S3/R2 upload architecture with tenant prefix key validation (`/${workspace_id}/proofs/...`).
   - Offline-first Drift SQLite mobile schema (v3) with outbox queuing and optimistic local state.
   - Next.js 15 Web management pages for Customers, Visits, and Tasks verification.
   - Mobile `CustomerSignatureSheet` (raw pointer Listener stroke tracking) and `PhotoProofSheet` (geotagged live GPS watermarking).
   - Full quality gates passed: TypeScript, ESLint, API integration tests (69/69), Flutter analyze (0 err), Flutter tests (22/22), Dart API tests (11/11), and Next.js production build.
9. **Phase 04 (Advanced Scheduling, Dispatch Routing, Conflict Resilience & Analytics):** **COMPLETED & VERIFIED**.
   - PostgreSQL RLS tenant isolation across `recurring_task_templates`, `shift_rosters`, `sync_mutation_records`, `notifications`, and route sequencing on `visits`.
   - Comprehensive Offline-First Sync Engine executing [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](../architecture/SYNC-CONFLICT-MATRIX.md) with idempotency deduplication, punch-out hardware override, managerial cancellation precedence, and checklist union merging.
   - Dispatch Stop Sequencing with `PUT /v1/visits/sequence` and interactive web/mobile route reordering controls.
   - Recurring Task Templates with cron evaluation and BullMQ worker job `tasks.recurring.generate`.
   - Shift Roster Assignment with roster calendar view and BullMQ worker job `tasks.sla.check_overdue`.
   - Operational Analytics & Reporting (`/v1/reports/attendance`, `/v1/reports/tasks`, `/v1/reports/visits`, streaming CSV export, and CSV bulk customer/site import).
   - In-App Notification Center with dropdown badge drawer, real-time unread counts, and priority dispatch alerts.
   - Offline Drift SQLite schema v4 on mobile with batch sync flushing and stop sequence badges.
   - Full quality gates passed: TypeScript monorepo typecheck (8/8 pkgs, 9 tasks), Phase 04 unit & contract tests (10/10), and Next.js 15 production build (14 static pages).
10. **Phase 05 (Production Hardening, Monitoring, Security Orchestration & Launch Readiness):** **COMPLETED & VERIFIED**.
    - Defense-in-depth security: `@fastify/helmet` strict HSTS/CSP headers, multi-tier `@fastify/rate-limit` (tenant/user/IP keyed with 10 req/min auth limit).
    - Deep observability & monitoring: Prometheus exporter (`/metrics` with `oprino_http_requests_total` and latency histograms), deep readiness `/health/ready` (PostgreSQL query & Redis ping probe with 503 fallback), and lightweight liveness `/health/live`.
    - Zero-downtime execution & graceful shutdown: Signal handling (`SIGTERM`/`SIGINT`) for API and BullMQ worker with connection pool draining and hard watchdog timers.
    - Physical OEM Android build scripting: Keystore signing template (`key.properties.example`), R8/ProGuard native reflection rules for Drift SQLite and Transistor Geolocation, and automated build scripts (`build-release-apk.ps1`/`build-release-apk.sh`).
    - Full quality gates passed: TypeScript monorepo typecheck (8/8 pkgs, 9 tasks), Phase 05 unit & security tests (9/9), full API test suite (23/23 tests pass), and Next.js 15 production build (14 static pages).
11. **Historical Phase 05 Assessment:** Core implementation was reported ready for deployment and pilot evaluation at that milestone. Commercial launch remains subject to the current release checklist.
12. **Physical Device Installation & End-to-End Smoke Test:** **COMPLETED & VERIFIED (OCTOBER 2026)**.
    - Production Release APK (`57.0 MB`, with R8 code shrinking and icon tree shaking) built and installed via ADB onto physical Android hardware.
    - Automated end-to-end smoke test (`scripts/smoke_test.mjs`) verified 100% across all 10 domain flows:
      - PostgreSQL 17 (PostGIS) & Redis 7 health probes.
      - Tenant workspace isolation (`Oprino Field Ops Demo`).
      - Attendance duty lifecycle (`ON_DUTY` / `OFF_DUTY` duty-hours privacy boundaries).
      - Dispatch route stop sequencing and geofenced physical site visit GPS check-in/check-out.
      - Task state transitions, mandatory checklist items enforcement, and watermarked proof of work (photo + on-glass digital signature).
      - Supervisor verification queue approval workflow.
      - Next.js Web Dashboard routes (`/auth/signin`, `/tasks`, `/visits`, `/reports`) verified operational.
    - Repository working tree clean; local dev services running and ready for pilot exploration.
13. **Cloud Deployment Blueprint & CI/CD Pipelines:** **COMPLETED & VERIFIED (OCTOBER 2026)**.
    - Automated GitHub Actions CI/CD pipelines (`.github/workflows/ci.yml` & `.github/workflows/mobile-release.yml`) verified **100% GREEN**:
      - `Oprino Mobile Release APK Build`: PASSED (signed release APK artifact generated).
      - `Flutter Analyze, Test & Android Baseline`: PASSED.
      - `Lint, Typecheck, Test & Build (TypeScript)`: PASSED (Turbo build + all 88 integration tests against live PostGIS 17 & Redis 7 service containers).
      - `Full End-to-End Smoke Test`: PASSED (self-bootstrapping tenant creation, attendance punch lifecycle, visit routing, checklists, proof upload, and Next.js routes).
    - Production multi-stage Docker containerization (`Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.web`).
    - 100% Free Cloud Deployment specifications (`render.yaml`, `apps/web/vercel.json`, and [`docs/deployment/FREE-CLOUD-DEPLOYMENT-GUIDE.md`](../deployment/FREE-CLOUD-DEPLOYMENT-GUIDE.md)) across Supabase (PostgreSQL 17 + PostGIS), Upstash (Redis), Render (Fastify API & Worker), and Vercel (Next.js 15 Web Dashboard).
14. **Cloud Deployment Execution & Free-Tier Optimization:** **COMPLETED & VERIFIED (OCTOBER 11, 2026)**.
    - **Vercel Web Dashboard:** Deployed live to Vercel CDN from `apps/web` with automatic Git push CI/CD.
    - **Render Free-Tier Re-architecture:**
      - Resolved Render free-tier limitation (`type: worker` unavailable on free plan) by bundling the BullMQ system worker into the single free `oprino-api` web container via `Dockerfile.api`.
      - Fixed invalid `tsconfig.base.json` references across `Dockerfile.api`, `Dockerfile.worker`, and `Dockerfile.web`.
      - Tested multi-stage Docker build locally to 100% completion (`oprino-api-test:latest`).
      - Pushed commit `b0c86ec` to `main`; Render Blueprint manual sync succeeded with all-green status.
      - Render Web Service `oprino-api` successfully deployed (`✔ Deployed`) in Oregon region.
    - **Comprehensive Test Suite Re-verification:**
      - End-to-End Smoke Test: 10/10 domain flows PASSED.
      - Fastify API Integration & Security Tests: 88/88 PASSED (0 failures, duration 66s).
      - Flutter Mobile Client Tests: 22/22 PASSED (0 failures).
      - Next.js Web Dashboard Tests: 7/7 PASSED (0 failures).
      - Automated Browser Agent: UI layout, typography, navigation, and `/attendance` dev hot-reload verified.
15. **Cloud Infrastructure Wiring (Neon + Upstash + Render):** **COMPLETED & VERIFIED (OCTOBER 12, 2026)**.
    - **Neon PostgreSQL (PostGIS):** 100% free serverless database provisioned; all Drizzle schema migrations applied (29 public tables created).
    - **Upstash Serverless Redis:** 100% free TLS Redis provisioned and verified (`PONG` response).
    - **Render Fastify API (`oprino-api`):** Configured with cloud connection strings in Oregon region; readiness probe `/health/ready` returns `HTTP 200 OK` with `database: connected` and `redis: connected`.
    - **Live Cloud E2E Smoke Test:** Automated smoke test (`scripts/smoke_test.mjs`) executed against `https://oprino-api.onrender.com` passing 100% of domain flows (bootstrap tenant, duty punch in/out, visits GPS routing, checklists, watermarked photo and signature proof of work, and supervisor verification).
16. **Current Status & Active Gate (October 15):** **COMMERCIAL LAUNCH GATED**.
    - The release report records earlier successful probes of the Render API and Vercel dashboard. Those probes do not verify deployment of the current candidate.
    - Configure and verify real production S3/R2 storage, complete Android release signing, conduct a physical background GPS field trial, and obtain owner acceptance before commercial release.
    - Use the [release candidate report](../releases/V1-RELEASE-CANDIDATE-REPORT.md) and [launch checklist](../releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md) for rollout prerequisites. Cloud health and physical-device behavior were not rechecked during the latest local project check.




