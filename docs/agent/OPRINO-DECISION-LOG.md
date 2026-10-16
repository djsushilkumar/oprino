# OPRINO — Architecture & Product Decision Log

**Document Status:** PERMANENT & CANONICAL  
**Classification:** Approved Decisions, Competitive Syntheses, Strategic Trade-offs  
**Repository:** `djsushilkumar/oprino`  
**Last Updated:** October 2026  

---

## 1. Architectural Decision Records (ADR) Register

The system's core technical architecture is governed by 21 formal Architecture Decision Records located in [`docs/architecture/ADR/`](../architecture/ADR/README.md):

| ADR ID | Decision Title | Status | Core Rationale & Invariant Impact |
|---|---|---|---|
| **ADR-001** | Mobile Framework: Flutter | **APPROVED** | Single codebase for Android & iOS; high-performance rendering for map overlays, offline Drift SQLite database, and on-glass digital signatures. |
| **ADR-002** | Web Stack: Next.js 15 (App Router) | **APPROVED** | Server-side rendering, React 19 ergonomics, edge performance, and seamless Vercel deployment. |
| **ADR-003** | Backend Platform: Fastify 5 | **APPROVED** | Low-overhead asynchronous HTTP throughput, schema-driven serialization, native plugin architecture, and minimal container memory footprint. |
| **ADR-004** | Database & Geospatial: PostgreSQL 17 + PostGIS | **APPROVED** | Enterprise ACID reliability, Row-Level Security (RLS) multi-tenancy, and native spatial queries (`ST_DWithin`, `ST_Point`). |
| **ADR-005** | Multi-Tenancy Strategy: Shared DB, Shared Schema with RLS | **APPROVED** | Highly cost-efficient for 1000+ SMB tenants while guaranteeing mathematical tenant isolation via PostgreSQL RLS and transaction-scoped `SET LOCAL app.current_workspace_id`. |
| **ADR-006** | Authentication: Better Auth | **APPROVED** | Self-hosted, lightweight TypeScript authentication supporting Web cookies and mobile Bearer tokens without external SaaS lock-in or auth per-user fees. |
| **ADR-007** | Authorization: Fastify Route Guards + RBAC | **APPROVED** | 4 standard roles (`OWNER`, `ADMIN`, `MANAGER`, `FIELD_WORKER`) enforced via declarative route hooks and database RLS policies. |
| **ADR-008** | Background Location: Battery-Optimized Geolocator Engine | **APPROVED** | 30-second interval / 25-meter distance filter during active shift; synchronous teardown on punch-out. Supersedes heavy commercial SDK dependencies for V1. |
| **ADR-009** | Offline Sync: Drift SQLite + Outbox Queue | **APPROVED** | Unordered idempotent mutations processed sequentially; conflict resolution governed by [`SYNC-CONFLICT-MATRIX.md`](../architecture/SYNC-CONFLICT-MATRIX.md). |
| **ADR-010** | Real-Time Live Map: Server-Sent Events (SSE) + Redis Pub/Sub | **APPROVED** | Unidirectional real-time stream (`/v1/telemetry/stream`) for dispatcher live maps; avoids heavy bidirectional WebSocket overhead on mobile clients. |
| **ADR-011** | Maps Provider: OpenStreetMap / Carto Vector Tiles | **APPROVED** | Zero API billing costs for base map rendering; web uses SVG/Leaflet, mobile uses Flutter Map with raster/vector caching. |
| **ADR-012** | File Storage: Cloudflare R2 (S3-Compatible) Presigned URLs | **APPROVED** | Direct client-to-storage uploads for proof photos and signatures; zero egress fees; tenant-isolated object keys `/${workspace_id}/...`. |
| **ADR-013** | Notifications: Server-Sent Events + In-App Badge Drawer | **APPROVED** | Real-time dispatch alerts and task assignments delivered in-app; push notifications staged for V1.5. |
| **ADR-014** | Background Jobs: BullMQ 5 + Redis | **APPROVED** | Reliable scheduling for recurring tasks, SLA overdue checks, and daily 30-day location retention pruning. |
| **ADR-015** | Domain Events: Internal Event Bus | **APPROVED** | Decoupled event emission within API process for audit logging, notification dispatch, and telemetry broadcasts. |
| **ADR-016** | Observability: Prometheus Metrics + Structured Pino Logging | **APPROVED** | Standard `/metrics` endpoint with request counts and latency histograms; zero external SaaS monitoring costs. |
| **ADR-017** | Monorepo Structure: Turborepo + pnpm 11 | **APPROVED** | High-performance cached builds, shared TypeScript contracts (`@oprino/contracts`), and unified lint/typecheck pipelines. |
| **ADR-018** | API Contract Style: Single Source of Truth Zod Schemas | **APPROVED** | `@oprino/contracts` defines Zod schemas which automatically generate OpenAPI 3.1 specs, Fastify validation schemas, and Dart Dio clients. |
| **ADR-019** | Reporting & Export: Streaming Server-Side CSV Generation | **APPROVED** | Memory-efficient streaming CSV downloads for attendance, task completion, and travel distance audit sheets. |
| **ADR-020** | Mobile Packaging: Android APK / App Bundle (AAB) with R8 | **APPROVED** | Code shrinking and resource optimization producing a lean, production-ready ~57MB Android artifact. |
| **ADR-021** | Zero-Cost GPS Telemetry Ingestion Pipeline | **APPROVED** | Direct HTTP batch ingestion (`POST /v1/telemetry/points`), Haversine distance rollup, and instant duty-hours gate dropping off-duty coordinates. |

