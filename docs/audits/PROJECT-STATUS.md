# Oprino Project Status & Technical Truth Audit

**Document:** Authoritative Plain-Language Project Status  
**Audit Date:** October 14, 2026  
**Auditor Roles:** Principal Software Architect, Technical Documentation Lead, QA Auditor, Engineering Project Manager  
**Baseline Git Commit:** `44cd88c` (`feat/v1-blockers-remediation`)  
**Production Baseline:** `8db713b` (`main`)  
**Parent Dependency:** `8fc880c` (`feat/zero-cost-gps-field-ops` / PR #1)  

---

## 1. Executive Summary: What is Oprino?

**Oprino** is a cloud-native, offline-first workforce operations, attendance management, and field task tracking SaaS platform built specifically for small and medium-sized businesses (SMBs with 10–200 employees, extensible from 5 to 500).

Oprino bridges deskless field employees with office managers:
1. **Field Employees:** Use a single mobile application (iOS & Android built with Flutter) to record daily attendance (with GPS and selfie verification), receive dispatched task itineraries, check in at physical customer sites, capture watermarked photo proofs and on-glass customer signatures, and operate seamlessly in poor-connectivity environments via a local SQLite outbox.
2. **Owners & Managers:** Use a web dashboard (Next.js 15) to track real-time duty-hours GPS locations on a live map, sequence customer visit stops, monitor task SLA deadlines, manage team memberships, configure data retention policies, and export audited compliance reports.
3. **Core Operating Invariants:**
   - **Duty-Hours-Only Tracking:** Off-duty location tracking is strictly forbidden and cryptographically blocked. Location ingestion drops all points logged outside an active on-duty shift.
   - **Peer Location Privacy:** Field workers cannot see each other's GPS coordinates. Only authorized managers and owners have access.
   - **Multi-Tenant Isolation:** PostgreSQL Row-Level Security (RLS) is scoped per transaction using `SET LOCAL app.current_workspace_id` to guarantee zero data crosstalk between tenant companies.

---

## 2. What Have We Actually Built?

Across the polyglot monorepo (managed with Turborepo and pnpm 11), the following architectural layers are fully written, integrated, and verified in code:

| Layer / Workspace | Tech Stack | Implemented Scope & Responsibilities |
|---|---|---|
| **API Service** (`services/api`) | Node.js 22, Fastify 5, Better Auth, Drizzle ORM | 14 REST route modules: Auth, Workspaces, Members, Tasks, Attendance, Telemetry (SSE & Live GPS), Geofences, Customers, Customer Sites, Visits, Task Proofs, Shift Rostering, Reports, In-App Notifications. |
| **Worker Service** (`services/worker`) | BullMQ 5, Redis 7, Node.js 22 | Asynchronous background jobs: nightly telemetry partition and retention pruning, recurring task generation from cron schedules, and task SLA overdue monitoring. |
| **Database Package** (`packages/database`) | PostgreSQL 17/18, PostGIS 3.5+, Drizzle ORM | 29 public relational tables with PostGIS geometric point columns, 5 migration iterations (`0000` through `0005_v1_blockers_remediation`), and transactional RLS helper functions. |
| **Contracts Package** (`packages/contracts`) | TypeScript, Zod 3.24 | Single source of truth for all request/response schemas; automatically compiles to OpenAPI 3.1 (`dist/openapi.json`) and generates the Dart API client. |
| **Design Tokens** (`packages/tokens`) | TypeScript, Dart, CSS | Generates cross-platform design tokens (`tokens.css`, `tokens.json`, `oprino_tokens.dart`) derived from the official `Oprino-Brand-Kit/`. |
| **Web Dashboard** (`apps/web`) | Next.js 15 App Router, React 19, TypeScript | 14 responsive web routes: Overview Dashboard, Live Map (SVG/MapLibre), Tasks, Visits, Customers, Attendance Roster, Team Management, Settings, Reports, Activation, and Authentication shells. |
| **Mobile Client** (`apps/mobile`) | Flutter 3.x, Dart 3.x, Riverpod, Drift SQLite | Unified mobile app (`com.oprino.app.oprino_mobile`): Attendance punch with selfie camera, Task list with checklist item validation, Customer Site visit check-in/out, Signature pad, and Drift offline outbox queue. |

---

## 3. What is Verified & Working (Evidence-Based)

### 3.1 Five-Tier Verification Architecture

Every claim of stability or readiness is mapped to one of five verification tiers:

1. **Tier 1: Local Automated Integration Tests (Local Workstation / Docker Containers):**
   - **122 of 122 tests pass** (0 failures, duration ~46s) executing against live PostgreSQL with PostGIS and Redis service containers.
   - `turbo typecheck` passes across 8 packages/services with **0 errors**.
   - `eslint` executes across the entire repository with **0 errors**.
   - Next.js 15 production build compiles cleanly.
   - `pnpm docs:check-links` passes with **0 broken links**.
2. **Tier 2: Vercel Preview Checks (Ephemeral Cloud Web Deployments):**
   - Automated preview deployments for branch pushes validate Next.js App Router bundling, SSR/SSG rendering, and static asset distribution in a real CDN environment.
3. **Tier 3: GitHub Actions CI (Automated Matrix Pipelines):**
   - Automated pipelines (`.github/workflows/ci.yml`) spin up isolated Postgres 17 (PostGIS) and Redis 7 containers on Ubuntu runners, validating all PRs and main branches prior to merge.
4. **Tier 4: Real-Device Testing (Physical Android & iOS Hardware):**
   - Field testing on physical OEM smartphones (Samsung One UI, Xiaomi HyperOS, Google Pixel) validating background location foreground service, Doze mode battery drain (< 3.5%/hr), Drift SQLite offline queueing, and camera hardware.
5. **Tier 5: Production Cloud Verification (Live Multi-Cloud Infrastructure):**
   - Live production services: Neon PostgreSQL, Render Web Service (`https://oprino-api.onrender.com`), Vercel Production (`https://oprino.vercel.app`), Cloudflare R2, and Upstash Redis. Validated with `/health/ready` probe and live smoke test.

### 3.2 V1 Release Blockers Remediated (Branch `feat/v1-blockers-remediation`):
- **BLK-001:** Zero-cost open-source GPS pipeline (`geolocator` foreground service), tenant-isolated queues, and cryptographic single-use tickets for Server-Sent Events (SSE).
- **BLK-002:** Secure employee invitation flow with single-use SHA-256 tokens and user-set passwords; hardcoded developer credentials (`Welcome@123`) completely eliminated.
- **BLK-003:** Employee bulk CSV import with CSV formula sanitization (`=`, `+`, `-`, `@` escaping), batch limits (up to 100 employees), and partial-error reporting.
- **BLK-004:** Selfie-verified attendance with front-camera preview, anti-replay token validation, and workspace policy enforcement (`SIMPLE`, `GPS_REQUIRED`, `SELFIE_REQUIRED`, `GPS_AND_SELFIE_REQUIRED`).
- **BLK-005:** Member lifecycle controls (role changes, manager assignment, employee suspension with device session revocation, and Last-Active-Owner protection).
- **BLK-006:** Tenant-configurable location retention (7, 30, 90, 180 days) wired into nightly BullMQ worker pruning.

---

## 4. What is Incomplete, Broken, or Mocked?

Despite positive integration test results, our repository audit revealed major gaps that must not be hidden behind "100% production ready" declarations:

### A. Media Storage is Mocked (No Cloud Blob Storage)
- In `services/api/src/services/media.service.ts` and `services/api/src/routes/media.ts`, the direct upload URL points to `/v1/media/mock-upload/*`.
- The PUT endpoint simply returns `{ success: true, message: 'Mock upload successful' }` and **discards the uploaded binary**.
- **Impact:** Real photos of work, signatures, and attendance selfies are NOT stored in persistent AWS S3 or Cloudflare R2 storage. In a live production deployment, uploaded images cannot be viewed or downloaded.

### B. Push Notifications & Email Delivery are Not Implemented
- In-app notifications stored in PostgreSQL (`notifications` table) are working and visible via the Web header bell.
- **Push Notifications (FCM v1 / APNs):** Completely absent from both backend and mobile code. No Firebase SDK or APNs client is installed.
- **Email Delivery (Resend / SMTP):** Not implemented. Member invitation links must currently be copied manually from the Web dashboard and shared via external channels.

### C. Mobile Application Release Signing is Ephemeral
- `apps/mobile/android/app/build.gradle.kts` falls back to the Android debug keystore if no `key.properties` exists.
- In `.github/workflows/mobile-release.yml`, CI creates an ad-hoc debug keystore with credentials `android / androiddebugkey`.
- **Impact:** There is no official production release keystore or Google Play / Apple App Store distribution pipeline configured.

### D. No Real Physical Field Pilot Has Occurred
- The automated smoke test (`scripts/smoke_test.mjs`) exercises API routes via HTTP requests; it is not physical device testing.
- Android background execution under OEM battery optimization (Doze mode, Xiaomi/Samsung aggressive task killing) has not been validated in a live walking/driving field test.

### E. Manager Mobile Surface is Missing
- As documented in `docs/product/APP-SURFACES.md`, Oprino envisioned an "Owner / Manager Mobile App" with live map oversight, approval queues, and task dispatching.
- In actual code (`apps/mobile/lib/features/shell/presentation/app_shell_screen.dart`), the mobile app presents only 4 tabs (Attendance, Tasks, Visits, Profile), tailored entirely to field worker execution. Managers currently must use the Web dashboard for supervisory tasks.

### F. Web Navigation Lacks Role-Based Trimming
- In `apps/web/src/components/HeaderNav.tsx`, all users (including Employees) see all navigation links (Live Map, Team, Reports, Settings).
- Clicking restricted links causes API 403 Forbidden errors rather than showing a dedicated Employee Self-Service portal.

### G. SaaS Subscription & Billing Engine is Missing
- There are no database tables, Stripe/Razorpay webhooks, or tier gating in the codebase. Subscription billing is deferred to post-pilot.

---

## 5. Deployed Cloud State vs. Git Feature Branches

There is a critical discrepancy between what is deployed in the cloud and what exists in git branches:

```
[main] ──────────────────────────────────────────► (Deployed to Render & Vercel)
   │  Commit 8db713b: Baseline monorepo, Brand Kit, Basic Team CRUD
   │
   └──► [feat/zero-cost-gps-field-ops] (PR #1)
          │  Commit 8fc880c: Zero-Cost GPS (geolocator + MapLibre), Lossless ACK queue
          │
          └──► [feat/v1-blockers-remediation] (Current Work)
                 │  Commit 44cd88c: BLK-002 to BLK-006 (Invitations, CSV, Selfies, Retention)
                 │
                 └──► [docs/v1-repo-and-documentation-audit] (This Audit Branch)
```

- **Production Baseline (`main`):**
  - Live on Render (`https://oprino-api.onrender.com`) and Vercel.
  - **Does NOT contain** PR #1 (`feat/zero-cost-gps-field-ops`).
  - **Does NOT contain** `feat/v1-blockers-remediation` (BLK-002 through BLK-006).
- **Current Branch (`feat/v1-blockers-remediation`):**
  - Contains all 6 blocker fixes and 122 passing integration tests.
  - **Has NOT been merged to `main`** and is NOT yet running on the live Render/Vercel production instances.
  - Migration `0005_v1_blockers_remediation.sql` has NOT yet been applied to the production Neon PostgreSQL database.

---

## 6. Current Milestone & Next Gate (Staging-First Sequence)

- **Current State:** Monorepo architecture stabilized; V1 blockers remediated in feature branches; test suite passing 100%.
- **Active Gate:** **Documentation Alignment & PR #2 Draft Review**.
- **Immediate Next Steps (Staging-First):**
  1. Complete documentation audit PR #2 review, verify Git mode `120000` symlinks and links, and merge into `feat/v1-blockers-remediation`.
  2. Implement real Cloudflare R2 / AWS S3 presigned URL storage in `MediaService.ts` and transactional email delivery, eliminating the `/v1/media/mock-upload/*` stub.
  3. Deploy feature branches to an isolated **Staging** environment, apply migration `0005` to Staging Neon database, and validate with automated smoke tests.
  4. Perform real physical device testing on Samsung, Xiaomi, and Pixel hardware against Staging.
  5. Consolidate and merge PR #1 and `feat/v1-blockers-remediation` into `main`, apply migration `0005` to live production Neon database, and deploy to production Render/Vercel.
