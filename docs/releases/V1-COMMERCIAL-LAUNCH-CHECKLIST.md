# Oprino — V1 Commercial Launch Readiness Checklist

**Release Candidate:** `release/v1-stabilization`  
**Date of Audit:** October 15, 2026  
**Auditor:** Principal Release Engineer, DevOps & QA Lead  
**Status:** **RELEASE CANDIDATE STABILIZED (CODE COMPLETE) — COMMERCIAL GATES BLOCKED PENDING OWNER CREDENTIALS**  

---

## 1. Multi-Tier Verification Breakdown

To ensure zero false positives, all verification results are classified into distinct tiers:
- **LOCAL BUILD & STATIC ANALYSIS:** Local compiler and linter execution.
- **GITHUB ACTIONS CI:** Automated multi-container pipeline with disposable PostgreSQL 17 + PostGIS and Redis 7.
- **IN-MEMORY MOCK TEST-DOUBLE:** Fast offline verification against `isolated_pilot_server.mjs`.
- **REAL BROWSER JOURNEY AUTOMATION:** End-to-end browser execution against rendered Next.js UI.
- **PHYSICAL / HARDWARE TESTING:** Real Android device sensor validation.
- **LIVE CLOUD PRODUCTION AUDIT:** Live HTTP probes against deployed cloud endpoints.

---

## 2. Release Gate Verification Matrix

| Category | Gate / Requirement | Verification Tier | Measured Result | Status | Blocker? |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Monorepo Build** | 6/6 TS Packages + Next.js 17 routes | Local Build & GitHub CI | `pnpm turbo build` exited 0 (1m17s) | **VERIFIED** | NO |
| **Type Integrity** | TypeScript strict compilation | Local Build & GitHub CI | `pnpm typecheck` passed 9/9 tasks | **VERIFIED** | NO |
| **Code Style** | ESLint linting rules | Local Build & GitHub CI | `pnpm lint` passed with 0 errors | **VERIFIED** | NO |
| **Mobile Quality** | Flutter static analysis | Flutter Local Analyzer | `flutter analyze` passed (0 issues) | **VERIFIED** | NO |
| **Mobile Unit Tests** | AppConfig & URL allowlist hardening | Flutter Test Runner | `flutter test` passed 18/18 unit tests | **VERIFIED** | NO |
| **Android Packaging** | Debug APK build for pilot | Flutter Android Build | `flutter build apk --debug` succeeded | **VERIFIED** | NO |
| **Android Release Signing**| Keystore signing for Google Play | Release Packaging | Requires owner `upload-keystore.jks` | **BLOCKED** | **YES** |
| **P0 Stack Trace Leak**| Suppress error stack traces | Security Regression | Removed `err.stack` from telemetry error reply | **FIXED** | NO |
| **P1 Worker RLS** | Transaction-scoped tenant RLS | Security Regression | Scoped recurring tasks & SLA monitor | **FIXED** | NO |
| **P1 Production CORS** | Prohibit localhost in prod | Security Regression | Filtered localhost & wildcard in prod | **FIXED** | NO |
| **P1 Dev DB Gate** | Reject dev DB in prod/staging | Security Regression | Fail-closed check in `env.ts` verified | **FIXED** | NO |
| **P2 Reports Crash** | Guard against empty items | Browser & Unit | Guarded `.reduce` & empty state table | **FIXED** | NO |
| **Admin Browser Flow** | Login, team, invites, settings | Real Browser Automation | Verified with recording | **VERIFIED** | NO |
| **Manager Browser Flow**| Live radar map, attendance, tasks | Real Browser Automation | Verified with recording | **VERIFIED** | NO |
| **Employee Browser Flow**| Punch in, shifts, tasks, visits | Real Browser Automation | Verified with recording | **VERIFIED** | NO |
| **Live API Health** | Render Fastify health probe | Live Cloud Read-Only | Probed `oprino-api.onrender.com/health/ready`: DB & Redis connected | **VERIFIED** | NO |
| **Live Web Health** | Vercel production web deployment | Live Cloud Read-Only | Probed `oprino.vercel.app`: HTTP 200 OK | **VERIFIED** | NO |
| **Production Domain** | Canonical Web Domain | Live HTTP Probes | `https://oprino.vercel.app` verified live; `oprino-app.vercel.app` is 404 | **VERIFIED** | NO |
| **Production Cloud Storage**| Real Cloudflare R2 / S3 storage | Live Cloud Storage | Missing owner R2 credentials in Render | **BLOCKED** | **YES** |
| **Physical GPS Sensor** | Real background GPS hardware test| Physical Hardware | Validated in emulator; requires real field staff device trial | **BLOCKED** | **YES** |
| **Human UAT** | Owner commercial sign-off | Human Acceptance | Pending final owner review of Draft PR | **BLOCKED** | **YES** |

