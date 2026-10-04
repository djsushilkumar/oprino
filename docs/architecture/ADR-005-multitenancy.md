# ADR-005: Multi-Tenancy Architecture, Isolation Flow & Pooled RLS Enforcement (Re-evaluated)

**Status:** Updated & Recommended for Phase 01A  
**Date:** October 2026 (Reconciled)  
**Deciders:** Lead Systems Architect, Security Engineering, Database Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Oprino is a multi-company SaaS platform serving SMBs with 5 to 500 employees (sweet spot: 10 to 200).
Key tenancy requirements from Phase 00:
- **Strict Horizontal Isolation:** An employee or manager in Company A must never view, mutate, or leak data to Company B under any circumstance.
- **Multi-Company Memberships:** A single user identity can belong to multiple workspaces with distinct roles in each (e.g. technician in Company A, manager in Company B).
- **Zero-Trust Tenant Authorization:** An arbitrary `workspace_id` header or body claim must **NEVER** be trusted blindly. Tenant context must be cryptographically and transactionally authenticated.
- **Pooled Connection Safety:** In high-concurrency environments utilizing connection poolers (PgBouncer in transaction mode or Fastify pg-pool), session-level state (`SET app.current_workspace_id`) can leak across queries if a connection is reused by another tenant.
- **Operational Efficiency:** Migrations across hundreds of SMB tenants must run in seconds without the complexity of hundreds of isolated schemas.

---

## 2. Alternatives Evaluated

### Alternative A: Shared Database, Shared Schema with Verified Tenant Scope + Transactional RLS
- **Overview:** All tenant tables include `workspace_id UUID NOT NULL`. Tenant isolation is enforced through a strict 5-stage verification pipeline:
  1. Authenticated Identity (JWT verification)
  2. Workspace Membership Verification (Active membership query)
  3. Authorized Active Workspace Context (Binding validated `workspace_id`)
  4. Transaction-Scoped Database Tenant Context (`SET LOCAL app.current_workspace_id = ...` strictly inside a transaction block)
  5. PostgreSQL Row-Level Security (RLS) Enforcement
- **Pros:** Maximum hardware density and connection pooling efficiency; single migration script updates all tenants atomically; zero connection leaks across pooled connections; RLS acts as a mathematical defense-in-depth safety net.
- **Cons:** Requires strict adherence to transactional connection wrappers.

### Alternative B: Schema-per-Tenant (Isolated PostgreSQL Schema per Company)
- **Overview:** Separate schema per tenant (`company_a.*`, `company_b.*`).
- **Pros:** Logical database namespace separation.
- **Cons:** Migration loop bottleneck across 500+ tenants; PostgreSQL catalog bloat (`pg_class`); incompatible with high-density transaction-mode PgBouncer connection pooling.

### Alternative C: Database-per-Tenant
- **Overview:** Separate physical PostgreSQL instance per tenant.
- **Pros:** Complete physical separation.
- **Cons:** Financially impossible for SMB SaaS margins ($15–$30/mo minimum per tenant on cloud DBs); unsustainable for a 15-person company paying $5/user/month.

---

## 3. Decision

**Adopt Alternative A: Shared Database, Shared Schema with Zero-Trust 5-Stage Tenant Verification, Transaction-Scoped RLS (`SET LOCAL`), and Automated Negative Isolation Testing.**

---

