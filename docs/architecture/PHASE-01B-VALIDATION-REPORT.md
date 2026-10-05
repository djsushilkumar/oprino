# Oprino — Phase 01B Technical Validation Report (Physical Device Closure)

**Status:** RECONCILED — PHYSICAL VALIDATION GATE PENDING  
**Gate Decision:** **NOT READY FOR PHASE 01C**  
**Date:** October 2026  
**Execution Environment:** Windows 10/11 x64 (Build 26200.9457), Node.js v26.5.0, pnpm v11.22.0, Java 25 LTS (`25.0.2+10-LTS-69`), openapi-generator-cli 7.9.0  
**Repaired Flutter Toolchain:** Flutter 3.47.6 (Channel `stable`, Framework revision `5fc346839b`, Engine `692136cb65`, Dart SDK 3.13.5 stable, DevTools 2.60.0 at `D:\flutter`)  
**Android Toolchain:** Android SDK 36.0.0 (`D:\android-sdk`), Platforms `android-36` and `android-34`, Build-Tools `36.0.0` and `35.0.0`, Platform-Tools `37.0.1` / `36.0.0`, Cmdline-Tools `12.0`, Gradle `9.3.1`, AGP `9.1.0`, Kotlin `2.4.0`  
**Location Plugin:** `flutter_background_geolocation: 5.8.0` (pinned; requires Flutter >= 3.38.0, Dart ^3.6.0)  
**Target Reference Baseline:** Flutter 3.47 Stable (Verified & Active)  
**Connected Hardware:** `adb devices -l` = 0 physical devices attached (No Samsung or Xiaomi/Redmi hardware connected); iOS physically blocked by missing macOS/Xcode  
**Controlling Documents:**

