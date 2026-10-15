# Oprino — Monorepo Repository Map

**Document:** Authoritative Directory & Module Map  
**Auditor:** Principal Software Architect  
**Branch:** `release/v1-stabilization`  

---

## 1. Top-Level Directory Tree

```
oprino/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines (CI, Pilot APK, Staging)
├── apps/
│   ├── mobile/                 # Flutter mobile client (Android & iOS)
│   └── web/                    # Next.js 15 App Router web management dashboard
├── services/
│   ├── api/                    # Fastify 5 REST API service
│   └── worker/                 # BullMQ 5 background worker service
├── packages/
│   ├── config-eslint/          # Shared ESLint 9 configuration
│   ├── config-typescript/      # Shared tsconfig profiles
│   ├── contracts/              # Single source of truth Zod schemas & OpenAPI generator
│   ├── database/               # PostgreSQL schema, Drizzle ORM, RLS migrations
│   └── tokens/                 # Design token compiler (CSS, Dart, JSON)
├── generated/
│   └── dart-api/               # Generated Dart Dio client (derived from OpenAPI 3.1)
├── docs/                       # Authoritative documentation tree
│   ├── architecture/           # Architecture overviews, ADRs, technical specs
│   ├── audits/                 # Bug registers, feature matrix, branch inventories
│   ├── brand/                  # Brand guidelines & token mappings
│   ├── deployment/             # Deployment runbooks, staging setup, cloud guides
│   ├── development/            # Local developer setup, testing, troubleshooting
│   ├── handoff/                # Handoff specifications
│   ├── implementation/         # Historical milestone reports
│   ├── product/                # PRD, V1 scope, role definitions
│   └── releases/               # Release candidate reports, launch checklists, rollback plans
├── Oprino-Brand-Kit/           # Immutable official Brand Kit assets (v1.3)
├── research/
│   └── archived-spikes/        # Historical Phase 01B spike prototypes
└── scripts/                    # Automation, pilot testing, and link validation scripts
```

---

## 2. Deep Module Walkthrough

### 2.1 `apps/mobile/` (Flutter Client)
* **Entry Point:** `lib/main.dart`
* **Configuration:** `lib/core/config/app_config.dart` (Environment and API resolution)
* **Architecture:** Feature-first layered architecture (Domain, Data, Presentation) powered by Riverpod and GoRouter.
* **Core Subsystems:**
  - `lib/core/auth/`: Better Auth Dio interceptor (`auth_interceptor.dart`), device registration (`device_service.dart`).
  - `lib/core/database/`: Drift SQLite local storage (`app_database.dart`) managing the `CachedLocations` offline queue.
  - `lib/core/location/`: `LocationService` managing the Android Foreground Service, duty-hours boundaries, and geofence proximity.
  - `lib/core/sync/`: `SyncService` outbox queue drainer, `MediaUploadService` managing persistent app-support private storage.
  - `lib/features/attendance/`: Selfie capture sheet, punch-in/out view, optimistic UI rollback.
  - `lib/features/field_operations/`: Live camera photo proof sheet (`photo_proof_sheet.dart`), digital signature canvas (`customer_signature_sheet.dart`).
  - `lib/features/tasks/`: Task list, checklist item toggling, proof review sheet.
  - `android/`: Android native project (compileSdk 36, split debug/release manifests, fail-closed release signing).
  - `test/`: 60 automated unit and widget tests covering auth, offline sync, media, and location.

### 2.2 `apps/web/` (Next.js Dashboard)
* **Entry Point:** `src/app/layout.tsx`
* **Architecture:** Next.js 15 App Router with React 19, Server Components, TanStack Query, and Tailwind CSS.
* **Routes (17 Static Pages):**
  - `/`: Landing redirect / session gate.
  - `/auth/signin`, `/auth/signup`: Better Auth authentication forms.
  - `/auth/activate`: Single-use employee invitation activation flow (`BLK-002`).
  - `/dashboard`: High-level operational KPIs, shift summary, active workers.
  - `/live-map`: MapLibre SVG live location tracker with real-time SSE streaming.
  - `/attendance`: Team attendance register, selfie proof modal, time audit.
  - `/tasks`: Kanban and list task views, checklist inspection, manager verification actions.
  - `/visits`: Field visit scheduler and route reordering.
  - `/customers`: Customer directory and site geofence management.
  - `/team`: Employee roster, role assignment, manager linking, bulk CSV onboarding (`BLK-003`).
  - `/settings`: Company policies (mandatory selfie policy, configurable location retention `BLK-006`).
  - `/reports`: Operational SLA reports, attendance summaries, CSV export.

