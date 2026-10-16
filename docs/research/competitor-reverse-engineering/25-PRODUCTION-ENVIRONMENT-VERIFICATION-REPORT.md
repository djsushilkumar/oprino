# OPRINO — PRODUCTION ENVIRONMENT VERIFICATION REPORT

**Document ID:** `docs/research/competitor-reverse-engineering/25-PRODUCTION-ENVIRONMENT-VERIFICATION-REPORT.md`  
**Audit Target:** `djsushilkumar/oprino`  
**Git Baseline:** `main @ 12d3ee3`  
**Verification Date:** 2026-10-15  
**Auditor:** Principal Cloud Architect & Senior Security Auditor  
**Audit Mode:** Read-Only Verification (No Destructive / Mutating Actions)

---

## 1. Executive Summary & Production Readiness Verdict

### Production Readiness Verdict: **CONDITIONAL PASS — HARDENING MANDATORY BEFORE PUBLIC STORE RELEASE**

The Oprino platform is **live, functional, and actively operating on real cloud infrastructure**. Live HTTPS diagnostics confirm that the primary web dashboard (`https://oprino.vercel.app`) and backend API gateway (`https://oprino-api.onrender.com`) are fully healthy, connected to managed Neon PostgreSQL 18 with PostGIS 3.6, Upstash Redis TLS, and Cloudflare R2 object storage. Live CORS filters strictly enforce production origins (`https://oprino.vercel.app` and `oprino://app`) while rejecting untrusted loopbacks.

However, this strict deployed environment audit identified **critical configuration hazards where production build workflows and client generators fail to enforce fail-closed invariants**, silently permitting release binaries to default to `http://localhost:3001` or `http://10.0.2.2:3000` if environment arguments are omitted.

```
+-------------------------------------------------------------------------------------------------------+
|                                    ENVIRONMENT AUDIT SUMMARY TABLE                                    |
+------------------------------------+--------------------------+---------------+-----------------------+
| Component                          | Deployed Host            | Live Status   | Audit Finding         |
+------------------------------------+--------------------------+---------------+-----------------------+
| API Gateway Service                | Render (Oregon, US)      | HTTP 200 OK   | Live Healthy / Prod   |
| Web Dashboard                      | Vercel Edge CDN          | HTTP 200 OK   | Live Healthy / Prod   |
| Database (Tenant RLS + PostGIS)    | Neon Serverless (AWS SG) | Connected     | Live Healthy / Prod   |
| Telemetry Stream & Cache           | Upstash Serverless TLS   | Connected     | Live Healthy / Prod   |
| Media Storage                      | Cloudflare R2 Bucket     | S3 Fail-Closed| Live Healthy / Prod   |
| Mobile Release Workflow            | GitHub Actions           | VULNERABLE    | Missing Dart Defines  |
| Generated Dart Client              | Monorepo Contracts       | DEFECTIVE     | Hard-coded 10.0.2.2   |
| Workspace Invitation BaseUrl       | API Service              | DEFECTIVE     | Fallback to Localhost |
| Deployment Revision Metadata       | API /v1/version          | MISCONFIGURED | Hard-coded Commit SHA |
+------------------------------------+--------------------------+---------------+-----------------------+
```

---

## 2. Actual Deployed Services, Infrastructure & Revisions

Direct live HTTPS probes verified the deployed infrastructure state as of 2026-10-15T17:40:00Z:

### 2.1 Backend API Service (Fastify / Node.js 22)
- **Deployment Platform:** Render Cloud (`oprino-api`, Web Service, Oregon region)
- **Container Runtime:** Multi-stage Docker (`Dockerfile.api`, Alpine Linux, Node.js 22, pnpm 11.22.0)
- **Public Base URL:** `https://oprino-api.onrender.com`
- **Internal Binding:** `0.0.0.0:3001` (Container private port, mapped by Render Cloudflare Edge)
- **Live Healthcheck:**
  - `GET https://oprino-api.onrender.com/health` -> `HTTP 200 OK`
  - Response payload:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-10-15T17:39:48.678Z",
      "services": {
        "database": "connected",
        "redis": "connected"
      }
    }
    ```
- **Live Readiness Check:**
  - `GET https://oprino-api.onrender.com/health/ready` -> `HTTP 200 OK`
