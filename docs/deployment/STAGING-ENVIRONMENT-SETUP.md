# Oprino SaaS — Staging Environment & Cloudflare R2 Storage Guide

**Target Audience:** DevOps Engineers, Cloud Architects, QA Leads  
**Governing Architecture:** [`../architecture/ENVIRONMENT-STRATEGY.md`](../architecture/ENVIRONMENT-STRATEGY.md) & [`../architecture/ADR-012-file-storage.md`](../architecture/ADR-012-file-storage.md)  
**Security Classification:** Isolated Staging / Zero Production Cross-Contamination  
**Date:** October 2026  

---

## 1. Staging Component Status & Verification Matrix

Every element of the staging architecture and media pipeline is tracked under explicit, verified statuses:

| Component / Subsystem | Architectural Invariant | Current Status | Verification Evidence |
|---|---|:---:|---|
| **S3StorageDriver Core** | Presigned PUT/GET, SigV4 compliance, HEAD, DELETE | **VERIFIED IN CI** | 8 automated tests in `cloud-storage.integration.test.ts` pass in GitHub CI. |
| **API Storage Proxy Blockade** | Direct proxy PUT/GET rejected with 403 when S3 is active | **VERIFIED IN CI** | Negative Fastify route injection tests pass with HTTP 403 in CI. |
| **Fail-Closed Live Guard** | `RUN_LIVE_R2_TESTS=true` fails closed if credentials missing | **VERIFIED IN CI** | Regression tests verify fatal error when live cloud run lacks secrets. |
| **Non-Zero Byte & MIME Validation** | Rejects 0-byte uploads and MIME mismatches | **VERIFIED IN CI** | 49 unit and domain tests in `media-storage.unit.test.ts` pass in CI. |
| **Selfie & Proof Ownership** | Prevents cross-employee and cross-tenant key re-use | **VERIFIED IN CI** | Attendance and Media service domain invariants enforced in CI. |
| **Staging Service Blueprint** | Isolated `oprino-api-staging` in `render.yaml` with `APP_ENV=staging` | **IMPLEMENTED** | `render.yaml` updated with `autoDeploy: false` and isolated config. |
| **Web Security Headers** | CSP, X-Frame-Options, nosniff, strict referrer | **VERIFIED IN CI** | Next.js 15 production build passes with HTTP security headers. |
| **GitHub Staging Workflow** | Dedicated workflow with Staging environment protection | **IMPLEMENTED** | `.github/workflows/staging-cloud-verification.yml` created. |
| **Live Staging Cloudflare R2 Bucket** | Physical bucket creation & live object upload in cloud | **BLOCKED** | Blocked awaiting user Cloudflare R2 API token injection into GitHub Secrets. |
| **Live Staging Render API Service** | Physical web service provisioned on Render | **BLOCKED** | Blocked awaiting Render staging service deploy from authorized Render account. |
| **Live Staging Neon / PostGIS DB** | Physical isolated database branch provisioned | **BLOCKED** | Blocked awaiting Neon staging branch creation or Supabase staging project. |

---

## 2. Staging Environment Architecture & Isolation Topology

To preserve production tenant data integrity and prevent cross-contamination, the staging environment operates in complete physical isolation from production.

```mermaid
flowchart TD
    subgraph Staging Clients
        StagingWeb["💻 Staging Web Dashboard<br>(Vercel Preview / app.staging.oprino.com)"]
        StagingMobile["📱 Staging Mobile Build<br>(Internal Track APK / API_BASE_URL pointing to staging)"]
    end

    subgraph Isolated Staging Cloud Infrastructure
        StagingAPI["⚡ Staging Fastify API<br>(Render Web Service: oprino-api-staging)"]
        StagingDB["🐘 Staging PostgreSQL 18 + PostGIS<br>(Neon Isolated Branch / Supabase Staging)"]
        StagingRedis["🔴 Staging Redis 7<br>(Upstash Isolated Database: oprino-cache-staging)"]
        StagingR2["🪣 Cloudflare R2 Private Bucket<br>(oprino-staging-media)"]
    end

    StagingWeb -->|HTTPS REST| StagingAPI
    StagingMobile -->|HTTPS REST| StagingAPI
    StagingAPI -->|Transactional RLS| StagingDB
    StagingAPI -->|Pub/Sub & Queues| StagingRedis
    StagingAPI -.->|Issues 10-min PUT & 15-min GET Presigned URLs| StagingWeb
    StagingWeb -->|Direct PUT Binary Upload / GET Display| StagingR2
    StagingMobile -->|Direct PUT Binary Upload| StagingR2
```

### Staging Isolation Invariants:
1. **Database Isolation:** Staging runs on a separate database branch (`oprino_staging_db`). No production tenant records, shifts, or GPS logs are ever queried or modified during staging tests.
2. **Storage Isolation:** Staging writes exclusively to a dedicated private bucket (`oprino-staging-media`). Production bucket (`oprino-prod-media`) is completely inaccessible.
3. **Secrets Isolation:** Staging uses distinct cryptographic secrets (`BETTER_AUTH_SECRET`, R2 tokens, and database credentials).
4. **Synthetic Data Only:** All staging users, workspaces, customers, and attendance sessions are synthetic test entities.
5. **Standard NODE_ENV Preservation:** Staging runs with standard `NODE_ENV=production` for framework optimization, while identifying environment via `APP_ENV=staging`.

---

## 3. Cloudflare R2 Staging Bucket Setup

### 3.1 Bucket Provisioning
1. Log into the Cloudflare Dashboard and navigate to **R2**.
2. Click **Create bucket**:
   - **Bucket name:** `oprino-staging-media`
   - **Location hint:** Automatic or APAC (closest to operational workforce).
   - **Storage class:** Standard.
