# ADR-017: Monorepo Architecture, Package Layout & Build Tooling

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, DevOps, Frontend & Mobile Leads  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Oprino consists of multiple software applications and shared components:
1. **Owner/Manager Web Dashboard:** Next.js App Router web application.
2. **Employee & Manager Mobile Apps:** React Native (Expo Prebuild) targeting Android and iOS.
3. **Core API Server:** Fastify TypeScript REST service.
4. **Background Worker:** BullMQ background job processor.
5. **Shared Domain Contracts:** Zod schemas, DTOs, domain event interfaces, sync mutation contracts.
6. **Brand Design System:** Canonical color tokens, typography scales, spacing units derived from the Oprino Brand Kit.
7. **Database Layer:** Database schemas, migration files, and query repositories.

Managing these components across independent Git repositories would cause:
- **Contract Drift:** Mobile and Web apps falling out of sync with backend API changes.
- **Dependency Duplication:** Multiple versions of shared utilities, date-handling libraries, and brand tokens.
- **Coordination Friction:** Requiring multi-repo pull requests, manual npm publishing, and complex release coordination.

We require a unified monorepo architecture that maximizes developer velocity, enables atomic full-stack commits, enforces strict package boundaries, and provides fast, cached build pipelines.

---

## 2. Alternatives Evaluated

### Alternative A: Turborepo + pnpm Workspaces
- **Package Manager:** `pnpm` with strict dependency isolation via hard links and symlinks, preventing phantom dependencies.
- **Build Orchestrator:** Vercel's `Turborepo` providing fast incremental builds, topological execution graphs, task pipelining, and local/remote computation caching.
- **Pros:**
  - Extremely fast cache hits; written in Rust.
  - Native integration with Next.js, Fastify, and React Native (Expo Prebuild).
  - Minimal configuration overhead compared to older enterprise tools.
  - Native pnpm workspace protocol (`workspace:*`) for zero-build local development symlinks.
- **Cons:** Remote caching requires setting up Vercel Remote Cache or self-hosted S3 cache.

### Alternative B: Nx + pnpm / npm Workspaces
- **Overview:** Enterprise monorepo tool originally created for Angular, now supporting React/Node.
- **Pros:** Deep dependency graph visualization, project generators, rich plugin ecosystem.
- **Cons:** Significantly steeper learning curve, high configuration verbosity, heavy framework-specific plugins that can conflict with Expo prebuild workflows.

### Alternative C: Multi-Repo Architecture (Separate Repos per App)
- **Overview:** Independent Git repositories for `oprino-web`, `oprino-mobile`, `oprino-api`, `oprino-shared`.
- **Pros:** Complete isolation of git commit history.
- **Cons:** Destroys developer velocity; requires private npm package registry, version bumping, and multi-repo PR coordination for simple API field changes.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | Alternative A: Turborepo + pnpm | Alternative B: Nx | Alternative C: Multi-Repo |
|---|:---:|:---:|:---:|
| **Developer Velocity & Frictionless Setup** | 25% | **9.5 / 10** | 7 / 10 | 4 / 10 |
| **Type & Contract Sharing (TS/Zod)** | 25% | **10 / 10 (Instant symlinks)** | 9 / 10 | 4 / 10 (Publish delay) |
| **Expo React Native Compatibility** | 20% | **9.5 / 10 (Standard Metro config)** | 7.5 / 10 | 8 / 10 |
| **Build & CI Pipeline Caching** | 15% | **9.5 / 10 (Fast Rust engine)** | 9.5 / 10 | 3 / 10 (No shared cache) |
| **Maintenance Simplicity for SMB Team** | 15% | **9.5 / 10** | 6.5 / 10 (Heavy plugins) | 5 / 10 |
| **Weighted Total** | **100%** | **9.65 / 10** | **7.95 / 10** | **4.75 / 10** |

---

## 4. Decision & Rationale

**Selected Architecture: Alternative A — Turborepo + pnpm Workspaces.**

### Rationale:
1. **Contract Integrity:** Changes to API request/response schemas in `@oprino/contracts` immediately propagate to `apps/web`, `apps/mobile`, and `apps/api` without building or publishing packages. TypeScript compiler flags any breaking schema mismatch in real time.
2. **Deterministic & Fast:** `pnpm` prevents the dreaded "phantom dependency" bugs common in npm/yarn where packages inadvertently import unlisted transitive dependencies. Hard-linking saves gigabytes of disk space across apps.
3. **Seamless Expo Prebuild Support:** Expo Prebuild works cleanly with Turborepo using standard Metro monorepo configuration (`watchFolders` pointing to workspace packages).

---

## 5. Monorepo Structure & Package Layout

```
oprino/
├── apps/
│   ├── api/                    # Fastify TypeScript Core REST API
│   ├── worker/                 # BullMQ Asynchronous Background Worker
│   ├── web/                    # Next.js App Router Web Dashboard
│   └── mobile/                 # React Native (Expo Prebuild) iOS/Android App
│
├── packages/
│   ├── contracts/              # Shared Zod Schemas, API DTOs, Event Models, Sync DTOs
│   ├── tokens/                 # Oprino Brand Tokens (Colors, Typography, Spacing)
│   ├── database/               # PostgreSQL Schema (Drizzle), Migrations, Seeders
│   ├── utils/                  # Pure TypeScript utility functions (dates, geohash, math)
│   ├── config-typescript/      # Shared base tsconfig files
│   └── config-eslint/          # Shared ESLint & Prettier configs
│
├── docs/                       # Architecture, PRD, Brand System, Audits
├── .gitignore
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 5.1 Workspace Task Pipeline (`turbo.json`)
The monorepo pipeline defines strict task dependencies:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 5.2 Package Boundaries & Dependency Rules
- `packages/contracts`: Must remain 100% pure TypeScript and Zod. Zero native or runtime dependencies (no database drivers, no UI components). Safe for import anywhere.
- `packages/tokens`: Exports brand colors, spacing, and typography primitives consumed by Tailwind in Web and StyleSheet/Unistyles in Mobile.
- `packages/database`: Contains PostgreSQL connection logic and Drizzle ORM schemas. Must NEVER be imported into `apps/mobile` or `apps/web` (enforced via package `private: true` and ESLint boundary rules).
- `apps/mobile` and `apps/web`: Communicate with the backend strictly through HTTP REST and SSE endpoints defined in `packages/contracts`.

---

## 6. Consequences & Trade-offs

- **Positive:**
  - One pull request can update an API endpoint, update the mobile client, and update the web dashboard simultaneously with guaranteed type safety.
  - Zero package registry publishing delay.
  - Single, uniform ESLint, Prettier, and TypeScript configuration.
- **Negative:**
  - Large single repository git clone.
  - Metro bundler on React Native requires `watchFolders` configuration to properly resolve symlinked monorepo packages.
- **Mitigation:**
  - Standard Expo monorepo template handles Metro symlinks cleanly without custom brittle scripts.

---

## 7. Compliance with Phase 00 Approved Scope

- Ensures full parity between Employee Mobile, Owner/Manager Mobile, and Owner/Manager Web Dashboard by sharing the identical domain contracts and brand tokens.
- Supports rapid multi-industry expansion with modular package boundaries.
