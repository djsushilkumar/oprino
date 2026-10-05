# Oprino Phase 02A Implementation Report: Identity, Workspace & Multi-Tenant Foundation

**Phase:** Phase 02A Core V1 Implementation  
**Status:** COMPLETED & VERIFIED  
**Date:** October 2026  
**Audience:** System Architects, Security Auditors, Engineering Leads, AI Agents  

---

## 1. Executive Summary

Phase 02A establishes the production-grade identity, authentication, workspace onboarding, multi-workspace membership, Role-Based Access Control (RBAC), device/installation governance, PostgreSQL Row-Level Security (RLS), web owner onboarding shell, and Flutter mobile authenticated shell for Oprino.

All strict product boundaries and core architectural invariants have been preserved:
- **Duty-Hours-Only Tracking Invariant:** Peer location visibility remains strictly OFF by default; zero off-duty tracking mechanisms exist in this baseline.
- **Multi-Tenant Isolation Invariant:** Enforced via 5-stage tenant verification in Fastify middleware and kernel-level PostgreSQL Row-Level Security (`ENABLE` and `FORCE ROW LEVEL SECURITY`) with transaction-scoped `SET LOCAL app.current_workspace_id`.
- **Device Governance Invariant:** Pure random UUIDv4 Installation ID generated on first mobile launch, securely stored via keystore/keychain, without hardware fingerprinting (zero IMEI, MAC, Android ID, or Advertising ID). Immediate server-side revocation causes local credential wipe.
- **Contract-First Pipeline:** Single source of truth in `@oprino/contracts`, exporting OpenAPI 3.1, compiling deterministic Dart Dio client without hand-written mobile DTOs.
- **Excluded Modules:** Strictly no tasks, attendance workflows, GPS tracking, proof of work, visits, reports, expenses, CRM, or invoicing.

---

## 2. Database Schema & Migration IDs

### 2.1 Applied Migration
- **Migration ID:** `0000_tense_christian_walker`
- **Location:** `packages/database/drizzle/0000_tense_christian_walker.sql`
- **Engine Target:** PostgreSQL 17/18 with PostGIS 3.5/3.6

### 2.2 Global vs Tenant-Scoped Table Classification

| Table Name | Scope | Rationale |
|---|---|---|
| `users` | **GLOBAL** | Global identity boundary. A single human user may hold memberships across multiple independent workspaces. Managed by Better Auth. |
| `sessions` | **GLOBAL** | Authentication sessions represent identity authentication state across devices; workspace context is resolved per request. |
| `accounts` | **GLOBAL** | Better Auth account credentials and external provider links. |
| `verifications` | **GLOBAL** | Better Auth verification tokens (email verification, password reset tokens). |
| `workspaces` | **TENANT-SCOPED** | The root organizational unit. Protected by RLS policies so members can only read workspaces they belong to. |
| `workspace_memberships` | **TENANT-SCOPED** | Joins users to workspaces with lifecycle status (`invited`, `active`, `suspended`, `removed`). Protected by RLS. |
| `roles` | **TENANT-SCOPED** | Workspace-scoped role definitions (`Owner / Admin`, `Manager`, `Employee`, and future custom roles). Protected by RLS. |
| `role_permissions` | **TENANT-SCOPED** | Mapping of roles to granular typed permission identifiers. Protected by RLS. |
| `user_devices` | **TENANT-SCOPED** | Workspace/user-bound device installations (`installation_id`, `status`, `is_trusted`). Protected by RLS. |
| `audit_logs` | **TENANT-SCOPED** | Append-only governance audit log recording tenant administrative lifecycle events. Protected by RLS. |

---

## 3. PostgreSQL Row-Level Security (RLS) Policies

All tenant-scoped tables have RLS enabled and forced:
```sql
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships FORCE ROW LEVEL SECURITY;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
```

### 3.1 Policy Definition
Every tenant table enforces tenant boundaries using transaction-scoped configuration:
```sql
CREATE POLICY tenant_isolation_policy ON <table>
AS PERMISSIVE FOR ALL
USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
)
WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
);
```

### 3.2 Connection Pool Safety
To eliminate cross-tenant leakage across pooled PostgreSQL connections, tenant queries execute inside `db.transaction()` and issue:
```sql
SELECT set_config('app.current_workspace_id', $1, true);
```
Parameter `true` ensures the configuration setting is `LOCAL` to the transaction and automatically resets on transaction commit or rollback.

