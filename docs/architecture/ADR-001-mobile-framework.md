# ADR-001: Mobile Application Framework Selection

**Status:** SUPERSEDED (React Native / Expo Decision Superseded by Stakeholder Directive) → **APPROVED (Flutter Stable + Dart Baseline)**  
**Date:** October 2026 (Revised & Re-Architected)  
**Deciders:** Stakeholder Technical Committee, Lead Systems Architect, Mobile Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))  
**Superseded Architecture:** React Native 0.76+ via Expo Prebuild (New Architecture / Bridgeless Mode)  
**Selected Architecture:** **Flutter Stable (Production Release at Phase 01C Scaffolding; Reference Baseline: Flutter 3.47 / Stable Dart Toolchain)**

---

## 1. Context & Problem Statement

Oprino requires two native-quality mobile operational experiences packaged within a single unified store binary:
1. **Employee Mobile Surface:** Offline-first task execution, background duty-hours location tracking, camera capture with metadata watermarks, on-glass customer signatures, and persistent duty-state visibility.
2. **Owner / Manager Mobile Surface:** Real-time operational map monitoring, instant approval workflows (proof of work, leave, attendance regularizations), operational exception alerts, and rapid task assignment.

Following the Phase 01A architecture review, a stakeholder directive mandated that the Oprino mobile application must be built using **Flutter**. This ADR formally records the superseding of the preliminary React Native evaluation and establishes the comprehensive Flutter architecture baseline across Android and iOS.

---

## 2. Superseded Decision Record (Historical)