---

## 2. Strategic Product Decisions Synthesizing Competitor Research

Based on the 26 competitor reverse-engineering studies of **TaskOPad** and **Unolo** in [`docs/research/competitor-reverse-engineering/`](../research/competitor-reverse-engineering/):

### Strategic Decision 1: Mobile-First Thumb Operations vs. TaskOPad Desktop Clutter
- **Finding:** TaskOPad began as a desktop project management tool and bolted on field attendance as a secondary tab. Its mobile app suffered from high tap depth (4–6 taps to begin a task) and poor field ergonomics.
- **Decision:** Oprino is strictly mobile-first for field workers. The mobile interface uses bottom sheets, high-contrast action cards, 1-tap duty punch buttons, and single-screen checklist execution reachable within natural thumb zones.

### Strategic Decision 2: Privacy-First Duty Boundaries vs. Unolo 24/7 Surveillance
- **Finding:** Unolo employs aggressive all-day background location tracking and battery-draining continuous GPS polling. This results in heavy employee pushback, privacy complaints, and union/legal disputes.
- **Decision:** Oprino establishes **Duty-Hours-Only** tracking as an unalterable core invariant. When an employee punches out, the GPS engine stops synchronously on the device, and the API drops any accidental coordinates with zero database writes. Peer tracking is OFF by default.

### Strategic Decision 3: Service & Maintenance Operations vs. Unolo FMCG Retail Order Booking
- **Finding:** Unolo attempts to serve both FMCG sales reps (distributor ordering, beat planning, product catalogs) and field service technicians. This clutters the product with sales pipelines, SKU catalogs, and order-taking forms irrelevant to service businesses.
- **Decision:** Oprino strictly excludes retail FMCG sales automation (SFA) and CRM pipelines. Oprino focuses with laser precision on HVAC, facilities management, electrical, telecom, and equipment maintenance operations.

### Strategic Decision 4: Verifiable Proof of Work vs. TaskOPad Honor System
- **Finding:** TaskOPad allows workers to mark tasks completed without requiring on-site evidence or customer signoff, leading to supervisor mistrust and client disputes.
- **Decision:** Oprino enforces mandatory step-by-step checklists, GPS-watermarked camera photos, and on-glass customer signatures before a task can transition to `COMPLETED`. Completed tasks flow into a manager verification queue (`VERIFIED` or `REJECTED`).

---

## 3. Security & Governance Decisions

### Security Decision 1: Hardware-Free Random UUIDv4 Device Installation Governance
- **Context:** Mobile applications frequently attempt to inspect hardware IMEI or MAC addresses, violating Google Play Developer policies and triggering security scanner alerts.
- **Decision:** Oprino mobile generates a cryptographically random UUIDv4 installation identifier stored in secure hardware-backed storage (`flutter_secure_storage`). Devices register on login and can be instantly revoked from the web dashboard.

### Security Decision 2: Connection-Pool-Safe Transactional RLS
- **Context:** Setting session-level variables (e.g., `SET app.current_workspace_id = '...'`) in PostgreSQL can pollute pooled connections reused across different HTTP requests, creating critical cross-tenant data leaks.
- **Decision:** All tenant-scoped database queries execute inside a database transaction setting `SET LOCAL app.current_workspace_id = :workspaceId`. When the transaction completes, the setting is discarded automatically.
