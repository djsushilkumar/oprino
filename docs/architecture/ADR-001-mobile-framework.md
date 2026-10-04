# ADR-001: Mobile Application Framework Selection

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, Mobile Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Oprino requires two native-quality mobile application experiences targeting both Android and iOS:
1. **Employee Mobile App:** Offline-first execution, background duty-hours location tracking, camera capture with metadata watermarks, on-glass customer signatures, and persistent duty-state visibility.
2. **Owner / Manager Mobile App:** Real-time operational map monitoring, instant approval workflows (proof of work, leave, attendance regularizations), operational exception alerts, and rapid task assignment.

The framework choice must satisfy demanding operational constraints:
- Reliable background execution and foreground service management across a fragmented spectrum of budget Android devices (MIUI, ColorOS, OneUI, stock Android) and strict iOS lifecycle limits.
- High-performance local embedded database operations for offline queuing and synchronization.
- High developer velocity and maximum code/contract sharing across Mobile, Web, and Backend in an SMB-cost-effective engineering structure.

---

## 2. Alternatives Evaluated

### Alternative A: React Native (via Expo Prebuild / New Architecture Bridgeless)
- **Overview:** Meta's cross-platform framework using TypeScript, React 19, Fabric renderer, TurboModules, and the Bridgeless C++ runtime.
- **Background Location:** Supported via native foreground services (`android:foregroundServiceType="location"`) and Transistor Software's industry-standard `react-native-background-geolocation` or background actions.
- **Offline Storage:** High-performance native SQLite via `op-sqlite`, WatermelonDB, or Expo SQLite.
- **Code Sharing:** 100% shared TypeScript domain models, Zod validation schemas, API contracts, and utility libraries with Next.js Web and Fastify Backend.
- **Native Escape Hatch:** Expo Config Plugins and Prebuild generate clean, reproducible native Kotlin/Swift projects while retaining OTA update capabilities.

### Alternative B: Flutter (Google / Dart)
- **Overview:** Google's UI toolkit compiling directly to native ARM machine code using the Impeller rendering engine (Vulkan on Android, Metal on iOS).
- **Background Location:** Supported via `flutter_background_service`, `geolocator`, and Transistor's `flutter_background_geolocation`.
- **Offline Storage:** Drift (typed SQLite abstraction) and Isar. Exceptional local database performance.
- **Code Sharing:** Dart language boundary prevents direct code/type sharing with TypeScript Web and Backend; requires maintaining dual model definitions or complex code generation (Protobuf/OpenAPI).
- **Native Escape Hatch:** Standard Flutter platform channels and FFI.

### Alternative C: Fully Separate Native Apps (Kotlin for Android + Swift for iOS)
- **Overview:** Developing separate native Android and native iOS apps from scratch.
- **Pros:** Unmatched native OS access and zero cross-platform abstraction overhead.
- **Cons:** 2x engineering headcount, severe risk of feature drift between Android and iOS, doubled maintenance cost, unfeasible for SMB SaaS economics.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | React Native (Expo) | Flutter (Dart) | Separate Native (Kotlin/Swift) |
|---|:---:|:---:|:---:|:---:|
| **Android Foreground Services & Reliability** | 15% | 9 / 10 | 9 / 10 | 10 / 10 |
| **iOS Background Location Compliance** | 15% | 9 / 10 | 9 / 10 | 10 / 10 |
| **Offline Embedded Storage & Sync Engine** | 15% | 9 / 10 (op-sqlite/Watermelon) | 10 / 10 (Drift) | 10 / 10 (Room/CoreData) |
| **Monorepo & Contract Sharing with Web/API** | 20% | **10 / 10 (Unified TS/Zod)** | 5 / 10 (Dual Language) | 2 / 10 (Triple Language) |
| **Native Device Hardware (Camera/Signatures)** | 10% | 9 / 10 | 9 / 10 | 10 / 10 |
| **UI Performance on Budget Android Devices** | 10% | 8.5 / 10 (Bridgeless) | 9.5 / 10 (Impeller) | 10 / 10 |
| **Developer Velocity & SMB Cost Efficiency** | 15% | **9.5 / 10** | 7.5 / 10 | 4 / 10 |
| **Weighted Total** | **100%** | **9.15 / 10** | **8.15 / 10** | **6.10 / 10** |

---

## 4. Decision

**Adopt React Native using Expo Prebuild (Continuous Native Generation) and the New Architecture (Bridgeless Mode).**

### Key Rationale:
1. **End-to-End TypeScript Monorepo:** Using React Native allows Oprino to share 100% of domain types, Zod validation schemas, business logic utilities, and API client contracts across the Mobile Apps, Web Dashboard, and Backend API in a single monorepo (`packages/contracts`). This eliminates cross-platform API drift—the single biggest source of mobile bugs in distributed field applications.
2. **Proven Background Location Capabilities:** Transistor Software’s `react-native-background-geolocation` is the global benchmark for enterprise field tracking, battle-tested across thousands of Android OEM variations (handling Samsung, Xiaomi, and Vivo battery optimizations) and fully supporting Android 14/15/16 foreground location services.
3. **High-Performance Offline SQLite:** Utilizing `op-sqlite` (direct JSI bindings to C++ SQLite) delivers sub-millisecond query execution on device, perfectly satisfying Oprino's offline-first local queue requirement.
4. **Unified App Shell:** Both the Employee Mobile App and Manager Mobile App can live within the same monorepo codebase or share foundational component packages, slashing development and maintenance overhead.

---

## 5. Consequences & Mitigations

- **Consequence:** React Native historically had bridge overhead and frame drops on low-end Android devices.  
  *Mitigation:* Enable the React Native New Architecture (Fabric + Bridgeless Mode), which communicates directly with C++ without the serialized JSON bridge.
- **Consequence:** Background location permissions on iOS and Android require strict native manifest configurations.  
  *Mitigation:* Utilize Expo Config Plugins to generate authoritative, reproducible `AndroidManifest.xml` and `Info.plist` entries programmatically during build, preventing manual native file drift.
- **Reversal Cost:** High. Re-architecting from React Native to Flutter would require rewriting the mobile client layer in Dart, though backend and web contracts would remain intact.
