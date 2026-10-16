# OPRINO — Tracked Open Issues & Commercial Blockers

**Document Status:** ACTIVE & AUDITABLE  
**Classification:** Operational Blockers, Commercial Launch Gates, Open Engineering Tasks  
**Repository:** `djsushilkumar/oprino`  
**Last Updated:** October 2026  

---

## 1. Critical Commercial Launch Blockers (P0 Gate)

These 5 items are the verified gating prerequisites documented in [`docs/releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md`](../releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md) before Oprino can be commercially launched:

```mermaid
graph TD
    B1[1. Cloudflare R2 Credentials] --> Gate[Commercial Launch Gate]
    B2[2. Android Production Keystore & APK] --> Gate
    B3[3. Multi-OEM GPS Battery Benchmark] --> Gate
    B4[4. Custom Domain & SSL Routing] --> Gate
    B5[5. Owner Commercial Sign-Off] --> Gate
```

### Blocker 1: Production Cloudflare R2 Storage Credentials
- **Severity:** P0 — Commercial Blocker
- **Current State:** API runs with local filesystem fallback in development. In production on Render, mock storage is active; 4 live R2 contract tests in `services/api` are skipped because R2 credentials are not populated in the cloud environment.
- **Resolution Steps:**
  1. Create a production Cloudflare R2 bucket (`oprino-production-media`, with staging as `oprino-staging-media`).
  2. Configure CORS rules allowing `PUT` requests from `https://oprino.vercel.app` and mobile clients.
  3. Set the canonical environment variables expected by `services/api/src/config/env.ts`:
     - `S3_BUCKET_NAME=oprino-production-media`
     - `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
     - `S3_ACCESS_KEY_ID=<cloudflare_r2_access_key>`
     - `S3_SECRET_ACCESS_KEY=<cloudflare_r2_secret_key>`
     - `S3_REGION=auto`
  4. Run automated integration test `services/api/src/cloud-storage.integration.test.ts` to verify live presigned upload and retrieval.

### Blocker 2: Android Production Release Signing Credentials & Workflow
- **Severity:** P0 — Mobile Release Gate
- **Current State:** The mobile app builds and installs cleanly on physical Android hardware. The CI workflow [`.github/workflows/mobile-release.yml`](../../.github/workflows/mobile-release.yml) is designed to build a signed production **APK** (`flutter build apk --release --no-tree-shake-icons`) and verify it via `apksigner`. Production distribution is gated pending keystore provisioning.
- **Resolution Steps:**
  1. Generate production keystore via `keytool -genkey -v -keystore oprino-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias oprino`.
  2. Base64-encode the keystore and populate the exact GitHub Actions Secrets and Variables expected by `.github/workflows/mobile-release.yml`:
     - Secret: `OPRINO_RELEASE_KEYSTORE_BASE64` (or `OPRINO_KEYSTORE_BASE64`)
     - Secret: `OPRINO_RELEASE_KEYSTORE_PASSWORD` (or `OPRINO_KEYSTORE_PASSWORD`)
     - Secret: `OPRINO_RELEASE_KEY_ALIAS` (or `OPRINO_KEY_ALIAS`)
     - Secret: `OPRINO_RELEASE_KEY_PASSWORD` (or `OPRINO_KEY_PASSWORD`)
     - Secret/Var: `OPRINO_RELEASE_CERT_SHA256` (mandatory certificate SHA-256 fingerprint for fail-closed validation)
     - Var: `PROD_API_URL` (defaults to `https://oprino-api.onrender.com`)
  3. Execute `.github/workflows/mobile-release.yml` to generate the cryptographically verified release APK artifact (`oprino-mobile-release-apk`). If Google Play Store distribution is selected, configure a companion `flutter build appbundle` (AAB) job.

### Blocker 3: Multi-OEM Real-Device Background GPS & Battery Benchmark
- **Severity:** P1 — Field Reliability Gate
- **Current State:** End-to-end duty punch, live camera photo, and on-glass signature verified on physical OnePlus CPH2707IN (Android 14/15). Aggressive battery-saving OEMs (Xiaomi HyperOS/MIUI, Samsung OneUI, Vivo FuntouchOS) have not been field-tested for 8-hour continuous shift keepalive.
- **Resolution Steps:**
  1. Install release build on at least 2 additional physical test devices (Xiaomi and Samsung).
  2. Execute continuous 8-hour field shift simulation with periodic 30-second GPS breadcrumbs.
  3. Verify that total battery consumption remains below 3.0% per hour.
  4. Verify that Android foreground service notification (`Oprino Field Operations — Active Shift`) remains sticky and prevents OS task killing.

### Blocker 4: Custom Production Domain & Cloudflare SSL Wiring
- **Severity:** P1 — Brand & Trust Gate
- **Current State:** Applications are currently served from platform default subdomains: `https://oprino.vercel.app` and `https://oprino-api.onrender.com`.
- **Resolution Steps:**
  1. Add DNS CNAME records in Cloudflare DNS pointing `app.oprino.com` to Vercel and `api.oprino.com` to Render.
  2. Configure SSL Full (Strict) mode in Cloudflare.
  3. Update `CORS_ORIGIN` in Render to authorize `https://app.oprino.com`.

### Blocker 5: Owner Commercial & Legal Sign-Off
- **Severity:** P0 — Governance Gate
- **Current State:** Product architecture and V1 scope frozen. Terms of Service, Privacy Policy, and initial pricing tier definitions require final business owner sign-off.
- **Resolution Steps:**
  1. Review pricing model ([`docs/business/PRICING-STRATEGY.md`](../business/PRICING-STRATEGY.md)): Free Starter (up to 5 workers) vs Pro Tier ($3/worker/mo or ₹199/worker/mo).
  2. Finalize Privacy Policy certifying Duty-Hours-Only tracking and 30-day location retention.
  3. Obtain explicit stakeholder launch approval.

---

## 2. Active Engineering Backlog Items

Per [`docs/product/V1-SCOPE.md`](../product/V1-SCOPE.md), push notifications are a frozen V1 **MUST** requirement. The engineering backlog below separates remaining V1 deliverables from post-V1 roadmap items:

| Issue ID | Feature / Component | Priority | Status | Description |
|---|---|---|---|---|
| **ENG-01** | Push Notifications (FCM / APNs) | P1 | V1 Required (In Progress) | Integrate Firebase Cloud Messaging for native mobile background push alerts when tasks are assigned or modified. (In-App Badge Drawer + SSE live stream are currently implemented and verified). |
| **ENG-02** | Geofence Auto-Punch Confirmation | P2 | Planned (V1.5) | Detect arrival at customer site and prompt the worker with a 1-tap check-in confirmation notification. |
| **ENG-03** | PDF Service Receipt Generator | P2 | Planned (V1.5) | Generate a branded PDF service report upon task completion including customer signature, checklist answers, and photos, delivered via email. |
| **ENG-04** | Conveyance Expense Claim Workflow | P2 | Planned (V1.5) | Structured manager reimbursement approval using GPS distance rollups and per-km vehicle rates. |
| **ENG-05** | Offline Map Tile Caching | P3 | Planned (V2.0) | Pre-cache regional OpenStreetMap raster tiles in mobile app SQLite database for zero-reception forest/basement operations. |