---

## 4. Better Auth Integration

- **Engine:** Better Auth 1.2.9 mounted inside Fastify modular server.
- **Storage Adapter:** Drizzle ORM PostgreSQL adapter.
- **Plugins:** Bearer plugin enabled for mobile mobile clients (`oprino://app`).
- **Web Credentials:** Cookies with `HttpOnly`, `SameSite=Lax`, `Secure`, and origin validation.
- **UUID Generation:** Injected `databaseHooks` on `user`, `session`, `account`, and `verification` ensuring all generated primary keys are RFC 4122 UUIDv4 strings matching the database schema.
- **No Bespoke Cryptography:** Standardized Argon2id/scrypt password hashing managed by Better Auth.

---

## 5. Endpoints & API Contracts

All contracts originate in `@oprino/contracts` and are compiled to OpenAPI 3.1:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/v1/auth/signup` | Register new user account; returns token and user info | Public |
| `POST` | `/v1/auth/signin` | Authenticate user; returns token, user info, active workspace ID | Public |
| `POST` | `/v1/auth/signout` | Revoke session credential | Bearer / Cookie |
| `GET` | `/v1/me` | Resolve current user, active workspace, role, permissions, installation | Bearer / Cookie |
| `POST` | `/v1/workspaces` | Atomic creation of workspace, default roles, permissions, membership | Bearer / Cookie |
| `GET` | `/v1/workspaces` | List all workspaces where user holds a membership | Bearer / Cookie |
| `POST` | `/v1/session/workspace` | Switch active workspace context after membership verification | Bearer / Cookie |
| `POST` | `/v1/devices/register` | Register installation ID with user/workspace governance | Bearer / Cookie |
| `GET` | `/v1/devices` | List user's registered device installations | Bearer / Cookie |
| `POST` | `/v1/devices/revoke` | Revoke installation ID (triggers remote wipe on next contact) | Bearer / Cookie |

---

## 6. Workspace Lifecycle & RBAC Foundation

### 6.1 Atomic Workspace Provisioning
`POST /v1/workspaces` executes in a single atomic database transaction:
1. Inserts workspace record (`id`, `name`, `slug`, `status: 'ACTIVE'`).
2. Creates workspace default system roles:
   - `Owner / Admin` (system template)
   - `Manager` (system template)
   - `Employee` (system template)
3. Seeds granular permission assignments:
   - `Owner / Admin`: `workspace.read`, `workspace.manage`, `members.read`, `members.manage`, `roles.read`, `roles.manage`, `devices.read`, `devices.manage`
   - `Manager`: `workspace.read`, `members.read`, `roles.read`, `devices.read`
   - `Employee`: `workspace.read`
4. Creates active owner membership for creating user with role `Owner / Admin`.
5. Logs append-only audit event: `workspace.created`.
6. Returns typed `WorkspaceResponse`. Rollback occurs if any step fails.

### 6.2 Membership Lifecycle
Memberships support states: `invited`, `active`, `suspended`, `removed`.
- `active`: grants access subject to role permissions.
- `suspended`: immediately rejected with HTTP 403 `FORBIDDEN` ("Membership is suspended").
- `removed`: immediately rejected with HTTP 403 `FORBIDDEN` ("Membership was removed").
- Client-provided `workspace_id` is only a selector; Fastify middleware verifies membership against the database before setting RLS context.

---

## 7. Device & Installation Governance

- **Generation:** On first launch of the mobile app, a random RFC 4122 UUIDv4 is generated via `Random.secure()` and saved in `flutter_secure_storage`.
- **Prohibited Identifiers:** Strictly zero use of IMEI, MAC, Android ID, Advertising ID, or hardware fingerprinting.
- **Registration:** Device is registered with `/v1/devices/register` on user authentication.
- **Revocation & Remote Wipe:**
  - Workspace administrators or users can revoke devices via `POST /v1/devices/revoke`.
  - When a revoked device contacts the backend, the Fastify `authMiddleware` checks device status:
    - Returns HTTP 401 with `{ statusCode: 401, error: "DEVICE_REVOKED", message: "Device installation has been revoked" }`.
  - Mobile `AuthInterceptor` intercepts HTTP 401 `DEVICE_REVOKED`:
    - Wipes session credentials from `flutter_secure_storage`.
    - Clears active workspace context.
    - Preserves installation ID and routes to `DeviceRevokedScreen`.
    - Prevents re-login until the installation is reset.

---

## 8. Web Owner Onboarding & Shell (`apps/web`)

- Built with Next.js 15 App Router and Oprino brand design tokens.
- **Routes:**
  - `/auth/signup`: Account creation via Better Auth.
  - `/auth/signin`: Sign in screen with validation and error alerts.
  - `/onboarding/workspace`: Guided organization onboarding (Workspace Name, auto-slug generator, default Owner role).
  - `/dashboard`: Authenticated shell displaying Oprino branding, current user, active workspace, assigned role badge, permissions chips, workspace switcher dropdown, tenant isolation guarantee indicators, and sign out button.
  - `/`: Root landing page routing to dashboard or sign in.
- **Automated Tests:** 7/7 integration tests in `apps/web/src/web-auth-flows.test.ts` passing.

---

## 9. Flutter Mobile Authenticated Shell (`apps/mobile`)

- Built with Flutter 3.47 Stable, Riverpod, Drift, and generated OpenAPI Dio client.
- **Architecture:**
  - `SecureStorageService`: Keystore/Keychain abstraction with separate namespaces (`oprino_device:installation_id`, `oprino_auth:session_token`, `oprino_workspace:active_id`).
  - `AuthInterceptor`: Attaches `Authorization: Bearer <token>`, `X-Installation-Id`, `X-Workspace-Id`, and `Origin: oprino://app`. Intercepts 401 `DEVICE_REVOKED` and triggers secure wipe.
  - `AuthNotifier` & `AuthState`: Riverpod state machine handling session loading, signin, logout, workspace switching, and revocation.
  - `GoRouter`: Auth-aware redirection between `/signin`, `/revoked`, and `/` (AppShell).