### 2.3 `services/api/` (Fastify REST Service)
* **Entry Point:** `src/index.ts` & `src/server.ts`
* **Configuration:** `src/config/env.ts` (Zod environment schema with fail-closed production validations).
* **Core Subsystems:**
  - `src/plugins/`: Auth plugin (Better Auth integration), RLS plugin, error handler, CORS, Helmet.
  - `src/routes/`: Route modules for auth, workspaces, attendance, telemetry, tasks, visits, customers, shifts, reports, media, health.
  - `src/services/`: Domain services enforcing business logic:
    - `workspace.service.ts`: Workspace creation, invitations, bulk CSV, employee lifecycle.
    - `attendance.service.ts`: Punch-in/out validation, selfie ownership verification, duration calculation.
    - `telemetry.service.ts`: Duty-hours filter, GPS accuracy check, travel summary aggregation, SSE ticketing.
    - `storage.service.ts`: S3/R2 presigned URL generator with entity ownership verification.
  - `test/`: 182 comprehensive unit and integration tests with real PostgreSQL RLS.

### 2.4 `services/worker/` (Background Worker)
* **Entry Point:** `src/index.ts`
* **Technology:** BullMQ 5 + Redis 7.
* **Responsibilities:**
  - Automated 30-day location telemetry partition pruning (`telemetry_prune_expired_records`).
  - Recurring task template scheduler.
  - SLA overdue visit and task alerts.
  - All DB queries wrapped in transaction-scoped `SET LOCAL app.current_workspace_id`.

### 2.5 `packages/contracts/` (Source of Truth Schemas)
* **Entry Point:** `src/index.ts`
* **Schemas (`src/schemas/`):** Zod definitions for workspaces, users, attendance, telemetry, tasks, visits, customers, shifts, reports.
* **Scripts:**
  - `scripts/export-openapi.ts`: Exports OpenAPI 3.1 specification to `dist/openapi.json`.
  - `scripts/generate-dart-client.ts`: Generates strongly typed Dart Dio client to `generated/dart-api`.

### 2.6 `packages/database/` (Data Layer)
* **Entry Point:** `src/index.ts`
* **ORM:** Drizzle ORM + postgres.js.
* **Migrations (`drizzle/`):**
  - `0000_phase_01c_scaffolding.sql`: Core schema (users, accounts, sessions, workspaces).
  - `0001_phase_02b_tasks_attendance.sql`: Tasks, visits, checklists, attendance sessions.
  - `0002_phase_02c_location_pipeline.sql`: Telemetry partitions, PostGIS geofences, pruning procedure.
  - `0003_phase_03_field_operations.sql`: Customer sites, proof records, digital signatures.
  - `0004_phase_04_advanced_operations.sql`: Shift rosters, recurring templates, audit logs.
  - `0005_v1_blockers_remediation.sql`: Workspace invitations, bulk CSV schema, attendance policy, configurable retention.

### 2.7 `packages/tokens/` (Design Tokens)
* **Source:** `Oprino-Brand-Kit/05-Design-Tokens/`
* **Compiler:** `scripts/build.ts`
* **Outputs:** `dist/tokens.css` (Web CSS variables), `dist/oprino_tokens.dart` (Flutter Dart constants), `dist/tokens.json`.

### 2.8 `scripts/` (DevOps & Test Tooling)
* `isolated_pilot_server.mjs`: Zero-dependency Fastify-compatible test server for isolated local and pilot testing.
* `test_pilot_scenarios.mjs`: Automated runner verifying 11 end-to-end pilot workflows.
* `verify_pilot_hardening_gates.mjs`: Regression test verifying 5 security gates.
* `validate-doc-links.mjs`: Validates all 473 relative markdown links across `docs/`.
* `smoke_test.mjs`: End-to-end platform smoke test against running web/API instances.
