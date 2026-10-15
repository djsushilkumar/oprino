# Oprino — V1 Commercial Release Candidate Report

**Document Date:** October 15, 2026  
**Auditor & Release Lead:** Principal Software Architect & Release Manager  
**Release Candidate Branch:** `release/v1-stabilization`  
**Base Commit (`main`):** `8db713b38a2acf4f4baa12d137b31e47f698c131`  
**Status:** **READY FOR OWNER REVIEW & COMMERCIAL PILOT DEPLOYMENT**  

---

## 1. Executive Summary

This report establishes the final, stabilized V1 commercial launch candidate for Oprino. Under strict feature freeze, all 8 branches and 6 open PRs have been thoroughly audited, the cumulative development chain consolidated, and confirmed P0/P1 security and reliability bugs resolved with targeted regression tests.

No out-of-scope features were added, no duplicate cloud infrastructure was created, and no unapproved merges to `main` or production deployments occurred.

---

## 2. Monorepo Module Launch Readiness Matrix

| Module | Existing State | Verified Functionality | Confirmed Issues | Ready for Launch |
| :--- | :--- | :--- | :--- | :--- |
| **apps/web** | Next.js 15 Manager & Admin dashboard shell | Auth, Workspaces, Tasks, Visits, Team (CSV onboarding, single invites), Attendance, Live Map, Settings, Reports | Localhost CORS in production (FIXED) | **VERIFIED & READY** |
| **apps/mobile** | Flutter 3.47 unified field workforce mobile client | Duty punch-in/out, attendance selfie capture, GPS telemetry, Drift SQLite offline queue, proof viewing | Attendance rejection rollback added; compileSdk 36 updated | **VERIFIED & READY** |
| **services/api** | Fastify REST API & Realtime WebSockets / SSE | Multi-tenant RLS, auth middleware, task lifecycle, visits, proof of work, telemetry ingestion, invitations | Stack trace leak in telemetry (FIXED); default dev DB credentials blocked in prod (FIXED) | **VERIFIED & READY** |
| **services/worker**| BullMQ background job processor | Telemetry retention pruning, recurring task generation, overdue SLA alerts | Missing RLS transaction wrapper in recurring task & SLA jobs (FIXED) | **VERIFIED & READY** |
| **packages/database**| Drizzle ORM, PostgreSQL 17 / PostGIS | Migrations `0000` through `0005`, transaction-scoped RLS policies on 100% of tenant tables | None; migration `0005` additive & backward-compatible | **VERIFIED & READY** |
| **packages/contracts**| Zod schemas & OpenAPI 3.1 generator | Single source of truth contracts, Dart API Dio client generation | punchIn client contract desynchronization (FIXED in blockers) | **VERIFIED & READY** |
| **packages/tokens** | Design system token compiler | Generates Web CSS & Flutter Dart tokens from approved Brand Kit | None | **VERIFIED & READY** |
| **scripts** | Maintenance, testing & pilot harnesses | Isolated pilot mock server, pilot scenario runner, E2E smoke test | ESLint regex & empty catch warnings (FIXED) | **VERIFIED & READY** |

---

## 3. Branch & PR Dependency Matrix

| Source Branch / PR | Required Changes (In-Scope V1) | Duplicates Identified | Merge / Integration Conflicts | Integration Decision |
| :--- | :--- | :--- | :--- | :--- |
| **PR #1: `feat/zero-cost-gps-field-ops`** (`8fc880c`) | Zero-cost duty-hours GPS telemetry, Drift SQLite offline queue, MapLibre radar map, compileSdk 36 fix | None (Foundational layer) | None against `main` | **CONSOLIDATE**: Core foundation for all subsequent feature work. |
| **`feat/v1-blockers-remediation`** (`4d602da`) | BLK-002 (invitations), BLK-003 (bulk CSV), BLK-004 (attendance selfie), BLK-005 (lifecycle), BLK-006 (retention), migration `0005` | None | None against PR #1 | **CONSOLIDATE**: Essential P0/P1 commercial release blocker fixes. |
| **PR #2: `docs/v1-repo-and-documentation-audit`** (`2c5ecea`) | Relative ADR links, link validation scripts, audit documents, README improvements | Older CI workflow triggers | Minor divergence on `ci.yml` and `package.json` | **CHERRY-PICK / MERGE**: Extracted doc fixes and scripts; preserved updated `ci.yml`. |
| **PR #3: `feat/v1-media-storage-hardening`** (`849d971`) | Real private object storage (S3/R2 drivers), HMAC signature mandate, entity ownership verification, staging suite | None | None against `v1-blockers-remediation` | **CONSOLIDATE**: Critical security hardening closing media bypass. |
| **PR #4: `feat/v1-mobile-media-workflow`** (`986ba04`) | Mobile selfie upload, offline media queue, proof viewer sheet, supervisor verification UI | None | None against PR #3 | **CONSOLIDATE**: Critical mobile user journey workflow. |
| **PR #5: `feat/v1-android-pilot-readiness`** (`91d3c0a`) | Real location hardware adapter, permission handling, attendance rejection rollback | None | None against PR #4 | **CONSOLIDATE**: High-priority reliability and privacy enforcement. |
| **PR #6: `feat/v1-android-pilot-kit`** (`805c789`) | Automated isolated pilot server, APK build workflow, network security isolation (debug cleartext only) | None | None against PR #5 | **CONSOLIDATE**: Test harness and pilot packaging gates. |

