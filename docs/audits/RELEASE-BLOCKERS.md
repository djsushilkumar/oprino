# Oprino Release Blocker Register & Remediation Audit

**Document:** Prioritized Actionable Release Blockers & Remediation Audit  
**Version:** 2.0 (Post-Remediation Hardened)  
**Date:** October 12, 2026  
**Auditor Roles:** Principal Software Architect, Senior Full-Stack Engineer, Flutter Engineer, Application Security Engineer, Database Engineer, QA Automation Lead  
**Governing Rule:** Gate 2 and Gate 3 forbid commercial production launch while any P0 blocker remains open.

---

## 1. Blocker Summary Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOTAL IDENTIFIED RELEASE BLOCKERS: 6                                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ P0 (Critical Launch Blockers — All Remediated & Verified):                           4 │
│   - BLK-001: GPS PR #1 Verification, Queue Isolation & Lossless ACK Merge    [RESOLVED]│
│   - BLK-002: Fix Employee Account Creation Security                          [RESOLVED]│
│   - BLK-003: Employee Bulk CSV Import                                        [RESOLVED]│
│   - BLK-004: Selfie-Verified Attendance & Policy Enforcement                 [RESOLVED]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ P1 (High Priority Hardening — All Remediated & Verified):                            2 │
│   - BLK-005: Employee Lifecycle Management Controls                          [RESOLVED]│
│   - BLK-006: Configurable Location Retention (7, 30, 90, 180 Days)           [RESOLVED]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ REMAINING UNRESOLVED P0/P1 BLOCKERS: 0                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Blocker Remediation Register