---

## 3. Commercial Launch Blockers (Owner Action Mandatory)

Before commercial release, the following items are strictly **BLOCKED** and cannot be completed autonomously:

1. **Cloudflare R2 Production Bucket Credentials:**
   - *Requirement:* Provide `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` in the Render environment variables for `oprino-api`.
   - *Consequence if skipped:* The API's fail-closed startup check in `services/api/src/config/env.ts` will intentionally abort startup to prevent silent fallback to fake local storage.
2. **Android Release Keystore for Google Play:**
   - *Requirement:* Create and supply production signing keystore (`upload-keystore.jks`) to generate signed Android App Bundles (`.aab`).
   - *Current status:* Pilot debug APK is built and ready for sideloading, but unsigned debug builds cannot be submitted to the Google Play Store.
3. **Owner Draft PR #7 Review & Sign-Off:**
   - *Requirement:* Explicit review and approval of Draft PR #7 ([#7](https://github.com/djsushilkumar/oprino/pull/7)) targeting `main`.

---

## 4. Operational Readiness: Subscription Model & Governance

### A. Manual Commercial Billing Operating Model (V1 Scope)
In accordance with the frozen V1 Product Requirements Document, automated recurring payment gateways (Stripe/Razorpay) are slated for Phase 06/V2. For commercial V1 operations, the approved manual operating procedure is:
1. **Contractual Invoicing:** B2B commercial agreements executed offline; invoicing issued with Net-30 payment terms via corporate bank transfer (NEFT/RTGS/IMPS).
2. **Workspace Provisioning:** Company workspace created via `/auth/signup` or provisioned by Oprino Super Admin.
3. **Seat Management:** Employee seats provisioned up to contracted quota via Bulk Employee CSV Onboarding (`/team` import) or single email invitations.
4. **Subscription Auditing:** Monthly reconciliation of active workspace memberships against commercial contracts. Suspension of overdue accounts executed via admin settings.

### B. Legal & Privacy Requirements (Prior to Google Play Submission)
- **Background Location Privacy Disclosure:** Host a public Privacy Policy at a persistent URL (e.g. `https://oprino.vercel.app/legal/privacy` or company website) detailing that GPS tracking operates strictly during active on-duty sessions and ceases immediately upon punch-out.
- **Data Retention Disclosure:** Document the configurable 30-day (min 7-day) automated pruning of technician location histories.

### C. Recommended GitHub Main Branch Protection Settings (Owner Action Item)
To preserve repository integrity post-launch, the repository owner should configure the following rules for `main` on GitHub:
1. **Require a pull request before merging:**
   - Require at least 1 approving review.
   - Dismiss stale pull request approvals when new commits are pushed.
2. **Require status checks to pass before merging:**
   - Require branches to be up to date before merging.
   - Mandate status checks:
     - `Lint, Typecheck, Test & Build (TypeScript)`
     - `Flutter Analyze, Test & Android Baseline`
     - `Full End-to-End Smoke Test`
     - `Build & Verify Android Pilot Debug APK`
3. **Enforce protections for administrators:** Prevent accidental force-pushes or direct commits to `main`.