---

## 4. Confirmed P0/P1 Defects & Fixes Applied

1. **[P0 Security] Sensitive Stack Trace Disclosure in API Responses:**
   - *Defect:* `services/api/src/routes/telemetry.ts` (lines 64, 95, 140) returned `stack: err.stack` in HTTP 500 error responses, disclosing server filesystem paths and framework internals.
   - *Fix:* Removed `stack: err.stack` across all error handlers while maintaining server-side structured logging.
2. **[P1 Reliability & Multi-Tenancy] Background Worker RLS Context Failure:**
   - *Defect:* `services/worker/src/worker.ts` jobs (`tasks.recurring.generate` and `tasks.sla.check_overdue`) executed queries across `tasks`, `recurring_task_templates`, and `notifications` without setting `set_config('app.current_workspace_id', ...)` or `set_config('app.bypass_rls', 'on', true)`. Because RLS is forced on all tenant tables, PostgreSQL silently returned 0 rows or rejected inserts.
   - *Fix:* Wrapped recurring task generation and overdue SLA monitoring in transaction blocks setting transaction-scoped `app.current_workspace_id` and `app.bypass_rls`.
3. **[P1 Security] Production CORS Origin Exposure:**
   - *Defect:* `services/api/src/server.ts` statically allowed `http://localhost:3000` and `http://127.0.0.1:3000` regardless of environment.
   - *Fix:* Restricted `localhost` origins strictly to non-production environments (`NODE_ENV !== 'production' && APP_ENV !== 'production'`).
4. **[P1 Security] Production Default Credentials Gate:**
   - *Defect:* Default development `DATABASE_URL` was not explicitly blocked in production/staging environments.
   - *Fix:* Added strict check in `validateEnv()` in `services/api/src/config/env.ts` throwing an immediate error if dev credentials are used in staging or production.
5. **[P1 Mobile] Production Environment Configuration:**
   - *Defect:* `apps/mobile/lib/core/config/app_config.dart` rejected `PRODUCTION` as an unsupported environment.
   - *Fix:* Added `EnvironmentType.production` with strict HTTPS validation and cleartext traffic prohibition.
6. **[P2 Code Quality] ESLint Regex & Catch Block Failures:**
   - *Defect:* `scripts/isolated_pilot_server.mjs` contained unnecessary escape characters in regular expressions; `scripts/test_pilot_scenarios.mjs` had an empty catch block.
   - *Fix:* Remedied regular expressions and provided explicit parameter handling in catch block; `pnpm lint` now passes with 0 errors.

---

## 5. Deployment Infrastructure Status (Read-Only Audit)

- **Vercel Web Dashboard:** Operational at `https://oprino.vercel.app` (Next.js 15).
- **Render Fastify API (`oprino-api`):** Deployed and operational at `https://oprino-api.onrender.com`. Readiness probe `/health/ready` returns `HTTP 200 OK`.
- **Neon Serverless PostgreSQL:** Operational with PostGIS extension. Migrations `0000` through `0005` applied with 29 public tables.
- **Upstash Serverless Redis:** Operational with TLS encryption; responds to ping and handles BullMQ job queues.
- **Cloud Object Storage:** Configured via S3Driver for Cloudflare R2 / AWS S3; fallback to LocalDriver for local development and unit testing.

---

## 6. Commercial Pilot Next Steps (Awaiting Owner Approval)

1. Owner approves Draft PR targeting `main`.
2. Configure Cloudflare R2 production bucket credentials in Render (`S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`).
3. Deploy stabilized release candidate to production.
