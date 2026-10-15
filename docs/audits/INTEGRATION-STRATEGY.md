# Oprino — V1 Commercial Launch Integration Strategy

**Date:** October 15, 2026  
**Auditor:** Principal Software Architect & Release Manager  
**Baseline SHA (`main`):** `8db713b38a2acf4f4baa12d137b31e47f698c131`  
**Target Release Branch:** `release/v1-stabilization`  
**Target PR:** Draft PR targeting `main` (Explicitly Unmerged until Owner Approval)

---

## 1. Classification of Changes Across Branches

Comparing the entire development chain (`main..feat/v1-android-pilot-kit`) and `docs/v1-repo-and-documentation-audit` against `main`:

### Category A: Necessary for Existing V1 Functionality
- **Zero-Cost Duty-Hours GPS Pipeline (PR #1):** Core field tracking engine utilizing Redis Pub/Sub, PostGIS, and MapLibre SVG radar map.
- **Bulk Employee CSV Onboarding (BLK-003):** Required for commercial SMB customer onboarding (importing 10–200 employees efficiently).
- **Mandatory Attendance Selfie (BLK-004):** Core anti-buddy-punching workforce management requirement.
- **Employee Lifecycle & Manager Assignment (BLK-005):** Required for RBAC hierarchy and manager supervision.
- **Configurable Location Retention (BLK-006):** Privacy compliance and storage quota management.
- **Real Private Object Storage Architecture (PR #3):** Pluggable S3/Cloudflare R2 and Local file storage for real photo proof persistence.
- **Mobile Offline Media Queue & Proof Viewer (PR #4):** Offline-first photo proof capture and supervisor inspection UI.

### Category B: Necessary Bug Fixes
- **compileSdk 36 Android Update (PR #1):** Resolves Gradle build failure with `geolocator_android` plugin.
- **Dart API Client Punch-In Desynchronization (Blockers):** Resolves contract mismatch where `punchIn` was missing `selfieMediaKey` and GPS coordinates.
- **Attendance Rejection Rollback (PR #5):** Reverts local optimistic UI state when the backend rejects punch-in (e.g. policy violations).
- **Deprecated Member Warning Suppression (Blockers):** Fixes Flutter analyze warning in `attendance_selfie_sheet.dart`.
- **Database Query Timeout Increase:** Ensures cross-region serverless DB resilience during cold starts.

### Category C: Necessary Security Fixes
- **Employee Invitation Workflow (BLK-002):** Replaces plaintext credential assignment with secure cryptographic token hashing (`sha256`), 7-day expiration, and activation flow.
- **Media Access Bypass Closure (PR #3):** Mandates HMAC signature tokens on media download endpoints; rejects unauthenticated direct queries.
- **Cross-Tenant Entity Ownership Validation (PR #3):** Enforces strict verification that the requested media proof belongs to the authenticated workspace and entity.
- **Android Cleartext Isolation (PR #6):** Restricts cleartext HTTP network traffic strictly to local debug/pilot testing, enforcing HTTPS in release builds.

### Category D: Duplicate or Superseded
- **Older CI Configuration in PR #2:** The `.github/workflows/ci.yml` in `docs/v1-repo-and-documentation-audit` lacked the automated pilot APK build steps and feature branch triggers introduced in PR #3 and PR #6. **Action:** Retain the newer workflow from PR #6.
- **Temporary Mock Testing Logic:** Isolated pilot server in `scripts/isolated_pilot_server.mjs` is strictly isolated to pilot scripts and never referenced in production code paths.

### Category E: Documentation-Only
- **Relative ADR Link Remediation (PR #2):** Converts non-portable absolute links in ADRs to relative markdown links.
- **Audit Reports & Roadmaps (PR #2):** `docs/audits/CURRENT-DEPLOYMENT-STATUS.md`, `FEATURE-INVENTORY.md`, etc.
- **Root README & CONTRIBUTING Improvements (PR #2):** Enhances onboarding and architecture overviews.

### Category F: Incomplete or Unsafe
- **Blind Direct Merge of PR #1–#6:** Because PR #3, #4, #5, #6 target their parent branches rather than `main`, automated batch merging via GitHub UI would result in broken dependencies, dangling PR states, or unverified intermediate code.
- **Unverified Third-Party Storage Credentials:** Direct live cloud writes to Cloudflare R2 are blocked unless actual staging credentials are provided. Storage falls back safely to LocalDriver in local/CI environments.

### Category G: Outside Frozen V1 Scope
- **None Identified:** No out-of-scope features (CRM, heavy warehouse inventory, payroll engines, accounting/billing, customer portals) were added across any of the branches.

---

## 2. Recommended Step-by-Step Integration Plan

1. **Step 1: Create Dedicated Stabilization Branch**
   - Branch from latest `main` (`8db713b38a2acf4f4baa12d137b31e47f698c131`):
     ```bash
     git checkout main
     git checkout -b release/v1-stabilization
     ```

2. **Step 2: Consolidate Cumulative Feature Chain**
   - Merge the cumulative development chain up to `feat/v1-android-pilot-kit` (`805c78922e654ff3080b7762f955c8a462408243`).
   - Because `feat/v1-android-pilot-kit` is a fast-forward descendant of `main` containing all 21 commits of PR #1 through #6, fast-forwarding or merging cleanly integrates all code without duplicate commits.

3. **Step 3: Integrate Documentation & Link Portability Fixes**
   - Incorporate the markdown documentation links, ADR relative paths, and doc validation scripts from `docs/v1-repo-and-documentation-audit` (`2c5ecea`) without regressing `.github/workflows/ci.yml`.

4. **Step 4: Monorepo Code Audit & P0/P1 Bug Fixes**
   - Audit web dashboard authentication, token handling, CORS, RLS, and forms.
   - Apply fixes directly on `release/v1-stabilization`.
   - Add automated regression tests proving each fix.

5. **Step 5: Full Automated Quality Gate Execution**
   - Run `pnpm install --frozen-lockfile`
   - Run `pnpm turbo generate`
   - Run `pnpm lint`
   - Run `pnpm typecheck`
   - Run `pnpm turbo build`
   - Run API integration and unit tests
   - Run Flutter analyze and widget tests
   - Run E2E smoke tests and pilot scenario tests

6. **Step 6: Real End-to-End User Journey Testing**
   - Execute browser journey tests for Admin, Manager, and Employee.
   - Record tangible evidence.

7. **Step 7: Draft PR Creation & Owner Sign-off**
   - Push `release/v1-stabilization` to GitHub.
   - Create one Draft PR targeting `main`.
   - Deliver comprehensive Hindi and English reports for owner approval.
   - **DO NOT MERGE INTO MAIN. DO NOT DEPLOY TO PRODUCTION.**
