# Oprino Infrastructure Cost Model & Multi-Tenant Unit Economics (Re-evaluated)

**Status:** Updated & Recommended for Phase 01A  
**Date:** October 2026 (Reconciled)  
**Controlling Documents:** 
- Phase 00 Approved PRD ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))
- [`ADR-011: Maps & Geospatial Services Provider Strategy`](file:///workspace/oprino/docs/architecture/ADR-011-maps-geospatial-provider.md)
- [`ADR-012: File Storage Architecture`](file:///workspace/oprino/docs/architecture/ADR-012-file-storage.md)
- [`ADR-014: Background Job Processing`](file:///workspace/oprino/docs/architecture/ADR-014-background-jobs.md)

---

## 1. Executive Summary & Cost Modeling Principles

This document establishes a fully parameterized, bottom-up infrastructure cost model for Oprino across five representative scale profiles:
1. **10 Employees (1 Small SMB Pilot)**
2. **50 Employees (1 Mid-Size SMB)**
3. **200 Employees (1 Primary Sweet-Spot SMB)**
4. **500 Employees (1 Upper-Segment SMB)**
5. **2,500 Total Active Platform Employees (Fleet of 25–50 Multi-Tenant SMB Companies)**

### Modeling Governance:
- **Comprehensive Line-Item Accounting:** Includes API compute, background workers, PostgreSQL primary + replicas, PostGIS, SSD storage, PITR/backups, Redis HA, R2 object storage (capacity and Class A/B operations), transactional email, Sentry, logging, Transistor Software SDK commercial support, web vector tiles, geocoding, CI/CD runners, container registry, CDN/WAF, secrets management, and backup storage.
- **Fixed vs. Variable Separation:** Distinguishes fixed baseline platform operational costs from volume-driven marginal costs.
- **Pricing as Business Assumption:** Retail seat pricing ($4.00 to $6.00/seat/month) is modeled explicitly as a **commercial business assumption**, not an architectural certainty.

---

## 2. Infrastructure Component Catalog & Cost Drivers

| Cost Category | Resource / Service | Provider Baseline | Cost Driver & Rate | Fixed / Variable |
|---|---|---|---|:---:|
| **Compute: API** | Stateless Fastify API Containers | AWS ECS Fargate / Hetzner Cloud | 2x containers (2 vCPU, 4GB RAM each): ~$65/mo per instance | Semi-Fixed |
| **Compute: Worker** | BullMQ Background Workers | AWS ECS Fargate / Hetzner Cloud | 2x containers (2 vCPU, 4GB RAM each): ~$65/mo per instance | Semi-Fixed |
| **Database: Primary**| Managed PostgreSQL 16/17 + PostGIS | AWS RDS / Managed Cloud Postgres | Primary: 4 vCPU, 16GB RAM: ~$180.00/mo | Fixed Base |
| **Database: Replica**| Physical Streaming Read Replica | AWS RDS / Managed Cloud Postgres | Replica: 2 vCPU, 8GB RAM: ~$90.00/mo (Added at >200 scale) | Semi-Fixed |
| **Database Storage** | Provisioned SSD (GP3 / NVMe) | Managed Cloud Storage | $0.115 per GB / month | Variable |
| **Database PITR** | Automated Backups & WAL Archiving | Managed S3 Backup Storage | 35-day rolling retention: ~$0.023 per GB / month | Variable |
| **In-Memory Broker**| Managed Redis 7+ Primary/Replica HA | Managed Redis Cloud / AWS ElastiCache | Primary + Replica with persistence: ~$65.00/mo | Fixed Base |
| **Object Storage** | Compressed Photos, Sigs, Exports | Cloudflare R2 Storage | $0.015 / GB-month (Zero egress fees) | Variable |
| **R2 Class A Ops** | Object PUT / Multi-Part Uploads | Cloudflare R2 Operations | $4.50 per 1,000,000 operations | Variable |
| **R2 Class B Ops** | Object GET / Signed View Requests | Cloudflare R2 Operations | $0.36 per 1,000,000 operations | Variable |
| **Push Notifications**| Mobile Push Alerts (FCM & APNs) | Google FCM v1 & Apple APNs Direct | $0.00 platform charge | $0 Cost |
| **Transactional Email**| Operational digests, alerts, invites | Resend API | $20.00 base (50k emails), then $0.80 per 1,000 | Variable |
| **Error Monitoring** | Cross-Platform Crash Reporting | Sentry Team Tier | $26.00 / month flat | Fixed |
| **Logs & Metrics** | Fastify Metrics + Loki / Prometheus | Managed Grafana Cloud / Self-hosted | ~$25.00 / month | Fixed |
| **Geolocation SDK** | Transistor Background Geolocation | Commercial OEM Support & License | Amortized platform license & support: ~$42.00 / month | Fixed |
| **Web Map Tiles** | MapLibre Vector Tile Delivery | MapTiler Cloud / PMTiles on R2 | Base free tier + $0.05 per 1k requests: ~$25.00 / month | Semi-Fixed |
| **Address Geocoding**| Customer Site Geocoding & Cache | Radar API + PostgreSQL Cache | 100k free tier + cache hits: ~$10.00 / month | Variable |
| **Routing / Navigation**| Turn-by-Turn Driving Directions | Native OS Deep Link Handoff | $0.00 API cost | $0 Cost |
| **CI/CD & Registry** | GitHub Actions & Container Registry | GitHub Actions / AWS ECR | Build minutes & container storage: ~$30.00 / month | Fixed |
| **Edge CDN & WAF** | Ingress Security & DDoS Protection | Cloudflare Pro / Business | ~$20.00 / month | Fixed |
| **Secrets Manager** | Centralized Secrets Distribution | Doppler / Infisical Team | ~$18.00 / month | Fixed |

---

## 3. Parameterized Cost Projections Across 5 Scales

```
+-----------------------------------------------------------------------------------------------------------------+
|                                 PARAMETERIZED MONTHLY INFRASTRUCTURE EXPENSE MODEL                              |
+-----------------------------------------------------+-----------+-----------+-----------+-----------+-----------+
| Scale Profile:                                      | 10 Users  | 50 Users  | 200 Users | 500 Users | 2,500 Usr |
| Active Tenant SMB Companies:                        | 1 Tenant  | 1 Tenant  | 1 Tenant  | 2 Tenants | 50 Tenants|
+-----------------------------------------------------+-----------+-----------+-----------+-----------+-----------+
| FIXED PLATFORM BASELINE:                            |           |           |           |           |           |
| • API Compute (Containers)                          | $30.00    | $65.00    | $65.00    | $130.00   | $130.00   |
| • Background Worker Compute (Containers)            | $30.00    | $65.00    | $65.00    | $130.00   | $130.00   |
| • Managed PostgreSQL Primary + PostGIS              | $45.00    | $90.00    | $180.00   | $180.00   | $180.00   |
| • Managed PostgreSQL Read Replica                   | $0.00     | $0.00     | $0.00     | $90.00    | $90.00    |
| • Managed Redis HA (Primary + Replica with AOF)     | $25.00    | $45.00    | $65.00    | $65.00    | $65.00    |
| • Sentry Error Tracking                             | $0.00     | $26.00    | $26.00    | $26.00    | $26.00    |
| • Metrics & Logging Storage                         | $10.00    | $15.00    | $25.00    | $25.00    | $25.00    |
| • Transistor Geolocation Commercial License Support | $42.00    | $42.00    | $42.00    | $42.00    | $42.00    |
| • Web Vector Tiles (MapTiler / PMTiles)             | $5.00     | $10.00    | $15.00    | $20.00    | $25.00    |
| • CI/CD Runners & Container Registry                | $10.00    | $15.00    | $25.00    | $30.00    | $30.00    |
| • Edge CDN / WAF Shield                             | $0.00     | $20.00    | $20.00    | $20.00    | $20.00    |
| • Secrets Management (Infisical / Doppler)          | $0.00     | $18.00    | $18.00    | $18.00    | $18.00    |
+-----------------------------------------------------+-----------+-----------+-----------+-----------+-----------+
| VARIABLE STORAGE & USAGE:                           |           |           |           |           |           |
| • Database Storage & IOPS (GP3 SSD)                 | $2.50     | $5.75     | $15.00    | $35.00    | $60.00    |
| • Database PITR WAL & Snapshot Storage              | $1.00     | $2.50     | $6.00     | $12.00    | $25.00    |
| • Cloudflare R2 Object Storage (Photos & Proof)     | $0.30     | $1.50     | $6.00     | $15.00    | $75.00    |
| • R2 Class A & B Operations                         | $0.10     | $0.40     | $1.80     | $4.50     | $22.50    |
| • Transactional Email (Resend)                      | $0.00     | $20.00    | $20.00    | $35.00    | $75.00    |
| • Address Geocoding API (Radar API + Cache)         | $0.00     | $0.00     | $5.00     | $10.00    | $10.00    |
+-----------------------------------------------------+-----------+-----------+-----------+-----------+-----------+
| TOTAL ALL-IN MONTHLY INFRASTRUCTURE COST:           | $200.90   | $441.15   | $594.80   | $904.50   | $1,048.50 |
|                                                     |           |           |           |           |           |
| ALL-IN INFRASTRUCTURE COST PER ACTIVE EMPLOYEE / MO | $20.09    | $8.82     | $2.97     | $1.81     | $0.419    |
+-----------------------------------------------------+-----------+-----------+-----------+-----------+-----------+
```

---

## 4. Gross Margin Analysis (Commercial Assumption Modeling)

Retail SaaS seat pricing for SMB workforce platforms typically ranges between **$4.00 and $6.00 per employee per month**. 

Below is the mathematical gross margin model at 2,500 active employees (Total Infra: **$1,048.50 / month**, or **$0.419 / seat / month**):

| Assumed Retail Price per Seat | Total Monthly Revenue (2,500 Seats) | All-In Infrastructure Cost | Payment Gateway Fees (~2.9% + $0.30) | Net Gross Profit | Calculated Gross Margin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Conservative: $4.00 / user / mo** | $10,000.00 | $1,048.50 (10.5%) | ~$305.00 (3.0%) | $8,646.50 | **86.5%** |
| **Baseline: $5.00 / user / mo** | $12,500.00 | $1,048.50 (8.4%) | ~$377.50 (3.0%) | $11,074.00 | **88.6%** |
| **Target: $6.00 / user / mo** | $15,000.00 | $1,048.50 (7.0%) | ~$450.00 (3.0%) | $13,501.50 | **90.0%** |

---

## 5. Critical Variable Cost Risks & Structural Mitigations

1. **Proof Photo Bloat (Cloudflare R2):**
   - *Risk:* 2,500 technicians uploading 10MB raw photos from 50MP smartphone cameras could accumulate terabytes of storage rapidly.
   - *Mitigation:* Client-side image compression ([`ADR-012`](file:///workspace/oprino/docs/architecture/ADR-012-file-storage.md)) scales all photos to 1600x1200 JPEG (80% quality, ~200–250KB average) with burned-in watermarks before upload. 500,000 photos consume only ~110GB.
2. **Web Live Map Vector Tile Surges:**
   - *Risk:* Operations managers leaving live dashboards open 24/7 causing millions of tile fetches.
   - *Mitigation:* Browser tab idle detection pauses SSE streams after 15 minutes of inactivity; vector tiles are cached on Cloudflare Edge with a 7-day TTL.
3. **Continuous Location Telemetry Database Bloat:**
   - *Risk:* Unbounded coordinate breadcrumbs consuming expensive SSD storage and bogging down PostgreSQL query performance.
   - *Mitigation:* Partitioning by day and executing the automated 30-day purge engine ([`RETENTION-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/RETENTION-ARCHITECTURE.md)) strictly limits active telemetry rows to a rolling 30-day window.

---

## 6. Compliance with Phase 00 Approved Scope

- Formulates a realistic, fully parameterized financial and technical cost model.
- Demonstrates sustainable SMB economics with gross margins comfortably supporting company viability.
