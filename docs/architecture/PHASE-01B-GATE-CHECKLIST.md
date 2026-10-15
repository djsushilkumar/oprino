# Oprino — Phase 01B Gatekeeper Checklist (Corrected)

**Project:** Oprino  
**Phase:** Phase 01B (Technical Validation Spikes)  
**Status:** CONDITIONALLY CLOSED (Physical OEM validation deferred to mobile release gate)  
**Gate Decision:** **PHASE 01B CONDITIONALLY CLOSED — PHASE 01C PRODUCTION SCAFFOLDING AUTHORIZED**  
**Date:** October 2026  
**Controlling Validation Report:** [`docs/architecture/PHASE-01B-VALIDATION-REPORT.md`](./PHASE-01B-VALIDATION-REPORT.md)\
**Governance Record:**

- Phase 00: APPROVED & FROZEN
- Phase 01A Flutter Architecture: APPROVED & FROZEN
- Phase 01B Software/Architecture Validation: CONDITIONALLY CLOSED
- Android OEM physical background-location validation: DEFERRED (Mandatory before mobile beta/production release)
- iOS physical background-location/Keychain validation: DEFERRED (Mandatory before mobile beta/production release)
- Phase 01C Production Scaffolding: AUTHORIZED

---

## 1. Absolute Constraints Verification

- [x] **Zero Production Scaffolding:** No production application UI or scaffolding written during this phase; spike code is now archived in [`research/archived-spikes/`](../../research/archived-spikes).
- [x] **Zero Scope Drift:** Phase 00 product requirements strictly preserved; no new product features introduced.
- [x] **Disposable Test Artifacts:** All spike code clearly isolated and marked as disposable research harnesses.
- [x] **Honest Categorization:** Software dispatch latency (16ms) clearly separated from physical GPS hardware spin-down latency; simulated and host unit test results strictly distinguished from physical silicon execution.

---

## 2. Technical Validation Spike Gates

### Gate A: Background Location & Duty Privacy (Spike A)

- [x] Software test harness created under [`research/archived-spikes/spike_a_location/`](../../research/archived-spikes/spike_a_location).
- [x] Software punch-out stop dispatch latency measured (**16ms**).
- [x] Post-duty breadcrumb purge algorithm verified (**100%** purged before transmission).
- [x] Automatic duty deadline safety watchdog validated (local timer triggers native stop on boundary expiration).
- [x] Server-side active shift ingest filter tested and verified (pre-shift and post-duty points rejected).
- [ ] **Physical Android Testing (Samsung, Xiaomi, Oppo, Vivo):** **BLOCKED / PENDING PHYSICAL HARDWARE** (Zero physical devices attached on ADB).
- [ ] **Physical iOS Testing (iPhone):** **BLOCKED / PENDING PHYSICAL HARDWARE** (Xcode and physical iPhone unavailable on Windows host).
- **Gate Status:** **PARTIAL / BLOCKED**

### Gate B: Drift Offline Persistence & Outbox (Spike B)

- [x] Test project created under [`research/archived-spikes/spike_b_drift/`](../../research/archived-spikes/spike_b_drift).
- [x] Native SQLite with WAL mode (`PRAGMA journal_mode = wal`) verified.
- [x] Foreign keys enabled and verified (`PRAGMA foreign_keys = 1`).
- [x] Atomic transactions (optimistic task update + outbox mutation) tested and verified.
- [x] Transaction rollback integrity on failure verified (zero partial state or orphan mutations).
- [x] Idempotency key uniqueness verified (`SqliteException` thrown on duplicate replay).
- [x] Network retry simulation and eventual ACK sync verified.
- [x] App restart survival verified (100% of pending outbox mutations survive process crash/restart).
- [x] Schema migration (v1 to v2) tested and verified.
- [x] Core invariant verified: Continuous GPS telemetry strictly rejected from entering domain outbox.
- **Gate Status:** **PASSED**

### Gate C: Flutter + Better Auth Integration (Spike C)

- [x] Test service created under [`research/archived-spikes/spike_c_auth/`](../../research/archived-spikes/spike_c_auth).
- [x] Better Auth Bearer plugin verified; opaque session token issued over TLS.
- [x] Global `disableCSRFCheck: true` eliminated; native scheme validation (`Origin: oprino://app` in `trustedOrigins`) verified.
- [x] Dart Dio client with interceptor verified: email auth, token capture, namespaced storage, device registration, workspace switch, revocation rejection, and replay protection.
- [ ] **Physical Mobile Execution:** **PENDING** (Client tested on host Dart VM; compiled Android APK / iOS IPA execution on physical devices pending).
- **Gate Status:** **PARTIAL**

### Gate D: OpenAPI 3.1 → Dart Code Generation (Spike D)

