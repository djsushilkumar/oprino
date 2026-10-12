# Oprino Security & Privacy Findings Report

**Document:** Comprehensive Security & Privacy Audit Report  
**Date:** October 2026  
**Auditor Roles:** Principal Security Architect & Lead Security Auditor  
**Threat Model Authority:** [`docs/architecture/THREAT-MODEL.md`](file:///workspace/oprino/docs/architecture/THREAT-MODEL.md)  
**Security Architecture:** [`docs/architecture/SECURITY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/SECURITY-ARCHITECTURE.md)  
**Privacy Architecture:** [`docs/architecture/PRIVACY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/PRIVACY-ARCHITECTURE.md)  

---

## 1. Executive Summary & Posture

Oprino manages high-sensitivity enterprise operations: continuous duty-hours employee GPS telemetry, customer physical sites, client on-glass signatures, and workforce performance data. 

The security review evaluated the application against the OWASP Top 10, multi-tenant isolation boundaries, cryptographic storage, duty-boundary cutoff enforcement, and supply chain integrity.

### Summary of Vulnerabilities by Severity:
- **Critical (P0):** 0
- **High (P0 Blocker):** 1 (Hardcoded Default Password in Web Team UI)
- **Medium (P1):** 3 (Member Invitation Without Email Verification, Lack of Tenant Settings for Retention, Mock Media Upload Endpoint in Dev Mode)
- **Low (P2):** 2 (Prettier Formatting Warnings, Missing Next.js Plugin in Root ESLint Config)
- **Informational / Hardened:** 6 (Streaming Ticket Randomness Hardened, Server Error Stack Trace Suppression Hardened, PostgreSQL RLS Default-Deny Verified, S3 Pre-Signed Workspace Prefix Confined, Rate Limiting Verified, Duty Cutoff Verified)

---

## 2. Vulnerability Inventory & Detailed Assessments

### SEC-01: Hardcoded Default Password Pattern in Team Add Member Modal
- **Finding ID:** `SEC-01`
- **Severity:** **HIGH (P0 Launch Blocker)**
- **Component:** `apps/web/src/app/team/page.tsx` (Lines 26 & 100)
- **CWE:** CWE-798: Use of Hard-coded Credentials / CWE-521: Weak Password Requirements
- **Description:**  
  When an operations manager or business owner opens the "Add Team Member" modal on the web dashboard, the state initializes with `const [memberPassword, setMemberPassword] = useState('Welcome@123')`. If the manager does not deliberately delete and change this pre-filled field, newly created employee accounts are provisioned with the identical, publicly guessable password `'Welcome@123'`.
- **Exploitability Analysis:**  
  An attacker or disgruntled employee who knows an organization uses Oprino can enumerate public employee emails and authenticate with `'Welcome@123'`, achieving unauthorized account access, viewing confidential assigned tasks, falsifying attendance punches, or uploading fraudulent proof of work.
- **Remediation Plan:**  
  1. Remove `'Welcome@123'` default value. Initialize `memberPassword` as empty string `''`.
  2. Implement an automated "Generate Secure Temporary Password" generator or one-time invite token workflow.
  3. Require password change upon initial login when provisioned by an administrator.

---

### SEC-02: User Creation Fallback Without Password or Verification in `addWorkspaceMember`
- **Finding ID:** `SEC-02`
- **Severity:** **MEDIUM (P1)**
- **Component:** `services/api/src/services/workspace.service.ts` (Lines 343–353)
- **CWE:** CWE-287: Improper Authentication
- **Description:**  
  If `addWorkspaceMember` is invoked without a password, the service falls back to executing a direct `db.insert(users)` with `crypto.randomUUID()`, setting `emailVerified: false`. Because Better Auth accounts require a hashed password credential record in the auth account table, this newly created user cannot authenticate or log in through `/v1/auth/signin` or the mobile app.
- **Exploitability Analysis:**  
  This does not leak credentials, but creates "zombie" employee records that cannot access the system, breaking operational onboarding.
- **Remediation Plan:**  
  Require either:
  a) A mandatory temporary password that calls `auth.api.signUpEmail`, OR
  b) An email invitation flow generating a signed token that allows the employee to set their own password securely.

---

### SEC-03: Lack of Tenant-Level Location Retention Configuration (Hardcoded 30-Day Default)
- **Finding ID:** `SEC-03`
- **Severity:** **MEDIUM (P1)**
- **Component:** `packages/database/src/schema/tenants.ts` & `services/api/src/services/telemetry.service.ts`
- **CWE:** CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- **Description:**  
  The approved product requirements in `docs/product/V1-SCOPE.md` mandate configurable location retention (7, 30, 90, 180 days). Currently, the database schema lacks a `location_retention_days` column on `workspaces`, and `telemetry_prune_expired_records(days)` defaults unconditionally to 30 days. Tenants operating in jurisdictions requiring 7-day data minimization cannot enforce a stricter retention window.
