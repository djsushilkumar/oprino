# Oprino — Environment Configuration Specification

**Document:** Authoritative Environment Variables & Configuration Matrix  
**Auditor:** Principal DevOps Engineer  
**Branch:** `release/v1-stabilization`  

---

## 1. Fastify API Service (`services/api/.env`)

All variables are strictly validated on startup via Zod in [`services/api/src/config/env.ts`](../../services/api/src/config/env.ts):

| Variable | Type | Default | Description | Fail-Closed Production Rule |
|---|---|---|---|---|
| `NODE_ENV` | enum | `development` | Runtime environment (`development`, `test`, `staging`, `production`) | Must be explicit in production |
| `PORT` | integer | `3001` | HTTP port for Fastify server | Configured by host (Render: `10000`) |
| `DATABASE_URL` | string | *N/A* | PostgreSQL connection string with PostGIS | Must NOT be default local dev credentials in prod |
| `REDIS_URL` | string | `redis://localhost:6379` | Redis connection string for SSE pub/sub & queues | TLS required in staging/production |
| `BETTER_AUTH_SECRET` | string | *N/A* | Cryptographic secret for signing session cookies | Must be >= 32 characters in production |
| `BETTER_AUTH_URL` | url | `http://localhost:3001` | Public API base URL for Better Auth redirects | Must be HTTPS in production |
| `CORS_ORIGIN` | string | `http://localhost:3000` | Comma-separated list of trusted client origins | Wildcards (`*`) strictly rejected with credentials |
| `STORAGE_DRIVER` | enum | `local` | Storage driver (`local`, `s3`, `r2`) | Must be `s3` or `r2` in staging/production |
| `STORAGE_BUCKET` | string | `oprino-media` | Target private bucket name | Required when driver is `s3`/`r2` |
| `STORAGE_ENDPOINT` | url | *N/A* | S3-compatible endpoint (e.g. Cloudflare R2) | Required when driver is `r2` |
| `STORAGE_ACCESS_KEY` | string | *N/A* | Private access key ID | Never commit to source code |
| `STORAGE_SECRET_KEY` | string | *N/A* | Private secret access key | Never commit to source code |

---

## 2. Background Worker Service (`services/worker/.env`)

| Variable | Type | Description |
|---|---|---|
| `DATABASE_URL` | string | PostgreSQL connection string (transactional RLS enforced) |
| `REDIS_URL` | string | Redis connection string for BullMQ workers |
| `RETENTION_PURGE_CRON` | string | Standard cron expression for nightly retention purge (default: `0 2 * * *`) |

---

## 3. Web Dashboard (`apps/web/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | url | `http://localhost:3001` | Public API gateway base URL |
| `NEXT_PUBLIC_APP_ENV` | string | `development` | Client environment flag |

---

## 4. Mobile Application (`apps/mobile/`)

Configured at compile time via `--dart-define` parameters in `AppConfig.fromEnvironment()`:

| Define Parameter | Default | Production Value |
|---|---|---|
| `--dart-define=API_BASE_URL` | `http://localhost:3001` (or `10.0.2.2:3001` in emulator) | `https://api.oprino.com` (Strict HTTPS) |
| `--dart-define=ENVIRONMENT` | `development` | `production` |