- **Screens:**
  - `SignInScreen`: Canonical pin-check mark, wordmark, email & password inputs, device governance footer.
  - `DeviceRevokedScreen`: High-visibility revocation alert with reset installation action.
  - `AppShellScreen`: Role-aware shell, active tenant card, workspace switcher bottom sheet, identity card, permissions wrap, and duty-hours invariant notice.
- **Automated Tests:** 13/13 tests passing (`auth_interceptor_test.dart`, `secure_storage_service_test.dart`, `widget_test.dart`).

---

## 10. Test & Quality Gate Results

### Monorepo Validation Matrix

| Quality Gate | Tool / Command | Result | Notes |
|---|---|---|---|
| Dependencies | `pnpm install` | **PASSED** (0 err) | Up to date, zero issues |
| Linter | `pnpm run lint` | **PASSED** (0 err) | ESLint passed across all workspaces |
| Monorepo Typecheck | `pnpm turbo typecheck` | **PASSED** (0 err) | 9/9 packages compiled cleanly |
| Monorepo Tests | `pnpm turbo test` | **PASSED** (0 err) | 7/7 packages successful |
| Web Build | `pnpm --filter @oprino/web build` | **PASSED** (0 err) | Next.js 15 static build (8/8 pages) |
| Code Formatting | `pnpm format:check` | **PASSED** (0 err) | Prettier checked and verified |
| PostgreSQL RLS Tests | `src/tenant-rls.integration.test.ts` | **PASSED** (5/5) | Real kernel PostgreSQL RLS validation |
| API Integration Tests | `src/identity-workspace.integration.test.ts` | **PASSED** (11/11) | End-to-end identity & tenancy flows |
| Contracts Generation | `pnpm --filter @oprino/contracts generate` | **PASSED** | 100% deterministic zero-diff across runs |
| Dart API Client Tests | `dart test` | **PASSED** (6/6) | All DTO deserialization tests pass |
| Flutter Analyzer | `flutter analyze` | **PASSED** (0 err) | 0 errors, 0 warnings |
| Flutter Tests | `flutter test` | **PASSED** (13/13) | Storage, interceptor, and widget tests pass |
| Flutter APK Build | `flutter build apk --debug` | **PASSED** (0 err) | Gradle assembled `app-debug.apk` |

---

## 11. Known Limitations & Next Recommended Phase

### Known Limitations
- Background location tracking and physical OEM OEM testing are deliberately deferred to later mobile release gates.
- Email verification and password reset flows are architecturally prepared (tables & Better Auth endpoints exist), but external SMTP provider integration is deferred to production deployment phase.

### Next Recommended Phase
- **Phase 02B / Phase 03: Task & Attendance Domain Model & Workflows.**
