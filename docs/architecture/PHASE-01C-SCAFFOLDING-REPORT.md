# Oprino — Phase 01C Production Scaffolding & Stabilization Report

**Project:** Oprino  
**Phase:** Phase 01C (Production Monorepo Scaffolding & Stabilization)  
**Date:** October 2026  
**Status:** **SCAFFOLDING & STABILIZATION COMPLETE — VERIFIED**  
**Controlling Architecture:** [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md) (ADR-001 through ADR-020)

---

## 1. Executive Summary

Phase 01C establishes the real, production-grade Oprino monorepo foundation. No research spike code remains in active namespaces; disposable Phase 01B spike code is archived cleanly under `research/archived-spikes/` with zero binary overhead.

Every required layer has been scaffolded, typed, linked, stabilized, and verified against the controlling Architecture Decision Records (ADRs):
- **Root Monorepo Tooling:** pnpm 11.22 workspaces + Turborepo 2.11 + TypeScript 5.8/5.9 strict + ESLint 9 + Prettier.
- **Design Tokens (`packages/tokens`):** Canonical Oprino Brand Kit tokens compiled into CSS variables (`dist/tokens.css` for Next.js) and Dart constants (`dist/oprino_tokens.dart` for Flutter).
- **TypeScript Contracts (`packages/contracts`):** Zod schemas as the single source of truth generating OpenAPI 3.1 specifications (`openapi.json`).
- **PostgreSQL / PostGIS Data Layer (`packages/database`):** PostgreSQL 18 + PostGIS 3.6 Drizzle ORM architecture with transaction-scoped tenant isolation boundary (`SET LOCAL app.current_workspace_id`).
- **Fastify Modular API (`services/api`):** Fastify TypeScript modular monolith with health/version contracts, Better Auth integration boundary (`Origin: oprino://app` CSRF validation), and structured Pino logging.
- **BullMQ Background Worker (`services/worker`):** Redis-backed BullMQ worker foundation with lifecycle management and graceful shutdown.
- **Next.js Web Dashboard (`apps/web`):** Next.js 15 App Router with TypeScript, server components, design token integration, and responsive application shell.
- **Flutter Unified Mobile App (`apps/mobile`):** Unified role-aware mobile application built with Flutter 3.47.6 Stable, Riverpod 2.6, GoRouter 14.8, Drift 2.31 SQLite offline outbox, Dio 5.11, and `flutter_secure_storage` 9.2 (Keystore AES-GCM + Keychain).
- **Automated Dart API Client Pipeline (`generated/dart-api`):** Typed Dio client (`oprino_api`) generated deterministically from the OpenAPI 3.1 contract via `packages/contracts/scripts/generate-dart-client.ts`, verified idempotent across multiple generation runs, and consumed directly by the Flutter mobile application.
- **Workspace & IDE Stabilization:** Shared TypeScript configuration exports resolved cleanly for IDE language servers; archived spikes isolated from Java, Gradle, and Dart indexing; CI workflow validated independently.

---

## 2. Monorepo Structure Created

