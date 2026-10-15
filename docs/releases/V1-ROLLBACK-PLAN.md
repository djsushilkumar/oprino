# Oprino — V1 Commercial Launch Rollback & Recovery Plan

**Document Version:** 2.0.0  
**Effective Date:** October 15, 2026  
**Auditor:** Principal DevOps & Site Reliability Engineer  
**Scope:** V1 Release Rollback, Non-Destructive Disaster Recovery & Incident Remediation Procedures  

---

## 1. Non-Destructive Rollback Principles

In the event of a critical incident during or following deployment (such as unhandled application errors, severe latency, or third-party service outage), all operational responses must adhere to strict data-protection invariants:

### Mandatory Invariants:
1. **Zero Data Destruction:** **NEVER** execute destructive DDL commands (`DROP TABLE`, `DROP COLUMN`, `CASCADE`) or destructive cache commands (`FLUSHDB`, `FLUSHALL`) against live production infrastructure. Doing so permanently destroys customer data, attendance histories, and worker task queues.
2. **Additive Schema Preservation:** Migration `0005_v1_blockers_remediation.sql` is strictly additive (adding nullable columns, default values, and an independent `workspace_invitations` table). The previous application release (`8db713b`) is 100% forward-compatible with the migration-0005 schema. If application rollback is required, **revert the application code only and leave the database schema intact**.
3. **Snapshot-First Disaster Recovery:** Any database recovery operation must be conducted through Neon Point-in-Time Restore (PITR) snapshots or disposable branch replicas before any schema or state adjustments.
4. **Queue State Preservation:** BullMQ background queues contain user jobs and SLA monitors. Stalled or failed jobs must be paused and retried, never wiped.
5. **No Unverified SLA Claims:** Rollback time depends on DNS propagation, container build caching, and provider health-check convergence. Do not guarantee zero-downtime rollbacks without multi-region active-active routing.

---

## 2. Component-by-Component Rollback Procedures

### A. Vercel Web Application Reversion
If an unhandled client-side crash or frontend routing defect is detected:
1. Navigate to the Vercel Dashboard: `https://vercel.com/djsushilkumar/oprino-web`.
2. Open **Deployments** and locate the last verified production deployment (`8db713b` or approved baseline).
3. Select **Instant Rollback** to promote the previous immutable static build to the production domain.
4. Confirm health:
   - Verify `GET /` returns `HTTP 200 OK`.
   - Verify `GET /auth/signin` loads without runtime exceptions.
   - Verify API requests continue targeting `https://oprino-api.onrender.com`.

### B. Render API Container Reversion
If the Fastify backend encounters fatal startup loops or unhandled API crashes:
1. Open the Render Dashboard: `https://dashboard.render.com`.
2. Select the `oprino-api` web service.
3. In the **Events / Deploys** tab, locate the prior stable deployment image.
4. Click **Rollback to this deploy**.
5. Wait for Render health checks to complete against `/health/live`.
6. Confirm `/health/ready` returns:
   ```json
   {
     "status": "ready",
     "database": "connected",
     "redis": "connected"
   }
   ```
7. Because migration 0005 is additive, the rolled-back API container will function without errors against the database.

### C. Neon Serverless PostgreSQL Non-Destructive Recovery
**Under NO circumstances run `DROP TABLE` or `DROP COLUMN` on production.**

If data corruption or bad application writes occurred:
1. **Immediate Point-In-Time Snapshot Branching (Isolated Sandbox):**
   ```bash
   # Create a recovery branch from the precise timestamp immediately prior to the incident
   neonctl branches create \
     --name recovery-snapshot-$(date +%s) \
     --parent main \
     --suspend-timeout 0
   ```
2. **Inspect and Verify Data on the Recovery Branch:**
   Connect disposable tools to the recovery branch connection string to audit customer records without touching live production.
3. **Forward-Fix Strategy (Preferred):**
   Rather than rolling back schema migrations, prepare an additive, forward-fix migration (e.g., `0006_fix_...sql`) that safely patches corrupt rows or adjusts constraints while preserving all existing tables, foreign keys, and RLS policies.
4. **Full Branch Swap (Catastrophic Data Recovery Only):**
   Only if live production suffered irreversible tabular data corruption and with explicit owner sign-off:
   - Put API into maintenance mode (returning `HTTP 503 Service Unavailable`).
   - Restore database from PITR snapshot to a fresh primary branch.
   - Update `DATABASE_URL` in Render environment settings.
   - Verify all workspace tables, sequences, and RLS policies.
   - Resume API service.

### D. Redis & BullMQ Worker Queue Recovery
If background worker jobs fail or queue processing stalls:
1. **Do NOT run `FLUSHDB` or `FLUSHALL`.**
2. **Pause Queues Safely:**
   Connect via Redis CLI or BullMQ admin script:
   ```typescript
   // Pauses incoming jobs while allowing active jobs to complete safely
   await taskSlaQueue.pause();
   await recurringTaskQueue.pause();
   ```
3. **Inspect Failed Jobs:**
   ```typescript
   const failedJobs = await taskSlaQueue.getFailed(0, 100);
   console.log(`Failed jobs count: ${failedJobs.length}`);
   for (const job of failedJobs) {
     console.log(`Job ${job.id} failure reason: ${job.failedReason}`);
   }
   ```
4. **Retry Jobs After Application Fix:**
   ```typescript
   // Retry failed jobs once fix is deployed
   for (const job of failedJobs) {
     await job.retry();
   }
   await taskSlaQueue.resume();
   await recurringTaskQueue.resume();
   ```
5. **Drain Stale Locks Only (if worker crashes left orphaned locks):**
   ```bash
   # Remove only specific orphaned BullMQ lock keys, preserving all queue payloads
   redis-cli -u $REDIS_URL --scan --pattern "bull:*:lock" | xargs redis-cli -u $REDIS_URL DEL
   ```

### E. Android Mobile Client Remediation
Mobile apps installed on physical devices cannot be forcefully uninstalled remotely:
1. **Backward-Compatible Backend Contract:** Ensure the API maintains backward-compatible responses for older mobile build request signatures (e.g., punch-in without selfie key).
2. **Crash Mitigation via Remote Config / Fail-Safe Defaults:** The mobile app defaults to fail-safe local caching when the server responds with 5xx or network errors.
3. **Emergency APK Distribution:** If a catastrophic client bug is reported in the pilot, upload a hotfix APK build with an incremented `versionCode` and distribute via the pilot distribution channel.
4. **Durable SQLite Outbox:** The local Drift SQLite database retains queued punches and locations indefinitely until a healthy server endpoint is reachable. No punch data is lost during backend maintenance.

---

## 3. Post-Incident Review Protocol

1. **Incident Declaration & Pipeline Freeze:** Halt all CI/CD deployments to `main` until root cause is identified.
2. **Log & Metric Preservation:**
   - Export Fastify structured JSON logs from Render.
   - Export Vercel serverless request logs.
   - Snapshot Prometheus metrics from `/metrics`.
3. **Blameless Retrospective:** Convene engineering team to document:
   - Root cause and trigger conditions.
   - Detection time (MTTD) and recovery time (MTTR).
   - Gaps in automated CI test coverage.
4. **Action Item Tracking:** Convert retrospective findings into regression tests and architectural decision records (ADRs) before lifting deployment freeze.