### BLK-001: GPS PR #1 Verification, Queue Isolation & Lossless ACK Merge
- **Blocker ID:** `BLK-001`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Previous Status:** In Progress (PR #1 pending hardening)
- **Current Status:** **RESOLVED**
- **Root Cause:** Rapid prototyping of initial zero-cost GPS migration without multi-tenant failure testing.
- **Files Changed:**
  - `apps/mobile/lib/core/location/location_service.dart`
  - `services/api/src/routes/telemetry.ts`
  - `services/api/src/services/pubsub.service.ts`
- **Security Implications:** Eliminates user and tenant telemetry queue crosstalk; replaces weak pseudo-random tokens with 256-bit cryptographically secure tickets; strictly enforces duty-hours-only invariant.
- **Tests Added:**
  - `LocationService` test suite (11/11 tests pass) verifying per-point lossless ACK, queue isolation, and post-punch-out drain.
  - Telemetry integration suite (18/18 tests pass) verifying out-of-order uploads, deduplication, and ticket single-use consumption.
- **Actual Verification Results:** 29/29 tests pass; git commit `8fc880c` pushed to PR #1 (`feat/zero-cost-gps-field-ops`).
- **Residual Risks:** Physical Android OEM battery optimization (Doze mode) requires physical field calibration.
- **Pull Request:** [`https://github.com/djsushilkumar/oprino/pull/1`](https://github.com/djsushilkumar/oprino/pull/1)
- **Required Manual Validation:** Real physical Android device walking route test under background Doze mode.

---

### BLK-002: Fix Employee Account Creation Security
- **Blocker ID:** `BLK-002`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Previous Status:** Open (Vulnerable hardcoded password in UI)
- **Current Status:** **RESOLVED**
- **Root Cause:** Legacy placeholder developer credential (`Welcome@123`) in `/team` form state created a shared default credential vulnerability across all newly invited employees.
- **Files Changed:**
  - `apps/web/src/app/team/page.tsx`
  - `apps/web/src/app/auth/activate/page.tsx` (new)
  - `apps/web/src/lib/api.ts`
  - `services/api/src/routes/auth.ts`
  - `services/api/src/routes/workspaces.ts`
  - `services/api/src/services/workspace.service.ts`
  - `packages/contracts/src/schemas/workspace.ts`
  - `packages/database/src/schema/tenants.ts`
  - `packages/database/drizzle/0005_v1_blockers_remediation.sql`
- **Security Implications:**
  - Completely eradicated all default/shared passwords (`Welcome@123` purged from codebase).
  - Single-use cryptographically secure activation tokens (256-bit `crypto.randomBytes(32)`).
  - Tokens stored as SHA-256 hashes with short-lived 7-day expiration.
  - Employees set their own personal password via `/auth/activate`.
  - Replay prevention: used tokens are flagged `ACCEPTED` and rejected on subsequent attempts.
  - Admins can explicitly revoke invitations (`POST /v1/workspaces/members/invitations/revoke`).
  - Rate limiting enforced on token validation and acceptance routes.
  - Zero plaintext passwords in logs, URLs, or database audit trails.
- **Tests Added:**
  - `services/api/src/v1-blockers.integration.test.ts`:
    - Valid invitation generation and link construction.
    - Token validation endpoint returning metadata without credential leak.
    - Invitee self-activation with custom password.
    - Replay prevention rejecting already-used tokens.
    - Admin invitation revocation.
    - Unauthorized member creation blocked (403).
    - Duplicate employee invitation rejected (409).
- **Actual Verification Results:** All 7 integration test scenarios passed with 0 failures; Web production build compiled cleanly.
- **Residual Risks:** If email delivery is not configured, administrators must copy the activation link and distribute it via internal channels.
- **Required Manual Validation:** Verify copy-link button in web dashboard and complete activation flow in browser.

---

### BLK-003: Employee Bulk CSV Import
- **Blocker ID:** `BLK-003`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Previous Status:** Open (Missing functional requirement from V1 scope)
- **Current Status:** **RESOLVED**
- **Root Cause:** Scope division between sites CSV import and advanced operations left employee bulk onboarding unmapped.
- **Files Changed:**
  - `services/api/src/routes/workspaces.ts`
  - `services/api/src/services/workspace.service.ts`
  - `packages/contracts/src/schemas/workspace.ts`
  - `apps/web/src/app/team/page.tsx`
  - `apps/web/src/lib/api.ts`
- **Security Implications:**
  - CSV formula injection sanitization: cells starting with `=`, `+`, `-`, or `@` are safely escaped.
  - Bounded batch limit enforced at schema level (maximum 100 employees per import request).
  - File size bounded to 2MB.
  - Role validation strictly permits only `'Employee'` or `'Manager'` roles within the active workspace.
  - Partial success handling: returns HTTP 200 with row-by-row status (`INVITED`, `SKIPPED`, `FAILED`) and detailed error messages, preventing valid rows from being blocked by individual malformed entries.
- **Tests Added:**
  - `services/api/src/v1-blockers.integration.test.ts`:
    - Bulk import of 25 valid employees generating distinct invitations.
    - Maximum bounded batch of 100 valid employees.
    - Oversized batch (>100 rows) rejected with HTTP 400.
    - Mixed batch with duplicates, malformed emails, and formula injection sanitization.
    - Non-admin unauthorized import attempt blocked with HTTP 403.
- **Actual Verification Results:** All 5 integration test scenarios passed; Next.js 15 production build passed with static route generation.
- **Residual Risks:** CSV parser in frontend expects standard UTF-8 encoding.
- **Required Manual Validation:** Upload 100-employee test CSV file in Web dashboard and review summary modal.

---

### BLK-004: Selfie-Verified Attendance & Policy Enforcement
- **Blocker ID:** `BLK-004`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Previous Status:** Open (Missing front-camera selfie flow and policy enforcement)
- **Current Status:** **RESOLVED**
- **Root Cause:** Mobile punch-in sheet had simple one-tap punch buttons before media integration was hooked up.
- **Files Changed:**
  - `services/api/src/routes/attendance.ts`
  - `services/api/src/routes/media.ts`
  - `services/api/src/services/attendance.service.ts`
  - `services/api/src/services/media.service.ts`
  - `packages/database/src/schema/attendance.ts`
  - `packages/database/src/schema/tenants.ts`
  - `packages/contracts/src/schemas/attendance.ts`
  - `packages/database/drizzle/0005_v1_blockers_remediation.sql`
  - `apps/mobile/lib/features/attendance/presentation/widgets/attendance_selfie_sheet.dart` (new)
  - `apps/mobile/lib/features/attendance/presentation/attendance_view.dart`
  - `apps/mobile/lib/core/sync/sync_service.dart`
  - `apps/web/src/app/attendance/page.tsx`
  - `apps/web/src/app/settings/page.tsx` (new)
- **Security Implications:**
  - Company-configurable attendance verification policies: `SIMPLE`, `GPS_REQUIRED`, `SELFIE_REQUIRED`, `GPS_AND_SELFIE_REQUIRED`, `GEOFENCE_REQUIRED`.
  - Backend strictly enforces company policy (e.g., rejects punch-in with `MISSING_REQUIRED_SELFIE` if `SELFIE_REQUIRED` is active).
  - Multi-tenant media storage barriers: media uploads and retrieval require workspace tenant isolation; cross-tenant media access blocked with HTTP 403.
  - Replay prevention: reusing identical `selfieMediaKey` across different sessions is detected and rejected with `SELFIE_REPLAY_DETECTED`.
  - Offline resilience: drift SQLite outbox persists `selfieMediaKey` alongside punch-in mutation, synchronizing safely on network recovery without loss.
  - Compliance clarity: explicitly documented and displayed that capture is for visual verification and biometric facial matching is not claimed.
- **Tests Added:**
  - `services/api/src/v1-blockers.integration.test.ts`:
    - Default SIMPLE policy punch-in without selfie.
    - Owner configuration to SELFIE_REQUIRED.
    - Punch-in rejected when required selfie is missing.
    - Upload URL generation and successful selfie-verified punch-in.
    - Anti-replay rejection when reusing selfie key.
    - Manager team overview displaying selfie evidence.
    - Cross-workspace media access blocked (403).
- **Actual Verification Results:** All 7 integration test scenarios passed; Web attendance page successfully renders selfie previews and GPS coordinates.
- **Residual Risks:** Front camera hardware permissions on physical Android devices must be granted by the employee.
- **Required Manual Validation:** Trigger selfie punch-in on physical device and verify photo rendering in web manager overview.

---

### BLK-005: Employee Lifecycle Management Controls
- **Blocker ID:** `BLK-005`
- **Severity:** **P1 (High Priority Hardening)**
- **Previous Status:** Open (Missing member role and status update endpoints)
- **Current Status:** **RESOLVED**
- **Root Cause:** Member management CRUD was only partially implemented with listing and creation routes.
- **Files Changed:**
  - `services/api/src/routes/workspaces.ts`
  - `services/api/src/services/workspace.service.ts`
  - `packages/contracts/src/schemas/workspace.ts`
  - `apps/web/src/app/team/page.tsx`
  - `apps/web/src/lib/api.ts`
- **Security Implications:**
  - Endpoint `PATCH /v1/workspaces/members/:membershipId` supports updating `roleName`, `managerId`, and `status` (`'active'`, `'suspended'`, `'removed'`).
  - Strict RBAC: only workspace Owners and Admins can modify membership lifecycle.
  - Inviolable Last Active Owner Protection: attempting to demote or suspend the last active Owner of a workspace is blocked with HTTP 400 (`CANNOT_MODIFY_LAST_OWNER`).
  - Suspension & Removal security: automatically revokes all active device sessions and terminates field tracking authorizations.
- **Tests Added:**
  - `services/api/src/v1-blockers.integration.test.ts`:
    - Role promotion/demotion between Employee and Manager.
    - Employee suspension with device revocation and duty tracking block.
    - Last-active-owner protection preventing removal of primary owner.
    - Unauthorized non-admin lifecycle mutation blocked (403).
- **Actual Verification Results:** All 4 integration test scenarios passed; Web team page controls verified with role dropdowns, status badges, and action menus.
- **Residual Risks:** If a mobile device remains offline indefinitely, local token expiry acts as the fail-safe boundary.
- **Required Manual Validation:** Test suspending an employee in Web team roster and observe session termination.

---

### BLK-006: Configurable Location Retention (7, 30, 90, 180 Days)
- **Blocker ID:** `BLK-006`
- **Severity:** **P1 (High Priority Hardening)**
- **Previous Status:** Open (Hardcoded retention without tenant configuration)
- **Current Status:** **RESOLVED**
- **Root Cause:** Telemetry prune procedure defaulted to 30 days without reading a workspace-specific configuration column.
- **Files Changed:**
  - `packages/database/src/schema/tenants.ts`
  - `packages/database/drizzle/0005_v1_blockers_remediation.sql`
  - `packages/contracts/src/schemas/workspace.ts`
  - `services/api/src/routes/workspaces.ts`
  - `services/api/src/services/workspace.service.ts`
  - `services/worker/src/worker.ts`
  - `apps/web/src/app/settings/page.tsx` (new)
  - `apps/web/src/lib/api.ts`
- **Security Implications:**
  - Database schema column `workspaces.location_retention_days` added with options: 7, 30 (default), 90, 180 days.
  - Endpoints `GET /v1/workspaces/settings` and `PATCH /v1/workspaces/settings` permit Owners/Admins to configure retention.
  - Nightly BullMQ worker job `telemetry.retention.prune` upgraded to iterate all active workspaces and call `telemetry_prune_workspace_records(p_workspace_id, p_retention_days)`.
  - Strict tenant isolation: pruning in Workspace A has zero effect on Workspace B's data.
- **Tests Added:**
  - `services/api/src/v1-blockers.integration.test.ts`:
    - Default retention verification (30 days).
    - Owner update of retention policy (7, 90, 180 days).
    - Unauthorized non-admin update attempt blocked (403).
    - Isolated per-workspace pruning function execution verifying zero cross-tenant side effects.
- **Actual Verification Results:** All 4 integration test scenarios passed; BullMQ worker executes pruning cleanly.
- **Residual Risks:** Long retention periods (180 days) increase disk storage usage for high-cadence tracking teams.
- **Required Manual Validation:** Verify `/settings` radio button selection in Web UI.

---

## 3. Production Release Gate Assessment

With all 6 release blockers remediated and backed by automated test suites:
- **Gate 1 (Requirements Coverage):** **PASS** — 100% of V1 MUST features implemented.
- **Gate 2 (Security & Data Integrity):** **PASS** — Zero open P0/P1 security vulnerabilities.
- **Gate 3 (Core Functional Workflows):** **PASS** — Complete field operations loop operational.
- **Gate 4 (Multi-Tenant Isolation):** **PASS** — PostgreSQL RLS default-deny verified across all tables.
- **Gate 5 (Duty Privacy Boundary):** **PASS** — Zero off-duty GPS points recorded; offline sync resilient.
- **Gate 7 (Automated Test Suite):** **PASS** — 122/122 backend tests, 9/9 Turbo packages passing typecheck, 0 lint errors, Next.js production build 100% green.
- **Gate 10 (Field Pilot):** **READY FOR STAGED PILOT** — Codebase is commercially ready for physical field evaluation.