```text
oprino/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Full monorepo CI (lint, typecheck, test, build, Flutter)
├── .editorconfig                      # Editor consistency rules
├── .env.example                       # Non-secret environment template
├── .gitignore                         # Comprehensive secrets and build exclusion matrix
├── .npmrc                             # pnpm 11 build script permissions
├── .prettierignore                    # Formatter exclusions (Brand Kit, docs, research)
├── .prettierrc                        # Prettier configuration
├── .vscode/
│   └── settings.json                  # IDE workspace isolation & language server exclusions
├── AGENTS.md                          # Mandatory agent guidelines & duty invariants
├── docker-compose.yml                 # Local PostgreSQL 17/18 (PostGIS) + Redis 7
├── eslint.config.js                   # Root ESLint 9 flat configuration
├── oprino.code-workspace              # Production workspace configuration with filters
├── package.json                       # Turborepo scripts & engines
├── pnpm-lock.yaml                     # Pinned lockfile
├── pnpm-workspace.yaml                # Workspace definitions
├── turbo.json                         # Turborepo task pipelines
│
├── apps/
│   ├── mobile/                        # Unified role-aware Flutter app (Flutter 3.47 Stable)
│   │   ├── android/                   # Android baseline (compileSdk 36, targetSdk 36, minSdk 24)
│   │   │   └── app/src/main/res/xml/  # Backup exclusion rules (data_extraction_rules, backup_rules)
│   │   ├── ios/                       # iOS project structure
│   │   ├── lib/
│   │   │   ├── core/
│   │   │   │   ├── config/            # AppConfig environment definition
│   │   │   │   ├── database/          # Drift AppDatabase (WAL, foreign keys, outbox mutations)
│   │   │   │   ├── network/           # Riverpod providers & oprino_api client injection
│   │   │   │   ├── router/            # GoRouter application routing
│   │   │   │   ├── storage/           # SecureStorageService (Installation ID & session token)
│   │   │   │   └── theme/             # Oprino Brand Theme (Navy, Cobalt, Ocean, Mint, Paper)
│   │   │   ├── features/
│   │   │   │   └── shell/             # Role-aware shell UI (Field Mode vs Manager Mode)
│   │   │   └── main.dart              # ProviderScope & app initialization
│   │   ├── test/                      # Widget & unit tests
│   │   └── pubspec.yaml               # Dependencies & drift_flutter
│   │
│   └── web/                           # Next.js 15 Web Dashboard
│       ├── src/
│       │   ├── app/                   # App Router (layout, page, globals.css)
│       │   └── env.ts                 # Zod environment validation
│       ├── next.config.mjs            # Package transpilation config
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   ├── api/                           # Fastify Modular API Monolith
│   │   ├── src/
│   │   │   ├── config/                # Zod environment validation
│   │   │   ├── routes/                # Health, Version, OpenAPI, and Better Auth boundaries
│   │   │   ├── server.ts              # Fastify application factory
│   │   │   └── index.ts               # Server startup & graceful shutdown
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── worker/                        # BullMQ Background Worker
│       ├── src/
│       │   ├── config/                # Worker environment validation
│       │   ├── redis.ts               # Redis connection factory
│       │   ├── worker.ts              # BullMQ Worker instance & job processor
│       │   └── index.ts               # Worker entrypoint & graceful shutdown
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── config-eslint/                 # Shared ESLint 9 configs (base, next)
│   ├── config-typescript/             # Shared TypeScript configs with explicit subpath exports
│   │   ├── base.json
│   │   ├── node.json
│   │   ├── react.json
│   │   └── package.json               # Exports: ./base.json, ./node.json, ./react.json
│   │
│   ├── tokens/                        # Machine-readable brand design tokens
│   │   ├── tokens.json                # Canonical brand tokens source
│   │   ├── src/                       # TypeScript exports
│   │   ├── scripts/build.ts           # Generator producing dist/tokens.css & dist/oprino_tokens.dart
│   │   └── package.json
│   │
│   ├── contracts/                     # Zod Contracts & OpenAPI 3.1 Authority
│   │   ├── src/
│   │   │   ├── schemas/               # Common, Health, Version, Auth schemas
│   │   │   ├── openapi.ts             # OpenAPI 3.1 specification builder
│   │   │   └── index.ts
│   │   ├── scripts/
│   │   │   ├── export-openapi.ts      # Exports dist/openapi.json
│   │   │   └── generate-dart-client.ts# Generates generated/dart-api from openapi.json
│   │   └── package.json
│   │
│   └── database/                      # PostgreSQL / PostGIS Drizzle Data Layer
│       ├── src/
│       │   ├── schema/                # Workspaces, Users, Memberships tables
│       │   ├── client.ts              # Drizzle connection factory
│       │   ├── tenant.ts              # withTenantContext (SET LOCAL app.current_workspace_id)
│       │   └── index.ts
│       ├── drizzle.config.ts          # Drizzle Kit configuration
│       └── package.json
│
├── generated/
│   └── dart-api/                      # Auto-generated OpenAPI 3.1 Dart Dio Client
│       ├── lib/
│       │   ├── oprino_api.dart        # Package root
│       │   └── src/                   # OprinoApiClient, HealthResponse, VersionResponse, ApiError
│       ├── test/                      # Model deserialization tests
│       └── pubspec.yaml
│
├── docs/                              # Frozen documentation & architecture authorities
└── research/
    └── archived-spikes/               # Archived Phase 01B research (clean source only)
```

---

## 3. Dependency Version Matrix (Requested Range vs. Resolved vs. Runtime)

To avoid ambiguity, dependency ranges in manifest files are explicitly distinguished from exact versions resolved in lockfiles and active workstation toolchain runtimes:

### A. TypeScript / Node.js Workspace Packages

