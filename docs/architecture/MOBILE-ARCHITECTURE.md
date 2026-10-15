# Oprino — Mobile Application Architecture (Flutter)

**Document:** Authoritative Mobile Technical Architecture  
**Auditor:** Principal Flutter Engineer  
**Branch:** `release/v1-stabilization`  
**Framework:** Flutter 3.47.6 / Dart 3.13.5 (Stable)  
**Platforms:** Android (API 24–36, TargetSdk 35, CompileSdk 36) & iOS (iOS 15+)  
**ADR References:** [`ADR-001`](./ADR-001-mobile-framework.md), [`ADR-008`](./ADR-008-background-location.md), [`ADR-009`](./ADR-009-offline-sync.md), [`ADR-020`](./ADR-020-mobile-packaging.md), [`ADR-021`](./ADR-021-zero-cost-gps-pipeline.md)  

---

## 1. High-Level Mobile Layer Architecture

```mermaid
graph TD
    UI["📱 Presentation Layer (Flutter Widgets)<br/>Riverpod State Providers, GoRouter Shells, Theme Tokens"] --> Domain
    Domain["🧠 Domain Layer (Business Logic & Use Cases)<br/>Duty state machine, Invariant guards, Task lifecycle"] --> Data
    Data["💾 Data Layer (Repositories & Services)<br/>SyncService, LocationService, MediaUploadService"]
    Data --> LocalDB["Drift SQLite Database<br/>`CachedLocations`, `OutboxQueue`"]
    Data --> SecureStore["flutter_secure_storage<br/>Auth tokens, Device Installation ID"]
    Data --> RemoteAPI["Generated Dart Dio API Client<br/>HTTP REST, 15-min Presigned Uploads"]
```

---

## 2. Core Mobile Subsystems

### A. Offline-First Drift SQLite Engine (`ADR-009`)
* **Database File:** Managed by Drift via `package:sqlite3` / bundled native SQLite.
* **Tables:**
  - `CachedLocations`: Stores on-duty GPS points when offline, tagged with `workspaceId`, `userId`, `lat`, `lng`, `accuracy`, and `recordedAt`.
  - `OutboxMutations`: Stores pending entity changes (checklists, punch actions, task status) with client-generated UUIDs.
* **Auto-Drain (`SyncService`):** Monitors network connectivity. Upon reconnect, drains the queue in chronological order, verifies server receipts, and cleans up local temporary state.

### B. Duty-Hours Location Engine (`ADR-021`)
* **Foreground Service:** Uses an Android Foreground Service displaying a persistent notification while active.
* **Duty State Machine:**
  - `NOT_STARTED` -> `PUNCH_PENDING` -> `ON_DUTY` -> `OFF_DUTY`.
  - Location tracking starts strictly upon reaching `ON_DUTY`.
  - When the user punches out, the service is terminated immediately.
* **Privacy Guarantee:** Zero off-duty location fixes are captured, queued, or transmitted.

### C. Media Capture & Proof-of-Work Pipeline (`ADR-012`)
* **Camera Capture:** Uses `image_picker` configured for physical camera acquisition, with strict image byte validation via `MediaValidator` (magic bytes, dimensions, and size limits).
* **3-Tier Watermark System:**
  1. **Permanent Bitmap Watermark:** Burned onto raw pixels by `WatermarkService` using `Canvas` and `ui.PictureRecorder`, producing immutable PNG pixels with a high-contrast metadata banner (timestamp, GPS coordinates, task ID).
  2. **UI Preview Overlay:** Real-time Flutter widget preview displayed in `PhotoProofSheet` before and after photo capture.
  3. **Audit JSON Metadata:** Structured audit payload persisted in PostgreSQL database `task_proofs.watermark_metadata` JSONB column.
* **Customer Digital Signature:** Hand-drawn vector strokes captured on glass via `CustomerSignatureSheet`, rasterized into authentic PNG image bytes (`0x89, 0x50, 0x4E, 0x47`) by `SignatureRasterizer`, uploaded directly to authorized object storage, and queued with `isBinaryUploaded: false` in Drift outbox if offline.
* **Persistent Storage:** Un-synced media is saved in `getApplicationSupportDirectory()` (`pending_media/`), surviving Doze mode and OS cache purges.

---

## 3. Android Native Configuration & Build Hardening

* **SDK Levels:** `minSdk = 24`, `targetSdk = 35`, `compileSdk = 36`.
* **Cross-Drive Windows Guard:** [`apps/mobile/android/build.gradle.kts`](../../apps/mobile/android/build.gradle.kts) guards subproject `buildDirectory` overrides against drive-letter mismatch crashes:
  ```kotlin
  subprojects {
      val projectRoot = project.projectDir.toPath().root
      val buildRoot = newBuildDir.asFile.toPath().root
      if (projectRoot == buildRoot) {
          project.layout.buildDirectory.value(newBuildDir.dir(project.name))
      }
  }
  ```
* **Network Security Isolation:**
  - `src/debug/AndroidManifest.xml`: Permits `usesCleartextTraffic="true"` solely for local test server connectivity (`10.0.2.2:3001`).
  - `src/main/` & `src/release/`: Strictly prohibits cleartext HTTP.
* **Fail-Closed Release Signing:** If release keystore environment variables are missing, release builds fail closed instead of silently falling back to insecure debug keystores.
