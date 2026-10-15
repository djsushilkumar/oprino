# Oprino — Comprehensive Branch Inventory Audit

**Audit Date:** October 15, 2026  
**Auditor:** Principal Software Architect & Release Manager  
**Baseline SHA (`main`):** `8db713b38a2acf4f4baa12d137b31e47f698c131`  
**Latest Development SHA:** `805c78922e654ff3080b7762f955c8a462408243`  

---

## 1. Overview of All Repository Branches

The repository contains 8 active branches (7 remote-tracking feature/docs branches + `main`).
Investigation confirms a strictly layered linear hierarchy across the feature branches, alongside one divergent documentation audit branch.

```
main (8db713b)
  │
  └── feat/zero-cost-gps-field-ops (PR #1: 8fc880c)
        │
        └── feat/v1-blockers-remediation (4d602da)
              ├── docs/v1-repo-and-documentation-audit (PR #2: 2c5ecea)
              │
              └── feat/v1-media-storage-hardening (PR #3: 849d971)
                    │
                    └── feat/v1-mobile-media-workflow (PR #4: 986ba04)
                          │
                          └── feat/v1-android-pilot-readiness (PR #5: 91d3c0a)
                                │
                                └── feat/v1-android-pilot-kit (PR #6: 805c789)
```

---

## 2. Detailed Branch Inventory

### Branch 1: `main`
- **Head SHA:** `8db713b38a2acf4f4baa12d137b31e47f698c131`
- **Base / Merge-Base:** Repository root / current default production branch.
- **Commit History:** 21 commits behind latest development. Contains monorepo scaffolding through Phase 05, Cloud deployment blueprint, Render/Neon/Upstash configurations, brand system assets.
- **PR:** N/A (Default target branch).
- **Files Added/Modified:** Base repository structure (88 tests passing on Phase 05 baseline).
- **Purpose:** Production release target.
- **CI Status:** Green on initial release baseline.
- **Remaining Defects:** Lacks critical V1 blocker remediations (BLK-002 through BLK-006), real object storage drivers, media authentication, mobile media sync, and compileSdk 36 fix.
- **Database Migrations:** Up to `0004_phase_04_advanced_operations.sql`.

---

### Branch 2: `feat/zero-cost-gps-field-ops` (PR #1)
- **Head SHA:** `8fc880cfc479ed46256d36048e869afa54960b75`
- **Base / Merge-Base:** `main` (`8db713b38a2acf4f4baa12d137b31e47f698c131`)
- **Commits Ahead of Base:** 3 commits (`2856422`, `75089e9`, `8fc880c`)
- **PR:** #1 (Target: `main`)
- **Files Modified:** 14 files (+1,894 / -210 lines).
  - `apps/mobile/android/app/build.gradle.kts` (compileSdk 36)
  - `apps/mobile/lib/core/location/location_service.dart`
  - `apps/web/src/app/live-map/page.tsx`
  - `services/api/src/services/telemetry.service.ts`
  - `services/api/src/routes/telemetry.ts`
  - `services/api/src/telemetry-geofence.integration.test.ts`
- **Purpose:** Implements zero-cost duty-hours GPS telemetry with Redis Pub/Sub, PostGIS spatial queries, Drift SQLite offline queue, MapLibre SVG live map, and Android 36 SDK compatibility.
- **Test Coverage:** Unit tests for location service + integration tests for geofences and telemetry.
- **CI Status:** PASSED.
- **Database Migrations:** No schema modifications (uses tables defined in migration `0002`).
- **Classification:** Category A (Necessary V1 functionality) + Category B (compileSdk 36 fix).

---

