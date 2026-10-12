# Oprino Release Blocker Register & Remediation Backlog

**Document:** Prioritized Actionable Release Blockers & Remediation Backlog  
**Version:** 1.0  
**Date:** October 2026  
**Governing Rule:** Gate 2 and Gate 3 forbid commercial production launch while any P0 blocker remains open.

---

## 1. Blocker Summary Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOTAL IDENTIFIED RELEASE BLOCKERS: 6                                   │
├────────────────────────────────────────────────────────────────────────┤
│ P0 (Critical Launch Blocker — Must resolve before production release):  4│
│ P1 (High Priority Hardening — Targeted for first patch / release v1.0.1):2│
│ P2 (Medium Polish — Post-launch improvements):                          0│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Blocker Register

### BLK-001: GPS PR #1 Verification, Queue Isolation & Lossless ACK Merge
- **Blocker ID:** `BLK-001`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Category:** Data Loss Prevention / Field Privacy / Reliability
- **Affected Surfaces:** Mobile (`apps/mobile`), API (`services/api`), Contracts (`packages/contracts`)
- **PR:** [`https://github.com/djsushilkumar/oprino/pull/1`](https://github.com/djsushilkumar/oprino/pull/1) (`feat/zero-cost-gps-field-ops`)
- **Description:**  
  The GPS pipeline in PR #1 previously had critical edge cases:
  1. Unacknowledged points were deleted prematurely on partial responses.
  2. GPS SQLite queues did not explicitly isolate records by `workspaceId` and `userId`.
  3. Stream tickets used weak `Math.random()` pseudo-randomness.
  4. Telemetry ingest did not row-lock travel summaries during concurrent retries.
  5. Post-punch-out sync did not drain buffered on-duty points safely.
- **Root Cause:** Rapid prototyping of initial zero-cost GPS migration without multi-tenant failure testing.
- **Remediation Status:** **IMPLEMENTED IN WORKING TREE — VERIFIED 100% BY TESTS**.
- **Verification Criteria:**
  - `LocationService` test suite (11/11 pass) verifies queue isolation, lossless ACK, and post-punch-out drain.
  - API telemetry integration suite (18/18 pass) verifies concurrent ingestion and ticket entropy.
- **Action Required:** Stage and commit working tree changes, push to `feat/zero-cost-gps-field-ops`, request human authorization to merge PR #1 into `main`.
- **Owner:** Principal Architect / Senior Flutter Engineer

---

### BLK-002: Hardcoded Default Password Pattern in Web Team UI
- **Blocker ID:** `BLK-002`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Category:** Authentication Security / Credential Governance
- **Affected Surfaces:** Web Dashboard (`apps/web/src/app/team/page.tsx`)
- **Description:**  
  Add Member modal in `/team` hardcodes `Welcome@123` into component state, creating a systemic default credential across newly added employee accounts.
- **Root Cause:** Placeholder developer default left in form state.
- **Remediation Status:** **OPEN**.
- **Verification Criteria:**
  - No hardcoded password strings in Web or Mobile codebases.
  - Password field requires explicit administrator input or triggers a cryptographically secure temporary credential generator (min 12 chars, upper, lower, number, symbol).
- **Action Required:** Refactor `TeamPage` modal state and add temporary password generator.
- **Owner:** Staff Full-Stack Engineer

---

### BLK-003: Employee Bulk CSV Import Missing from Web and API
- **Blocker ID:** `BLK-003`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Category:** V1 MUST Functional Requirement / SMB Onboarding
- **Affected Surfaces:** Backend API (`services/api`), Contracts (`packages/contracts`), Web (`apps/web`)
- **Description:**  
  `docs/product/V1-SCOPE.md` item 2.6 line 102 specifies: `"Bulk CSV Import (Employees & Sites) — MUST — Fast onboarding for 20–100 employees in minutes."` Customer Sites CSV import is fully implemented (`/v1/customers/:id/sites/import-csv`), but Employee CSV onboarding is absent from the API and `/team` web page.
- **Root Cause:** Scope split between Phase 03 (Sites) and Phase 04 (Advanced Ops) left employee CSV unmapped.
- **Remediation Status:** **OPEN**.
- **Verification Criteria:**
  - `POST /v1/workspaces/members/import-csv` parses standard CSV (`name,email,role`), validates emails, creates member accounts atomically, and returns `{ imported: N, failed: M, errors: [...] }`.
  - Web `/team` includes an "Import via CSV" button with template download and drag-and-drop file parser.
  - Automated integration test verifies importing 25 employees in a single request.
- **Action Required:** Implement backend route, service method, contracts schema, and web UI modal.
- **Owner:** Staff Full-Stack Engineer

---

### BLK-004: Selfie-Verified Attendance Hookup in Mobile Client
- **Blocker ID:** `BLK-004`
- **Severity:** **P0 (Absolute Launch Blocker)**
- **Category:** V1 MUST Functional Requirement / Anti-Buddy Punching
- **Affected Surfaces:** Mobile (`apps/mobile`), Contracts (`packages/contracts`), Database (`packages/database`)
- **Description:**  
  `docs/product/V1-SCOPE.md` item 2.1 line 39 specifies: `"Selfie-Verified Punch In / Out — MUST — Visual anti-buddy punching capability for SMB owners."` The geotagged camera widget exists for tasks and visits, but the mobile attendance punch-in flow does not prompt for a front-camera selfie.
- **Root Cause:** Mobile punch-in sheet was built with simple one-tap punch buttons before media integration.
- **Remediation Status:** **OPEN**.
- **Verification Criteria:**
  - `PunchInRequestSchema` accepts optional `selfieMediaKey?: string` and `coordinates?: { latitude, longitude, accuracy }`.
  - Mobile `AttendanceView` includes a "Capture Verification Selfie" step before executing punch-in.
  - Attendance history and manager overview display selfie thumbnail alongside punch record.
- **Action Required:** Update contracts schema, database `attendance_sessions` metadata, and mobile `attendance_view.dart`.
- **Owner:** Senior Flutter Engineer

---

### BLK-005: Member Lifecycle Management Endpoints (Update Role & Status)
- **Blocker ID:** `BLK-005`
- **Severity:** **P1 (High Priority)**
- **Category:** Workspace Administration / RBAC Governance
- **Affected Surfaces:** API (`services/api/src/routes/workspaces.ts`), Web (`apps/web/src/app/team/page.tsx`)
- **Description:**  
  Currently, workspace members can only be listed (`GET /v1/workspaces/members`) or added (`POST /v1/workspaces/members`). There is no endpoint to change a member's role (e.g., promote Employee to Manager) or deactivate/suspend an employee who has left the organization.
- **Root Cause:** Membership CRUD was only partially exposed in initial team management commit.
- **Remediation Status:** **OPEN**.
- **Verification Criteria:**
  - `PATCH /v1/workspaces/members/:membershipId` supports updating `roleId` and `status` (`'active'` | `'suspended'` | `'removed'`).
  - Web `/team` provides dropdown controls to change role and action menu to deactivate member.
- **Action Required:** Add `updateWorkspaceMember` to `WorkspaceService` and route handler in `workspaces.ts`.
- **Owner:** Staff Full-Stack Engineer

---

### BLK-006: Tenant-Configurable Location Retention Policy (7, 30, 90, 180 Days)
- **Blocker ID:** `BLK-006`
- **Severity:** **P1 (High Priority)**
- **Category:** V1 MUST / Privacy Architecture / Data Minimization
- **Affected Surfaces:** Database (`packages/database`), API (`services/api`), Web (`apps/web`)
- **Description:**  
  `docs/product/V1-SCOPE.md` item 2.1 line 45 specifies: `"Configurable Location Retention — MUST — Approved default retention: 30 days. Configurable policy options: 7, 30, 90, 180 days."` The backend function `telemetry_prune_expired_records(days)` defaults to 30 days, but there is no column on `workspaces` or UI to configure this per tenant.
- **Root Cause:** Retention duration was hardcoded in BullMQ worker definition rather than read from workspace table.
- **Remediation Status:** **OPEN**.
- **Verification Criteria:**
  - Migration adds `location_retention_days: integer().default(30)` to `workspaces`.
  - Workspace settings endpoint permits owners to update retention policy.
  - Nightly BullMQ retention prune job reads workspace-specific policy.
- **Action Required:** Add column, update `WorkspaceService`, update BullMQ worker job query.
- **Owner:** Principal Architect

---

## 3. Immediate Remediation Sequence

1. **Commit BLK-001:** Working tree already resolves all GPS PR #1 blockers and passes 100% of tests. Commit to feature branch.
2. **Remediate BLK-002:** Fix hardcoded password in `TeamPage` (remove `Welcome@123`).
3. **Remediate BLK-003:** Implement Employee Bulk CSV import in API and Web.
4. **Remediate BLK-004:** Wire camera selfie verification into Mobile punch-in sheet.
5. **Remediate BLK-005 & BLK-006:** Implement member update endpoints and configurable retention days.
