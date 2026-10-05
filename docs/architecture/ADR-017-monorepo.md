# ADR-017: Monorepo Architecture, Polyglot Workspace Layout & Build Tooling

**Status:** APPROVED (Updated for Polyglot Flutter + TypeScript Workspace)  
**Date:** October 2026 (Revised & Re-Architected)  
**Deciders:** Lead Systems Architect, DevOps, Frontend & Mobile Leads  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))  
**Underlying Architecture:** **Turborepo + pnpm Workspaces (TypeScript) & Standalone Dart/Pub Workspace (Flutter)**

---

## 1. Context & Problem Statement

Oprino consists of multiple software applications and shared components operating across two primary language ecosystems:
1. **TypeScript Ecosystem:**
   - **Next.js Web Dashboard (`apps/web`):** Next.js 15 App Router.
   - **Core API Server (`services/api`):** Fastify TypeScript REST service.
   - **Background Worker (`services/worker`):** Node/BullMQ asynchronous background processor.
   - **Shared Domain Contracts (`packages/contracts`):** Zod schemas, Fastify type providers, OpenAPI 3.1 generator.
   - **Database Layer (`packages/database`):** Drizzle ORM schema, migrations, and seeders.
   - **Brand Design Tokens (`packages/tokens`):** Canonical JSON design tokens and Style Dictionary compilers.
2. **Dart / Flutter Ecosystem:**
   - **Unified Mobile App (`apps/mobile`):** Flutter (Phase 01C Scaffolding; Reference Baseline: Flutter 3.47 / Stable Dart Toolchain) targeting Android and iOS.
   - **Generated API Client (`generated/dart-api`):** Compiled Dart client and DTO models generated from the OpenAPI 3.1 specification.

Managing these components across independent repositories would cause severe contract drift, multi-repo PR gridlock, and version fragmentation. We require a polyglot monorepo layout with clear toolchain boundaries.

---

## 2. Alternatives Evaluated

### Alternative A: Polyglot Monorepo (pnpm Workspaces + Turborepo + Native Flutter Pub)
- **Architecture:** `pnpm` manages the TypeScript services and shared packages. Flutter (`apps/mobile`) and the generated Dart client (`generated/dart-api`) remain native Dart/Pub packages. Turborepo orchestrates cross-stack task execution (contracts export → Dart code-gen → Flutter tests).
- **Pros:**
  - Avoids shoehorning Dart packages into npm/pnpm.
  - Native Dart and Flutter tooling (`flutter pub get`, `flutter test`, `flutter build`) work without hacks.
  - Fast, cached TypeScript pipelines for Web and API.
  - Single git repository enables atomic commits across API schema changes, generated Dart models, and mobile client code.
- **Cons:** Requires lightweight wrapper scripts in root `package.json` to bridge TypeScript and Flutter task invocations.

### Alternative B: Nx Polyglot Monorepo with Community Dart Plugins
- **Architecture:** Nx workspace using community Nx Flutter plugins.
- **Pros:** Unified CLI for all commands (`nx run mobile:build`).
- **Cons:** Community Dart plugins for Nx are notoriously fragile, lag behind Flutter SDK updates, and break standard IDE tooling (Android Studio / VS Code Flutter extension).

### Alternative C: Multi-Repo Architecture (Separate Repos per Stack)
- **Architecture:** Separate Git repos for web, backend, mobile, and contracts.
- **Pros:** Absolute separation of git history.
- **Cons:** Catastrophic developer friction; requires publishing Dart packages and npm packages to private registries for simple field additions.

---

## 3. Decision

**Adopt Alternative A: Polyglot Monorepo using Turborepo + pnpm Workspaces for TypeScript Services, paired with a Native Dart/Pub Workspace for Flutter.**

### Architectural Rationale:
1. **Respect Tooling Boundaries:** Do **NOT** force Dart packages into `pnpm`. `pnpm` manages JavaScript/TypeScript dependencies; the `flutter` and `dart` CLIs manage Dart dependencies via standard `pubspec.yaml` files.
2. **Formal Contract Bridge via Generated Code:** Fastify generates `packages/contracts/openapi.json`. An automated script invokes `openapi-generator-cli` (`dart-dio`) to compile strongly-typed Dart code into `generated/dart-api`.
3. **Atomic Cross-Stack Commits:** A feature requiring a database migration, an API endpoint update, a web dashboard view, and a Flutter mobile screen is implemented, tested, and committed in a single pull request.

---

## 4. Polyglot Monorepo Structure

