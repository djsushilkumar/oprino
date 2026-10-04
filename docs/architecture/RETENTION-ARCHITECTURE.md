# Oprino Data Retention, Lifecycle & Least-Privileged Purge Architecture (Re-evaluated)

**Status:** Updated & Recommended for Phase 01A  
**Date:** October 2026 (Reconciled)  
**Controlling Documents:** 
- Phase 00 Approved PRD ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))
- Phase 00 Stakeholder Sign-Off (Frozen Retention Policy)
- [`ADR-004: Database & Geospatial Architecture`](file:///workspace/oprino/docs/architecture/ADR-004-database-geospatial.md)
- [`docs/architecture/PRIVACY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/PRIVACY-ARCHITECTURE.md)

---

## 1. Executive Summary & Policy Baseline

Data retention in Oprino is governed by a strict distinction between **High-Frequency Ephemeral Telemetry** and **Operational Business Records**.

Per the **Phase 00 Stakeholder Sign-Off**:
- **Default Location History Retention:** **30 days**.
- **Configurable Retention Options:** **7 days**, **30 days**, **90 days**, **180 days**, and extended/custom retention where supported by enterprise plan or compliance mandates.
- **Operational Records:** Shifts, completed tasks, customer visit records, and audit logs are retained under explicit operational lifecycle policies.

**Stakeholder Review Directive:**  
Partitioning may be used, but `DROP TABLE` alone does not constitute complete regulatory deletion. The retention architecture must comprehensively address primary tables, indexes, read replicas, backups/PITR, object exports, derived aggregates, and debug logs. Derived mileage must **NOT** be retained "permanently" by default, and application workers must **NEVER** hold unrestricted DDL privileges.

---

## 2. Retention Schedules Across All Data Categories

| Data Category | Target Tables / Storage | Retention Policy | Purge / Transition Mechanism | Operational Rationale |
|---|---|---|---|---|
| **Raw GPS Breadcrumbs** | `telemetry.employee_locations` | **30 days (Default)**<br>(Configurable: 7, 30, 90, 180 days) | Automated nightly call to security-definer procedure `telemetry.prune_expired_partitions()`. | Privacy minimization; eliminates storage bloat while maintaining duty oversight. |
| **Derived Mileage Summaries** | `daily_travel_summaries` | **3 Years (Configurable)** | Nightly SQL delete: `DELETE WHERE date < NOW() - INTERVAL '3 years'`. | Operational conveyance expense verification; NOT permanent. |
| **Attendance Records** | `attendance_records` | **3 Years (Configurable)** | Retained in primary DB; archived upon company request. | Workforce shift verification and attendance history. |
| **Tasks & Site Visits** | `tasks`, `customer_visits` | **3 Years (Configurable)** | Retained; archived to cold storage after 3 years. | Core operational records, customer service history, warranty verification. |
| **Proof Media (Photos/Sigs)** | Cloudflare R2 / S3 (`/proofs/`) | **1 Year Hot R2** | Lifecycle rule moves objects to Infrequent Access at 90 days; deleted after 365 days unless flagged. | Balances manager proof inspection with storage cost optimization. |
| **Audit Logs** | `audit.system_audit_logs` | **365 Days Active** | Exported to compressed JSONL in cold storage after 1 year. | Governance, dispute resolution, security forensics. |
| **Object Exports (CSV/PDF)** | `/exports/` storage | **7 Days** | Automated R2 bucket lifecycle rule permanently deletes export files after 7 days. | Temporary download link protection. |
| **Backups & PITR WAL** | Managed Cloud Backup Store | **35-Day Rolling Window** | Automated cloud backup retention prunes WAL segments older than 35 days. | Recovery point objective while ensuring purged data leaves cold backups. |
| **Support / Debug Logs** | Pino Stdout / Sentry | **Zero GPS Retention** | PII and coordinates redacted prior to serialization. Sentry logs expire after 30 days. | Zero telemetry leakage in monitoring tools. |

---

## 3. Least-Privileged Retention Maintenance Architecture

Application workers and general API processes must **NEVER** hold unrestricted DDL privileges (`DROP TABLE`, `ALTER TABLE`) in production.

```mermaid
flowchart LR
    subgraph Worker["Isolated BullMQ Maintenance Worker"]
        CRON["Nightly Scheduler (02:00 UTC)"]
        CLIENT["DB Client (Role: oprino_maintenance_user)"]
    end

    subgraph StoredProc["PostgreSQL Security Boundary"]
        PROC["telemetry.prune_expired_partitions(days INT)<br>[SECURITY DEFINER]"]
        CREATE_PROC["telemetry.ensure_future_partitions(days INT)<br>[SECURITY DEFINER]"]
    end

    subgraph Data["PostgreSQL Storage Engine"]
        TABLES[("telemetry.employee_locations_YYYY_MM_DD")]
    end

    CRON --> CLIENT
    CLIENT -->|CALL (Only EXECUTE allowed)| PROC & CREATE_PROC
    PROC -->|Drops expired partition metadata| TABLES
    CREATE_PROC -->|Provisions next 7 daily partitions| TABLES
```

### 3.1 Security Definer Maintenance Stored Procedure
```sql
-- Executed strictly by the database administrator during migration
CREATE OR REPLACE FUNCTION telemetry.prune_expired_partitions(retention_days INT)
RETURNS TABLE(dropped_partition TEXT) AS $$
DECLARE
    row_record RECORD;
    cutoff_date DATE;
    cutoff_partition_name TEXT;
BEGIN
    -- Clamp minimum retention to 7 days for safety
    IF retention_days < 7 THEN
        RAISE EXCEPTION 'Retention days cannot be less than 7';
    END IF;

    cutoff_date := CURRENT_DATE - (retention_days || ' days')::INTERVAL;
    cutoff_partition_name := 'employee_locations_' || to_char(cutoff_date, 'YYYY_MM_DD');

    FOR row_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'telemetry' 
          AND tablename < cutoff_partition_name
          AND tablename LIKE 'employee_locations_%'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS telemetry.' || quote_ident(row_record.tablename) || ' CASCADE;';
        dropped_partition := row_record.tablename;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant strictly EXECUTE on this specific function to the maintenance worker
REVOKE ALL ON SCHEMA telemetry FROM oprino_maintenance_user;
GRANT USAGE ON SCHEMA telemetry TO oprino_maintenance_user;
GRANT EXECUTE ON FUNCTION telemetry.prune_expired_partitions(INT) TO oprino_maintenance_user;
GRANT EXECUTE ON FUNCTION telemetry.ensure_future_partitions(INT) TO oprino_maintenance_user;
```

---

## 4. Multi-Layer Deletion Lifecycle (Beyond `DROP TABLE`)

Complete regulatory data deletion requires enforcing data expiry across all storage tiers:

1. **Primary Tables & Indexes:** Dropped cleanly via the security-definer procedure in < 15ms.
2. **Physical Replicas:** Read replicas stream the DDL change and immediately drop their local partition tables.
3. **Database Backups & Point-in-Time Recovery (PITR):**
   - Cloud PostgreSQL automated backups maintain a rolling **35-day backup retention window**.
   - After 35 days, WAL files and physical snapshots containing the dropped partition are automatically overwritten and purged from cold backup storage.
4. **Temporary Exports & Caches:**
   - Any CSV or PDF reports generated by managers are stored in `/exports/` with an S2/R2 lifecycle rule that deletes files after 7 days.
   - Redis location cache keys have a strict TTL of 15 minutes.
5. **Derived Aggregate Mileage:**
   - Conveyance distance totals (`daily_travel_summaries`) contain only aggregated numbers (e.g. `total_distance_km: 18.4`), never raw coordinate breadcrumbs.
   - These records are retained for a bounded **3-year operational retention policy**, after which they are deleted.

---

## 5. Account Deletion & Tenant Offboarding Protocol

When an SMB customer terminates their subscription or requests tenant data erasure:
1. **Immediate Revocation (Hour 0):** All active JWT sessions, refresh tokens, and mobile device tokens are revoked; API access is blocked.
2. **Read-Only Grace Period (30 Days):** Tenant status set to `SUSPENDED_PENDING_PURGE` allowing accidental cancellation recovery.
3. **Hard Cascade Erasure (Day 31):**
   - Object storage purge: Bulk delete all R2 objects with prefix `/{workspace_id}/`.
   - PostgreSQL cascade: `DELETE FROM workspaces WHERE id = $1;` cascades to all users, tasks, attendance records, and telemetry partitions.
   - Redis flush: Removes all tenant cache keys.
   - Anonymized tombstone record created in platform audit register.

---

## 6. Compliance with Phase 00 Approved Scope

- Strictly implements the 30-day default location history retention baseline.
- Focuses purely on operational workforce management; avoids scope creep into payroll or billing compliance.
- Enforces least-privileged maintenance access with zero application DDL permissions.