### Branch 3: `feat/v1-blockers-remediation`
- **Head SHA:** `4d602da1cb92aad2ffaa28a76df87a7f8c8581bc`
- **Base / Merge-Base:** `feat/zero-cost-gps-field-ops` (`8fc880cfc479ed46256d36048e869afa54960b75`)
- **Commits Ahead of Base:** 7 commits (`24fdafd`, `4398a51`, `e6834d0`, `cb142d0`, `44cd88c`, `cacc3ab`, `4d602da`)
- **PR:** None directly open (serves as base for PR #2 and PR #3).
- **Files Modified:** 25 files (+3,420 / -340 lines).
  - DB Migration: `0005_v1_blockers_remediation.sql` & journal
  - Backend: `services/api/src/services/workspace.service.ts`, `services/api/src/services/attendance.service.ts`, `routes/workspaces.ts`
  - Web: `apps/web/src/app/team/page.tsx`, `settings/page.tsx`, `auth/activate/page.tsx`
  - Contracts & Mobile: `packages/contracts/src/schemas/workspace.ts`, `attendance.ts`, `generated/dart-api/`
- **Purpose:** Remediates commercial release blockers:
  - BLK-002: Secure tokenized employee invitations with expiration and web activation flow.
  - BLK-003: Bulk employee CSV onboarding with format validation and error reporting.
  - BLK-004: Mandatory attendance selfie capture and workspace attendance policies.
  - BLK-005: Employee lifecycle management (manager assignment, role updates, deactivation).
  - BLK-006: Workspace-configurable GPS telemetry retention with automatic pruning.
- **Test Coverage:** `services/api/src/v1-blockers.integration.test.ts` (14 comprehensive tests), `punch_in_contract_regression.test.ts`.
- **CI Status:** PASSED in downstream CI runs.
- **Database Migrations:** Adds migration `0005_v1_blockers_remediation.sql` (`workspace_invitations` table with strict RLS, session coordinates, selfie key, manager_id, retention days).
- **Classification:** Category A + B + C (Core blocker fixes, security fixes, and domain completion).

---

### Branch 4: `docs/v1-repo-and-documentation-audit` (PR #2)
- **Head SHA:** `2c5ecea12648ebcd4556874c74eb17ac38ac5831`
- **Base / Merge-Base:** `feat/v1-blockers-remediation` (`4d602da1cb92aad2ffaa28a76df87a7f8c8581bc`)
- **Commits Ahead of Base:** 5 commits (`4a842c6`, `ebb6b49`, `3e2b237`, `21563e9`, `2c5ecea`)
- **PR:** #2 (Target: `feat/v1-blockers-remediation`)
- **Files Modified:** 65 files (+1,933 / -383 lines).
  - Documentation: Root `README.md`, `docs/README.md`, audit documents (`FEATURE-INVENTORY.md`, `CURRENT-DEPLOYMENT-STATUS.md`, `REPOSITORY-STRUCTURE-AUDIT.md`).
  - Architecture ADR markdown links converted to relative paths.
  - Scripts: `scripts/convert-nonportable-links.mjs`, `scripts/validate-doc-links.mjs`.
- **Purpose:** Comprehensive documentation audit, broken link cleanup, and repository documentation standardization.
- **Test Coverage:** Doc link validation script.
- **CI Status:** PASSED.
- **Database Migrations:** None.
- **Classification:** Category E (Documentation-only and repository hygiene).

---

### Branch 5: `feat/v1-media-storage-hardening` (PR #3)
- **Head SHA:** `849d9715bd3b10ebad1e1faf908d900c0a0ebc80`
- **Base / Merge-Base:** `feat/v1-blockers-remediation` (`4d602da1cb92aad2ffaa28a76df87a7f8c8581bc`)
- **Commits Ahead of Base:** 7 commits (`3bd0ede`, `1ba327d`, `a853a44`, `8542d64`, `4c27321`, `6292c41`, `849d971`)
- **PR:** #3 (Target: `feat/v1-blockers-remediation`)
- **Files Modified:** 26 files (+2,740 / -180 lines).
  - Storage Drivers: `services/api/src/storage/index.ts`, `local-driver.ts`, `s3-driver.ts`, `types.ts`
  - Routes & Services: `services/api/src/routes/media.ts`, `services/api/src/services/media.service.ts`
  - Tests: `services/api/src/media-storage.unit.test.ts`, `services/api/src/cloud-storage.integration.test.ts`
  - Workflows: `.github/workflows/staging-cloud-verification.yml`
- **Purpose:**
  - Real private object storage abstraction (LocalDriver + AWS S3 / Cloudflare R2 driver).
  - Closes unauthenticated media access bypass: mandates HMAC-signed download tokens with short expiry.
  - Enforces cross-tenant entity ownership validation before issuing upload/download presigned URLs.
  - Implements fail-closed staging verification workflow.
- **Test Coverage:** 14 unit and security tests in `media-storage.unit.test.ts`, live cloud storage integration test.
- **CI Status:** PASSED.
- **Database Migrations:** None.
- **Classification:** Category C (Critical Security Fixes) + Category A (Necessary V1 Media Architecture).

---

### Branch 6: `feat/v1-mobile-media-workflow` (PR #4)
- **Head SHA:** `986ba0448087a44661ce4a788a050535e986ac78`
- **Base / Merge-Base:** `feat/v1-media-storage-hardening` (`849d9715bd3b10ebad1e1faf908d900c0a0ebc80`)
- **Commits Ahead of Base:** 1 commit (`986ba04`)
- **PR:** #4 (Target: `feat/v1-media-storage-hardening`)
- **Files Modified:** 12 files (+1,650 / -120 lines).
  - Mobile UI & Services: `apps/mobile/lib/core/network/media_upload_service.dart`, `apps/mobile/lib/core/sync/sync_service.dart`, `apps/mobile/lib/features/tasks/presentation/widgets/proof_viewer_sheet.dart`, `task_detail_screen.dart`
  - Tests: `apps/mobile/test/media_workflow_and_offline_reliability_test.dart` (37 tests)
- **Purpose:** Full mobile attendance selfie capture, durable offline media upload queue, on-device proof inspection, and supervisor verification controls.
- **Test Coverage:** 37 Flutter widget/unit tests verifying offline retry, proof rendering, and state sync.
- **CI Status:** PASSED.
- **Database Migrations:** None.
- **Classification:** Category A (Necessary V1 Mobile Functionality).

---

### Branch 7: `feat/v1-android-pilot-readiness` (PR #5)
- **Head SHA:** `91d3c0a40adea85fc98105710835b600b3830796`
- **Base / Merge-Base:** `feat/v1-mobile-media-workflow` (`986ba0448087a44661ce4a788a050535e986ac78`)
- **Commits Ahead of Base:** 1 commit (`91d3c0a`)
- **PR:** #5 (Target: `feat/v1-mobile-media-workflow`)
- **Files Modified:** 9 files (+820 / -160 lines).
  - Mobile: `apps/mobile/lib/core/location/real_location_hardware_adapter.dart`, `location_service.dart`, `attendance_view.dart`, `app_config.dart`
  - Tests: `apps/mobile/test/location_service_test.dart`, `apps/mobile/test/app_config_test.dart`
- **Purpose:** Real physical Android location hardware adapter, runtime permission prompt lifecycle, durable punchIn rejection rollback (ensuring UI reverts if server rejects punch), and duty-hours GPS strict boundary enforcement.
- **Test Coverage:** Location service test suite expanded to 28 test cases.
- **CI Status:** PASSED.
- **Database Migrations:** None.
- **Classification:** Category B (Core Workflow Reliability & Rejection Handling).

---

### Branch 8: `feat/v1-android-pilot-kit` (PR #6)
- **Head SHA:** `805c78922e654ff3080b7762f955c8a462408243`
- **Base / Merge-Base:** `feat/v1-android-pilot-readiness` (`91d3c0a40adea85fc98105710835b600b3830796`)
- **Commits Ahead of Base:** 2 commits (`f62bdf9`, `805c789`)
- **PR:** #6 (Target: `feat/v1-android-pilot-readiness`)
- **Files Modified:** 14 files (+1,120 / -85 lines).
  - Scripts: `scripts/isolated_pilot_server.mjs`, `scripts/test_pilot_scenarios.mjs`, `scripts/verify_pilot_hardening_gates.mjs`
  - Android: `AndroidManifest.xml` (debug vs release network security isolation), network security XML
  - CI: `.github/workflows/android-pilot-apk.yml`
- **Purpose:** Automated local and CI pilot testing kit with isolated mock backend, automated physical device APK build with debug/release isolation (cleartext permitted only in debug mode), and pilot scenario runner.
- **Test Coverage:** Automated pilot scenario runner and hardening gate validator scripts.
- **CI Status:** PASSED (All jobs including APK build succeed).
- **Database Migrations:** None.
- **Classification:** Category B + C (Deployment Readiness & Security Gates).

---

## 3. Summary of Branch Inventory Findings

1. **Ancestry is Linear:** The 6 feature branches represent an unbroken chain of 21 commits starting from `main` (`8db713b`) up to `feat/v1-android-pilot-kit` (`805c789`).
2. **Docs Branch Divergence:** `docs/v1-repo-and-documentation-audit` branched off `feat/v1-blockers-remediation` (`4d602da`) and contains non-conflicting markdown documentation improvements and link audit scripts.
3. **No Unrelated Scope Added:** None of the 8 branches contain out-of-scope features (no CRM, no warehouse inventory, no payroll engine, no customer portals). All work is strictly aligned with the frozen V1 Master PRD.
4. **No Incompatible Migrations:** Only one new migration was introduced across all branches: `0005_v1_blockers_remediation.sql`. It is additive, idempotent, and fully protected with transaction-scoped RLS.