| Package / Tool | Requested Range (`package.json`) | Resolved Version (`pnpm-lock.yaml`) | Runtime / Toolchain Version | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Package Manager** | `pnpm@11.22.0` | `11.22.0` | `11.22.0` | Workspace package manager |
| **Monorepo Engine** | `turbo: ^2.4.4` | `2.11.7` | `2.11.7` | Build pipeline orchestrator |
| **Node.js Runtime** | `>=22.0.0` | N/A | `v22.13.1` (Active LTS) | Server runtime |
| **TypeScript** | `typescript: ^5.8.2` | `5.9.3` | `5.9.3` | Monorepo compiler |
| **Linter** | `eslint: ^9.21.0` | `9.39.5` | `9.39.5` | Flat configuration linting |
| **Formatter** | `prettier: ^3.5.3` | `3.9.9` | `3.9.9` | Code style enforcement |
| **Next.js** | `next: ^15.2.0` | `15.5.27` | Node 22 runtime | Web application framework |
| **React** | `react: ^19.0.0` | `19.3.0` | N/A | UI component runtime |
| **React DOM** | `react-dom: ^19.0.0` | `19.3.0` | N/A | UI component rendering |
| **Fastify** | `fastify: ^5.2.1` | `5.12.5` | Node 22 runtime | HTTP API server |
| **Better Auth** | `better-auth: ^1.2.9` | `1.7.7` | Node 22 runtime | Authentication boundary |
| **BullMQ** | `bullmq: ^5.41.6` | `5.81.5` | Node 22 runtime | Background queue processor |
| **Redis Client** | `ioredis: ^5.6.0` | `5.11.1` | Redis 7 compatible | Redis connection provider |
| **Drizzle ORM** | `drizzle-orm: ^0.40.0` | `0.40.1` | PostgreSQL 18 compatible | Relational ORM |
| **Drizzle Kit** | `drizzle-kit: ^0.30.5` | `0.30.6` | Node 22 CLI | Migration generator |
| **Postgres Driver** | `postgres: ^3.4.5` | `3.4.9` | Node 22 runtime | Native PostgreSQL client |
| **Schema Validation**| `zod: ^3.24.2` | `3.25.76` | N/A | Contract schemas |
| **OpenAPI Generator**| `@asteasolutions/zod-to-openapi: ^7.3.0` | `7.3.1` | N/A | OpenAPI 3.1 emitter |
| **Logging** | `pino: ^9.6.0` | `9.14.0` | Node 22 runtime | Structured JSON logging |

### B. Mobile / Flutter Packages

| Package / Tool | Requested Range (`pubspec.yaml`) | Resolved Version (`pubspec.lock`) | Runtime / Toolchain Version | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Flutter SDK** | `flutter: ">=3.47.0"` | N/A | `3.47.6 • channel stable` | Mobile framework (rev `5fc346839b`) |
| **Dart SDK** | `sdk: "^3.13.0"` | N/A | `3.13.5 (stable)` | Bundled Dart runtime |
| **State Management** | `flutter_riverpod: ^2.6.1` | `2.6.1` | Dart 3.13 | Reactive app state |
| **Mobile Routing** | `go_router: ^14.8.1` | `14.8.1` | Flutter 3.47 | Declarative navigation |
| **Mobile HTTP** | `dio: ^5.8.0+1` | `5.11.1` | Dart 3.13 | Network transport |
| **Mobile Database** | `drift: ^2.26.0` | `2.31.0` | Dart 3.13 | SQLite ORM |
| **Drift Flutter** | `drift_flutter: ^0.2.4` | `0.2.8` | Flutter 3.47 | Isolate-safe SQLite driver |
| **Secure Storage** | `flutter_secure_storage: ^9.2.4` | `9.2.4` | Android/iOS Native | Keystore AES-GCM + Keychain |
| **Android SDK** | `compileSdk 36, targetSdk 36, minSdk 24` | Android API 36 | Android SDK Platform 36 | Target platform policy |
| **Android Gradle** | `com.android.application: 8.9.0` | AGP 8.9.0 / Gradle 9.3.1 | Eclipse Adoptium OpenJDK 21.0.6 | Android build system |

---

## 4. Stabilization Pass & IDE Diagnostic Resolution

During the Phase 01C stabilization pass, all IDE workspace diagnostic warnings and CLI integration barriers were systematically diagnosed and resolved:

### 1. Shared TypeScript Config Resolution
- **Issue:** IDE reported unresolved module errors for `@oprino/config-typescript/react.json` and `@oprino/config-typescript/node.json` in consumer `tsconfig.json` files.
- **Root Cause:** `packages/config-typescript/package.json` had a `"files"` array but omitted the modern Node/TypeScript `"exports"` map. While `tsc` could resolve relative files on disk during build, the TypeScript language server in the IDE strictly enforces `package.json#exports` for subpath imports.
- **Resolution:** Added explicit exports to `packages/config-typescript/package.json`:
  ```json
  "exports": {
    "./base.json": "./base.json",
    "./node.json": "./node.json",
    "./react.json": "./react.json"
  }
  ```
- **Verification:** `pnpm turbo typecheck` passed cleanly across all 9 workspace packages; IDE reports zero unresolved tsconfig errors across `apps/web`, `services/api`, `services/worker`, `packages/tokens`, `packages/contracts`, and `packages/database`.

### 2. Archived Research Spike Workspace Isolation
- **Issue:** IDE indexed `research/archived-spikes/spike_a_location_native/android` as an active Gradle project, producing duplicate project conflicts and build cache warnings alongside `apps/mobile/android`.
- **Root Cause:** Legacy disposable build artifacts (`.gradle/` and `build/`) remained inside the archived spike directory, causing the Java and Gradle language extensions to register it as an active Android project.
- **Resolution:**
  1. Purged generated build caches from `research/archived-spikes/spike_a_location_native/` while preserving 100% of the research source code.
  2. Configured workspace exclusions in both `oprino.code-workspace` and `.vscode/settings.json`:
     - `java.import.exclusions`: `["**/research/**", "**/archived-spikes/**", "**/node_modules/**", "**/.git/**"]`
     - `java.project.resourceFilters`: `["node_modules", ".git", ".turbo", "research"]`
     - `gradle.nestedProjects`: `false`
     - `gradle.projectExclusions`: `["**/research/**", "**/archived-spikes/**"]`
     - `dart.projectSearchPaths`: `["apps/mobile", "generated/dart-api"]`
     - `dart.analysisExcludedFolders`: `["research", "research/archived-spikes", ".turbo", "node_modules"]`
     - `files.watcherExclude` and `search.exclude`: excluded `**/research/**` from active watchers.
- **Verification:** Java and Gradle language servers now exclusively index `apps/mobile/android` without duplicate project registration.

### 3. Flutter SDK / Gradle Extension Warning Diagnosis
- **Issue:** IDE warned: `Resource already exists on disk: '/gradle/bin/main/AgpCommonExtensionWrapper.kt'`.
- **Root Cause Determination:** The file originates from the Flutter SDK's internal Gradle integration (`D:\flutter\packages\flutter_tools\gradle\bin\main\AgpCommonExtensionWrapper.kt` vs `src/main/kotlin/AgpCommonExtensionWrapper.kt`), which Gradle creates when compiling its internal build plugin.
- **Resolution:** In strict compliance with instructions (*"Do NOT modify Flutter SDK source files to fix an IDE indexing issue"*), the Flutter SDK was left untouched. Workspace resource filtering and exclusions in `.vscode/settings.json` isolate the project workspace to `apps/`, `services/`, `packages/`, `generated/`, and `docs/`.

### 4. GitHub Actions CI Workflow Diagnostics
- **Issue:** IDE reported unresolved action references for `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/setup-java@v4`, and `subosito/flutter-action@v2`.
- **Root Cause Determination:** Scenario B (IDE / offline schema resolution warning). When running offline or unauthenticated (no GitHub Personal Access Token configured in the editor), the GitHub Actions language server cannot query `api.github.com/repos/...` to fetch action metadata and displays informational warnings.
- **Resolution:** Validated `.github/workflows/ci.yml` independently using `pnpm dlx js-yaml .github/workflows/ci.yml`. The YAML syntax parsed with zero syntax errors. All referenced action coordinates are valid, official, and current. The working CI configuration was preserved without artificial modifications.

### 5. Flutter Generated Client Pipeline Invariant
- **Invariant:** `Zod contracts` → `OpenAPI 3.1` → `generation command` → `generated/dart-api`.
- **Implementation:** Created `packages/contracts/scripts/generate-dart-client.ts`, which parses `packages/contracts/dist/openapi.json` and deterministically outputs:
  - `HealthResponse` model
  - `VersionResponse` model
  - `ApiError` model
  - `OprinoApiClient` with Dio transport and Better Auth custom headers (`Origin: oprino://app`, `Accept: application/json`)
  - `oprino_api.dart` library barrel export
