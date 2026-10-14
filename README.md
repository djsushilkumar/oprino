# Oprino

**Cloud-Native Workforce Management, Attendance & Field Operations Platform for SMBs**

[![CI Status](https://github.com/djsushilkumar/oprino/actions/workflows/ci.yml/badge.svg)](https://github.com/djsushilkumar/oprino/actions/workflows/ci.yml)
[![Mobile Release](https://github.com/djsushilkumar/oprino/actions/workflows/mobile-release.yml/badge.svg)](https://github.com/djsushilkumar/oprino/actions/workflows/mobile-release.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-11.22.0-orange.svg)](https://pnpm.io/)
[![Flutter Version](https://img.shields.io/badge/flutter-3.x-blue.svg)](https://flutter.dev/)
[![License: Private](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

---

## 1. What is Oprino?

**Oprino** is an operational SaaS platform built specifically for small and medium-sized businesses (10–200 employees, extensible from 5 to 500) managing distributed, deskless field teams.

Oprino unifies field execution and office dispatch into a single coordinated loop:
- **Field Employees:** Use a single Flutter mobile application (iOS & Android) to punch in/out with selfie and GPS verification, execute dispatched tasks, tick off mandatory checklist steps, log physical customer site visits, capture watermarked photo proofs and client signatures on glass, and work completely offline via a local SQLite queue.
- **Operations Managers & Owners:** Use a modern Next.js 15 Web Dashboard for live radar map oversight, day-route stop sequencing, task verification, team membership administration, configurable data retention policies, and compliance reporting.
- **Strict Duty-Hours Privacy Invariant:** **Off-duty location tracking NEVER occurs.** Telemetry acquisition starts strictly on punch-in and terminates immediately on punch-out. Ingestion pipelines drop all off-duty data with zero database writes. Peer location visibility remains **OFF by default**.
- **Multi-Tenant Isolation:** 5-stage zero-trust gateway verification paired with PostgreSQL Row-Level Security (RLS) scoped per transaction using `SET LOCAL app.current_workspace_id`.

---

## 2. Product Scope & Core Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               OPRINO V1 CAPABILITIES                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ • Attendance & Duty Hours:    Simple, GPS-verified, and Selfie-verified punches; │
│                               Overnight shifts; Late punch detection.            │
│ • Task Management:            7-stage lifecycle; Checklists; Photo proofs;       │
│                               Activity comments; Optimistic concurrency locks.   │
│ • Field Visits & Routing:     Physical customer site check-in/out; Proximity     │
│                               validation; Day-route stop sequencing.             │
│ • Proof of Work:              Watermarked camera photos; Digital on-glass signa- │
│                               tures; Supervisor approval & rejection queue.      │
│ • Live Operations Map:        Server-Sent Events (SSE) live location stream;     │
│                               Historical daily breadcrumb playback trail.        │
│ • Offline-First Mobile:       Drift SQLite local database with outbox queue;     │
│                               Deterministic conflict resolution on reconnect.    │
│ • Administration & Security:  Single-use token employee invitations; Bulk CSV    │
│                               import; Configurable 7-180 day location retention. │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Polyglot Monorepo Architecture

Oprino is structured as a high-performance monorepo managed with **Turborepo** and **pnpm 11** for TypeScript, alongside native **Flutter / Dart** tooling for mobile:

```text
oprino/
├── apps/
│   ├── mobile/                 # Flutter 3.x unified mobile app (iOS & Android)
│   └── web/                    # Next.js 15 App Router web management dashboard
├── services/
│   ├── api/                    # Fastify 5 TypeScript REST API service
│   └── worker/                 # BullMQ 5 asynchronous job processing service
├── packages/
│   ├── contracts/              # Zod schemas, OpenAPI 3.1 & Dart client generator
│   ├── database/               # PostgreSQL schema, Drizzle ORM, RLS migrations
│   ├── tokens/                 # Design token compiler (CSS, Dart, JSON)
│   ├── config-eslint/          # Shared ESLint 9 configuration
│   └── config-typescript/      # Shared tsconfig profiles
├── generated/
│   └── dart-api/               # Generated Dart Dio client (from OpenAPI 3.1)
├── docs/                       # Complete architecture, product, and audit docs
├── Oprino-Brand-Kit/           # Authoritative Brand Kit v1.3 (123 verified assets)
└── scripts/                    # Smoke testing and release packaging scripts
```

### Technology Stack:
- **Backend:** Node.js 22 LTS, Fastify 5, Better Auth (Bearer plugin), Drizzle ORM 0.40, BullMQ 5.
- **Database & Cache:** PostgreSQL 17/18 with PostGIS 3.5+, Redis 7 (Upstash Serverless).
- **Frontend Web:** Next.js 15 App Router, React 19, TypeScript, Vanilla CSS + Brand Tokens.
- **Mobile Client:** Flutter 3.x, Dart 3.x, Flutter Riverpod, GoRouter, Drift SQLite, `geolocator`.
- **Contracts & Boundary:** Zod 3.24 -> OpenAPI 3.1.0 -> Dart Dio (`@oprino/contracts`).

---

## 4. Current Release & Branch Status

```
[main] ──────────────────────────────────────────► (Deployed to Render & Vercel)
   │  Commit 8db713b: Baseline Monorepo Scaffolding & Brand Integration
   │
   └──► [feat/zero-cost-gps-field-ops] (PR #1)
          │  Commit 8fc880c: Zero-Cost Duty GPS Pipeline (geolocator + MapLibre)
          │
          └──► [feat/v1-blockers-remediation] (V1 Blocker Hardening)
                 │  Commit 44cd88c: BLK-002 to BLK-006 (Invitations, CSV, Selfies, Retention)
                 │
                 └──► [docs/v1-repo-and-documentation-audit] (Documentation & Audit Polish)
```

- **Production Baseline (`main`):** Currently deployed to Render (`https://oprino-api.onrender.com`) and Vercel.
- **Active Remediation Branches:** Contain the zero-cost GPS pipeline and 6 remediated release blockers (BLK-001 through BLK-006) backed by 122 passing integration tests. Preparing for consolidation into `main`.
- **Authoritative Status Report:** See [`docs/audits/PROJECT-STATUS.md`](docs/audits/PROJECT-STATUS.md).

---

## 5. Getting Started & Local Development

### Prerequisites:
- **Node.js:** `>= 22.0.0`
- **pnpm:** `11.22.0` (or `corepack enable pnpm`)
- **Docker:** Docker Desktop with Compose (for local PostgreSQL PostGIS & Redis)
- **Flutter SDK:** `>= 3.24.0` (for mobile development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/djsushilkumar/oprino.git
cd oprino
pnpm install
```

### 2. Configure Environment Variables
Copy the root `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure required variables are populated:
```env
DATABASE_URL="postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db"
REDIS_URL="redis://localhost:6379"
BETTER_AUTH_SECRET="oprino_dev_secret_must_be_at_least_32_characters_long_for_security"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 3. Start Local Infrastructure (Docker)
Start PostgreSQL 17 (PostGIS) and Redis 7:
```bash
docker compose up -d
```

### 4. Run Migrations & Generate Code
```bash
# Run database migrations and seed system roles
pnpm --filter @oprino/database migrate
pnpm --filter @oprino/database provision-roles

# Build design tokens and generate Dart API client
pnpm turbo generate
```

### 5. Launch Development Services
```bash
# Start API (port 3000) and Web Dashboard (port 3001) in parallel
pnpm dev
```
- **Web Dashboard:** [http://localhost:3001](http://localhost:3001)
- **Fastify API:** [http://localhost:3000](http://localhost:3000)
- **API Health Probe:** [http://localhost:3000/health/ready](http://localhost:3000/health/ready)

### 6. Run the Flutter Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 6. Verification & Test Commands

Oprino enforces comprehensive testing across all monorepo packages:

```bash
# Run full automated test suite (122 backend integration tests)
pnpm test

# Typecheck all 8 TypeScript packages
pnpm typecheck

# Lint the entire repository
pnpm lint

# Run end-to-end operational smoke test against live API
node scripts/smoke_test.mjs

# Run Flutter mobile unit and widget tests
cd apps/mobile && flutter test
```

---

## 7. Cloud Deployment Architecture

Oprino deploys to production using an optimized zero-overhead cloud topology:
- **Fastify API & BullMQ Worker:** Hosted on [Render](https://render.com) (`oprino-api.onrender.com`) via `Dockerfile.api`.
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech) 17 with PostGIS 3.5 in Oregon (`us-west-2`).
- **Cache & Pub/Sub:** [Upstash Serverless Redis](https://upstash.com) with TLS.
- **Web Dashboard:** [Vercel](https://vercel.com) Edge CDN deployed automatically from `apps/web`.
- **Deployment Guide:** Detailed configuration instructions are in [`docs/deployment/FREE-CLOUD-DEPLOYMENT-GUIDE.md`](docs/deployment/FREE-CLOUD-DEPLOYMENT-GUIDE.md).

---

## 8. Documentation Index

The repository features comprehensive technical documentation under `docs/`:

- **Central Documentation Index:** [`docs/README.md`](docs/README.md)
- **Authoritative PRD:** [`docs/product/OPRINO-MASTER-PRD.md`](docs/product/OPRINO-MASTER-PRD.md)
- **V1 Scope Boundaries:** [`docs/product/V1-SCOPE.md`](docs/product/V1-SCOPE.md)
- **System Architecture:** [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md)
- **Architecture Decisions (21 ADRs):** [`docs/architecture/ADR/README.md`](docs/architecture/ADR/README.md)
- **Project Status Audit:** [`docs/audits/PROJECT-STATUS.md`](docs/audits/PROJECT-STATUS.md)
- **Repository Inventory:** [`docs/audits/REPOSITORY-STRUCTURE-AUDIT.md`](docs/audits/REPOSITORY-STRUCTURE-AUDIT.md)
- **Feature Inventory:** [`docs/audits/FEATURE-INVENTORY.md`](docs/audits/FEATURE-INVENTORY.md)
- **Production Roadmap:** [`docs/audits/NEXT-STEPS-ROADMAP.md`](docs/audits/NEXT-STEPS-ROADMAP.md)
- **Brand System (v1.3):** [`docs/brand/OPRINO-BRAND-SYSTEM.md`](docs/brand/OPRINO-BRAND-SYSTEM.md)
- **Agent Handoff Specification:** [`docs/handoff/CODEX-CLOUD-HANDOFF.md`](docs/handoff/CODEX-CLOUD-HANDOFF.md)

---

## 9. Brand Assets & Guidelines

The official **Oprino Brand Kit (v1.3)** is located under `Oprino-Brand-Kit/`:
- **16 Logo Variations:** SVG, high-resolution 4096px transparent PNG, and vector PDF under `01-Logos/`.
- **Brand System Specifications:** Typography rules, accessible contrast ratios, and color palette tokens under `docs/brand/OPRINO-BRAND-SYSTEM.md`.
- **Asset Integrity:** All 123 brand assets are cryptographically verified via `Oprino-Brand-Kit/CHECKSUMS.json`.

---

## 10. Contributing & Security Policy

All autonomous and assisted coding agents must adhere to the invariant developer guidelines codified in [`AGENTS.md`](AGENTS.md):
- Off-duty location tracking must NEVER occur.
- Multi-tenant isolation must always use transaction-scoped `SET LOCAL app.current_workspace_id`.
- Never commit secrets, `.env` files, or production credentials.
- All architectural changes require an explicit numbered ADR.
