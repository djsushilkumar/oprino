# Oprino — Local Developer Environment Setup

**Document:** Complete Local Development Guide  
**Auditor:** Principal DevOps Engineer & Full-Stack Lead  
**Branch:** `release/v1-stabilization`  

---

## 1. Prerequisites & Toolchain

Ensure your local development workstation satisfies the following version constraints:

| Dependency | Required Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | `>= 22.0.0` (Active LTS) | `node -v` | Node 22+ required for native TS and modern ESM. |
| **pnpm** | `>= 9.0.0` (pnpm 11 recommended) | `pnpm -v` | Core package manager across monorepo workspaces. |
| **Java / JDK** | JDK 17, 21, or 25 | `java -version` | Required for Gradle Android compilation. |
| **Flutter** | Flutter 3.47.x (Stable) | `flutter --version` | Required for mobile application builds. |
| **Android SDK** | API 34 to 36 | `sdkmanager --list` | Set `ANDROID_HOME` or configure `local.properties`. |
| **Docker / Postgres** | PostgreSQL 16+ with PostGIS | `psql -V` | Optional: Can use Docker or local isolated pilot server. |

---

## 2. Step-by-Step Monorepo Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/djsushilkumar/oprino.git
cd oprino
git checkout release/v1-stabilization
pnpm install --frozen-lockfile
```

### 2. Compile Design Tokens & OpenAPI Contracts
```bash
pnpm turbo build
```
This automatically compiles:
- `packages/tokens` -> `tokens.css`, `tokens.json`, `oprino_tokens.dart`
- `packages/contracts` -> `dist/openapi.json` & `generated/dart-api`

### 3. Configure Android Local Properties
In `apps/mobile/android/local.properties`, specify your local SDK paths:
```properties
sdk.dir=D:\\android-sdk
flutter.sdk=D:\\flutter
flutter.buildMode=debug
flutter.versionName=0.1.0
flutter.versionCode=1
```

---

## 3. Fast Zero-Dependency Local Testing (Pilot Mode)

You can run and test the complete system locally without configuring external databases or cloud buckets:

### Start Isolated Backend:
```bash
pnpm pilot:server
```
Runs at `http://localhost:3001` with synthetic tenant *Apex Field Services*.

### Execute Pilot Test Scenarios:
```bash
pnpm pilot:test
```
Verifies 11 full operational workflows including selfie punch-in, GPS tracking, and manager approvals.

### Run Next.js Web Dashboard:
```bash
pnpm --filter @oprino/web dev
```
Accessible at `http://localhost:3000`.

### Build & Run Mobile Client:
```bash
cd apps/mobile
flutter pub get
flutter run
```
Or compile the Android debug APK:
```bash
cd apps/mobile/android
.\gradlew.bat :app:assembleDebug
```
Output: `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`.
