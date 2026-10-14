# Oprino Security & Privacy Findings Report

**Document:** Comprehensive Security & Privacy Audit Report  
**Version:** 2.0 (Post-Remediation Hardened)  
**Date:** October 12, 2026  
**Auditor Roles:** Principal Security Architect & Lead Security Auditor  
**Threat Model Authority:** [`docs/architecture/THREAT-MODEL.md`](../architecture/THREAT-MODEL.md)  
**Security Architecture:** [`docs/architecture/SECURITY-ARCHITECTURE.md`](../architecture/SECURITY-ARCHITECTURE.md)  
**Privacy Architecture:** [`docs/architecture/PRIVACY-ARCHITECTURE.md`](../architecture/PRIVACY-ARCHITECTURE.md)  

---

## 1. Executive Summary & Posture

Oprino manages high-sensitivity enterprise operations: continuous duty-hours employee GPS telemetry, customer physical sites, client on-glass signatures, and workforce performance data. 

The security review evaluated the application against the OWASP Top 10, multi-tenant isolation boundaries, cryptographic storage, duty-boundary cutoff enforcement, and supply chain integrity.

### Summary of Vulnerabilities by Severity:
- **Critical (P0):** 0
- **High (P0 Blocker):** 0 (All remediated and verified)
  - `SEC-01`: Hardcoded Default Password Pattern in Web Team UI — **RESOLVED**
- **Medium (P1):** 0 (All remediated and verified)
  - `SEC-02`: Member Invitation Without Password / Self-Activation — **RESOLVED**
  - `SEC-03`: Tenant Location Retention Configuration Missing — **RESOLVED**
  - `SEC-04`: Mock Media Upload Route Exposure & Tenant Barriers — **RESOLVED**
- **Low (P2):** 1 (Non-blocking Next.js lint plugin config)
- **Verified Hardening Controls:** 8 (All verified green in automated integration suites)

---

## 2. Vulnerability Inventory & Detailed Remediation Status

### SEC-01: Hardcoded Default Password Pattern in Team Add Member Modal
- **Finding ID:** `SEC-01`
- **Severity:** **HIGH (P0 Launch Blocker)**
- **Status:** **RESOLVED**
- **Component:** `apps/web/src/app/team/page.tsx`
- **CWE:** CWE-798: Use of Hard-coded Credentials / CWE-521: Weak Password Requirements
- **Remediation Implemented:**
  1. Purged `'Welcome@123'` completely from all files in the codebase.
  2. Implemented cryptographically secure single-use invitation tokens (`crypto.randomBytes(32)`).
  3. Tokens are stored as SHA-256 hashes (`workspace_invitations` table) with 7-day expiration.
  4. Employees activate their accounts at `/auth/activate?token=...`, choosing their own password with minimum 8 characters and confirmation.
  5. Tokens are single-use (`ACCEPTED` flag) to prevent replay attacks.
  6. Admins can revoke pending invitations on demand.
  7. Token validation and acceptance endpoints are protected by IP and workspace rate limits.
- **Verification Evidence:** `services/api/src/v1-blockers.integration.test.ts` (7/7 tests pass).

---

### SEC-02: User Creation Fallback Without Password or Verification
- **Finding ID:** `SEC-02`
- **Severity:** **MEDIUM (P1)**
- **Status:** **RESOLVED**
- **Component:** `services/api/src/services/workspace.service.ts`
- **CWE:** CWE-287: Improper Authentication
- **Remediation Implemented:**
  1. Deprecated direct unverified user creation without credentials.
  2. Implemented the official `POST /v1/workspaces/members/invite` route.
  3. Supports both individual employee invitation and bulk CSV onboarding (`POST /v1/workspaces/members/import-csv`).
  4. Both workflows generate cryptographically secure activation tokens and send/copy activation links, allowing the employee to securely set their password before account creation completes.
- **Verification Evidence:** `services/api/src/v1-blockers.integration.test.ts` (suite BLK-002 and BLK-003 pass).

---

