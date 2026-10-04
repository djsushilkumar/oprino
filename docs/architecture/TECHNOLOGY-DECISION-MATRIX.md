# Oprino Technology Decision Matrix & Architectural Trade-Off Analysis (Re-evaluated)

**Status:** Updated & Recommended for Phase 01A  
**Date:** October 2026 (Reconciled)  
**Controlling Documents:** 
- Phase 00 Approved PRD ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))
- ADR Register ([`docs/architecture/ADR/README.md`](file:///workspace/oprino/docs/architecture/ADR/README.md))

---

## 1. Overview & Evaluation Principles

Every technology decision in Oprino is evaluated using a weighted multi-criteria decision matrix grounded in:
1. **Phase 00 PRD Fidelity:** Strict compliance with frozen product capabilities and privacy requirements.
2. **Mobile Field Reliability:** Guaranteed background duty tracking and offline-first autonomy on budget devices.
3. **SMB SaaS Economics:** Maximizing gross margin (>85%) by eliminating per-MAU SaaS taxes and vendor lock-in.
4. **Developer Velocity & Contract Integrity:** Maximizing code, contract, and type sharing across all surfaces.

---

## 2. Comprehensive 20-Decision Matrix

| # | Architecture Domain | Options Evaluated | Selected Winner | Decisive Rationale |
|---|---|---|---|---|
| **01** | **Mobile Framework** | • React Native (Expo)<br>• Flutter (Dart)<br>• Separate Native (Kotlin/Swift) | **React Native (Expo Prebuild / Bridgeless)** | 100% shared TypeScript/Zod contracts with Web and Backend in monorepo; mature native foreground services via Transistor plugin. |
| **02** | **Web Application Stack** | • Next.js App Router (React 19)<br>• Vite + React SPA<br>• Remix / React Router v7 | **Next.js App Router (React 19 + TanStack)** | Server Components for SEO marketing pages; TanStack Query & Table for high-density live operational dashboards. |
| **03** | **Backend Platform & Runtime** | • Fastify TypeScript<br>• Express.js<br>• NestJS<br>• Go (Golang) | **Fastify TypeScript Monolith (Active-LTS Node.js Policy)** | Sub-millisecond routing; native JSON schema validation; direct Zod integration. Runtime policy: pin current approved Active-LTS at Phase 01C scaffolding. |
| **04** | **Database & Geospatial Engine** | • PostgreSQL + PostGIS (GA)<br>• MySQL 8<br>• MongoDB | **Mature Supported PostgreSQL (16/17) + PostGIS (3.4+/3.5+ GA)** | Mature GA release supported by cloud hosting and PITR; GiST spatial indexing; daily range partitioning with least-privileged stored procedure maintenance. |
| **05** | **Multi-Tenancy Architecture** | • Shared DB / Shared Schema (`workspace_id`)<br>• Schema-per-tenant<br>• Database-per-tenant | **Shared DB / Shared Schema + Transactional `SET LOCAL` RLS** | 5-stage zero-trust tenant verification; connection pool safety via transaction-scoped `SET LOCAL`; automated negative isolation CI test matrix. |
| **06** | **Authentication & Sessions** | • Application-Owned Audited Framework<br>• Self-Hosted Service (Keycloak)<br>• Managed SaaS (Clerk/Auth0) | **Application-Owned Audited Framework (Better Auth) + PostgreSQL + Redis** | Audited Argon2id hashing and session rotation without hand-rolling crypto; $0 per-MAU vendor tax; direct multi-company organization membership data ownership. |
| **07** | **Authorization Model** | • Domain:Action:Scope RBAC<br>• Cerbos / OPA<br>• Hardcoded role strings | **Domain:Action:Scope RBAC** | Fastify route-level guards; SQL scope injection (`location:read:team`); flexible custom roles for SMB growth without external policy daemon. |
| **08** | **Background Location Engine** | • Transistor Software Geolocation<br>• Expo Location standard<br>• Custom Native Modules | **Transistor Software Background Geolocation (Separate Native Queue)** | Native motion-triggered stationary sleep; separate native SQLite queue directly uploading to server; 3-boundary duty control; safe local deadline strategy; device validation matrix. |
| **09** | **Offline Storage & Sync Engine** | • Embedded SQLite (`op-sqlite`) + Outbox<br>• WatermelonDB<br>• PowerSync | **Embedded SQLite (`op-sqlite`) for Domain State** | Domain SQLite stores pure business state (tasks, punches, visits); location breadcrumbs handled by native SDK queue; zero competing sync queues. |
| **10** | **Real-Time Operational Updates** | • Server-Sent Events (SSE) + Push<br>• WebSockets (Socket.io)<br>• HTTP Long Polling | **Server-Sent Events (SSE) + Native Push** | Unidirectional HTTP/2 streaming for Web live map (Target Delivery SLO: < 2-3s p95); zero socket state maintenance; mobile uses native push and adaptive polling. |
| **11** | **Maps & Geospatial Services** | • Hybrid: Native Mobile SDK + MapLibre Web<br>• Google Maps API everywhere<br>• Mapbox GL everywhere | **Hybrid: Native SDK Mobile + MapLibre Web + Geocoding Cache** | Native mobile SDKs ($0 mobile rendering); MapLibre vector tiles via Protomaps/MapTiler (~$25/mo); geocoding cached in PostgreSQL; OS deep link navigation ($0). |
| **12** | **File Storage & Proof Media** | • Direct Pre-Signed S3/R2 PUT<br>• Backend API Multipart Proxy<br>• Supabase Storage | **Direct Pre-Signed Cloudflare R2 / S3 PUT** | $0.00 egress bandwidth fees via Cloudflare R2; client-side image compression (1600x1200 JPEG); private bucket with 15-min signed GETs. |
| **13** | **Push Notifications & Alerts** | • Direct FCM v1 + APNs + Resend<br>• OneSignal / Knock<br>• Expo Push Relay | **Direct FCM v1 + APNs + Resend Email** | Zero message SaaS fees; customer addresses never touch 3rd-party ad trackers; server enforces duty-hours and quiet-hours notification filtering. |
| **14** | **Background Jobs & Broker** | • BullMQ + Redis HA (Primary/Replica)<br>• Redis Cluster<br>• Temporal.io | **BullMQ + Managed Redis Primary/Replica HA** | Shared TypeScript domain entities; handles 10,000+ jobs/sec; managed Redis with persistence and primary/replica failover eliminates distributed cluster complexity. |
| **15** | **Domain Events Architecture** | • PostgreSQL Transactional Outbox + Redis<br>• In-Process / Redis Pub/Sub only<br>• Apache Kafka / Redpanda | **PostgreSQL Transactional Outbox + Redis Pub/Sub (Ephemeral Only)** | Atomic event commit with business mutations in PostgreSQL; zero dropped events on server crash; Redis Pub/Sub scoped strictly to volatile SSE live map fan-out. |
| **16** | **Observability & Logging** | • Pino + Sentry + Prometheus<br>• Datadog Cloud APM<br>• New Relic | **Pino + Sentry + Prometheus** | Pino fastest JSON logger; automated redaction of raw GPS and PII (`redact: paths`); predictable self-hosted metrics with Sentry error tracking. |
| **17** | **Monorepo Architecture** | • Turborepo + pnpm Workspaces<br>• Nx Monorepo<br>• Multi-Repo | **Turborepo + pnpm Workspaces** | Blazing-fast Rust caching; strict pnpm dependency isolation (no phantom deps); 100% shared `@oprino/contracts` and `@oprino/tokens`. |
| **18** | **API Architecture & Contracts** | • Pragmatic REST + OpenAPI 3.1 + Zod<br>• GraphQL<br>• tRPC | **Pragmatic REST + OpenAPI 3.1 + Zod** | Universal HTTP semantics; standard idempotency keys for offline replay; immune to GraphQL query complexity attacks; integration-ready. |
| **19** | **Operational Reporting & Exports**| • PostgreSQL Relational Aggs + Streams<br>• ClickHouse Columnar OLAP<br>• Snowflake / BigQuery | **PostgreSQL Relational Aggs + Streams + BullMQ**| Zero extra database clusters; streaming CSV has flat < 25MB RAM; BullMQ worker isolates headless Chromium PDF rendering; rollups preserve mileage. |
| **20** | **Mobile Packaging Strategy** | • One Unified Role-Aware Application<br>• Separate Field and Manager Apps | **One Unified Role-Aware Application ("Oprino")** | Single binary dynamically mounts Field Surface vs Manager Surface based on active role; accommodates SMB working foremen and supervisors seamlessly. |

---

## 3. Compliance with Phase 00 Approved Scope

Every selected technology directly honors frozen product scope, privacy principles, and economic sustainability.
