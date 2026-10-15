# Contributing to Oprino

Welcome to the Oprino repository. We appreciate your contributions to building the next-generation multi-industry task management and workforce operations platform for SMBs.

---

## 1. Governance & Quality Gates

All contributors and coding assistants must strictly adhere to the project rules and standards defined in [`AGENTS.md`](./AGENTS.md).

### Non-Negotiable Invariants:
1. **Duty-Hours-Only Tracking:** Off-duty location tracking must **NEVER** occur. Peer location visibility remains **OFF by default**.
2. **Multi-Tenant Isolation:** Enforce 5-stage tenant verification; always use transaction-scoped `SET LOCAL app.current_workspace_id` in database queries.
3. **Never Commit Secrets:** Do not commit `.env` files, API keys, private keys, or credentials. Rely strictly on environment variables validated with Zod schemas.
4. **Scope Creep Prohibition:** V1 scope is frozen. Do not add standalone CRM pipelines, warehouse inventory engines, payroll engines, general accounting, or customer web portals.

---

## 2. Monorepo Organization

```
oprino/
├── apps/
│   ├── web/          # Next.js 15 Manager & Admin Web Dashboard
│   └── mobile/       # Flutter 3.47 Field Worker Mobile App
├── services/
│   ├── api/          # Fastify REST API & Real-time WebSockets/SSE
│   └── worker/       # BullMQ Background Job Worker
├── packages/
│   ├── contracts/    # Single Source of Truth Zod Schemas & OpenAPI Spec
│   ├── database/     # PostgreSQL 17 / PostGIS Schema & Migrations
│   └── tokens/       # Design System Tokens (CSS & Dart)
├── generated/
│   └── dart-api/     # Auto-generated Dio API Client for Flutter
├── scripts/          # E2E Smoke Tests, Pilot Harnesses, Verification
└── docs/             # Architecture ADRs, PRDs, Audits & Deployment Guides
```

---

## 3. Development Workflow

### Prerequisites
- Node.js >= 22
- pnpm >= 11
- Flutter >= 3.47
- Docker & Docker Compose (for local PostgreSQL & Redis)

### Initial Setup
```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Generate Design Tokens and API Contracts
pnpm turbo generate

# 3. Start local Postgres & Redis
docker-compose up -d

# 4. Apply Database Migrations
pnpm --filter @oprino/database migrate
```

### Running Locally
```bash
# Start API & Web Dashboard in development mode
pnpm dev
```

---

## 4. Verification & Testing

Before submitting pull requests, run all quality gates:

```bash
# 1. Monorepo Typecheck & Lint
pnpm typecheck
pnpm lint

# 2. Monorepo Build
pnpm turbo build

# 3. Backend & Contract Tests
pnpm --filter @oprino/api test
pnpm --filter @oprino/contracts test

# 4. Flutter Analyze & Tests
cd apps/mobile
flutter analyze
flutter test
```

---

## 5. Architecture Decisions & PR Standards
- Any architectural change or dependency addition requires an explicit Architecture Decision Record (ADR) in `docs/architecture/ADR/`.
- Every pull request must be linked to an audited milestone and tested against isolated service containers.