```text
oprino/
├── apps/
│   ├── web/                      # Next.js 15+ App Router Web Dashboard (pnpm)
│   └── mobile/                   # Flutter Unified Mobile App (pub; Reference Baseline: Flutter 3.47)
│       ├── lib/                  # Dart source (Employee, Manager, Owner surfaces)
│       ├── test/                 # Widget, unit, and golden tests
│       ├── android/              # Native Android gradle project
│       ├── ios/                  # Native iOS Xcode workspace
│       └── pubspec.yaml          # Flutter dependencies (references generated/dart-api)
│
├── services/
│   ├── api/                      # Fastify TypeScript Core REST API (pnpm)
│   └── worker/                   # BullMQ Asynchronous Background Worker (pnpm)
│
├── packages/
│   ├── contracts/                # Canonical Zod schemas & OpenAPI 3.1 exporter (pnpm)
│   ├── tokens/                   # Brand token source (JSON) & Style Dictionary compiler (pnpm)
│   ├── database/                 # PostgreSQL schema (Drizzle), migrations, seeders (pnpm)
│   ├── config-typescript/        # Shared base tsconfig files (pnpm)
│   └── config-eslint/            # Shared ESLint & Prettier configs (pnpm)
│
├── generated/
│   └── dart-api/                 # Auto-generated Dart API Client (pub package)
│       ├── lib/                  # Generated Dio client & DTO models
│       └── pubspec.yaml          # Standalone Dart package definition
│
├── docs/                         # Canonical System Architecture & Product PRD
├── .gitignore
├── pnpm-workspace.yaml           # Declares apps/web, services/*, packages/*
├── turbo.json                    # Turborepo task pipeline
└── package.json                  # Root orchestration scripts
```

---

## 5. Toolchain Configuration & Workspace Boundaries

### 5.1 `pnpm-workspace.yaml` (TypeScript Workspace)
```yaml
packages:
  - 'apps/web'
  - 'services/*'
  - 'packages/*'
```
*(Notice: `apps/mobile` and `generated/dart-api` are deliberately excluded from `pnpm-workspace.yaml`).*

### 5.2 Flutter Local Path Dependency (`apps/mobile/pubspec.yaml`)
```yaml
name: oprino_mobile
description: "Oprino Unified Role-Aware Mobile Application"
publish_to: "none"

environment:
  sdk: ">=3.6.0 <4.0.0"
  flutter: ">=3.47.0"

dependencies:
  flutter:
    sdk: flutter
  # Generated API client linked via local monorepo path
  oprino_api:
    path: ../../generated/dart-api
  dio: ^5.7.0
  drift: ^2.24.0
  sqlite3: ^2.5.0
  flutter_background_geolocation: ^4.16.0
  flutter_secure_storage: ^9.2.2
  go_router: ^14.6.0
  flutter_riverpod: ^2.6.1
```

### 5.3 Turborepo Pipeline (`turbo.json`)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "generate:contracts": {
      "cache": false
    },
    "generate:dart": {
      "dependsOn": ["generate:contracts"],
      "outputs": ["generated/dart-api/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 5.4 Root Orchestration Scripts (`package.json`)
```json
{
  "name": "oprino-monorepo",
  "private": true,
  "scripts": {
    "dev:web": "turbo run dev --filter=@oprino/web",
    "dev:api": "turbo run dev --filter=@oprino/api",
    "dev:mobile": "cd apps/mobile && flutter run",
    "generate:contracts": "pnpm --filter=@oprino/contracts export:openapi",
    "generate:dart": "pnpm generate:contracts && npx @openapitools/openapi-generator-cli generate -i packages/contracts/openapi.json -g dart-dio -o generated/dart-api --additional-properties=pubName=oprino_api,serializationLibrary=json_serializable",
    "build": "turbo run build",
    "test:ts": "turbo run test",
    "test:mobile": "cd apps/mobile && flutter test",
    "test": "pnpm test:ts && pnpm test:mobile"
  }
}
```

---

## 6. Consequences & Trade-offs

- **Positive:**
  - Zero friction for mobile developers: standard `flutter run` and `flutter test` work out of the box without Node/npm baggage.
  - End-to-end type safety: Fastify schema changes immediately trigger compilation failures in Flutter during local builds or CI.
  - Efficient CI caching: Turborepo caches TypeScript builds; Gradle/Xcode caches handle mobile compilation.
- **Negative:**
  - Requires developers working across the full stack to have both Node.js (Active-LTS) and Flutter (pinned Stable release, reference baseline: Flutter 3.47+) installed locally.
- **Compliance:**
  - Perfectly aligns with Phase 00 frozen product scope while establishing a scalable polyglot engineering structure.
