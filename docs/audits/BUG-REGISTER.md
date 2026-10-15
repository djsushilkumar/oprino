# Oprino — Comprehensive Bug Register

**Audit Date:** October 15, 2026  
**Auditor:** Principal Software Architect & Full-Stack QA Lead  
**Repository Branch:** `release/v1-stabilization`  
**Commit Range:** `8db713b` through `d35b8f3` + local stabilization fixes  

---

## 1. Bug Priority & Severity Classification

* **P0 (Critical / Blocker):** Data loss, critical security bypass, cross-tenant data leak, false core legal/audit evidence, or system-wide outage.
* **P1 (High):** Major broken functionality, build failure across supported OS, security hardening gap, or core workflow interruption.
* **P2 (Moderate):** Moderate workflow defect, edge-case failure, unhandled UI exception, or non-portable tooling.
* **P3 (Low):** Minor cosmetic defect, non-blocking documentation inconsistency, or developer ergonomics.

---

## 2. Master Bug Register Table

| Bug ID | Severity | Module | Affected File | Root Cause | Status | Verification / Test |
|---|:---:|---|---|---|:---:|---|
| **BUG-001** | **P0** | API | [`services/api/src/server.ts`](../../services/api/src/server.ts) | Fastify default error handler leaked raw Java/Node stack traces in 500 error responses | **RESOLVED** | Unit & security test in `hardening.integration.test.ts` |
| **BUG-002** | **P1** | Worker | [`services/worker/src/index.ts`](../../services/worker/src/index.ts) | Background worker jobs executed DB queries without transaction-scoped `SET LOCAL app.current_workspace_id` | **RESOLVED** | RLS isolation verified in worker tests |
| **BUG-003** | **P1** | API | [`services/api/src/server.ts`](../../services/api/src/server.ts) | CORS configured with wildcard `*` while `credentials: true` was enabled, violating browser security spec | **RESOLVED** | Explicit trusted origins whitelist enforced |
| **BUG-004** | **P1** | API | [`services/api/src/config/env.ts`](../../services/api/src/config/env.ts) | No fail-closed validation rejecting default dev DB credentials in staging/production environments | **RESOLVED** | Zod schema refinement rejecting dev credentials in production |
| **BUG-005** | **P2** | Web | [`apps/web/src/app/reports/page.tsx`](../../apps/web/src/app/reports/page.tsx) | `.reduce()` called on empty array without initial accumulator value causing uncaught runtime crash | **RESOLVED** | Initial value `0` supplied + null-safety guards added |
| **BUG-006** | **P1** | Mobile | [`apps/mobile/lib/core/config/app_config.dart`](../../apps/mobile/lib/core/config/app_config.dart) | Production mobile configuration did not strictly enforce HTTPS allowlist | **RESOLVED** | Fail-closed HTTPS validation enforced in production config |
| **BUG-007** | **P1** | DevOps | [`render.yaml`](../../render.yaml) | Production Render blueprint lacked explicit S3/R2 environment variable declarations | **RESOLVED** | Blueprint updated with full object storage schema |
| **BUG-008** | **P0** | Docs / Ops | [`docs/releases/V1-ROLLBACK-PLAN.md`](../releases/V1-ROLLBACK-PLAN.md) | Legacy rollback plan instructed destructive `DROP TABLE` and `FLUSHDB` in production incidents | **RESOLVED** | Rewritten with non-destructive version pin rollback |
| **BUG-009** | **P1** | Mobile | [`apps/mobile/lib/features/tasks/presentation/widgets/photo_proof_sheet.dart`](../../apps/mobile/lib/features/tasks/presentation/widgets/photo_proof_sheet.dart) | Camera capture and selfie sheets used synthetic mock placeholders instead of real device camera | **RESOLVED** | Integrated `image_picker` camera capture + real JPEG watermarking |
| **BUG-010** | **P1** | Mobile / Build | [`apps/mobile/android/build.gradle.kts`](../../apps/mobile/android/build.gradle.kts) | Unconditional `subprojects { project.layout.buildDirectory.value(...) }` threw `IllegalArgumentException: this and base files have different roots` on Windows across drive letters (D: vs C:) | **RESOLVED** | Guarded with `projectRoot == buildRoot` check; Android assembleDebug passed |
| **BUG-011** | **P2** | Mobile / Repo | [`apps/mobile/android/.gitignore`](../../apps/mobile/android/.gitignore) | JVM crash dumps (`hs_err_pid*.log`, `replay_pid*.log`) left in repository and not tracked by gitignore | **RESOLVED** | Added `hs_err_pid*.log` and `replay_pid*.log` to `.gitignore`; files deleted |
| **BUG-012** | **P2** | Docs | 54 Markdown Files in `docs/` | Hardcoded Linux absolute paths `file:///workspace/oprino/...` broke link navigation on Windows/clones | **RESOLVED** | Converted all 473 links to relative paths; `validate-doc-links.mjs` returns 0 broken links |
| **BUG-013** | **P1** | Mobile / API | [`apps/mobile/lib/features/tasks/presentation/task_detail_screen.dart`](../../apps/mobile/lib/features/tasks/presentation/task_detail_screen.dart) | Signature sheet generated dummy fileKey without converting drawn strokes or uploading PNG binary; backend confirmed missing object | **RESOLVED** | `SignatureRasterizer` converts strokes to valid PNG bytes; real binary uploaded via storage API; offline retry via Drift outbox; API tests 15-19 & mobile tests 14-16 pass |
| **BUG-014** | **P1** | Mobile / API | [`apps/mobile/lib/core/utils/media_validator.dart`](../../apps/mobile/lib/core/utils/media_validator.dart) | Inverted condition `if (!isJpeg && bytes.length < 100)` accepted non-image arbitrary bytes if >100 bytes | **RESOLVED** | Comprehensive `MediaValidator` enforcing magic bytes (JPEG/PNG/WebP), size limits, header checks, and native image decoding; API PUT route enforces magic byte validation |

