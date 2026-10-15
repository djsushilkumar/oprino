# Oprino — V1 Commercial Release Candidate Report

**Document Date:** October 15, 2026  
**Auditor & Release Lead:** Principal Software Architect, DevOps & Application Security Lead  
**Release Candidate Branch:** `release/v1-stabilization`  
**Base Commit (`main`):** `8db713b38a2acf4f4baa12d137b31e47f698c131`  
**Current Head Commit:** `release/v1-stabilization`  
**Status:** **CODE STABILIZED & OWNER UAT APPROVED — READY FOR PR MERGE (COMMERCIAL LAUNCH GATED)**  

---

## 1. Executive Summary

This report establishes the final stabilized V1 commercial launch candidate for Oprino. Under strict feature freeze, all 8 branches and 6 open PRs have been audited and consolidated into `release/v1-stabilization` without duplicate commits or merge conflicts.

Confirmed P0/P1 security and reliability bugs (sensitive stack trace disclosure, worker multi-tenant RLS bypass, production CORS exposure, default database credentials check, and mobile production HTTPS configuration) have been resolved and validated with automated regression tests.

To maintain strict truth-in-engineering standards, this report explicitly distinguishes between local static verification, automated containerized CI, test-double simulations, real browser journeys, and live cloud probes. **No component is marked commercially ready on the basis of mock tests alone.**

---

## 2. Monorepo Module Launch Readiness Matrix

| Module | Existing State | Verified Functionality | Confirmed Issues & Fixes | Ready for Launch? |
| :--- | :--- | :--- | :--- | :---: |
| **apps/web** | Next.js 15 Manager & Admin dashboard shell | Auth, Workspaces, Tasks, Visits, Team (CSV onboarding, invitations), Attendance, Live Map, Settings, Reports | Fixed `TypeError: Cannot read properties of undefined (reading 'reduce')` on `/reports`. | **VERIFIED** |
| **apps/mobile** | Flutter 3.47 unified field workforce mobile client | Duty punch-in/out, attendance selfie capture, GPS telemetry, Drift SQLite offline queue, proof viewing | Added `EnvironmentType.production` with strict HTTPS and cleartext prohibition. | **VERIFIED (Code Ready)** |
| **services/api** | Fastify REST API & Realtime WebSockets / SSE | Multi-tenant RLS, auth middleware, task lifecycle, visits, proof of work, telemetry ingestion, invitations | Fixed P0 stack trace leak; hardened production CORS wildcard stripping; added fail-closed dev DB check. | **VERIFIED** |
| **services/worker** | BullMQ background job processor | Telemetry retention pruning, recurring task generation, overdue SLA alerts | Fixed P1 cross-tenant RLS bypass by wrapping recurring task and SLA checks in transaction-scoped contexts. | **VERIFIED** |
| **packages/database** | Drizzle ORM, PostgreSQL 17 / PostGIS | Migrations `0000` through `0005`, transaction-scoped RLS policies on 100% of tenant tables | None; migration `0005` is strictly additive & backward-compatible. | **VERIFIED** |
| **packages/contracts** | Zod schemas & OpenAPI 3.1 generator | Single source of truth contracts, Dart API Dio client generation | Synced punchIn client contract parameters in Dart generator. | **VERIFIED** |
| **packages/tokens** | Design system token compiler | Generates Web CSS & Flutter Dart tokens from approved Brand Kit | None. | **VERIFIED** |
| **scripts** | Maintenance, testing & pilot harnesses | Isolated pilot mock server, pilot scenario runner, E2E smoke test | Resolved ESLint regex escapes and catch block syntax. | **VERIFIED** |

---

## 3. Branch & PR Dependency Matrix

| Source Branch / PR | Required Changes (In-Scope V1) | Duplicates Identified | Merge / Integration Conflicts | Integration Decision |
| :--- | :--- | :--- | :--- | :--- |
| **PR #1: `feat/zero-cost-gps-field-ops`** (`8fc880c`) | Zero-cost duty-hours GPS telemetry, Drift SQLite offline queue, MapLibre radar map, compileSdk 36 fix | None (Foundational layer) | None against `main` | **CONSOLIDATED (Base)** |
| **`feat/v1-blockers-remediation`** (`4d602da`) | BLK-002 (invitations), BLK-003 (bulk CSV), BLK-004 (attendance selfie), BLK-005 (lifecycle), BLK-006 (retention), migration `0005` | None | None against PR #1 | **CONSOLIDATED (Linear)** |
| **PR #2: `docs/v1-repo-and-documentation-audit`** (`2c5ecea`) | Relative ADR links, link validation scripts, audit documents, README improvements | Older CI workflow triggers | Outdated CI file | **PORTED**: Extracted doc fixes & scripts while preserving updated CI workflows. |
| **PR #3: `feat/v1-media-storage-hardening`** (`849d971`) | Real private object storage (S3/R2 drivers), HMAC signature mandate, entity ownership verification, staging suite | None | None against `v1-blockers-remediation` | **CONSOLIDATED (Linear)** |
| **PR #4: `feat/v1-mobile-media-workflow`** (`986ba04`) | Mobile selfie upload, offline media queue, proof viewer sheet, supervisor verification UI | None | None against PR #3 | **CONSOLIDATED (Linear)** |
| **PR #5: `feat/v1-android-pilot-readiness`** (`91d3c0a`) | Real location hardware adapter, permission handling, attendance rejection rollback | None | None against PR #4 | **CONSOLIDATED (Linear)** |
| **PR #6: `feat/v1-android-pilot-kit`** (`805c789`) | Automated isolated pilot server, APK build workflow, network security isolation (debug cleartext only) | None | None against PR #5 | **CONSOLIDATED (Chain Tip)** |

