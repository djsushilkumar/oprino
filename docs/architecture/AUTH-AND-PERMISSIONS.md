# Oprino — Authentication, Roles & Permissions Specification

**Document:** Authoritative Identity & Access Control Architecture  
**Auditor:** Principal Security Engineer  
**Branch:** `release/v1-stabilization`  
**Framework:** Better Auth + PostgreSQL Session Store  
**ADR Reference:** [`ADR-006`](./ADR-006-authentication.md) & [`ADR-007`](./ADR-007-authorization.md)  

---

## 1. Authentication Mechanics & Dual-Surface Strategy

Oprino employs a unified Better Auth core supporting both web and mobile clients:

| Surface | Client Technology | Transport Protocol | Storage Medium | Lifecycle |
|---|---|---|---|---|
| **Web Dashboard** | Next.js 15 App Router | HTTPS `HttpOnly`, `SameSite=Lax`, `Secure` Cookies | Browser Cookie Jar | 30-day sliding window; invalidates on logout |
| **Mobile App** | Flutter 3.47 / Dio | HTTPS `Authorization: Bearer <token>` + `X-Installation-Id` | `flutter_secure_storage` (Keychain / KeyStore) | Retained across app restarts; revokable remotely |

---

## 2. Role Hierarchy & Built-In Roles

Oprino defines 5 standard roles suited for SMB operations:

```mermaid
graph TD
    Owner["👑 Workspace Owner<br/>Full billing, workspace deletion, last-owner protected"] --> Admin
    Admin["🛡️ Admin<br/>User invites, bulk CSV, company policies, retention settings"] --> Manager
    Manager["👔 Manager / Supervisor<br/>Task creation, team live map, proof approvals, site visits"] --> Dispatcher
    Dispatcher["📡 Dispatcher<br/>Shift assignments, route ordering, customer site updates"] --> FieldWorker
    FieldWorker["👷 Field Worker (Employee)<br/>Selfie punch-in/out, task checklist, photo proof, signature"]
```

---

## 3. RBAC Model (`Domain:Action:Scope`)

Fastify route guards enforce fine-grained scopes before any business service executes:

```
<domain>:<action>:<scope>
Examples:
  - attendance:punch:write
  - attendance:team:read
  - tasks:manage:workspace
  - tasks:execute:assigned
  - workspaces:settings:manage
  - location:read:team
```

### Permission Matrix by Role

| Permission Scope | Owner | Admin | Manager | Dispatcher | Field Worker |
|---|:---:|:---:|:---:|:---:|:---:|
| `workspaces:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `workspaces:settings:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `members:invite` / `members:bulk` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `members:role:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `tasks:create` / `tasks:assign` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `tasks:verify` (Approve/Reject) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `tasks:execute:assigned` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `location:read:team` (Live Map) | ✅ | ✅ | ✅ | ✅ | ❌ (Off by default) |
| `attendance:team:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `attendance:punch:write` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Mobile Device Governance & Zero-Trust Revocation (`ADR-006`)

To prevent unauthorized access from lost, stolen, rogue employee handsets, or bypassed installations:
1. **Device Registration:** On initial sign-in, the mobile app generates a cryptographically random RFC 4122 UUIDv4 stored in hardware-backed secure storage (`flutter_secure_storage`).
2. **Installation Header & Session Binding:** Every mobile API request transmits `X-Installation-Id: <uuid>`. During sign-in, the session is transactionally bound to this installation ID in the database (`sessions.installation_id`).
3. **Stage 1B Authentication Enforcement:** Before route logic executes, Fastify verifies:
   - Requests on bound mobile sessions **MUST** provide `X-Installation-Id`, matching the bound session (`401 DEVICE_ID_REQUIRED` / `401 DEVICE_MISMATCH`).
   - Device governance state is verified against `user_devices`.
4. **Zero-Trust State Machine (`pending | active | revoked`):**
   - **Active:** Authorized for protected workspace routes.
   - **Revoked:** Rejection with HTTP 401 `DEVICE_REVOKED`. Drops all server-side sessions bound to `(userId, installationId)` immediately.
   - **Pending:** If a user with a revoked device generates a new UUID or reinstalls the app, the registration defaults to `pending`, returning HTTP 401 `DEVICE_PENDING_APPROVAL` until an administrator approves it.
5. **Manager Revocation & Approval Actions:**
   - Workspace Administrators revoke installations via `POST /v1/devices/revoke`.
   - Administrators approve pending installations via `POST /v1/devices/approve`.
   - Administrators list all workspace hardware via `GET /v1/workspaces/:workspaceId/devices`.
6. **Mobile App Lockout & Zero Duty-Hours Tracking Invariant:**
   - On receiving `DEVICE_REVOKED`, the mobile app intercepts the flat `ApiErrorSchema`, halts background GPS tracking immediately (`locationService.stopTracking()`), purges session credentials, and displays the `DeviceRevokedScreen`.
   - Client-side UUID regeneration bypass is eliminated; the installation identifier is preserved so the device remains verifiably blocked.
