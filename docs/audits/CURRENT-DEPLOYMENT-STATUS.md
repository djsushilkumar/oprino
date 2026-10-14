# Oprino Cloud Infrastructure & Current Deployment Status

**Document:** Confirmed Deployment Infrastructure, Configuration Audit & Evidence Assessment  
**Audit Date:** October 14, 2026  
**Auditor Roles:** DevOps Lead, Principal Software Architect, Cloud Security Engineer  
**Governing Standard:** Separate confirmed technical facts from unverified assumptions.  

---

## 1. Cloud Architecture Topology

Oprino utilizes a multi-cloud serverless and free-tier infrastructure architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                             │
│                                                                        │
│    Web Dashboard (Desktop)                Field Mobile (Android/iOS)   │
│   Hosted on Vercel CDN                    Flutter Client via APK       │
└──────────────────┬─────────────────────────────────────┬───────────────┘
                   │                                     │
                   │ HTTPS (Bearer Token)                │ HTTPS & SSE
                   ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         API & WORKER HOSTING                           │
│                                                                        │
│    Render Web Service: oprino-api (Oregon us-west)                     │
│    Fastify 5 REST API + Co-located BullMQ System Worker                │
│    Public Endpoint: https://oprino-api.onrender.com                    │
└──────────────────┬─────────────────────────────────────┬───────────────┘
                   │                                     │
         PostgreSQL/PostGIS (TLS)                   Redis / TLS
                   ▼                                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        NEON SERVERLESS POSTGRES      │  │    UPSTASH SERVERLESS REDIS  │
│   PostgreSQL 17.2 + PostGIS 3.5      │  │    Redis 7.4 with TLS        │
│   Tenant RLS + Partitioning          │  │    Sessions & BullMQ Queues  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 2. Component-by-Component Deployment Audit

### 2.1 Render Web Service (`oprino-api`)

| Attribute | Audited Fact & Status | Evidence / Source |
|---|---|---|
| **Service Name** | `oprino-api` | `render.yaml`, `docs/handoff/CODEX-CLOUD-HANDOFF.md` |
| **Region** | Oregon (`us-west-2`) | Render Blueprint deployment log |
| **Runtime Image** | `Dockerfile.api` (multi-stage Node.js 22 alpine) | `Dockerfile.api` |
| **Process Model** | Bundled API + BullMQ Worker in a single container | Render free tier restriction (worker type paid-only) |
| **Health Probe** | `/health/ready` (checks DB and Redis connectivity) | `services/api/src/routes/health.ts` |
| **Public URL** | `https://oprino-api.onrender.com` | Live verified probe (`HTTP 200 OK`) |
| **Current Deployed Commit** | `8db713b` (or earlier commit from `main`) | Git branch mapping |
| **Free Tier Limitations** | Spins down after 15 minutes of inactivity; cold starts take 50–70s; 512MB RAM cap. | Render Free Tier specifications |

> [!WARNING]
> **Branch Desynchronization:** Render auto-deploys exclusively from the `main` branch. Because PR #1 (`feat/zero-cost-gps-field-ops`) and `feat/v1-blockers-remediation` have not been merged into `main`, the live Render API is running legacy code and **does not have the zero-cost GPS pipeline or BLK-002 through BLK-006 fixes deployed**.

---

### 2.2 Neon PostgreSQL (PostGIS)

| Attribute | Audited Fact & Status | Evidence / Source |
|---|---|---|
| **Engine** | PostgreSQL 17 + PostGIS 3.5 | Neon serverless database console |
| **Region** | AWS `us-west-2` (Oregon, co-located with Render) | Connection string configuration |
| **Multi-Tenancy** | Row-Level Security enabled on all tables; transaction-scoped `SET LOCAL` | `packages/database/src/schema/` |
| **Migrations Applied** | 29 public tables created through migration `0004` | Database inspection |
| **Pending Migration** | `0005_v1_blockers_remediation.sql` (**NOT YET APPLIED ON PROD**) | `packages/database/drizzle/0005_v1_blockers_remediation.sql` |