---

## 4. Confirmed P0/P1 Defects & Fixes Applied

1. **[P0 Security] Sensitive Stack Trace Disclosure in API Responses:**
   - *Location:* `services/api/src/routes/telemetry.ts` (line 61).
   - *Fix:* Replaced raw `err.stack` exposure with generic error message `Internal server error while processing batch`.
2. **[P1 Reliability & Multi-Tenancy] Background Worker RLS Context Failure:**
   - *Location:* `services/worker/src/worker.ts` (lines 102–135).
   - *Fix:* Wrapped recurring task generation and overdue SLA monitoring in transaction blocks setting transaction-scoped `set_config('app.current_workspace_id', workspace.id, true)` and `set_config('app.bypass_rls', 'on', true)`.
3. **[P1 Security] Production CORS Origin Exposure:**
   - *Location:* `services/api/src/server.ts` (lines 140–152) and `render.yaml`.
   - *Fix:* Restricted `localhost` origins strictly to development environments and stripped wildcard `'*'` origin in production/staging.
4. **[P1 Security] Production Default Credentials Gate:**
   - *Location:* `services/api/src/config/env.ts` (line 75).
   - *Fix:* Added fail-closed check throwing an immediate error if dev credentials (`oprino_dev_password@localhost:5432`) are used in staging or production.
5. **[P1 Mobile] Production Environment Configuration:**
   - *Location:* `apps/mobile/lib/core/config/app_config.dart`.
   - *Fix:* Added `EnvironmentType.production` requiring HTTPS and prohibiting cleartext traffic (`allowCleartext: false`).
6. **[P2 Web Bug] Reports Page Undefined Reduce Crash:**
   - *Location:* `apps/web/src/app/reports/page.tsx` (line 210).
   - *Fix:* Added nullish coalescing guards `(attendanceReport.items ?? []).reduce(...)` and empty-state table rendering.
7. **[P1 Mobile Security] Strict Localhost & Private Interface Allowlist:**
   - *Location:* `apps/mobile/lib/core/config/app_config.dart`.
   - *Fix:* Replaced loose check with strict RFC-1918 / loopback allowlist (`isAuthorizedLocalHost`). Rejects arbitrary external HTTP domains and public IPs; enforces strict HTTPS in staging and production. Verified with 18 automated unit tests.
8. **[P1 Auth Security] Better Auth Production Trusted Origins:**
   - *Location:* `services/api/src/auth/better-auth.ts`.
   - *Fix:* Added verified live production domain `https://oprino.vercel.app` to `trustedOrigins`, restricted `localhost` to development, and stripped wildcard `*` origins.

---

## 5. Deployment Infrastructure & Live Cloud Health Audit

Probed live cloud environments via read-only HTTP probes:
- **Render Fastify API (`oprino-api`):** Deployed at `https://oprino-api.onrender.com`. Live probe to `/health/ready` confirmed:
  `{"status":"ok","services":{"database":"connected","redis":"connected"}}`.
  Endpoint `/v1/version` confirmed running commit `5fc3468`.
- **Vercel Web Interface:** Operational at `https://oprino.vercel.app`. HTTP `GET /` returned `HTTP 200 OK`.
- **Neon Serverless PostgreSQL:** Connected to live Render API instance. Migrations `0000` through `0005` applied with 29 public tables and PostGIS extension.
- **Upstash Serverless Redis:** Connected to live Render API instance. Responds to ping and handles BullMQ job queues.
- **Cloudflare R2 Storage (Production):** **BLOCKED**. The production Render service currently lacks `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. The fail-closed configuration in `services/api/src/config/env.ts` will intentionally halt container startup if deployed without these credentials.

---

## 6. Commercial Pilot Next Steps (Post-UAT)

1. **Owner UAT & Sign-Off:** **COMPLETED & APPROVED** on October 15, 2026. Real Android device workflows (duty punch-in, selfie, real camera photo proof with permanent raster watermark, customer digital signature rasterization, and offline Drift SQLite queue sync) verified.
2. **Merge Draft PR #7 into `main`:** Draft PR #7 ([#7](https://github.com/djsushilkumar/oprino/pull/7)) is authorized for merge into `main`.
3. **Configure Cloudflare R2 Credentials in Render:** Set `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` in `oprino-api` environment variables on Render prior to commercial production deployment.
4. **Generate Android Release Keystore:** Supply `upload-keystore.jks` for Google Play release bundle generation.
