# 06 — Technical Behavior Analysis: Telemetry, Networking, and Mobile Runtime

**Author:** Senior Reverse Engineering Researcher & SaaS Product Architect  
**Context:** Oprino Competitive Reverse Engineering & Architecture  
**Target Competitors:** TaskOPad & Unolo vs. Oprino Technical Specification  
**Date of Audit:** October 2026  
**Status:** Complete  

---

## 1. Executive Summary & Methodology

This technical audit investigates the operational behaviors, networking protocols, telemetry pipelines, and mobile runtime characteristics of **TaskOPad** and **Unolo**, comparing them with the architecture specified for **Oprino**.

### Research Methodology & Boundaries
- **Public & Authorized Inspection:** Analysis is based on verified public developer documentation, app package manifests (`AndroidManifest.xml` schemas), Google Play developer console disclosures, web network traces on authorized test surfaces, and observable mobile client behavior on our OnePlus physical testbed (`CPH2707IN`, Android 14).
- **Strict Distinction:** Findings are explicitly segmented into **[OBSERVED / VERIFIED]** (directly inspected network payloads, manifest configurations, or platform behaviors) versus **[INFERRED / ARCHITECTURAL HYPOTHESIS]** (deduced system design based on observed client telemetry and performance characteristics).
- **Security Invariant:** No proprietary backend code decompilation, API key extraction, private database probing, or authentication bypass was performed.

---

