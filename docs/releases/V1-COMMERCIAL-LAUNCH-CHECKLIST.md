# Oprino — V1 Commercial Launch Readiness Checklist

**Release Candidate:** `release/v1-stabilization`  
**Date of Audit:** October 15, 2026  
**Status:** RELEASE CANDIDATE STABILIZED — AWAITING OWNER PRODUCTION SIGN-OFF  

---

## 1. Commercial Launch Readiness Matrix

| Category | Item / Gate | Status | Evidence / Verification Method | Blocker? |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | Better Auth Bearer token exchange | **VERIFIED** | Auth middleware verifies bearer tokens and user sessions. | NO |
| **Authentication & RBAC** | Role enforcement (Owner, Admin, Manager, Employee) | **VERIFIED** | Default roles & permissions matrix verified with `requirePermission`. | NO |
| **Authentication & RBAC** | Token exposure in URL query parameters | **FIXED** | Stream ticket endpoint (`/v1/telemetry/stream-ticket`) issues single-use 60s tickets. | NO |
| **Multi-Tenant Isolation** | 5-stage tenant verification | **VERIFIED** | `X-Workspace-Id` verified against membership; `SET LOCAL app.current_workspace_id` in every transaction. | NO |
| **Multi-Tenant Isolation** | PostgreSQL Row-Level Security | **VERIFIED** | 100% of public tenant tables enforce transaction-scoped RLS policies. | NO |
| **Data Security** | Zero plaintext secrets committed | **VERIFIED** | Git history and working tree audited. Environment variables validated with Zod `validateEnv()`. | NO |
| **Data Security** | Default secrets blocked in production | **FIXED** | `validateEnv()` rejects default `BETTER_AUTH_SECRET` and dev `DATABASE_URL` in production/staging. | NO |
| **Data Security** | Stack trace disclosure in API responses | **FIXED** | Removed `stack: err.stack` across all API route error responses. | NO |
| **Data Security** | Production CORS origins | **FIXED** | Restricts `localhost` origins strictly to non-production environments. | NO |
| **Media & Proof of Work** | Real private object storage (S3/R2) | **VERIFIED** | `StorageDriver` abstraction with S3Driver and LocalDriver; fail-closed cloud testing. | NO |
| **Media & Proof of Work** | Fake media upload prevention | **VERIFIED** | `headObject` verification verifies binary exists and has non-zero size before confirming proof. | NO |
| **Media & Proof of Work** | Media download HMAC signature | **VERIFIED** | Direct storage download requires valid cryptographic HMAC signature and non-expired timestamp. | NO |
| **Workforce Attendance** | Selfie anti-buddy-punching | **VERIFIED** | Mandatory selfie capture and server verification for attendance punch-in (BLK-004). | NO |
| **Workforce Attendance** | Punch-in rejection rollback | **VERIFIED** | Mobile sync client rolls back optimistic `ON_DUTY` to `NOT_STARTED` on 4xx rejection. | NO |
| **GPS & Telemetry** | Strict duty-hours-only invariant | **VERIFIED** | Off-duty points hard-dropped at mobile hardware unhook and API ingestion boundary. | NO |
| **GPS & Telemetry** | Peer visibility off by default | **VERIFIED** | Restricted to `LOCATION_READ` permission (Managers/Owners only). | NO |
| **GPS & Telemetry** | Configurable location retention | **VERIFIED** | Per-workspace retention days (default 30, min 7) with BullMQ automated pruning (BLK-006). | NO |
| **Offline Reliability** | Drift SQLite outbox & sync queue | **VERIFIED** | Mobile client persists mutations locally and flushes sequentially or in batch upon reconnection. | NO |
| **Background Worker** | Multi-tenant RLS isolation | **FIXED** | Worker jobs wrap recurring task generation and SLA monitor in transactions with `set_config`. | NO |
| **Web Dashboard** | Admin & Manager interfaces | **VERIFIED** | Pages for Tasks, Visits, Team (CSV import + invitations), Attendance, Live Map, Settings, Reports. | NO |
| **Mobile Client** | Android SDK 36 compatibility | **VERIFIED** | `compileSdk = 36` configured; debug vs release manifest network security isolation. | NO |
| **Mobile Packaging** | Production release APK signing | **VERIFIED** | `key.properties.example` template provided; builds fail-closed without real keystore. | NO |
| **CI/CD Pipelines** | GitHub Actions automation | **VERIFIED** | `.github/workflows/ci.yml` and `android-pilot-apk.yml` passing. | NO |

---

## 2. Commercial Operations & Subscription Prerequisites (Owner Decision Required)

The following items are outside the frozen V1 operational scope and require explicit owner decision prior to commercial paid billing:

1. **Paid Subscription & Billing Engine:**
   - *Status:* Out of V1 Core Scope (PRD non-goal).
   - *Recommendation:* SMB workspaces can be manually provisioned or set to a trial status. Integration with Stripe/Razorpay is slated for Phase 06/V2.
2. **Custom Legal Agreements & Privacy Policy URL:**
   - *Status:* Needs customer-specific legal text published at `/legal/privacy` and `/legal/terms`.
3. **Cloudflare R2 Production Bucket Credentials:**
   - *Status:* Staging/Production S3 configuration requires setting `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` in Render environment variables.