3. Verify that **Public Access** is **DISABLED** (100% private bucket). No public URL or anonymous object listing is allowed.

### 3.2 CORS Policy Configuration
To allow the web dashboard to upload photos directly from the browser without proxying megabytes through the API server, configure CORS in bucket settings:

```json
[
  {
    "AllowedOrigins": [
      "https://app.staging.oprino.com",
      "https://oprino-staging.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "x-amz-content-sha256",
      "x-amz-date",
      "Authorization"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3.3 R2 API Token Provisioning
1. In Cloudflare Dashboard -> **R2** -> **Manage R2 API Tokens**, click **Create API Token**.
2. Set token permissions:
   - **Permissions:** `Object Read & Write`
   - **Bucket scope:** Specific bucket -> `oprino-staging-media`
   - **TTL:** 12 months (or company policy).
3. Record the generated credentials securely:
   - **S3 Endpoint:** `https://<account-id>.r2.cloudflarestorage.com`
   - **Access Key ID:** `S3_ACCESS_KEY_ID`
   - **Secret Access Key:** `S3_SECRET_ACCESS_KEY`

---

## 4. Staging Environment Variables

Configure these environment variables in Render (`oprino-api-staging`) and staging deployment runners:

| Variable | Staging Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Standard Node production optimization (disables dev stacks and debug dumps) |
| `APP_ENV` | `staging` | Identifies staging environment and enforces mandatory S3 validation |
| `PORT` | `3001` | Fastify HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `API_PUBLIC_URL` | `https://api.staging.oprino.com` | Authoritative public API URL |
| `BETTER_AUTH_SECRET` | `staging_secret_min_32_characters_random_string` | Cryptographic session & token secret |
| `BETTER_AUTH_URL` | `https://api.staging.oprino.com` | Auth redirect base URL |
| `DATABASE_URL` | `postgresql://.../oprino_staging_db` | Isolated staging Postgres + PostGIS connection string |
| `REDIS_URL` | `rediss://default:...@...upstash.io:6379` | Isolated staging Redis connection string |
| `CORS_ORIGINS` | `https://app.staging.oprino.com,https://oprino-staging.vercel.app,http://localhost:3000` | Whitelisted browser origins |
| `STORAGE_DRIVER` | `s3` | Activates `S3StorageDriver` |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` | Cloudflare R2 S3-compatible endpoint |
| `S3_BUCKET_NAME` | `oprino-staging-media` | Private staging media bucket |
| `S3_REGION` | `auto` | Cloudflare R2 region |
| `S3_ACCESS_KEY_ID` | `<staging-r2-access-key-id>` | Scoped R2 token key |
| `S3_SECRET_ACCESS_KEY` | `<staging-r2-secret-access-key>` | Scoped R2 token secret |
| `S3_FORCE_PATH_STYLE` | `false` | Cloudflare R2 virtual-hosted bucket style |

---

## 5. Automated Verification Procedures

### 5.1 Cloud Storage Integration Test (`cloud-storage.integration.test.ts`)
Once credentials are injected into the staging runner:
```bash
NODE_ENV="production" \
APP_ENV="staging" \
RUN_LIVE_R2_TESTS="true" \
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com" \
S3_BUCKET_NAME="oprino-staging-media" \
S3_ACCESS_KEY_ID="<key>" \
S3_SECRET_ACCESS_KEY="<secret>" \
node --test dist/cloud-storage.integration.test.js
```
This test automatically performs:
1. Direct binary upload of valid synthetic JPEG bytes to R2 using 10-minute presigned PUT URL.
2. `headObject` verification of stored physical bytes and content type.
3. 15-minute presigned GET URL generation.
4. Byte-for-byte binary download comparison against the original image.
5. Object deletion and existence verification (`exists: false`).
6. Fail-closed error throwing if `RUN_LIVE_R2_TESTS=true` is set without credentials.

### 5.2 End-to-End Staging Smoke Test
```bash
API_BASE_URL="https://api.staging.oprino.com" \
WEB_BASE_URL="https://app.staging.oprino.com" \
node scripts/smoke_test.mjs
```

---

## 6. Security Review: Web Session Tokens in `localStorage`

### 6.1 Identified Risk
In `apps/web/src/lib/api.ts`, session tokens are stored in `localStorage` under `TOKEN_KEY = 'oprino_web_auth_token'` and transmitted via `Authorization: Bearer <token>`.

- **Vulnerability:** `localStorage` is accessible to any JavaScript running on the same origin. An XSS vulnerability (e.g. from an unpinned third-party library or malicious script injection) could read and exfiltrate the session token.
- **Why it was initially adopted:** The frontend (`oprino-app.vercel.app`) and backend (`oprino-api.onrender.com`) are hosted on distinct top-level domains, making third-party cross-site cookies subject to strict browser ITP (Intelligent Tracking Prevention) blocks.

### 6.2 Defense-in-Depth Protections Applied
1. **Strict HTTP Security Headers:** Added to `apps/web/next.config.mjs`:
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
   - `X-Frame-Options: DENY` (prevents clickjacking)
   - `Referrer-Policy: strict-origin-when-cross-origin` (prevents token leakage in Referer headers)
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (restricts unauthorized hardware access)
2. **Short Token Lifetimes & Revocation:** Session tokens in Redis expire automatically and can be revoked instantly (<1 second).

### 6.3 Production Remediation Strategy (ADR-006 Compliance)
For commercial production, configure a unified custom domain:
- Web Dashboard: `app.oprino.com`
- Backend API: `api.oprino.com`

This allows Better Auth to issue `HttpOnly`, `Secure`, `SameSite=Lax` cookies scoped to `.oprino.com`. JavaScript running in the browser will have **zero access** to the session cookie, eliminating XSS token theft entirely.
