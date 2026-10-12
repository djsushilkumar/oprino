# Oprino SaaS Production Launch Checklist & Sign-Off Matrix

**Document:** Production Launch Checklist & Sign-Off Matrix  
**Version:** 1.0  
**Target Release:** Oprino V1 Production Commercial Launch  
**Governing Rule:** No production commercial release may proceed without explicit sign-off on all 10 release gates and pre-launch infrastructure validations.

---

## 1. Production Readiness Release Gate Verification (Gates 1–10)

| Gate # | Gate Title | Verification Standard | Current Status | Required Sign-Off Role | Evidence Document |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Gate 1** | Architecture & Requirement Coverage | 100% of V1 MUST requirements mapped and accounted for | **CONDITIONAL** | Technical Product Owner | [`V1-FEATURE-COVERAGE.md`](file:///workspace/oprino/docs/audits/V1-FEATURE-COVERAGE.md) |
| **Gate 2** | Security & Data Integrity | Zero unresolved P0/P1 security vulnerabilities | **BLOCKED (P0 Open)** | Principal Security Auditor | [`SECURITY-FINDINGS.md`](file:///workspace/oprino/docs/audits/SECURITY-FINDINGS.md) |
| **Gate 3** | V1 Functional Workflows | Core closed loop (Dispatch -> Punch -> Task -> Proof -> Verify -> Punch Out) | **VERIFIED** | QA Automation Lead | [`TEST-EVIDENCE.md`](file:///workspace/oprino/docs/audits/TEST-EVIDENCE.md) |
| **Gate 4** | Multi-Tenant Isolation | 5-stage tenant verification & PostgreSQL RLS default-deny | **VERIFIED** | Principal Architect | Negative RLS Test Suite (12/12 pass) |
| **Gate 5** | Offline Sync & Duty Privacy | Inviolable duty boundary & Drift SQLite offline outbox | **VERIFIED** | Senior Flutter Engineer | `location_service_test.dart` (11/11 pass) |
| **Gate 6** | Web & Mobile UI/UX Quality | Brand token compliance, responsive design, keyboard/touch | **VERIFIED** | UI/UX Lead | Next.js build (15 pages), Flutter analyze (0 err) |
| **Gate 7** | Automated Test Suite Green | TypeScript, ESLint, API tests, Flutter analyze & tests | **VERIFIED** | QA Automation Lead | 142/142 tests green across all repos |
| **Gate 8** | Mobile Release Packaging | Android Release APK signed, R8 reflection rules, split ABIs | **VERIFIED** | Senior Flutter Engineer | Release APK built (`60.4 MB`) |
| **Gate 9** | Infrastructure & Monitoring | Cloud health probes (`/health/ready`), Prometheus metrics | **VERIFIED** | DevOps Engineer | Live Render + Neon + Upstash probes |
| **Gate 10** | Real Field Pilot Acceptance | Controlled physical device field test with real employees | **PENDING PILOT** | Business Owner / Field Ops Lead | Phase 6 Field Pilot Protocol |

---

## 2. Pre-Launch Cloud Infrastructure Verification

| Service Tier | Provider / Specification | Health Probe / Verification Method | Operational Status | Sign-Off |
| :--- | :--- | :--- | :---: | :---: |
| **Database** | Serverless Neon PostgreSQL (PostGIS 17/3.5) | `SELECT 1 as alive;` via `/health/ready` probe (< 200ms latency) | **VERIFIED (Active)** | [ ] DevOps |
| **Cache / Queue** | Upstash Serverless Redis (TLS) | `PING` -> `PONG` response via `/health/ready` probe | **VERIFIED (Active)** | [ ] DevOps |
| **API Server** | Render Fastify Web Container (`oprino-api`) | Public endpoint `https://oprino-api.onrender.com/health/ready` (HTTP 200) | **VERIFIED (Active)** | [ ] DevOps |
| **System Worker**| BullMQ Worker (bundled in `oprino-api`) | Connection pool & cron schedulers registered cleanly | **VERIFIED (Active)** | [ ] DevOps |
| **Web Dashboard**| Vercel CDN (`apps/web`) | Next.js 15 App Router CDN deployment with Edge caching | **VERIFIED (Active)** | [ ] DevOps |
| **Cartography** | MapLibre GL JS + CartoDB Dark Matter | Zero-cost raster tile loading without API keys | **VERIFIED (Active)** | [ ] Full-Stack Lead |
| **Storage (Dev)**| Fastify Local Mock Storage (`/v1/media/mock-upload/*`)| Direct upload tested in integration tests | **VERIFIED (Active)** | [ ] Architect |
| **Storage (Prod)**| Cloudflare R2 / AWS S3 Bucket | Requires provisioned S3 credentials for production launch | **PENDING PROD KEY** | [ ] Owner |

---

## 3. Pre-Launch Security & Privacy Verification Checklist

- [x] **Zero Plaintext Secrets:** No `.env` files or API secrets committed to Git repository; all credentials validated via Zod schemas.
- [x] **Connection Pool Safety:** In multi-tenant queries, all tenant contexts set within transactions using `SET LOCAL app.current_workspace_id`.
- [x] **Stack Trace Suppression:** Production error handler active; suppress stack traces and database errors to public users.
- [x] **Rate Limiting Active:** Public auth routes enforce 10 req/min; authenticated routes capped at 300 req/min.
- [x] **Duty-Boundary Invariant Enforced:** Zero off-duty coordinates stored; background location unhooks synchronously on punch-out.
- [x] **Peer Location Visibility Off:** Default-off policy enforced; `location.read` restricted to managers/owners.
- [x] **Device Revocation Active:** Revoking an installation immediately blocks subsequent API requests.
- [ ] **SEC-01 Remediated:** Hardcoded `Welcome@123` removed from Web Team UI modal.
- [ ] **BLK-003 Remediated:** Employee Bulk CSV import implemented and tested.
- [ ] **BLK-004 Remediated:** Front-camera selfie verification connected to mobile punch-in.

---

## 4. Disaster Recovery & Rollback Strategy

### 4.1 Database Rollback Plan
- **Drizzle Migration Journal:** Managed via `packages/database/drizzle/meta/_journal.json`.
- **Pre-Migration Snapshot:** Before applying schema migrations to production Neon database, create a Neon Instant Point-In-Time Restore (PITR) branch snapshot (`pg_snapshot_pre_deploy`).
- **Rollback Procedure:** If a migration fails or corrupts data, promote the pre-migration snapshot branch to primary immediately via Neon CLI:
  ```bash
  neon branches create --from-snapshot <snapshot_id> --name primary_rollback
  ```

### 4.2 Web & API Application Rollback Plan
- **Render Fastify API Rollback:**
  - Render keeps immutable image tags for previous builds.
  - To rollback API, trigger Render Instant Rollback to previous successful commit (`b0c86ec` or current stable SHA).
- **Vercel Web Dashboard Rollback:**
  - Vercel retains instant rollback deployment targets.
  - Revert to prior deployment with one click from Vercel deployment dashboard (< 5 seconds global CDN propagation).

### 4.3 Mobile Client Incident Mitigation
- **Revocation Safety Net:** If a released mobile APK exhibits critical runtime anomalies on a specific device, administrators can revoke the installation via Web Dashboard (`POST /v1/devices/revoke`), forcing the app to halt background tasks and return to the sign-in screen.
- **Fail-Closed Location Invariant:** If the mobile `LocationService` encounters any unexpected exception or permission ambiguity, it immediately transitions to `isTracking = false` to guarantee off-duty privacy cannot be violated.

---

## 5. Formal Production Launch Sign-Off Table

| Approval Role | Sign-Off Authority | Signature / Approval Stamp | Date | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **Principal Software Architect** | Architecture, Monorepo & Zero-Cost Governance | `[PENDING REMEDIATION]` | 2026-10-12 | CONDITIONAL |
| **Lead Security Auditor** | Threat Model, Vulnerabilities & Tenant Isolation | `[BLOCKED ON SEC-01]` | 2026-10-12 | BLOCKED |
| **Senior Flutter Engineer** | Mobile Reliability, Offline Drift & GPS Pipeline | `[PENDING PR #1 MERGE]` | 2026-10-12 | CONDITIONAL |
| **Staff Full-Stack Engineer** | Web Dashboard & Fastify Modular Monolith | `[PENDING BLK-003]` | 2026-10-12 | CONDITIONAL |
| **QA Automation Lead** | Regression Suites, Negative Tests & Test Evidence | `[142/142 TESTS GREEN]` | 2026-10-12 | PASSED |
| **Technical Product Owner** | PRD Compliance, V1 Scope & Business Launch Approval | `[PENDING PHASE 1-2]` | 2026-10-12 | CONDITIONAL |
