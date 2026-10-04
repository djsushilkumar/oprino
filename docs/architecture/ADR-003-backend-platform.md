# ADR-003: Backend Platform & Application Architecture

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, Backend Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Oprino requires a backend architecture capable of orchestrating complex multi-tenant operational workflows:
- High-frequency ingestion of duty-hours location pings with strict server-side off-duty boundary enforcement.
- Offline-first delta synchronization with idempotent mutation replay.
- 7-stage task state-machine enforcement with multi-assignee notifications and audit trails.
- Asynchronous background workloads: scheduled daily location purge crons, recurring task generation, and report compilation.
- Predictable SMB operating economics with zero vendor lock-in traps.

The team must evaluate whether a managed Backend-as-a-Service (BaaS) such as Supabase is sufficient on its own, whether a conventional custom API is necessary, or whether a hybrid approach best balances velocity and architectural integrity.

---

## 2. Alternatives Evaluated

### Alternative A: Pure Supabase BaaS (Managed Postgres + PostgREST + Supabase Auth + Edge Functions)
- **Overview:** Directly exposing Supabase Postgres tables to mobile/web clients via PostgREST and Row-Level Security (RLS), with business logic running in Deno Edge Functions.
- **Detailed Assessment:**
  - *Postgres & PostGIS:* Excellent fit. Native relational integrity and spatial queries.
  - *Authentication & Multi-Tenancy:* Good baseline, but multi-company workspace switching and complex custom roles require intricate custom JWT claims and RLS policies that are difficult to debug and test at scale.
  - *High-Frequency Telemetry Writes:* Ingesting thousands of background GPS pings through PostgREST directly into PostgreSQL risks rapid connection pool exhaustion, write amplification, and high Realtime message quotas.
  - *Offline Sync & State Machine:* Complex business logic (e.g., verifying proof checklist items before transitioning task to `COMPLETED`, validating device hardware timestamps, and running idempotent batch sync) becomes fragmented and brittle across SQL triggers and isolated Edge Functions.
  - *Vendor Lock-in & Observability:* Difficult to run end-to-end integration tests locally; debugging complex RLS permission policies incurs significant friction.

### Alternative B: Conventional Monolithic Custom API (Node.js / Express / NestJS + PostgreSQL + Redis)
- **Overview:** Building a standard RESTful application server handling 100% of business logic, database queries, and background queues.
- **Detailed Assessment:**
  - *Strengths:* Total control over application lifecycle, business state machines, and testing. Clean separation between API layer and database.
  - *Weaknesses:* Higher initial setup overhead (building authentication, file storage abstraction, and admin scaffolding from scratch).

### Alternative C: Hybrid Modular Architecture (Fastify TypeScript Core API + PostgreSQL with PostGIS + Redis/BullMQ + S3-Compatible Storage)
- **Overview:** A specialized, high-performance Node.js application backend (built with Fastify and TypeScript) backed by a standard PostgreSQL + PostGIS database (which can optionally be hosted on Supabase, AWS RDS, Neon, or Railway) and Redis for queuing.
- **Detailed Assessment:**
  - Fastify provides 2x–3x the throughput of Express/NestJS with built-in schema validation and low memory footprint.
  - The API encapsulates all task state-machine transitions, offline sync idempotency, and location ingestion buffering.
  - Standard PostgreSQL and S3 object storage ensure zero vendor lock-in: Oprino can run locally in Docker, on cloud managed services, or migrate seamlessly as scale grows.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | Pure Supabase BaaS | Conventional Monolith | Hybrid (Fastify + PG + Redis) |