- **Remediation Plan:**  
  Add `location_retention_days: integer().notNull().default(30)` to the `workspaces` table and respect the workspace's configured threshold during nightly partition pruning.

---

### SEC-04: Development Mock Media Upload Route Exposure
- **Finding ID:** `SEC-04`
- **Severity:** **MEDIUM (P1)**
- **Component:** `services/api/src/routes/media.ts` (Lines 96–98)
- **CWE:** CWE-434: Unrestricted Upload of File with Dangerous Type
- **Description:**  
  `PUT /v1/media/mock-upload/*` was introduced for local zero-cost development without requiring live AWS S3 or Cloudflare R2 credentials. If deployed to production without guardrails, this endpoint accepts mock uploads without saving to real object storage.
- **Remediation Plan:**  
  Ensure `app.put('/v1/media/mock-upload/*')` is mounted strictly when `env.NODE_ENV !== 'production'`. When `NODE_ENV === 'production'`, verify S3/R2 pre-signed URLs are issued against configured storage bucket credentials (`R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).

---

### SEC-05: Missing Next.js Plugin in ESLint Monorepo Root
- **Finding ID:** `SEC-05`
- **Severity:** **LOW (P2)**
- **Component:** `eslint.config.js` / `apps/web/next.config.js`
- **Description:**  
  During `next build`, Next.js emits warning: `"The Next.js plugin was not detected in your ESLint configuration."` While monorepo linting passes with zero errors, specific Next.js best practices (e.g., `@next/next/no-html-link-for-pages`, image optimization rules) are not enforced at lint time.
- **Remediation Plan:**  
  Add `@next/eslint-plugin-next` to `packages/config-eslint` and extend it in `apps/web`.

---

## 3. Verified Security Controls & Hardening Achievements

### 3.1 Multi-Tenant Isolation & Pooled Connection Safety (VERIFIED)
- **Architecture:** 5-stage tenant verification pipeline (`authenticate` -> `requireWorkspace` -> `requirePermission` -> `SET LOCAL app.current_workspace_id` -> PostgreSQL RLS).
- **Test Evidence:** 12 automated negative integration tests in `services/api/src/server.test.ts` prove:
  - Direct queries without tenant context return 0 rows (RLS default-deny).
  - Cross-workspace queries return 0 rows.
  - Cross-workspace inserts trigger RLS `WITH CHECK` violation.
  - Pooled database connections never leak prior tenant context across requests.

### 3.2 Inviolable Duty-Hours Privacy Boundary (VERIFIED)
- **Acquisition Boundary:** Mobile `LocationService` synchronously shuts down the GPS radio upon punch-out (zero off-duty coordinates recorded).
- **Persistence Boundary:** Drift SQLite outbox strictly segregates points by `workspaceId` and `userId`.
- **Ingestion Boundary:** `telemetry.service.ts` validates incoming GPS timestamps against active or historical authorized duty sessions. Off-duty coordinates are hard-dropped with zero database writes (`drop_reason = 'OFF_DUTY_FILTER'`).
- **Peer Privacy:** Live locations are hidden by default from peer field technicians (`location.read` restricted strictly to managers and owners).

### 3.3 Ephemeral Streaming Ticket Security (VERIFIED)
- **Entropy & Generation:** PR #1 hardens stream tickets from `Math.random()` to `crypto.randomBytes(24).toString('base64url')` (192 bits of cryptographic entropy).
- **Storage:** Persisted in Redis with 60-second TTL.
- **Consumption:** Atomic single-use consumption (`getdel`), completely preventing URL query parameter token leakage in browser history, proxy logs, or SSE channels.

### 3.4 Production Error Handler & Stack Trace Suppression (VERIFIED)
- Fastify server configuration suppresses internal database stack traces, SQL strings, and system filepaths when `NODE_ENV === 'production'`.
- Generic HTTP 500 `"An unexpected internal error occurred."` returned to public clients; detailed error object logged to Pino logger for Sentry / observability.

### 3.5 Rate Limiting Defense (VERIFIED)
- `@fastify/rate-limit` enforces 10 attempts per minute on `/v1/auth/signup` and `/v1/auth/signin`, mitigating brute-force dictionary attacks.
- Standard API routes capped at 300 req/min per user.

---

## 4. Prioritized Security Remediation Roadmap

1. **Sprint 1 (P0 Blockers):**
   - Eliminate hardcoded default password in `apps/web/src/app/team/page.tsx` (`SEC-01`).
   - Validate and commit PR #1 streaming ticket and queue scoping security hardening.
2. **Sprint 2 (P1 Hardening):**
   - Implement user invite/activation workflow for `addWorkspaceMember` (`SEC-02`).
   - Add tenant configurable retention days to workspaces schema (`SEC-03`).
   - Guard `/v1/media/mock-upload/*` with environment flag (`SEC-04`).
3. **Sprint 3 (P2 Polish):**
   - Add Next.js ESLint plugin to monorepo config (`SEC-05`).