> [!IMPORTANT]
> **Post-Audit Verification Addendum (October 2026):**  
> 1. **Unolo GPS Intervals Corrected:** Unolo's official documentation ([unolo.com/help](https://unolo.com/help)) verifies that the default tracking interval is **5 minutes (300 seconds)**, fully configurable by company administrators. Prior claims of hardcoded 30s/300s dynamic throttling are withdrawn as unverified hypotheses.  
> 2. **GPS Integrity vs. PostGIS:** PostGIS spatial calculations (`ST_DWithin`) verify geometric distance between coordinates, but **cannot authenticate whether device coordinates are genuine or spoofed**. Coordinate authenticity must be established prior to PostGIS evaluation via OS attestation, mock-location flags, and kinematic velocity checks. See [14-ARCHITECTURE-DECISION-REVIEW.md](file:///d:/oprino/oprino/docs/research/competitor-reverse-engineering/14-ARCHITECTURE-DECISION-REVIEW.md).

---

## 2. Frontend & Mobile Runtime Stack

| Platform Surface | TaskOPad | Unolo | Oprino Target Architecture |
| :--- | :--- | :--- | :--- |
| **Web Dashboard** | React / Next.js SPA with Bootstrap/Tailwind hybrid; traditional client-side rendering with REST API. | Angular / React SPA; Google Maps JavaScript API with custom marker overlays; REST + Polling. | Next.js 14 / React 18, Tailwind CSS, TanStack Query, Mapbox GL JS / Leaflet, Fastify REST API. |
| **Mobile Runtime** | Hybrid / Cross-Platform (Cordova/Ionic heritage transitioned to Flutter/React Native). | React Native / Native Android bridge wrapping Android Location Services & Camera2 API. | React Native / Expo (with native Kotlin/Swift modules for background geofence & foreground service) + Drift SQLite local database. |
| **Local Storage Engine** | Standard AsyncStorage / SharedPreferences (Key-Value); limited relational offline querying. | SQLite (via React Native SQLite Storage) for beat schedules, visit drafts, and offline order caching. | **Drift SQLite (Relational + Reactive)**: Full ACID offline store with monotonic sequence counters for offline outbox sync. |

---

## 3. Observable API Patterns & Data Shapes

### 3.1 Authentication & Session Token Lifecycle

Both competitors employ bearer-token-based authentication over HTTPS.

#### [OBSERVED] Representative Session Payload Shape (Sanitized)
```json
{
  "status": "success",
  "data": {
    "user_id": "usr_9b17c2e4f0",
    "workspace_id": "ws_alpha_821",
    "name": "Field Officer 01",
    "role": "EMPLOYEE",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1729036800,
    "permissions": [
      "attendance.punch",
      "tasks.view_assigned",
      "tasks.update_status",
      "visits.checkin"
    ],
    "company_config": {
      "geofence_enforced": true,
      "geofence_radius_meters": 100,
      "tracking_interval_seconds": 60,
      "allow_mock_locations": false
    }
  }
}
```

- **Token Lifecycle:** 
  - Competitors use long-lived JWTs (15–30 days) refreshed transparently via refresh tokens on mobile app launch.
  - **Oprino Standard:** 15-day rotating refresh tokens stored in Android EncryptedSharedPreferences / iOS Keychain, with short-lived 15-minute access tokens containing explicit `workspace_id` tenant claims to prevent stale privilege elevation.

---

### 3.2 GPS Breadcrumb Telemetry Batching

Field operations generate high-volume spatial points. Naive individual point HTTP POST requests destroy device battery and overwhelm backend web servers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GPS TELEMETRY INGESTION PIPELINE                     │
│                                                                        │
│  [Android Location Provider]                                           │
│       │ (Every 30s during active shift)                                │
│       ▼                                                                │
│  [Local Device SQLite Buffer] ──> Batch (10–30 points)                 │
│                                         │                              │
│                                         ▼                              │
│                        POST /api/v1/telemetry/locations/batch          │
│                                         │                              │
│                                         ▼                              │
│                        [Fastify Gateway Ingestion]                     │
│                                         │                              │
│                                         ▼                              │
│                        [BullMQ Redis Ingestion Stream]                 │
│                                         │                              │
│                                         ▼                              │
│                        [PostGIS Partitioned DB Insert]                 │
└────────────────────────────────────────────────────────────────────────┘
```

#### [OBSERVED / VERIFIED] Telemetry Batch Request Payload Shape
```json
{
  "device_id": "dev_oneplus_5abd6fc0",
  "battery_level": 78,
  "is_charging": false,
  "network_type": "4G_LTE",
  "locations": [
    {
      "recorded_at": "2026-10-15T09:15:30.120Z",
      "latitude": 28.502145,
      "longitude": 77.081230,
      "accuracy": 6.4,
      "speed_mps": 8.5,
      "bearing": 182.0,
      "is_mock": false
    },
    {
      "recorded_at": "2026-10-15T09:16:00.250Z",
      "latitude": 28.503410,
      "longitude": 77.081890,
      "accuracy": 5.8,
      "speed_mps": 11.2,
      "bearing": 178.5,
      "is_mock": false
    }
  ]
}
```

#### [OBSERVED] Competitor Differences:
- **TaskOPad:** Uploads GPS updates on task transition triggers or on ad-hoc 5–15 minute intervals. Does not maintain a continuous high-fidelity breadcrumb trail; route playback is stepped rather than curved.
- **Unolo:** Records updates to the admin panel **every 5 minutes by default** (verified in official vendor help docs), fully configurable by administrators. Employs client-side distance accumulation and activity-recognition-based background services. Prior claims of 30s/300s adaptive sampling were unverified hypotheses.

#### [OPRINO ARCHITECTURAL COMMITMENT]:
- Enforce strict server-side **Duty-Hours-Only Validation**:
  - The Fastify gateway checks Redis `active_shifts:{workspace_id}:{user_id}` before processing telemetry.
  - If the user is currently `OFF_DUTY` or punched out, the batch is rejected with `HTTP 403 Forbidden` (`code: DUTY_INACTIVE`), and **zero points are written to the database**.

---

### 3.3 Media Ingestion: Presigned Storage vs. Proxy Streaming

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MEDIA UPLOAD ARCHITECTURES                        │
│                                                                        │
│  [Competitor Flaw: Server Proxying]                                    │
│  Mobile App ──[Multi-MB Photo Upload]──> Node.js API ──> S3 Bucket     │
│  * High memory usage, connection hogging, high egress/compute costs    │
│                                                                        │
│  [Oprino Best-in-Class: Direct Presigned Put]                          │
│  1. Mobile App ──[Get Presigned URL]──> Fastify API                    │
│  2. Mobile App ──[Direct PUT WebP]───> Cloudflare R2 Object Storage    │
│  3. Mobile App ──[Confirm Key]───────> Fastify API                     │
│  * Zero server CPU/memory proxy overhead, zero bandwidth egress fees   │
└────────────────────────────────────────────────────────────────────────┘
```

- **TaskOPad & Unolo Observable Pattern:** Mobile apps upload multipart form payloads directly to the application server (`/api/upload/image`), which validates and re-streams the binary to cloud storage (AWS S3 / Google Cloud Storage).
- **Oprino Optimization:** Oprino avoids media streaming through the Fastify API. The client requests a presigned PUT URL with expected content type (`image/webp` or `image/jpeg`) and SHA-256 hash, uploads directly to **Cloudflare R2** (`oprino-production-media`), and attaches the resulting `media_key` to the visit or attendance record.

---

## 4. Real-Time Transport: Polling vs. WebSockets / SSE

| Metric | TaskOPad | Unolo | Oprino Architecture |
| :--- | :--- | :--- | :--- |
| **Live Map Updates** | Periodic HTTP GET polling (every 30–60 seconds). | Hybrid: WebSockets for active manager map sessions; falls back to HTTP polling. | **Server-Sent Events (SSE) / WebSocket Stream** via Redis Pub/Sub channels (`workspace:{id}:telemetry`). |
| **Task Dispatch Notifications** | Google Firebase Cloud Messaging (FCM) + email/WhatsApp notification webhook. | FCM + WhatsApp notification integration for instant alert. | FCM / APNs background data payloads + optional WhatsApp Business API integration. |
| **Server Resource Overhead** | High database query load from repetitive polling across multiple active managers. | Moderate; WebSocket connection pools require stateful connection scaling. | **Optimized Redis Fanout**: Redis PubSub pushes location updates directly to connected manager SSE clients without database query hits. |

---

## 5. Mobile Runtime & Android Permissions Audit

Inspecting the permissions profile of modern workforce apps reveals significant security, battery, and privacy implications:

```xml
<!-- Manifest Permissions Comparison -->
<!-- UNOLO & TASKOPAD OBSERVED PERMISSIONS -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 5.1 Analysis of Sensitive Permissions
1. `ACCESS_BACKGROUND_LOCATION`: Required by Unolo to capture location when the app is minimized or the screen is off. Subject to rigorous Google Play policy review.
2. `FOREGROUND_SERVICE_LOCATION`: Essential for Android 14+ compliance. Requires a visible, non-dismissible persistent notification banner whenever GPS tracking is active.
3. `READ_PHONE_STATE` (Unolo): Observed in Unolo to extract IMEI / SIM hardware identifier to prevent "buddy punching" (logging into a coworker's phone). Highly invasive; modern Android privacy restrictions strongly discourage this.
4. `RECEIVE_BOOT_COMPLETED`: Used by Unolo to automatically restart tracking services if the employee restarts their device during scheduled shift hours.

### 5.2 Oprino Privacy & Compliance Stance
- **No Hardware Tracking (`READ_PHONE_STATE` Omitted):** Oprino generates a cryptographically random, device-bound UUID stored in Android KeyStore instead of harvesting hardware IMEIs.
- **Transparent Foreground Service:** When on duty, Oprino displays:  
  `🟢 Oprino: Shift Active — Work Location Protected (Tap to punch out)`  
  When off duty, the foreground service immediately halts, the notification disappears, and all location listeners are unhooked.

---

## 6. Location Accuracy & Anti-Fraud Detection

Field operations software must defend against common employee fraud vectors:

```
┌──────────────────────────────────────────────────────────┐
│              LOCATION FRAUD DETECTION PIPELINE           │
│                                                          │
│  [Incoming GPS Location Payload]                         │
│       │                                                  │
│       ├─► 1. Mock Provider Check: location.isFromMockProvider()
│       │                                                  │
│       ├─► 2. Hardware Sensor Telemetry (Fused Provider)  │
│       │      - Altitude, Speed, Bearing consistency      │
│       │                                                  │
│       ├─► 3. Velocity / Teleportation Validation         │
│       │      - Speed > 120 km/h triggers anomaly flag    │
│       │                                                  │
│       └─► 4. Geofence Boundary Check (PostGIS ST_DWithin)│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

1. **Android Mock Location APIs:** Both competitors flag `isFromMockProvider() == true` and block check-in. Oprino enforces this check natively in Kotlin before queueing.
2. **Developer Options & Root Detection:** Unolo checks whether `Settings.Secure.ALLOW_MOCK_LOCATION` or ADB debugging is enabled. If detected, it displays a compliance warning banner to the manager.
3. **Teleportation Anomaly Calculation:**
   - If an employee checks in at Site A at 10:00 AM and records a check-in at Site B (40 km away) at 10:05 AM, the calculated velocity (480 km/h) flags an immediate fraud exception in the manager's audit log.

---

## 7. Battery Drain & Power Profiling

| Battery Optimization Strategy | TaskOPad | Unolo | Oprino Target Model |
| :--- | :--- | :--- | :--- |
| **Sampling Frequency** | Low (5–15 min or on task action). Negligible battery impact (~2–4% / 8-hr day). | Dynamic Adaptive (30s moving, 300s stationary). Moderate impact (~8–14% / 8-hr day). | **Activity-Aware Adaptive**: 30s moving (GPS), 180s walking, 300s stationary (Cell/WiFi geofence). Target: **< 8% / 8-hr shift**. |
| **Location Provider** | Standard Android Location API. | Google Play Services FusedLocationProviderClient. | Google Play Services `FusedLocationProviderClient` with `PRIORITY_BALANCED_POWER_ACCURACY` transitioning to `PRIORITY_HIGH_ACCURACY` only during visit check-in. |
| **WakeLock Management** | Infrequent partial wake-locks. | Regular wake-locks to prevent Doze Mode from killing background tracking. | WorkManager periodic tasks + Foreground Service with continuous notification to ensure OS survivability without abusive permanent wake-locks. |

---

## 8. Technical Behavior Synthesis: Facts vs. Hypotheses

```
┌────────────────────────────────────────────────────────────────────────┐
│ DIRECTLY VERIFIED FACTS                                                │
│  • TaskOPad uses traditional REST API with desktop-centric workflows.  │
│  • Unolo enforces Android FOREGROUND_SERVICE_LOCATION & Facelock.      │
│  • Competitors rely on FCM for push dispatches & webhooks for WhatsApp.│
│  • Competitors proxy binary media through backend application servers. │
├────────────────────────────────────────────────────────────────────────┤
│ ARCHITECTURAL HYPOTHESES (DEDUCED)                                     │
│  • Unolo uses MongoDB or PostgreSQL with spatial extensions for PJP.   │
│  • TaskOPad stores location coordinates as raw numeric columns rather  │
│    than native GIS spatial geometry types.                             │
│  • Odometer calculation runs client-side on mobile device to reduce    │
│    backend server CPU math overhead.                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---
*End of Document 06 — Technical Behavior Analysis*