## 4. The 5-Stage Multi-Tenant Enforcement Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Dashboard / Mobile Client
    participant AuthGuard as Fastify Auth Guard
    participant MemberGuard as Workspace Membership Guard
    participant Pool as PostgreSQL Connection Pool
    participant DB as PostgreSQL Transaction & RLS

    Client->>AuthGuard: HTTP Request + Bearer Token / Session Cookie + Workspace Header
    Note over AuthGuard: 1. Authenticate Identity
    AuthGuard->>AuthGuard: Verify cryptographic signature -> userId
    
    AuthGuard->>MemberGuard: 2. Verify Workspace Membership
    MemberGuard->>Pool: SELECT role_id, status FROM workspace_memberships WHERE user_id = $1 AND workspace_id = $2
    
    alt Membership Missing / Status != 'ACTIVE'
        MemberGuard-->>Client: 403 Forbidden ("Invalid or inactive workspace membership")
    else Active Valid Membership
        MemberGuard->>MemberGuard: 3. Establish Authorized Active Context (workspaceId, roleId)
        
        MemberGuard->>Pool: 4. Acquire Connection & BEGIN TRANSACTION
        Pool->>DB: BEGIN;
        Pool->>DB: SET LOCAL app.current_workspace_id = 'verified_workspace_id';
        
        Note over DB: 5. Transaction-Scoped RLS Enforcement
        MemberGuard->>DB: Execute Query: SELECT * FROM tasks WHERE ...;
        Note over DB: RLS policy enforces workspace_id = current_setting('app.current_workspace_id')
        DB-->>Pool: Return strictly isolated rows
        Pool->>DB: COMMIT; (SET LOCAL resets immediately upon COMMIT/ROLLBACK)
        MemberGuard-->>Client: 200 OK (Tenant-safe response)
    end
```

### 4.1 Connection Pool Safety: The `SET LOCAL` Invariant
When utilizing connection poolers (PgBouncer in transaction mode or Node-postgres pool):
- **NEVER** execute session-level `SET app.current_workspace_id = ...`. Doing so attaches the tenant ID to the physical connection. If that connection returns to the pool and is given to another request, cross-tenant data leakage occurs.
- **ALWAYS** execute inside a transaction block using `SET LOCAL`:
  ```sql
  BEGIN;
  SELECT set_config('app.current_workspace_id', $1, true); -- true = local to current transaction
  -- Application queries executed here are strictly isolated by RLS
  COMMIT; -- set_config automatically clears upon commit or rollback
  ```
- Any connection returned to the pool is guaranteed to have `app.current_workspace_id = NULL`.

### 4.2 Row-Level Security Policy Definition
```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON public.tasks
  FOR ALL
  TO authenticated_app_user
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
  WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);
```

---

## 5. Automated Negative Isolation Test Suite

To guarantee that tenant boundaries are impervious to bugs, our CI/CD pipeline enforces an automated **Negative Isolation Test Matrix**:

| Negative Isolation Test Case | Attack / Fault Simulation | Expected Result |
|---|---|:---:|
| **Cross-Workspace Row Read** | Authenticated User in Workspace A attempts to fetch Task UUID belonging to Workspace B via `GET /v1/tasks/:id`. | **HTTP 404 Not Found** (RLS culls row). |
| **Cross-Workspace Mutation** | User in Workspace A attempts to update or complete a task belonging to Workspace B via `PATCH /v1/tasks/:id`. | **HTTP 404 / 403 Forbidden** (Zero rows affected). |
| **Forged Tenant Header** | User passes header `X-Workspace-Id: <Victim-Workspace-UUID>` for a company they do not belong to. | **HTTP 403 Forbidden** (Membership guard halts before DB). |
| **Stale Workspace Membership** | User’s membership in Workspace A is changed to `SUSPENDED` while user retains an active token. | **HTTP 403 Forbidden** on next request. |
| **Removed / Terminated Employee** | User is deleted from `workspace_memberships`; attempts replay of previous task submission. | **HTTP 403 Forbidden** (Zero database access). |
| **Role Downgrade In-Flight** | Manager downgraded to Employee; attempts to invoke `POST /v1/attendance/regularize`. | **HTTP 403 Forbidden** (RBAC permission denied). |
| **Rapid Workspace Switching** | Client issues alternating concurrent requests across Workspace A and Workspace B over pooled connections. | **100% Correct Scoping**; zero bleed across `SET LOCAL` boundaries. |

---

## 6. Consequences & Trade-offs

- **Positive:**
  - Zero possibility of connection pool tenant contamination.
  - Complete defense against forged `workspace_id` parameters.
  - High developer velocity: single database migration updates all SMB companies.
- **Negative:**
  - Queries require wrapping inside transaction blocks to leverage `SET LOCAL`.
- **Mitigation:**
  - Fastify tenant repository abstraction automatically wraps queries in transactional `withTenantContext()` helper.

---

## 7. Compliance with Phase 00 Approved Scope

- Ensures full data sovereignty and multi-tenant security for companies with 5–500 employees.
- Guarantees zero cross-company operational leakage.