> [!IMPORTANT]
> **Pending Schema Migration:** Migration `0005_v1_blockers_remediation.sql` introduces columns `workspaces.location_retention_days`, `attendance_punches.selfie_media_key`, and invitation verification indices. This migration MUST be executed against the production Neon database before `feat/v1-blockers-remediation` is deployed to Render.

---

### 2.3 Upstash Serverless Redis

| Attribute | Audited Fact & Status | Evidence / Source |
|---|---|---|
| **Engine** | Redis 7.4 (TLS enabled) | Upstash console |
| **Usage** | Better Auth session cache, Telemetry Pub/Sub fan-out, BullMQ queues | `services/worker/src/redis.ts`, `services/api/src/services/pubsub.service.ts` |
| **Status** | Confirmed operational; ping/pong verified via `/health/ready` | API readiness probe |
| **Limits** | 10,000 commands/day on free tier | Upstash Free Tier specifications |

---

### 2.4 Vercel Web Dashboard (`apps/web`)

| Attribute | Audited Fact & Status | Evidence / Source |
|---|---|---|
| **Framework** | Next.js 15 App Router | `apps/web/package.json` |
| **Deployment Mechanism**| Git push auto-deploy from `main` | Vercel GitHub integration |
| **Environment Variable**| `NEXT_PUBLIC_API_URL` pointing to `https://oprino-api.onrender.com` | `apps/web/src/lib/api.ts` |
| **Current Deployed Commit**| `8db713b` (on `main`) | Vercel deployment log |
| **Missing Features on Live Site** | Missing activation page (`/auth/activate`), member CSV bulk modal, settings page (`/settings`), and selfie attendance views. | Present only on `feat/v1-blockers-remediation` |

---

### 2.5 Media & File Storage (AWS S3 / Cloudflare R2)

| Attribute | Audited Fact & Status | Reality Assessment |
|---|---|---|
| **Planned Provider** | Cloudflare R2 or AWS S3 (ADR-012) | Documented in architecture specs |
| **Implemented Code** | Mock endpoint `/v1/media/mock-upload/*` | **NOT WIRED TO CLOUD STORAGE** |
| **Bucket Provisioned** | No production S3 or R2 bucket exists in configuration | Assumptions in docs corrected |
| **Binary Retention** | Uploaded binaries are discarded by Fastify content parser | Photos cannot be retrieved in production |

---

## 3. Confirmed Evidence vs. Assumptions

| Operational Dimension | Confirmed Fact (Verified with Evidence) | Unverified Assumption (Corrected) |
|---|---|---|
| **API Health** | `/health/ready` returns `HTTP 200 OK` with DB and Redis connected. | Assumed API had latest blocker fixes (Refuted: deployed code is on `main`). |
| **Database Tables** | PostgreSQL 17 tables migrated through `0004`. | Assumed migration `0005` was applied to Neon (Refuted: migration `0005` exists only locally/branch). |
| **Smoke Test** | `scripts/smoke_test.mjs` passes against local and remote endpoints. | Assumed smoke test verified physical mobile hardware (Refuted: smoke test is HTTP-only). |
| **Release APK** | Release APK builds cleanly on Android Gradle. | Assumed release APK had production Play Store signing (Refuted: signed with debug key). |
| **Media Proofs** | Proof metadata is recorded in database table `task_proofs`. | Assumed photos were stored in S3/R2 (Refuted: mock upload endpoint discards payloads). |

---

## 4. Production Deployment Sequence to Reconcile Differences

To bring the live cloud deployment into full parity with the verified feature branches:

1. **Step 1: Merge PR #1 (`feat/zero-cost-gps-field-ops`) into `main`.**
2. **Step 2: Merge `feat/v1-blockers-remediation` into `main`.**
3. **Step 3: Run Database Migration `0005` on Live Neon:**
   ```bash
   pnpm --filter @oprino/database migrate
   ```
4. **Step 4: Provision Cloudflare R2 or AWS S3 Bucket:**
   - Configure environment variables on Render: `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   - Update `MediaService.ts` to generate authentic presigned URLs.
5. **Step 5: Trigger Render and Vercel Production Re-deployments from `main`.**
6. **Step 6: Run Live Cloud Smoke Test:**
   ```bash
   node scripts/smoke_test.mjs
   ```