- **Deployment Revision Metadata (`GET /v1/version`):**
  - Response payload:
    ```json
    {
      "name": "oprino-api",
      "version": "0.1.0",
      "environment": "production",
      "gitCommit": "5fc3468",
      "architecture": {
        "framework": "Fastify + TypeScript",
        "database": "PostgreSQL 18 + PostGIS 3.6",
        "mobile": "Flutter 3.47 Stable",
        "auth": "Better Auth (Bearer & Session Cookies)"
      }
    }
    ```
  - **Discrepancy Note:** The reported `gitCommit` (`5fc3468`) is a static string literal hard-coded in [`services/api/src/routes/version.ts:10`](../../../services/api/src/routes/version.ts#L10). It does not dynamically reflect the latest merged commit (`12d3ee3`).

### 2.2 Web Dashboard (Next.js 15 App Router)
- **Deployment Platform:** Vercel (Edge CDN delivery, Project `oprino`)
- **Public URL:** `https://oprino.vercel.app`
- **Live HTTP Status:** `HTTP 200 OK`
- **Security Headers Verified:**
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Frontend API Endpoint Configuration:**
  - Configured in [`apps/web/next.config.mjs:6`](../../../apps/web/next.config.mjs#L6) and [`apps/web/src/lib/api.ts:105`](../../../apps/web/src/lib/api.ts#L105):
  - `process.env.NEXT_PUBLIC_API_URL || 'https://oprino-api.onrender.com'`
  - **Audit Result:** Web client cleanly targets `https://oprino-api.onrender.com`. Zero localhost or cleartext references exist in web client source bundles.

### 2.3 Managed Database (PostgreSQL 18 + PostGIS 3.6)
- **Deployment Platform:** Neon Serverless PostgreSQL (`ep-late-unit-b3sh305d-pooler.c-4.ap-southeast-1.aws.neon.tech`)
- **Isolation Model:** Transaction-scoped `SET LOCAL app.current_workspace_id = ?` (ADR-001 multi-tenant RLS).
- **Applied Migrations:** `0000_flawless_silver_centurion.sql` through `0005_dashing_typhoid_mary.sql` verified active.

### 2.4 Realtime Telemetry Cache & SSE Distribution (Redis)
- **Deployment Platform:** Upstash Serverless Redis (TLS-encrypted `rediss://...`)
- **Functionality:** Token-based single-use SSE streaming tickets (`/v1/telemetry/stream-ticket`), rate limiting store, and employee location event fanout.

### 2.5 Object Storage (Cloudflare R2)
- **Production Bucket:** `oprino-production-media`
- **Region:** `auto`
- **Driver:** S3-compatible pre-signed upload URL generator ([`S3StorageDriver`](../../../services/api/src/storage/s3-driver.ts#L26)).
- **Fail-Closed Gate:** [`services/api/src/config/env.ts:50-64`](../../../services/api/src/config/env.ts#L50-L64) aborts initialization if `STORAGE_DRIVER !== 's3'` or credentials are unpopulated in production.

---

## 3. Verified Production Endpoints & Live Verification Matrix

| Endpoint | Method | Expected Auth / Origin | Live Verified Result |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | `HTTP 200 OK` (`services.database=connected`, `services.redis=connected`) |
| `/health/ready` | `GET` | Public | `HTTP 200 OK` (Fastify ready hook active) |
| `/v1/version` | `GET` | Public | `HTTP 200 OK` (`environment=production`, `framework=Fastify + TypeScript`) |
| `/health` (CORS) | `OPTIONS` | `Origin: https://oprino.vercel.app` | `HTTP 204 No Content` with `access-control-allow-origin: https://oprino.vercel.app` |
| `/health` (CORS) | `OPTIONS` | `Origin: oprino://app` | `HTTP 204 No Content` with `access-control-allow-origin: oprino://app` |
| `/health` (CORS) | `OPTIONS` | `Origin: http://localhost:3000` | `HTTP 204 No Content` with **NO** `access-control-allow-origin` (Rejected) |
| `/v1/telemetry/stream-ticket` | `POST` | Bearer Token Required | `HTTP 401 Unauthorized` (`"Authentication required"`) |
| `/v1/telemetry/stream?ticket=invalid`| `GET` | Valid Redis Ticket | `HTTP 401 Unauthorized` (`"Invalid or expired streaming ticket"`) |

---

## 4. Localhost & Development Fallback Audit Findings

A complete scan was conducted across configuration files, client generators, workflows, and routes. Six specific defects were identified:

### Finding 1: `.github/workflows/mobile-release.yml` Builds Release APK Without `--dart-define` Flags
- **File:** [`.github/workflows/mobile-release.yml:69`](../../../.github/workflows/mobile-release.yml#L69)
- **Risk Level:** **CRITICAL**
- **Root Cause:**
  ```yaml
  - name: Build Unified Release APK
    run: |
      cd apps/mobile
      flutter build apk --release --no-tree-shake-icons
  ```
  In [`apps/mobile/lib/core/config/app_config.dart:127`](../../../apps/mobile/lib/core/config/app_config.dart#L127):
  ```dart
  factory AppConfig.fromEnvironment() {
    const rawEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: 'LOCAL_PILOT_DEBUG');
    const customUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    const isEmulator = bool.fromEnvironment('EMULATOR', defaultValue: false);
    return AppConfig.resolve(rawEnv: rawEnv, customUrl: customUrl, isEmulator: isEmulator);
  }
  ```
  Because the release workflow does not supply `--dart-define=ENVIRONMENT=PRODUCTION`, the compiled release APK defaults to `LOCAL_PILOT_DEBUG` and points to `http://localhost:3001` with `isCleartextAllowed = true`.
- **Impact:** An APK generated by this release pipeline fails immediately on physical devices because it attempts to contact `http://localhost:3001`.

### Finding 2: `generated/dart-api/lib/src/api_client.dart` Hard-codes Android Emulator Loopback Default
- **File:** [`generated/dart-api/lib/src/api_client.dart:25`](../../../generated/dart-api/lib/src/api_client.dart#L25)
- **Risk Level:** **HIGH**
- **Root Cause:**
  ```dart
  class OprinoApiClient {
    final Dio dio;

    OprinoApiClient({
      Dio? dio,
      String baseUrl = 'http://10.0.2.2:3000',
    })
  ```
  The client parameter defaults to an insecure emulator loopback (`http://10.0.2.2:3000`) instead of enforcing a mandatory, non-empty `baseUrl`.
- **Code Generator Source:** [`packages/contracts/scripts/generate-dart-client.ts:2236`](../../../packages/contracts/scripts/generate-dart-client.ts#L2236) emits this template whenever `pnpm turbo generate` or `pnpm run generate:dart` is executed.

### Finding 3: `packages/contracts/src/openapi.ts` Server List Contains Exclusively Local Development Endpoints
- **File:** [`packages/contracts/src/openapi.ts:1799-1812`](../../../packages/contracts/src/openapi.ts#L1799-L1812)
- **Risk Level:** **MEDIUM**
- **Root Cause:**
  ```ts
  servers: [
    { url: 'http://localhost:3000', description: 'Local Development Server' },
    { url: 'http://10.0.2.2:3000', description: 'Android Emulator Loopback' },
    { url: 'http://127.0.0.1:3000', description: 'Physical Android Reverse Loopback' },
  ]
  ```
  The published OpenAPI specification has zero representation of the actual production API (`https://oprino-api.onrender.com`) or cloud staging (`https://staging-api.oprino.com`). OpenAPI-driven tooling and SDK generators default to the first server entry (`http://localhost:3000`).

### Finding 4: `services/api/src/config/env.ts` Fails to Check `API_PUBLIC_URL` and `BETTER_AUTH_URL` for Localhost in Production
- **File:** [`services/api/src/config/env.ts:8-13`](../../../services/api/src/config/env.ts#L8-L13)
- **Risk Level:** **HIGH**
- **Root Cause:**
  ```ts
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  ```
  In `render.yaml`, `API_PUBLIC_URL` and `BETTER_AUTH_URL` are marked `sync: false`. If an operator forgets to configure these variables in the Render Dashboard, `validateEnv()` passes without error, silently running the production API with `http://localhost:3001`.
  Furthermore, in [`services/api/src/auth/better-auth.ts:79`](../../../services/api/src/auth/better-auth.ts#L79), `env.API_PUBLIC_URL` is added to `trustedOrigins`, inadvertently whitelisting `http://localhost:3001` in production.

### Finding 5: `services/api/src/routes/workspaces.ts` Fallback to `http://localhost:3000` for Invitation Links
- **File:** [`services/api/src/routes/workspaces.ts:194 & 297`](../../../services/api/src/routes/workspaces.ts#L194)
- **Risk Level:** **HIGH**
- **Root Cause:**
  ```ts
  const baseUrl =
    (req.headers.origin as string) ||
    (req.headers.referer ? new URL(req.headers.referer as string).origin : '') ||
    process.env.APP_PUBLIC_URL ||
    'http://localhost:3000';
  ```
  If an invitation is created from a client that does not send `origin` or `referer` headers (e.g. mobile app API call or worker process), `baseUrl` falls back to `'http://localhost:3000'`. Generated invitation emails would send recipients unusable links (`http://localhost:3000/invite?token=...`).

### Finding 6: `services/api/src/routes/version.ts` Static String Literal for `gitCommit`
- **File:** [`services/api/src/routes/version.ts:10`](../../../services/api/src/routes/version.ts#L10)
- **Risk Level:** **LOW / OBSERVABILITY**
- **Root Cause:**
  ```ts
  gitCommit: '5fc3468',
  ```
  The revision hash is hard-coded as `'5fc3468'`. It does not reflect the current git HEAD (`12d3ee3`) or Render's automatically injected `RENDER_GIT_COMMIT` environment variable.

---

## 5. Preservation of Legitimate Private Bindings (Requirement 6 Compliance)

Per Requirement 6 ("Preserve local development configurations exclusively for development and automated testing. Internal server bindings and private container networking are not public API URLs and must not be removed indiscriminately"):

1. **`Dockerfile.api:60` Container Healthcheck:**
   `CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health/live || exit 1`
   - **Status: PRESERVE.** This is an internal container loopback probe required by the container orchestrator. It is not an external client endpoint.
2. **`HOST=0.0.0.0` in `Dockerfile.api:39` & `env.ts:7`:**
   - **Status: PRESERVE.** Required to bind Fastify across all container network interfaces.
3. **Database & Redis Local Defaults in Dev/Test Suites:**
   - `postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db` in `ci.yml` and integration tests.
   - **Status: PRESERVE.** Legitimate isolated test harness configuration.

---

## 6. Required Fixes With Exact File Paths

### Fix 1: `.github/workflows/mobile-release.yml`
Pass explicit production environment arguments and add build artifact validation:
```diff
--- a/.github/workflows/mobile-release.yml
+++ b/.github/workflows/mobile-release.yml
@@ -67,5 +67,7 @@ jobs:
       - name: Build Unified Release APK
         run: |
           cd apps/mobile
-          flutter build apk --release --no-tree-shake-icons
+          flutter build apk --release --no-tree-shake-icons \
+            --dart-define=ENVIRONMENT=PRODUCTION \
+            --dart-define=API_BASE_URL=https://oprino-api.onrender.com
```

### Fix 2: `apps/mobile/lib/core/config/app_config.dart`
Enforce fail-closed validation in release mode:
```diff
--- a/apps/mobile/lib/core/config/app_config.dart
+++ b/apps/mobile/lib/core/config/app_config.dart
@@ -1,3 +1,4 @@
+import 'package:flutter/foundation.dart';
+
 enum EnvironmentType {
   localPilotDebug,
   cloudStagingDebug,
@@ -126,6 +127,12 @@ class AppConfig {
   factory AppConfig.fromEnvironment() {
+    // Fail-closed security barrier: Release builds MUST explicitly provide ENVIRONMENT=PRODUCTION
+    if (kReleaseMode) {
+      const rawReleaseEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: '');
+      if (rawReleaseEnv != 'PRODUCTION' && rawReleaseEnv != 'PROD') {
+        throw StateError(
+          'Security gate violation: Release mode requires explicit --dart-define=ENVIRONMENT=PRODUCTION',
+        );
+      }
+    }
     const rawEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: 'LOCAL_PILOT_DEBUG');
     const customUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
```

### Fix 3: `packages/contracts/scripts/generate-dart-client.ts` & `generated/dart-api/lib/src/api_client.dart`
Enforce required `baseUrl` without default loopback parameter:
```diff
--- a/packages/contracts/scripts/generate-dart-client.ts
+++ b/packages/contracts/scripts/generate-dart-client.ts
@@ -2233,7 +2233,7 @@ class OprinoApiClient {
   final Dio dio;
 
   OprinoApiClient({
     Dio? dio,
-    String baseUrl = 'http://10.0.2.2:3000',
+    required String baseUrl,
   }) : dio = dio ??
```

### Fix 4: `packages/contracts/src/openapi.ts`
Add deployed production and staging servers:
```diff
--- a/packages/contracts/src/openapi.ts
+++ b/packages/contracts/src/openapi.ts
@@ -1799,6 +1799,14 @@ export function createOpenApiDocument(): OpenAPIV3_1.Document {
     servers: [
+      {
+        url: 'https://oprino-api.onrender.com',
+        description: 'Production API Gateway (Render Cloud)',
+      },
+      {
+        url: 'https://staging-api.oprino.com',
+        description: 'Cloud Staging API Gateway',
+      },
       {
         url: 'http://localhost:3000',
         description: 'Local Development Server',
```

### Fix 5: `services/api/src/config/env.ts`
Enforce fail-closed HTTPS checks for `API_PUBLIC_URL` and `BETTER_AUTH_URL` in production/staging:
```diff
--- a/services/api/src/config/env.ts
+++ b/services/api/src/config/env.ts
@@ -80,4 +80,20 @@ export function validateEnv(customEnv?: Record<string, unknown>): Env {
       );
     }
+
+    // Security Invariant: API_PUBLIC_URL and BETTER_AUTH_URL cannot be localhost in production
+    const isLocalApiUrl = result.data.API_PUBLIC_URL.includes('localhost') || result.data.API_PUBLIC_URL.includes('127.0.0.1');
+    if (isLocalApiUrl) {
+      const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';
+      throw new Error(
+        `Insecure ${envName} API_PUBLIC_URL: Cannot point to localhost in ${envName.toLowerCase()}.`,
+      );
+    }
+
+    const isLocalAuthUrl = result.data.BETTER_AUTH_URL.includes('localhost') || result.data.BETTER_AUTH_URL.includes('127.0.0.1');
+    if (isLocalAuthUrl) {
+      const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';
+      throw new Error(
+        `Insecure ${envName} BETTER_AUTH_URL: Cannot point to localhost in ${envName.toLowerCase()}.`,
+      );
+    }
   }
```

### Fix 6: `services/api/src/routes/workspaces.ts`
Ensure invitation links default to production web URL when `origin` is omitted:
```diff
--- a/services/api/src/routes/workspaces.ts
+++ b/services/api/src/routes/workspaces.ts
@@ -193,3 +193,4 @@ export const workspaceRoutes: FastifyPluginAsync = async (app, options) => {
           process.env.APP_PUBLIC_URL ||
-          'http://localhost:3000';
+          (process.env.NODE_ENV === 'production' ? 'https://oprino.vercel.app' : 'http://localhost:3000');
```

### Fix 7: `services/api/src/routes/version.ts`
Dynamically resolve git commit SHA from deployment runtime:
```diff
--- a/services/api/src/routes/version.ts
+++ b/services/api/src/routes/version.ts
@@ -9,3 +9,7 @@ export const versionRoutes: FastifyPluginAsync = async (app) => {
       environment: process.env.NODE_ENV || 'development',
-      gitCommit: '5fc3468',
+      gitCommit:
+        process.env.RENDER_GIT_COMMIT ||
+        process.env.COMMIT_SHA ||
+        process.env.GIT_COMMIT ||
+        'unknown',
       architecture: {
```

---

## 7. Safe Regression Testing Plan

To guarantee that production artifacts can never reference development endpoints or loopbacks, the following automated regression suite will be executed:

1. **Pre-commit / CI Production Artifact Scanner (`scripts/verify-production-artifacts.mjs`):**
   - Inspects `apps/web/.next` static bundles, `Dockerfile.api`, and `render.yaml` for accidental inclusion of `10.0.2.2`, `http://localhost`, or unencrypted `http://` client targets.
   - Fails CI with non-zero exit code if detected in production build outputs.
2. **Mobile Release Build Unit Tests (`apps/mobile/test/app_config_test.dart`):**
   - Add test case verifying that `AppConfig.resolve(rawEnv: 'PRODUCTION')` rejects any non-HTTPS URL.
   - Add test case verifying that omitting `ENVIRONMENT` in release mode throws `StateError`.
3. **API Environment Hardening Unit Tests (`services/api/src/env.unit.test.ts`):**
   - Verify `validateEnv({ NODE_ENV: 'production', API_PUBLIC_URL: 'http://localhost:3001' })` throws `Insecure Production API_PUBLIC_URL`.
   - Verify `validateEnv({ NODE_ENV: 'production', BETTER_AUTH_URL: 'http://localhost:3001' })` throws `Insecure Production BETTER_AUTH_URL`.
4. **End-to-End Synthetic Probe:**
   - Run nightly synthetic HTTP probe against `https://oprino-api.onrender.com/health` and `https://oprino.vercel.app` to continuously verify 100% production uptime without regressions.

---

## 8. Summary of Safe Next Actions

Per audit safety instructions:
- **No changes have been implemented yet.**
- Awaiting user review and approval of the exact file fixes detailed above.
- Once approved, fixes can be applied atomically, validated via monorepo test suites (`pnpm turbo test`), and packaged safely.