- [x] Fastify Zod contract API created under [`research/archived-spikes/spike_d_openapi/`](../../research/archived-spikes/spike_d_openapi).
- [x] Complete schema coverage tested: UUID, enums, nullable fields, arrays, pagination, nested objects, dates/timestamps, validation error schema, multipart upload, binary PDF streaming.
- [x] OpenAPI spec exported and compiled to `dart-dio` client (`oprino_api`) using `openapi-generator-cli 7.9.0`.
- [x] Dart client compiled cleanly with `build_runner` (72 outputs generated in 19.8s).
- [x] Live E2E tests against running Fastify server passed (4 of 4 tests).
- [x] Requirement for named schemas in `components.schemas` identified and documented.
- **Gate Status:** **PASSED**

### Gate E: Secure Storage & Installation Identity (Spike E)

- [x] Test project created under [`research/archived-spikes/spike_e_security/`](../../research/archived-spikes/spike_e_security).
- [x] Cryptographically random Installation ID (`inst_` + UUIDv4) generated and verified.
- [x] Namespace separation between `oprino_installation` and `oprino_auth_session` verified.
- [x] Cold app restart and update survival verified.
- [x] Logout isolation verified (session purged, Installation ID preserved).
- [x] Reinstall behavior verified (fresh Installation ID generated, no hardware fingerprinting).
- [x] Diagnostic metadata strictly decoupled from identity (zero MAC, IMEI, or Android ID).
- [x] Remote wipe flow verified (clears local credentials and purges domain cache upon server revocation).
- [x] Android backup & migration security (`android:dataExtractionRules` for Android 12+ and `android:fullBackupContent` for Android 11-) codified to exclude credentials, installation ID, and Drift SQLite databases from cloud backup and D2D device migration.
- [ ] **Physical Keystore / Keychain Native Execution:** **PENDING PHYSICAL HARDWARE** (Hardware key invalidation, OS update survival, and secure enclave execution unverified on physical silicon).
- **Gate Status:** **PARTIAL**

---

## 3. Architecture Validation Gate Evaluation

### Android Architecture Validation

**FAIL / BLOCKED: Physical Samsung and Xiaomi Devices Not Attached to Workstation**  
Software emulation, outbox persistence, Better Auth Bearer integration, and secure storage abstractions passed completely. However, zero physical devices are attached to ADB (`adb devices` is empty). Actual on-device validation of foreground/background tracking, aggressive OEM background killers (MIUI/HyperOS, Samsung One UI), Doze survival, physical GPS shutdown latency, and battery impact cannot be fabricated.

### iOS Architecture Validation

**BLOCKED BY REQUIRED macOS/Xcode ENVIRONMENT**  
Windows cannot execute native iOS builds or connect physical iPhones for profiling. All spike harnesses are structured so they can run on macOS, current stable Xcode, and a physical iPhone without modification.

### Scope Assessment for Remaining iOS Validation

The remaining iOS validation is **A BLOCKER FOR MOBILE PRODUCTION RELEASE ONLY**, NOT for Phase 01C monorepo repository scaffolding.

**Technical Reasoning:**

1. **Unified Cross-Platform Core:** The Flutter architecture unifies Drift SQLite offline persistence, Better Auth integration, OpenAPI Dio API client generation, state management, and business logic across both platforms. Monorepo scaffolding, web dashboard development, Fastify modular monolith implementation, and Android mobile client work can proceed without blocking on macOS.
2. **Vendor Plugin Parity:** `flutter_background_geolocation` wraps `TSLocationManager` on iOS, an established commercial library with first-class standard iOS background mode support (`UIBackgroundModes: location, fetch, processing`).
3. **Android Represents the More Volatile Boundary:** Android OEM background power management (Samsung One UI battery optimization, Xiaomi MIUI/HyperOS aggressive autostart killers, and Doze mode) is architecturally more volatile than iOS standard background location services. Passing Android physical validation establishes high confidence in the offline/location architecture.
4. **Release Gate Separation:** Scaffolding the repository, setting up CI/CD, and building the web dashboard and backend services can proceed in Phase 01C as soon as Android physical hardware tests pass, while physical iOS testing and profiling remain an uncompromised hard release gate for App Store publication in Phase 02.

---

## 4. Final Gate Verdict & Governance Record

By stakeholder executive determination, all architectural, software-level, cryptographic, schema, and API generation validation objectives for Phase 01B have concluded successfully. Multi-device physical Android OEM fleet profiling (Samsung One UI, Xiaomi HyperOS) and physical iOS Keychain/background testing are formally **DEFERRED** to the mobile release-validation gate, remaining mandatory before beta/production mobile release.

**Gate Status:** **PHASE 01B CONDITIONALLY CLOSED — PHASE 01C PRODUCTION SCAFFOLDING AUTHORIZED**
