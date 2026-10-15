# Oprino SaaS — Free Cloud Deployment Guide

**Target Audience:** Engineering & Product Team  
**Cost Target:** **$0.00 / Month (100% Free Tier Services)**  
**Governing Architecture:** [`docs/architecture/ENVIRONMENT-STRATEGY.md`](../architecture/ENVIRONMENT-STRATEGY.md)\
**Date:** October 2026  

---

## 1. Free Cloud Architecture Topology

This guide deploys the complete Oprino multi-tenant SaaS stack to production-grade free cloud infrastructure without requiring a credit card or incurring monthly costs.

```mermaid
flowchart TD
    subgraph Mobile & Clients
        MobileApp["📱 Flutter Mobile App<br>(GitHub Actions Artifact / Physical Device)"]
        Browser["💻 Next.js Web Dashboard<br>(Vercel Free CDN)"]
    end

    subgraph Free Cloud Infrastructure
        API["⚡ Fastify API Container<br>(Render Free Web Service)"]
        Worker["⚙️ BullMQ Background Worker<br>(Render / Koyeb Free)"]
        DB["🐘 PostgreSQL 17 + PostGIS<br>(Supabase Free Tier)"]
        Redis["🔴 Serverless Redis 7<br>(Upstash Free Tier)"]
    end

    Browser -->|HTTPS REST & Auth| API
    MobileApp -->|HTTPS REST & Telemetry| API
    API -->|Transaction RLS Queries| DB
    API -->|Pub/Sub & BullMQ Jobs| Redis
    Worker -->|Process Overdue & Reports| DB
    Worker -->|Queue Listeners| Redis
```

---

## 2. Service Matrix (100% Free Tiers)

| Component | Provider | Free Tier Allocation | URL Format |
|---|---|---|---|
| **Database (PostgreSQL + PostGIS)** | **Supabase** | 500 MB storage, 2 active projects, full PostGIS extension | `postgresql://postgres:...@...pooler.supabase.com:6543/postgres?sslmode=require` |
| **Cache & Job Broker (Redis)** | **Upstash** | 10,000 commands/day, 256 MB memory, persistent | `rediss://default:...@...upstash.io:6379` |
| **Backend API (Fastify)** | **Render** | 750 free instance hours/month, automatic HTTPS | `https://oprino-api.onrender.com` |
| **Web Dashboard (Next.js 15)** | **Vercel** | Unlimited deployments, global edge CDN, automatic SSL | `https://oprino-app.vercel.app` |
| **Mobile Build & Releases** | **GitHub Actions** | 2,000 CI minutes/month, automated APK build artifacts | Downloadable `.apk` from Actions Runs |

---

## 3. Step-by-Step Provisioning Guide

### Step 1: Provision Free Database (Supabase)

1. Sign up or log into [supabase.com](https://supabase.com).
2. Click **New Project** and name it `oprino-production`. Set a strong database password.
3. Once provisioned, navigate to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Navigate to **Project Settings -> Database -> Connection string**.
5. Select **URI** and copy the Transaction Pooler connection string (`port 6543`).
6. Apply all Drizzle schema migrations directly from your local terminal:
   ```powershell
   $env:DATABASE_URL="your-supabase-connection-string"
   pnpm --filter @oprino/database migrate
   ```
   *(All 5 migrations: workspaces, RLS policies, shifts, tasks, visits, sync, notifications will apply instantly).*

---

### Step 2: Provision Free Serverless Redis (Upstash)

1. Sign up or log into [upstash.com](https://upstash.com).
2. Click **Create Database**, name it `oprino-cache-redis`, choose a region close to your Supabase database.
3. Select **TLS Enabled**.
4. In the database details view, copy the standard **Node.js / ioredis** URL (`rediss://...`).

---

### Step 3: Deploy Backend API & Worker (Render)

1. Log into [render.com](https://render.com) and link your GitHub account.
2. Click **New +** -> **Blueprint**, and select your GitHub repository `djsushilkumar/oprino`.
   - Render will automatically read [`render.yaml`](../../render.yaml) from the repository root.
3. Alternatively, click **New Web Service**:
   - Repository: `djsushilkumar/oprino`
   - Environment: **Docker**
   - Dockerfile path: `./Dockerfile.api`
   - Plan: **Free**
4. Configure Environment Variables in the Render dashboard:
   ```ini
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   DATABASE_URL=your-supabase-pooled-connection-string
   REDIS_URL=your-upstash-redis-connection-string
   BETTER_AUTH_SECRET=oprino_production_super_secret_jwt_32_characters_minimum
   API_PUBLIC_URL=https://your-api-name.onrender.com
   BETTER_AUTH_URL=https://your-api-name.onrender.com
   CORS_ORIGINS=*
   ```
5. Click **Create Web Service**. Once deployed (approx. 2-3 minutes), verify:
   ```bash
   curl https://your-api-name.onrender.com/health/ready
   # Expected response: {"status":"ok","services":{"database":"connected","redis":"connected"}}
   ```

---

### Step 4: Deploy Web Dashboard (Vercel)

1. Log into [vercel.com](https://vercel.com) and link your GitHub account.
2. Click **Add New...** -> **Project** -> Import `djsushilkumar/oprino`.
3. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** Edit and select `apps/web`
   - **Build Command:** `cd ../.. && pnpm turbo build --filter=@oprino/web...`
   - **Install Command:** `pnpm install`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-name.onrender.com` (from Step 3)
5. Click **Deploy**. Vercel will build the 14 prerendered pages and provide a live URL (`https://oprino-web-xxx.vercel.app`).

---

### Step 5: Connect Mobile App to Deployed Cloud Stack

To build or run the mobile application pointed to your live cloud deployment:

#### Option A: Run directly from physical device:
```powershell
$env:PATH="D:\flutter\bin;$env:PATH"
flutter run --dart-define=API_BASE_URL="https://your-api-name.onrender.com"
```

#### Option B: Build Release APK with Cloud API:
```powershell
$env:PATH="D:\flutter\bin;$env:PATH"
flutter build apk --release --dart-define=API_BASE_URL="https://your-api-name.onrender.com"
```

#### Option C: Download from GitHub Actions:
- On every push to `main`, `.github/workflows/mobile-release.yml` automatically builds the optimized release APK.
- Go to `https://github.com/djsushilkumar/oprino/actions`, click the latest workflow run, and download `oprino-mobile-release-apk` directly to your phone.

---

## 4. End-to-End Cloud Verification Checklist

Once deployed to free cloud infrastructure, execute the following smoke verification:

- [ ] Supabase SQL: `SELECT COUNT(*) FROM workspaces;` confirms active workspace.
- [ ] API Readiness Probe: `GET https://your-api-name.onrender.com/health/ready` returns HTTP 200 `status: ok`.
- [ ] OpenAPI Spec: `GET https://your-api-name.onrender.com/openapi.json` returns valid schema.
- [ ] Web Auth Flow: Open `https://oprino-app.vercel.app/auth/signin`, log in with seed credentials.
- [ ] Web Map & Visits: Navigate to `/live-map`, `/visits`, `/tasks`, and `/reports`.
- [ ] Mobile App Field Ops: Punch in on mobile app, complete checklist, attach signature, verify upload directly against cloud S3/API.
