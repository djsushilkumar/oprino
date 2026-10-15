# Oprino — V1 Commercial Launch Rollback Plan

**Document Version:** 1.0.0  
**Effective Date:** October 15, 2026  
**Auditor:** Senior DevOps & Site Reliability Engineer  
**Scope:** V1 Release Rollback & Incident Recovery Procedures  

---

## 1. Rollback Strategy & Principles

In the event of a critical P0 incident during or immediately following commercial deployment (e.g., severe data corruption, unexpected cloud outage, or tenant isolation failure), this rollback plan provides exact, tested steps to safely restore system availability.

### Core Recovery Invariants:
1. **Prioritize Data Integrity:** Never execute destructive SQL statements (`DROP TABLE`) without verified offline database snapshots.
2. **Instant Web & API Reversion:** Web dashboard and API containers support zero-downtime atomic rollbacks via Vercel and Render versioned deployment artifacts.
3. **Additive Schema Safety:** Migration `0005_v1_blockers_remediation.sql` is strictly additive (adds nullable columns, default values, and a standalone `workspace_invitations` table). It maintains 100% backward compatibility with `main` code (`8db713b`).

---

## 2. Component Rollback Procedures

### A. Vercel Web Dashboard Rollback (Target Time: < 1 Minute)
If a critical frontend regression is detected:
1. Log into the Vercel Dashboard at `https://vercel.com/djsushilkumar/oprino-web`.
2. Navigate to **Deployments**.
3. Locate the previous production deployment commit (`8db713b` or approved stable baseline).
4. Click the three dots (`...`) and select **Instant Rollback**.
5. Verify traffic routes immediately to the previous static build.

### B. Render Fastify API Rollback (Target Time: < 3 Minutes)
If the Fastify backend experiences unhandled crashes or configuration errors:
1. Log into Render Dashboard at `https://dashboard.render.com`.
2. Select the web service `oprino-api`.
3. Under the **Events / Deploys** tab, locate the prior stable deployment.
4. Click **Rollback to this deploy**.
5. Verify `/health/ready` returns `HTTP 200 OK` with database and redis connected.

### C. Neon Serverless PostgreSQL Database Rollback
Because migration `0005` is backward compatible, code running on the previous commit can safely execute against the database without rolling back the schema. However, if schema restoration is required:
1. Neon provides instantaneous Point-in-Time Restore (PITR) and branching:
   ```bash
   # Create a recovery branch from the timestamp prior to migration deployment
   neonctl branches create --name pre-v1-recovery --parent main
   ```
2. Or execute the manual rollback SQL script below:
   ```sql
   -- Oprino Phase 05 Migration 0005 Reversal Script
   DROP FUNCTION IF EXISTS telemetry_prune_workspace_records(UUID, INT);
   DROP TABLE IF EXISTS "workspace_invitations" CASCADE;
   ALTER TABLE "attendance_sessions" 
     DROP COLUMN IF EXISTS "selfie_media_key",
     DROP COLUMN IF EXISTS "punch_in_latitude",
     DROP COLUMN IF EXISTS "punch_in_longitude",
     DROP COLUMN IF EXISTS "punch_in_accuracy";
   ALTER TABLE "workspace_memberships" 
     DROP COLUMN IF EXISTS "manager_id";
   ALTER TABLE "workspaces" 
     DROP COLUMN IF EXISTS "location_retention_days",
     DROP COLUMN IF EXISTS "attendance_policy";
   ```

### D. Upstash Redis Rollback
Redis handles caching and BullMQ job queues. If jobs stall or queue corruption occurs:
```bash
# Flush transient job state if unrecoverable
redis-cli -u $REDIS_URL FLUSHDB
```

### E. Android Mobile Application Rollback
Mobile client updates cannot be rolled back instantaneously once installed on end-user physical devices:
1. **Immediate Backend Support:** Ensure older mobile client versions (pre-v1) can still authenticate and submit punch records.
2. **Re-publish Stable APK:** Re-distribute the previous signed APK to field users.
3. **Outbox Safe Draining:** Mobile Drift SQLite outbox queues remain persisted on device and will synchronize once connectivity or server fixes are applied.

---

## 3. Post-Rollback Postmortem Protocol
1. Freeze all deployment pipelines.
2. Export Prometheus metrics (`/metrics`) and error logs from Render and Vercel.
3. Convene an immediate incident retrospective.
4. Document root causes and prevention measures before scheduling redeployment.