*The initial Phase 01A draft evaluated React Native (Expo Prebuild) as Alternative A and Flutter as Alternative B. The React Native recommendation was selected primarily for monorepo language homogeneity (sharing TypeScript/Zod schemas with Fastify). That decision is hereby marked **SUPERSEDED** by stakeholder directive. The contract sharing model is transitioned to OpenAPI 3.1 code-generation (see [`docs/architecture/CONTRACT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/CONTRACT-STRATEGY.md) and [`ADR-018`](file:///workspace/oprino/docs/architecture/ADR-018-api-style.md)).*

---

## 3. Flutter Technical Evaluation (14 Core Dimensions)

To ensure enterprise-grade stability, predictable performance on budget frontline Android devices, and strict compliance with Apple App Store and Google Play guidelines, Flutter Stable is evaluated across 14 operational dimensions:

### 3.1 Current Stable Flutter Release & Runtime Policy
- **Flutter Framework Policy:** Oprino pins the current production Flutter Stable release at Phase 01C scaffolding (Reference baseline: Flutter 3.47 with the corresponding stable Dart toolchain). Exact versions are pinned via repository tooling during Phase 01C; the architecture avoids hard-freezing legacy minimum versions permanently in ADRs.
- **Rendering Engine:** **Impeller** (Metal on iOS, Vulkan on Android with OpenGL ES fallback). Impeller precompiles shaders ahead of time (AOT), eliminating shader compilation stutter ("jank") that historically affected low-to-mid tier mobile devices.
- **Compilation Target:** Ahead-Of-Time (AOT) compiled native ARM64 machine code, ensuring fast startup times (< 1.2s cold start) and minimal memory footprints on frontline devices.

### 3.2 Android Platform Support & SDK Policy
- **SDK Targets:** `minSdkVersion: 24` (Android 7.0+, covering > 96% of global active Android devices), `targetSdkVersion >= 36` (strictly following current Google Play target API policy at each release), and `compileSdkVersion` meeting or exceeding the toolchain requirement.
- **Foreground Service Integration:** Full native support for `android:foregroundServiceType="location|dataSync"` with ongoing persistent notifications (`NotificationCompat.Builder`) and custom Notification Channels.
- **Battery Optimization Exemption:** Standard Android Intents (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) to survive aggressive OEM task killers (Samsung One UI, Xiaomi MIUI/HyperOS, Oppo ColorOS, Vivo Funtouch).

### 3.3 iOS Platform Support
- **OS Targets:** `iOS 15.0+` minimum deployment target, supporting Swift 5.10+ and Xcode 16+.
- **CoreLocation Background Modes:** Native entitlement configuration for `UIBackgroundModes: ["location", "fetch", "processing", "remote-notification"]`.
- **Transparency Compliance:** Native integration with `showsBackgroundLocationIndicator = true` ensuring Apple App Store review guideline compliance for field workforce tracking.

### 3.4 Native Platform Channels & Interop
- **Inter-Process Communication:** Standard Flutter `MethodChannel` and `EventChannel` for asynchronous bidirectional communication between Dart and native Kotlin/Swift.
- **Type-Safe Code Generation:** **Pigeon** (`package:pigeon`) utilized for high-frequency or complex native platform bridges, generating compile-time type-safe Kotlin and Swift interfaces to prevent runtime string-key message serialization errors.
- **C/C++ Interop:** Direct C-FFI (`dart:ffi`) enables native-speed interaction with shared C libraries without method-channel marshaling overhead.

### 3.5 Background Services & Isolates
- **Dart Isolates:** Multi-threaded computation via independent Dart memory heaps (`Isolate.spawn`), keeping the main UI thread at a locked 60/120 FPS during heavy offline serialization or database query processing.
- **Background Task Execution:** Supported via `flutter_background_service` and `workmanager` for scheduled background synchronizations and periodic health checks when the app is backgrounded.

### 3.6 Foreground Services
- **Duty-Hours Foreground Service:** Managed directly by Transistor Software's `flutter_background_geolocation`, which initiates an OS-managed Android Foreground Service containing an active notification displaying current duty status ("Oprino: Shift Active — Location Monitored for Duty Tracking").

### 3.7 Push Notifications
- **Provider:** **Firebase Cloud Messaging (FCM)** for Android and **Apple Push Notification service (APNs)** for iOS via official `firebase_messaging` and `flutter_local_notifications` packages.
- **Background Message Handler:** Top-level background isolate handler (`@pragma('vm:entry-point')`) processes silent data pushes (e.g. instant shift cancellations, urgent task dispatch) even when the app is suspended.

### 3.8 Camera & Optical Proof Capture
- **Hardware Access:** Official `camera` package providing direct viewfinder streaming, auto-focus, torch control, and high-resolution photo capture.
- **On-Device Compression & Metadata:** Captured images are compressed client-side via `flutter_image_compress` (target: < 1.5MB JPEG) and embedded with GPS EXIF metadata (timestamp, latitude, longitude, altitude) prior to offline outbox queueing.

### 3.9 On-Glass Customer Signatures
- **Touch Capture:** Smooth vector signature capture on canvas using `signature` package with Catmull-Rom spline smoothing.
- **Export & Integrity:** Exports high-contrast PNG byte arrays directly into the local attachments directory, hashed with SHA-256 for cryptographic non-repudiation before sync upload.

### 3.10 In-App Maps & Geospatial Surfaces
- **Vector Map Rendering:** `flutter_map` (powered by Leaflet principles) with vector tile support via `maplibre_gl` or MapLibre vector tile endpoints, styled with Oprino's custom monochrome/slate basemap.
- **OS Navigation Handoff:** Direct deep-link launching (`url_launcher`) to Google Maps (`google.navigation:q=`) on Android and Apple Maps (`http://maps.apple.com/?daddr=`) on iOS for turn-by-turn routing at zero API cost.

### 3.11 Modern Offline Embedded Persistence
- **Engine Selection:** **Drift + SQLite** (`package:drift` + `package:sqlite3` with bundled native SQLite). Provides compile-time verified type-safe SQL, relational foreign keys, step-by-step schema migrations with verification tests, and background database execution via `NativeDatabase.createInBackground(...)` (see [`ADR-009`](file:///workspace/oprino/docs/architecture/ADR-009-offline-sync.md)).

### 3.12 Secure Platform Storage
- **Hardware-Backed Storage:** `flutter_secure_storage` protects sensitive credentials and installation tokens using:
  - **Android:** Platform-backed secure encrypted storage utilizing Android Keystore-protected key material.
  - **iOS:** Keychain-backed secure storage with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
  - Implementation follows the pinned supported plugin release without hard-coding obsolete Android Jetpack library internals.

### 3.13 Non-Invasive Device Identity & Governance
- **Oprino Installation Identity:** Upon first launch, Oprino generates a cryptographically random, non-hardware-fingerprinted Installation ID (`installation_id`) saved in secure storage.
- **Diagnostic Metadata:** `device_info_plus` collects non-invasive operational telemetry (device model, manufacturer, OS build) strictly for troubleshooting and administrative visibility—never as an authentication identity or invasive hardware fingerprint.
- **Biometric Authentication:** `local_auth` package enables biometric unlock (fingerprint, Face ID, device PIN) for app re-entry.

### 3.14 Testing, Build & Release Pipeline
- **Automated Testing:** 
  - Unit & Bloc/Repository Tests: `test` and `bloc_test`.
  - Widget & UI Component Tests: `flutter_test`.
  - Integration Tests on Real Hardware: `integration_test` executing end-to-end flows on Android and iOS devices/emulators.
  - Golden Tests: `golden_toolkit` verifying pixel-perfect brand consistency across device viewports.
- **CI/CD & Code Signing:** Standard automated Gradle/Fastlane pipelines for Google Play (AAB) and App Store Connect (IPA). Optional over-the-air (OTA) code patch engine (Shorebird) evaluated for rapid post-release bug fixes without full store review.

---

## 4. Decision & Rationale

**Adopt Flutter Stable (Reference Baseline: Flutter 3.47 / Stable Dart Toolchain; exact version pinned at Phase 01C Scaffolding) as the Exclusive Mobile Application Framework for Android and iOS.**

### Decisive Rationale:
1. **Unrivaled Cross-Platform UI Consistency & Impeller Speed:** Flutter renders directly to native Vulkan/Metal canvas via Impeller, ensuring that complex operational surfaces (live attendance cards, task agendas, signature pads) render with rock-solid 60/120 FPS performance across fragmented budget Android devices without JavaScript bridge overhead.
2. **First-Class Offline Relational Architecture:** The modern Drift architecture (`package:drift` + `package:sqlite3` with bundled native SQLite) provides a compile-time type-safe relational database engine with isolate-safe background execution (`NativeDatabase.createInBackground`).
3. **Enterprise Background Location Support:** Transistor Software officially maintains `flutter_background_geolocation`, providing identical battle-tested native background services, stationary motion geofences, and OEM battery-killer survivability in Flutter as in React Native.
4. **Unified Role-Aware Architecture:** A single Flutter codebase compiles into the unified `com.oprino.app` store binary, dynamically presenting Employee, Manager, and Owner surfaces via role-driven state management (see [`ADR-020`](file:///workspace/oprino/docs/architecture/ADR-020-mobile-packaging.md)).
5. **Decoupled Cross-Language Contract Safety:** Rather than relying on monorepo TypeScript imports, Oprino establishes OpenAPI 3.1 as the formal contract boundary between Fastify and Flutter, auto-generating a strongly-typed Dart client via `openapi-generator-cli` (`dart-dio`).

---

## 5. Consequences & Mitigations

- **Consequence:** Loss of direct TypeScript/Zod schema imports across Mobile and Web.  
  *Mitigation:* Fastify auto-generates OpenAPI 3.1 specifications (`openapi.json`), which compile into strongly-typed Dart models and API clients using `openapi-generator-cli` with `dart-dio`. CI/CD validates that the OpenAPI spec and generated Dart client are in 100% lockstep before merges.
- **Consequence:** Initial binary size is larger than minimal native Kotlin/Swift apps due to bundled Flutter C++ engine and Impeller runtime (~15–20MB AAB download size).  
  *Mitigation:* Negligible impact on modern LTE/5G networks; well within Google Play / App Store standard thresholds for enterprise field applications.
- **Consequence:** Engineering team requires Dart and Flutter proficiency.  
  *Mitigation:* Dart's object-oriented syntax is instantly familiar to TypeScript/C#/Java developers; comprehensive widget architecture, Flutter DevTools, and static analysis provide high onboarding velocity.

---

## 6. References
- Controlling PRD: [`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md)
- Packaging Strategy: [`docs/architecture/ADR-020-mobile-packaging.md`](file:///workspace/oprino/docs/architecture/ADR-020-mobile-packaging.md)
- Background Geolocation: [`docs/architecture/ADR-008-background-location.md`](file:///workspace/oprino/docs/architecture/ADR-008-background-location.md)
- Local Offline Storage: [`docs/architecture/ADR-009-offline-sync.md`](file:///workspace/oprino/docs/architecture/ADR-009-offline-sync.md)
- Cross-Language Contract Strategy: [`docs/architecture/CONTRACT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/CONTRACT-STRATEGY.md)
