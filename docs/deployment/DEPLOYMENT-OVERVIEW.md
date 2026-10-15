# Oprino — Production Deployment Overview

**Document:** Authoritative Cloud Hosting & Infrastructure Topology  
**Auditor:** Principal DevOps Engineer  
**Branch:** `release/v1-stabilization`  
**Infrastructure Blueprint:** [`render.yaml`](../../render.yaml) & [`vercel.json`](../../apps/web/vercel.json)  

---

## 1. Multi-Tier Production Topology

Oprino leverages a decoupled, high-availability architecture optimized for SMB economics (~$0.40/user/month at scale):

```mermaid
graph TB
    subgraph Edge ["Global Edge & CDN Layer"]
        Vercel["▲ Vercel Edge Network<br/>Next.js 15 Web Dashboard<br/>Global Anycast SSL"]
        R2Edge["☁️ Cloudflare R2 Global Edge<br/>15-Minute Presigned PUT/GETs<br/>Zero Egress Bandwidth Fees"]
    end

    subgraph Compute ["Compute Layer (Render)"]
        API["Render Web Service (Standard/Pro)<br/>Fastify 5 REST API Monolith<br/>Docker Container: Dockerfile.api"]
        Worker["Render Background Worker<br/>BullMQ 5 Asynchronous Engine<br/>Nightly Retention & Schedulers"]
    end

    subgraph Data ["Managed Database Layer"]
        Neon[("🐘 Neon PostgreSQL 17/18<br/>PostGIS Spatial Extension<br/>Multi-Tenant RLS Enforcement")]
        Upstash[("⚡ Upstash Redis 7<br/>Primary/Replica HA<br/>SSE Pub/Sub & Queues")]
    end

    Vercel -->|HTTPS REST| API
    API -->|Connection Pool| Neon
    API -->|TLS Redis| Upstash
    Worker -->|Transactional RLS| Neon
    Worker -->|Queue Backpressure| Upstash
    API -->|Direct Presigned Storage| R2Edge
```

---

## 2. Service Specifications & Resource Allocations

| Service Name | Host Provider | Instance Type | Minimum Sizing | Health Check Endpoint | Scaling Strategy |
|---|---|---|---|---|---|
| **`oprino-web`** | Vercel | Serverless Edge | Standard Pro | `/` | Automatic global edge auto-scaling |
| **`oprino-api`** | Render | Docker Web Service | 1 CPU / 2 GB RAM | `/health/live`, `/health/ready` | Horizontal auto-scaling on CPU/Request count |
| **`oprino-worker`** | Render | Background Worker | 1 CPU / 1 GB RAM | Internal Heartbeat | Active/Standby or scaled concurrency |
| **`oprino-db`** | Neon | Serverless Postgres | 0.25 to 2 CU auto-scale | `SELECT 1;` | Automatic compute auto-scaling with PostGIS |
| **`oprino-redis`** | Upstash | Managed Redis HA | 10,000 req/sec | `PING` -> `PONG` | Multi-region active replication |
| **`oprino-media`** | Cloudflare | Private R2 Bucket | S3 API Compatible | S3 HeadBucket | Zero-egress serverless object storage |