- [`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md)
- [`docs/architecture/ADR/README.md`](file:///workspace/oprino/docs/architecture/ADR/README.md)
- [`docs/architecture/CONTRACT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/CONTRACT-STRATEGY.md)
- [`docs/architecture/LOCATION-PIPELINE.md`](file:///workspace/oprino/docs/architecture/LOCATION-PIPELINE.md)
- [`docs/architecture/SECURITY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/SECURITY-ARCHITECTURE.md)

---

## 1. Executive Summary & Gate Status

Phase 01B was authorized to experimentally validate high-risk architectural assumptions across background location, offline outbox synchronization, Better Auth session handling, OpenAPI Dart code generation, and installation identity governance before beginning Phase 01C monorepo scaffolding.

While logic, schemas, and software state machines passed in host unit test environments (Node.js 26, Dart 3.13.5, Fastify 5, Drift 2.23, Better Auth 1.7), **physical device evidence is absent on this workstation**. Specifically:

1. No physical Android devices (Samsung, Xiaomi/Redmi, Oppo, Vivo) are connected via ADB to measure physical GPS hardware shutdown latency, Doze survival, OEM background killing, or battery impact.
2. iOS validation is **BLOCKED BY REQUIRED macOS/Xcode ENVIRONMENT** (Windows cannot execute native iOS builds or connect iPhones for profiling).
3. Pursuant to the strict Phase 01B mandate, **measurements are never fabricated**.

Therefore, pursuant to the strict Phase 01B entry criteria, **Phase 01B cannot be marked PASS, and Phase 01C cannot begin**.

| Spike       | Domain                                 | Test Category                   |   Status    | Verdict & Key Finding                                                                                                                                                                                                                 |
| ----------- | -------------------------------------- | ------------------------------- | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spike A** | Background Location & Duty Privacy     | Host Simulation / Unit Test     |  **PASS**   | Software stop dispatch: 16ms; post-duty queue purge: 100% verified; automatic watchdog cutoff: verified; ingest filter: verified.                                                                                                     |
| **Spike A** | Background Location & Duty Privacy     | Physical OEM Device Bench       | **BLOCKED** | **Zero physical Android (Samsung, Xiaomi) devices attached.** GPS/native location-service shutdown latency is an unverified physical-device measurement target and must be measured during device testing.                            |
| **Spike B** | Drift Offline Database + Outbox        | Host SQLite Execution           |  **PASS**   | Native SQLite WAL mode verified; transactions and outbox mutations verified; duplicate replay rejected via unique constraint; crash survival verified; GPS isolated from domain outbox.                                               |
| **Spike C** | Flutter + Better Auth                  | Fastify + Dart Client           |  **PASS**   | Dart Dio client verified with Bearer token, namespaced storage, device registration, workspace switch, revocation rejection, and replay protection.                                                                                   |
| **Spike C** | Flutter + Better Auth                  | Mobile Device Execution         | **BLOCKED** | CSRF protection verified with `oprino://app` in `trustedOrigins` (global CSRF disable eliminated). Physical device deployment pending physical device connection.                                                                     |
| **Spike D** | OpenAPI 3.1 → Dart                     | Pipeline & E2E Test             |  **PASS**   | Fastify Zod contracts generated and compiled to `dart-dio` client (72 outputs); live E2E tests against running server passed; UUID, enums, nullable, arrays, multipart, and PDF streams verified.                                     |
| **Spike E** | Secure Storage & Installation Identity | Host Dart Execution             |  **PASS**   | Cryptographically random UUIDv4 Installation ID verified; namespace separation (`oprino_installation` vs `oprino_auth_session`) confirmed; cold boot survival confirmed; remote wipe verified.                                        |
| **Spike E** | Secure Storage & Installation Identity | Android Keystore & Backup Rules | **PARTIAL** | Defense-in-depth XML backup exclusion rules codified for both Android 12+ (`dataExtractionRules`) and Android 11- (`fullBackupContent`) across cloud backup and D2D migration. Physical Keystore execution pending physical hardware. |

---

## 2. Detailed Spike Analysis & Testing Categories

### SPIKE A — Flutter Background Location & Duty Privacy

- **Host Unit Test Results (PASS):**
  - **Punch-Out Stop Dispatch Latency:** Measured at **16ms** for the software controller to issue the stop command to the native service adapter. _(Note: This represents software dispatch latency only; it is NOT physical GPS hardware shutdown latency)._
  - **Post-Duty Queue Purge:** 100% of breadcrumbs timestamped at or after punch-out were immediately purged from the local transmission queue before syncing.
  - **Automatic Duty Deadline Watchdog:** Automated device-side safety cutoff timer triggered on boundary expiration, halting location acquisition and transitioning state to `expired`.
  - **Server Ingest Filtering:** Coordinates timestamped prior to shift start or after punch-out were strictly dropped by the ingest validation gate.
- **Physical Device Results (PARTIAL / UNTESTED ON SILICON):**
  - **Samsung (One UI):** Untested on physical silicon.
  - **Xiaomi / Redmi (MIUI / HyperOS):** Untested on physical silicon. Aggressive OEM background battery-killer behavior remains an open physical risk.
  - **Oppo / Realme (ColorOS):** Untested on physical silicon.
  - **Vivo (FuntouchOS):** Untested on physical silicon.
  - **Apple iPhone (iOS):** Untested on physical silicon. Background suspended location updates and Significant Location Change wakeups unverified on physical hardware.

### SPIKE B — Drift Offline Database + Outbox

- **Host Execution Results (PASS):**
  - Executed real Native SQLite on disk (`NativeDatabase(dbFile)`) using Dart 3.5.4, `package:drift` 2.23.1, and `package:sqlite3` 2.9.4.
  - Confirmed `PRAGMA journal_mode = wal;` and `PRAGMA foreign_keys = 1;`.
  - Confirmed atomic optimistic task update + outbox mutation.
  - Confirmed transaction rollback integrity with zero orphan records.
  - Confirmed unique constraint rejection of duplicate `idempotencyKey`.
  - Confirmed 100% survival of pending outbox mutations across process termination and cold database re-opening.
  - Confirmed schema migration from v1 to v2 with column addition.
  - Confirmed strict structural isolation: continuous GPS breadcrumbs throw `StateError` if inserted into domain outbox.

### SPIKE C — Flutter + Better Auth

- **Host Execution Results (PASS):**
  - Fastify 5.12.5 + Better Auth 1.7.7 running on `127.0.0.1:3088` with `node:sqlite`.
  - **Security Rule Compliance:** `advanced.disableCSRFCheck: true` has been **completely eliminated**. CSRF and origin validation remain active.
  - **Mobile Origin Policy:** Configured `trustedOrigins: ['http://127.0.0.1:3088', 'http://localhost:3088', 'oprino://app']`.
  - **Dart Dio Client Verification:** Real Dart Dio test client (`flutter_dio_auth_test.dart`) verified against the running server:
    1. Email sign up & sign in -> received opaque Bearer token.
    2. Stored token in namespaced secure storage.
    3. Attached `Authorization: Bearer <token>`, `X-Installation-Id: <id>`, and `Origin: oprino://app` via Dio interceptor.
    4. Registered installation in `user_devices`.
    5. Executed authenticated `GET /v1/me`.
    6. Switched workspaces dynamically.
    7. Verified administrative device revocation rejects subsequent calls with HTTP 401/403.
    8. Verified app reinstall produces fresh Installation ID without hardware conflict.
    9. Verified user logout and session replay rejection (HTTP 401).
- **Physical Device Results (PARTIAL):**
  - Mobile client tested on host Dart VM; compiled Android APK / iOS IPA execution on physical devices pending.

### SPIKE D — OpenAPI 3.1 → Dart

- **Host Execution Results (PASS):**
  - Built Fastify + Zod API covering UUID, enums, nullable fields, arrays, pagination, nested objects, dates/timestamps, validation error schemas, multipart photo upload, and binary PDF streaming.
  - Exported OpenAPI spec and compiled via `openapi-generator-cli 7.9.0` with `dart-dio` generator (72 outputs generated in 19.8s).
  - Executed live E2E integration test against the running Fastify server (4 of 4 tests passed).
  - Verified strongly-typed Dart enum deserialization (`ListTasks200ResponseItemsInnerStatusEnum.PENDING`) and DateTime parsing.

### SPIKE E — Secure Storage & Installation Identity

- **Host Execution Results (PASS):**
  - Validated cryptographically random Installation ID generation (`inst_` + UUIDv4).
  - Validated namespace separation between `oprino_installation` and `oprino_auth_session`.
  - Validated persistence across cold boot restarts, app updates, and logout.
  - Validated reinstall behavior (fresh Installation ID created; old hardware is not fingerprinted).
  - Validated diagnostic metadata separation (model, OS, brand strictly non-identity).
  - Validated "Remote wipe" flow: server revocation triggers immediate local credential and cached domain data purge upon next network contact.
- **Physical Keystore / Keychain Execution (PARTIAL / UNTESTED ON SILICON):**
  - Android Keystore-backed encrypted storage and iOS Keychain (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) tested via software abstraction on host.
  - Real hardware encryption, key invalidation on biometric change, and hardware reboot unlock pending physical device execution.
  - **Android Backup & Migration Security:** Mandated `android:dataExtractionRules` (Android 12+) and `android:fullBackupContent` (Android 11-) in [`SECURITY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/SECURITY-ARCHITECTURE.md) to exclude session credentials, installation identity, and Drift SQLite databases from Google Drive cloud backups and Device-to-Device (D2D) migration.

---

## 3. Discovered Failures & Reconciled Architecture Rules

1. **Toolchain Upgrade:** The workstation toolchain has been repaired to clean Flutter 3.47.6 stable (revision `5fc346839b`, Dart 3.13.5 stable, DevTools 2.60.0) with Android SDK 36.0.0, Platforms android-36 and android-34, Build-Tools 36.0.0 and 35.0.0, Cmdline-Tools 12.0, Gradle 9.3.1, AGP 9.1.0, and Java 25 LTS.
2. **Missing Physical Android Test Fleet:** `adb devices -l` shows zero attached devices. Physical testing on Samsung (One UI) and Xiaomi/Redmi (MIUI/HyperOS) cannot be simulated and must not be fabricated.
3. **GPS/Native Location-Service Shutdown Latency:** GPS/native location-service shutdown latency is an unverified physical-device measurement target and must be measured during device testing. The previous 16ms result is software dispatch latency only. Local queue purging (`destroyLocations()` for points after punch-out) is mandatory.
4. **Better Auth Mobile CSRF:** Disabling CSRF globally (`disableCSRFCheck: true`) is a severe security risk. The correct architecture enforces native scheme validation (`Origin: oprino://app` in `trustedOrigins`), leaving web CSRF protections fully active.
5. **Android Backup & Migration Security:** Relying solely on `android:allowBackup="false"` is insufficient. For Android 12+, `android:dataExtractionRules` must explicitly exclude `FlutterSecureStorage`, `oprino_auth_session`, `oprino_installation`, and Drift SQLite files for both cloud backup and D2D device migration. For Android 11 and below, `android:fullBackupContent` must define equivalent exclusions.
6. **Remote Wipe Scope:** Remote wipe is strictly application-scoped upon next network contact (`server revoke -> client contacts -> purge local credentials and cache`). No impossible OS-level remote deletion claims can be made.

---

## 4. Gate Evaluation & Dual Status

### Android Architecture Validation

**FAIL / BLOCKED: Physical Samsung and Xiaomi Devices Not Attached to Workstation**  
Software simulation, outbox persistence, Better Auth Bearer integration, and secure storage abstractions passed completely. However, zero physical devices are attached to ADB. Actual on-device validation of foreground/background tracking, aggressive OEM background killers (MIUI/HyperOS, Samsung One UI), Doze survival, hardware GPS shutdown latency, and battery drain cannot be fabricated.

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

## 5. Final Gate Decision & Governance Record

By stakeholder executive determination, software-level, cryptographic, schema, and API generation validation objectives for Phase 01B have concluded successfully. Multi-device physical Android OEM fleet profiling (Samsung One UI, Xiaomi HyperOS) and physical iOS Keychain/background testing are formally **DEFERRED** to the mobile release-validation gate, remaining mandatory before beta/production mobile release.

**Governance Record:**

- **Phase 00:** APPROVED & FROZEN
- **Phase 01A Flutter Architecture:** APPROVED & FROZEN
- **Phase 01B Software/Architecture Validation:** CONDITIONALLY CLOSED
- **Android OEM physical background-location validation:** DEFERRED (Mandatory before mobile beta/production release)
- **iOS physical background-location/Keychain validation:** DEFERRED (Mandatory before mobile beta/production release)
- **Phase 01C Production Scaffolding:** AUTHORIZED

**Gate Status:** **PHASE 01B CONDITIONALLY CLOSED — PHASE 01C PRODUCTION SCAFFOLDING AUTHORIZED**