---

## 3. Detailed Bug Profiles

### BUG-010: Windows Cross-Drive Root Crash in Gradle
- **Unique ID:** `BUG-010`
- **Severity:** `P1` (High — Blocked Android build and Gradle sync on Windows machines with split partitions)
- **Affected Module:** `apps/mobile/android`
- **File:** [`apps/mobile/android/build.gradle.kts`](../../apps/mobile/android/build.gradle.kts#L14-L26)
- **Root Cause:**
  When Oprino was cloned to drive `D:\` while the global Flutter Pub cache resided on drive `C:\Users\<user>\AppData\Local\Pub\Cache`, Gradle's root `build.gradle.kts` forced every subproject (including Flutter plugin subprojects in `C:`) to set its `buildDirectory` to `D:\oprino\oprino\apps\mobile\build\<subproject>`. During compilation task creation, AGP executed `Path.relativize()`, which throws `IllegalArgumentException: this and base files have different roots` on Windows across drive letters.
- **Reproduction:**
  Clone repository to `D:\`, run `.\gradlew.bat tasks` or `.\gradlew.bat :app:assembleDebug`.
- **Fix Strategy:**
  Add a drive root check in `subprojects`:
  ```kotlin
  subprojects {
      val projectRoot = project.projectDir.toPath().root
      val buildRoot = newBuildDir.asFile.toPath().root
      if (projectRoot == buildRoot) {
          val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
          project.layout.buildDirectory.value(newSubprojectBuildDir)
      }
  }
  ```
- **Regression Test:**
  `.\gradlew.bat tasks` (PASS) and `.\gradlew.bat :app:assembleDebug` (PASS, 193/193 tasks passed).
- **Status:** **RESOLVED**

---

### BUG-001: Raw Stack Trace Disclosure in Fastify API Responses
- **Unique ID:** `BUG-001`
- **Severity:** `P0` (Critical Security)
- **Affected Module:** `services/api`
- **File:** [`services/api/src/server.ts`](../../services/api/src/server.ts)
- **Root Cause:**
  Uncaught 500 errors returned internal server stack traces to API consumers, disclosing directory paths, library internals, and database driver versions.
- **Fix Strategy:**
  Installed explicit Fastify `setErrorHandler` returning sanitized JSON errors (`{ code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' }`) while logging structured traces privately to Pino.
- **Regression Test:**
  `services/api/src/phase-05-hardening.test.ts` (PASS).
- **Status:** **RESOLVED**

---

### BUG-002: Worker Background Jobs Missing Tenant RLS Context
- **Unique ID:** `BUG-002`
- **Severity:** `P1` (High Security)
- **Affected Module:** `services/worker`
- **File:** [`services/worker/src/index.ts`](../../services/worker/src/index.ts)
- **Root Cause:**
  Scheduled BullMQ jobs running in the worker process connected to PostgreSQL without establishing transaction-scoped `SET LOCAL app.current_workspace_id`, causing direct queries to return 0 rows under default-deny RLS.
- **Fix Strategy:**
  Wrapped all worker database interactions in explicit transactional scopes using `withWorkspaceContext(workspaceId, async (tx) => ...)`.
- **Regression Test:**
  Worker test suite in `services/worker/src/index.test.ts` (PASS).
- **Status:** **RESOLVED**

---

### BUG-009: Synthetic Photo Proof Placeholders in Field Mobile App
- **Unique ID:** `BUG-009`
- **Severity:** `P1` (High — False Legal/Operational Evidence)
- **Affected Module:** `apps/mobile`
- **File:** [`apps/mobile/lib/features/tasks/presentation/widgets/photo_proof_sheet.dart`](../../apps/mobile/lib/features/tasks/presentation/widgets/photo_proof_sheet.dart)
- **Root Cause:**
  The photo proof sheet generated synthetic placeholder images rather than triggering physical hardware camera capture.
- **Fix Strategy:**
  Integrated `image_picker` camera capture, validated legitimate binary JPEG fixtures, and overlaid real client-side watermarks (timestamp, GPS coordinates, task ID).
- **Regression Test:**
  `apps/mobile/test/field_operations_mobile_test.dart` (PASS) and `apps/mobile/test/media_workflow_and_offline_reliability_test.dart` (PASS).
- **Status:** **RESOLVED**

---

### BUG-013: Customer Signature False Confirmation & Missing Binary Storage
- **Unique ID:** `BUG-013`
- **Severity:** `P1` (High — Legal/Operational Verification Defect)
- **Affected Module:** `apps/mobile` & `services/api`
- **File:** [`apps/mobile/lib/features/tasks/presentation/task_detail_screen.dart`](../../apps/mobile/lib/features/tasks/presentation/task_detail_screen.dart) & [`services/api/src/services/media.service.ts`](../../services/api/src/services/media.service.ts)
- **Root Cause:**
  `CustomerSignatureSheet` returned raw canvas drawing strokes, but `TaskDetailScreen` fabricated an imaginary `fileKey` without rasterizing strokes to PNG or uploading the binary to storage. `SyncService` subsequently queued confirmation with `isBinaryUploaded: true`. In environments requiring verified object existence, `MediaService.confirmUpload` threw `STORAGE_OBJECT_NOT_FOUND` because no storage object was ever uploaded.
- **Fix Strategy:**
  1. Implemented `SignatureRasterizer` (`apps/mobile/lib/core/utils/signature_rasterizer.dart`) using `ui.PictureRecorder` and `Canvas` to render strokes into valid PNG bytes (`0x89, 0x50, 0x4E, 0x47`).
  2. Updated `TaskDetailScreen` to request an authorized upload URL and upload real PNG binary bytes before calling confirmation.
  3. Added offline support in `SyncService`: when offline, signature PNG is saved to durable app storage (`pending_media/sig_*.png`) with `isBinaryUploaded: false`, drained upon reconnect, and purged only after backend confirmation.
  4. Backend storage route verifies magic bytes on upload and confirms physical storage object existence before creating database record.
- **Regression Test:**
  Mobile unit/widget tests: `apps/mobile/test/signature_rasterizer_test.dart` (PASS), `field_operations_mobile_test.dart` (PASS), and `media_workflow_and_offline_reliability_test.dart` tests 14, 15, 16 (PASS). Backend API tests: `services/api/src/media-storage.unit.test.ts` tests 15–19 (PASS).
- **Status:** **RESOLVED**

---

### BUG-014: Inverted Image Byte Validation Bypassing Format Checks
- **Unique ID:** `BUG-014`
- **Severity:** `P1` (High — Media Integrity & Security Vulnerability)
- **Affected Module:** `apps/mobile` & `services/api`
- **File:** [`apps/mobile/lib/core/utils/media_validator.dart`](../../apps/mobile/lib/core/utils/media_validator.dart) & [`services/api/src/routes/media.ts`](../../services/api/src/routes/media.ts)
- **Root Cause:**
  Photo and selfie validation used the condition `if (!isJpeg && bytes.length < 100)`, which inadvertently allowed arbitrary non-image binaries to pass validation simply because their length exceeded 100 bytes.
- **Fix Strategy:**
  1. Created `MediaValidator` (`apps/mobile/lib/core/utils/media_validator.dart`) enforcing magic bytes for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), and WebP (`RIFF...WEBP`), header length checks (>=32 bytes), max size limits (<=10MB), and native decoding with positive dimensions.
  2. Applied `MediaValidator.validateImageBytes` to `AttendanceSelfieSheet` and `PhotoProofSheet`.
  3. Added binary magic byte verification to backend storage direct PUT route (`services/api/src/routes/media.ts`), rejecting corrupted or mismatched payloads with `400 Bad Request`.
- **Regression Test:**
  Mobile tests: `apps/mobile/test/media_validator_test.dart` (7/7 tests PASS). Backend tests: `services/api/src/media-storage.unit.test.ts` tests 16–17 (PASS).
- **Status:** **RESOLVED**