### SEC-03: Lack of Tenant-Level Location Retention Configuration
- **Finding ID:** `SEC-03`
- **Severity:** **MEDIUM (P1)**
- **Status:** **RESOLVED**
- **Component:** `packages/database/src/schema/tenants.ts`, `services/api/src/routes/workspaces.ts`, `services/worker/src/worker.ts`
- **CWE:** CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- **Remediation Implemented:**
  1. Created and applied database migration `0005_v1_blockers_remediation.sql` adding `location_retention_days: integer().notNull().default(30)` to `workspaces`.
  2. Created PostgreSQL function `telemetry_prune_workspace_records(p_workspace_id UUID, p_retention_days INT)` enforcing strict workspace isolation during telemetry deletion.
  3. Implemented `GET /v1/workspaces/settings` and `PATCH /v1/workspaces/settings` routes restricted to workspace Owners and Admins.
  4. Supported retention options: 7, 30 (default), 90, 180 days.
  5. Upgraded BullMQ worker job `telemetry.retention.prune` to loop through active workspaces and prune each workspace according to its individual retention policy.
- **Verification Evidence:** `services/api/src/v1-blockers.integration.test.ts` (suite BLK-006 passes).

---

### SEC-04: Development Mock Media Upload Route Exposure & Tenant Barriers
- **Finding ID:** `SEC-04`
- **Severity:** **MEDIUM (P1)**
- **Status:** **RESOLVED**
- **Component:** `services/api/src/routes/media.ts`, `services/api/src/services/media.service.ts`
- **CWE:** CWE-434 / CWE-284: Improper Access Control
- **Remediation Implemented:**
  1. Multi-tenant prefix barriers enforced on all media endpoints: uploaded media keys must be strictly prefixed with the authenticated workspace ID (`${workspaceId}/...`).
  2. `GET /v1/media/files/*` route validates that the requesting session or token matches the file's tenant prefix; cross-tenant media access is blocked with HTTP 403.
  3. Added attendance selfie upload route `POST /v1/media/attendance-selfie-url` which validates the workspace prefix and returns isolated upload keys.
  4. Anti-replay verification prevents cross-session selfie reuse (`SELFIE_REPLAY_DETECTED`).
- **Verification Evidence:** `services/api/src/v1-blockers.integration.test.ts` (suite BLK-004 passes).

---

## 3. Verified Security Controls & Hardening Achievements

### 3.1 Multi-Tenant Isolation & Pooled Connection Safety (VERIFIED)
- **Architecture:** 5-stage tenant verification pipeline (`authenticate` -> `requireWorkspace` -> `requirePermission` -> `SET LOCAL app.current_workspace_id` -> PostgreSQL RLS).
- **Test Evidence:** 12 automated negative integration tests in `server.test.ts` and `v1-blockers.integration.test.ts`:
  1. Direct queries without tenant context return 0 rows (default-deny).
  2. `SET LOCAL app.current_workspace_id` isolates queries to the active tenant only.
  3. Cross-workspace reads (User in Workspace A reading Workspace B) return 0 rows or 404.
  4. Cross-workspace writes violate RLS `WITH CHECK` and error immediately.
  5. Pooled connections do not retain prior tenant context (`SET LOCAL` terminates on transaction commit/rollback).

### 3.2 Inviolable Duty-Hours Privacy Boundary (VERIFIED)
- **Principle:** Off-duty employee GPS telemetry must **NEVER** be recorded under any circumstances.
- **Test Evidence:**
  - Automated integration test `Duty Boundary Invariant: Off-duty employee telemetry is HARD DROPPED with ZERO DB writes` passes.
  - Subsequent points submitted after Punch Out are immediately dropped.
  - Peer live location visibility is OFF by default; employees without `location.read` permission receive HTTP 403 when requesting the live map.

### 3.3 Rate Limiting, Helmet Security Headers & Cryptographic Tokens (VERIFIED)
- Fastify Helmet security headers (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`) verified on all API responses.
- CORS restricted to configured frontend domains with credentials.
- Rate limiting enforces burst limits on auth and invitation endpoints.
- Stream tickets for Live Map SSE use 256-bit cryptographically secure entropy (`crypto.randomBytes(32)`).