|---|:---:|:---:|:---:|:---:|
| **High-Frequency Telemetry Ingestion** | 20% | 6 / 10 (RLS/PostgREST overhead) | 9 / 10 | **9.5 / 10 (Fastify buffer)** |
| **Offline Sync & State Machine Logic** | 20% | 6.5 / 10 (SQL triggers/Edge) | 9 / 10 | **9.5 / 10 (Domain service)** |
| **Multi-Tenant Security & RBAC Control** | 15% | 7.5 / 10 (Pure RLS complex) | 8.5 / 10 | **9 / 10 (App scope + RLS)** |
| **Developer Velocity & Contract Sharing**| 15% | 8 / 10 | 8 / 10 | **9.5 / 10 (Shared Zod monorepo)**|
| **Cost Predictability at SMB Scale** | 15% | 7 / 10 (Realtime quotas) | 9 / 10 | **9 / 10 (Low resource footprint)**|
| **Testability & Local Development** | 15% | 6.5 / 10 | 8.5 / 10 | **9.5 / 10 (Docker + Vitest)** |
| **Weighted Total** | **100%** | **6.85 / 10** | **8.70 / 10** | **9.40 / 10** |

---

## 4. Decision

**Adopt the Hybrid Modular Architecture: Fastify TypeScript Core Application Backend + Mature Supported PostgreSQL (with PostGIS) + Managed Redis (Primary/Replica with Persistence) + S3-Compatible Object Storage.**

*(Note: PostgreSQL and S3 may be hosted on AWS RDS, Supabase, Neon, or Hetzner during development and production, but the application code interacts with standard PostgreSQL via pooled connections and S3 via standard AWS SDKs rather than coupling to proprietary client SDKs).*

### Runtime Version Selection Policy:
- **Node.js Baseline:** Do not hard-freeze a speculative or early Node release.
- **Policy Directive:** *Pin current approved Active-LTS release at Phase 01C scaffolding and keep it within its supported LTS lifecycle.*

### Cache & Broker Topology:
- **Redis Configuration:** Use a **single managed Redis instance with primary/replica high-availability and persistence (AOF/RDB)**. 
- Avoid distributed Redis Cluster operational complexity; an SMB fleet of 2,500 active employees generates < 1,000 ops/sec, which runs comfortably on a single managed Redis instance with < 10% CPU.

### Architectural Responsibilities:
1. **Core Application Service (`apps/api`):**
   - Built with **Fastify** and **TypeScript** (pinned to Active-LTS Node.js at scaffolding).
   - Enforces the 7-stage task lifecycle state machine and verification workflows.
   - Houses the **Offline Delta Sync Engine**, processing batched client mutations idempotently.
   - Enforces the **Duty-Hours Privacy Cutoff**: verifies employee duty status before ingesting or persisting any location telemetry.
   - Authentication powered by an application-owned, audited authentication framework ([`ADR-006`](file:///workspace/oprino/docs/architecture/ADR-006-authentication.md)).
2. **Database Layer:**
   - Mature supported PostgreSQL with stable **PostGIS** extension for spatial geometries, distance calculations, and geofencing ([`ADR-004`](file:///workspace/oprino/docs/architecture/ADR-004-database-geospatial.md)).
   - Uses Drizzle ORM or Kysely for type-safe, performant SQL queries compiled directly to native SQL without heavyweight ORM runtime overhead.
3. **Queue & Background Worker (`BullMQ`):**
   - Redis-backed queue handling asynchronous workloads: photo metadata watermarking, daily location retention partition pruning, notification fan-out, and report generation ([`ADR-014`](file:///workspace/oprino/docs/architecture/ADR-014-background-jobs.md)).

---

## 5. Consequences & Mitigations

- **Consequence:** Requires maintaining a dedicated Node.js service container rather than serverless functions.  
  *Mitigation:* Fastify has an exceptionally tiny memory footprint (~60–80 MB idle), allowing cheap hosting on standard container platforms (AWS ECS Fargate, Railway, or Google Cloud Run) with predictable pricing.
- **Consequence:** Authentication must be handled by the application server.  
  *Mitigation:* Utilize an established, audited open-source framework (Better Auth / audited engine) with PostgreSQL storage and Redis cache, providing full authority over multi-company switching and device revocation without custom crypto implementation ([`ADR-006`](file:///workspace/oprino/docs/architecture/ADR-006-authentication.md)).
- **Reversal Cost:** Low to Medium. Because the database is standard PostgreSQL and the API is standard REST, migrating infrastructure providers requires zero code rewriting.