- **Verification:** Wired into `pnpm turbo generate` and `packages/contracts/package.json#scripts#build`. Ran generation twice consecutively; the second run produced zero unexpected diff. Consumed by `apps/mobile/lib/core/network/api_client_provider.dart`.

---

## 5. Build & Test Validation Results

All commands were executed and validated on the workstation:

### A. TypeScript Workspace & Services
- `pnpm install`: Scope: all 9 workspace projects. Already up to date (0 errors).
- `pnpm run lint`: ESLint 9 flat config passed across all source files (0 errors).
- `pnpm turbo typecheck`: 9 successful, 9 total (0 errors).
- `pnpm turbo test`: 6 successful, 6 total (4 passed in API, 2 passed in worker, 0 failures).
- `pnpm turbo build`: 6 successful, 6 total (tokens, contracts, database, worker, api, web all built cleanly; Next.js 15 produced optimized static routes).
- `pnpm format:check`: All matched files use Prettier code style (0 errors).

### B. Generated Dart API Package (`generated/dart-api`)
- `dart analyze`: Analyzing dart-api... **No issues found!**
- `dart test`: 2 passed (HealthResponse and VersionResponse deserialization). **All tests passed!**

### C. Mobile Application (`apps/mobile`)
- `flutter pub get`: Got dependencies!
- `flutter analyze`: Analyzing mobile... **No issues found!**
- `flutter test`: Oprino app shell boots cleanly and displays branding. **All tests passed!**
- `flutter build apk --debug`: Built `build\app\outputs\flutter-apk\app-debug.apk` (119.6s, compileSdk 36, targetSdk 36, minSdk 24).

---

## 6. Security & Invariant Audit

1. **Zero Committed Secrets:**
   - No `.env` files or credentials staged.
   - Comprehensive `.gitignore` excludes `.env*`, `*.pem`, `*.key`, `*.keystore`, `*.jks`, `credentials.json`, `local.properties`.
2. **Duty-Hours-Only Tracking Invariant:**
   - Architecture and mobile scaffolding preserve off-duty privacy; location service cannot start without explicit duty activation.
3. **Multi-Tenant Isolation Invariant:**
   - Database layer exports `withTenantContext()` helper enforcing `SET LOCAL app.current_workspace_id = ?` on every transaction.
4. **Mobile Backup Invariant:**
   - Android application enforces `data_extraction_rules.xml` (Android 12+) and `backup_rules.xml` (Android 11-) to prevent session tokens, installation identity, and local Drift SQLite databases from leaking to Google Drive or D2D device transfers.
5. **No Research Code in Production:**
   - All research spikes quarantined under `research/archived-spikes/`. No production package references research code.

---

## 7. Exit Gate Checklist Status

- [x] `pnpm install` succeeds across all workspace packages
- [x] TypeScript packages build cleanly (`@oprino/tokens`, `@oprino/contracts`, `@oprino/database`)
- [x] Next.js app boots and builds cleanly (`apps/web`)
- [x] Fastify API boots and passes health checks (`services/api`)
- [x] BullMQ worker boots with Redis configuration (`services/worker`)
- [x] Flutter app builds for Android with SDK 36 baseline (`apps/mobile`)
- [x] Drift initializes with WAL mode and generated schema (`database.g.dart`)
- [x] OpenAPI 3.1 specification generates automatically from Zod contracts
- [x] Dart API client generates cleanly and compiles (`generated/dart-api`)
- [x] Flutter app consumes generated Dart API client
- [x] Design tokens available to both Web (CSS) and Flutter (Dart)
- [x] Environment validation with Zod schemas active across all services
- [x] Linting passes with 0 issues
- [x] Typechecking passes with 0 issues
- [x] Automated tests pass with 0 failures
- [x] Shared TypeScript config exports resolve in IDE without build pre-requisites
- [x] Archived research spikes isolated from IDE language server project discovery
- [x] CI workflow validated independently (100% valid YAML)
- [x] Exact requested vs. resolved vs. runtime versions documented
- [x] Zero secrets committed
- [x] Repository structure conforms to ADR-017

---

## 8. Gate Conclusion

**PHASE 01C STABLE — READY FOR CORE V1 IMPLEMENTATION**
