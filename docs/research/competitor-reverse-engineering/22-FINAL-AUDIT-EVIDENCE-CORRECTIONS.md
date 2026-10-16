# 22 — Final Audit Evidence Corrections & Source Dissection

**Auditor:** Principal Software Architect, Senior QA Lead & Security Analyst  
**Repository Baseline:** `djsushilkumar/oprino` (`main` branch @ `12d3ee3`)  
**Context:** Source-Backed Correction of Document 21 & Production Verification  
**Date of Audit:** October 2026  
**Status:** Approved Post-Audit Corrections  

---

## 1. Executive Summary

An adversarial source-code and runtime verification was conducted to eliminate errors, inaccurate assumptions, and unmeasured claims present in Document 21 (`21-PRODUCTION-RELIABILITY-VALIDATION.md`).

### Five Critical Evidence Corrections Established:
1. **The Deployed Commit SHA in `version.ts` is Hard-Coded:** `gitCommit: '5fc3468'` in `services/api/src/routes/version.ts:10` is a static string literal. It does not prove that commit `5fc3468` is deployed. A true build-time injection mechanism (`RENDER_GIT_COMMIT`) must be implemented before claiming deployment revision parity.
2. **Mobile Network Timeouts Were Mischaracterized:** Document 21 claimed the mobile client suffered from default 30-second socket timeouts during network handover. Inspection of `generated/dart-api/lib/src/api_client.dart:29–30` reveals that `OprinoApiClient` **already configures 10-second connect and receive timeouts**, while raw binary uploads in `media_upload_service.dart:25–27` enforce separate 30s connect / 60s send limits.
3. **The Four Skipped R2 Tests Were Erroneously Named:** The four conditionally skipped tests in `services/api/src/cloud-storage.integration.test.ts` were incorrectly named in Document 21. The actual tests are verified live staging tests guarded by `evaluateLiveR2Preconditions`.
4. **Synthetic Map Benchmarks Overestimated Real Browser Performance:** The Node.js synthetic benchmark (showing 60 FPS at 200 markers) ignored browser DOM rendering, style recalcs, and GPU compositing. **Direct Chromium browser instrumentation revealed severe frame drops: 16 FPS at 25 workers, 7 FPS at 100 workers, and 5 FPS at 200 workers.**
5. **Two Confirmed Defect Bugs & One Security Risk Identified in Live Map:**
   - **CONFIRMED DEFECT (Continuous Bounds Reset):** In `live-map/page.tsx:475–481`, `currentMap.fitBounds(bounds)` executes on every background SSE location update, repeatedly snapping the supervisor's map viewport and fighting manual pan/zoom gestures.
   - **CONFIRMED DEFECT (Stale Closure in Marker Click):** In `live-map/page.tsx:401`, marker click listeners capture the initial `worker` object in a closure, causing subsequent clicks to display stale telemetry data.
   - **SECURITY RISK (DOM XSS):** In `live-map/page.tsx:455`, `worker.userName` is directly interpolated into `el.innerHTML` without sanitization.

---

## 2. Evidence Correction 1: Deployment Revision & Commit SHA

### 2.1 The Code Dissection
In [`services/api/src/routes/version.ts`](../../../services/api/src/routes/version.ts#L5-L21):
```typescript
export const versionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/version', async (_req, reply) => {
    const payload = {
      name: 'oprino-api',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      gitCommit: '5fc3468', // <--- HARDCODED STRING LITERAL IN SOURCE
      architecture: {
        framework: 'Fastify + TypeScript',
        database: 'PostgreSQL 18 + PostGIS 3.6',
        mobile: 'Flutter 3.47 Stable',
        auth: 'Better Auth (Bearer & Session Cookies)',
      },
    };
    ...
```

### 2.2 The Technical Correction
- Polling `https://oprino-api.onrender.com/v1/version` returns `gitCommit: "5fc3468"` because that string was committed into the repository, **not because the build pipeline verified the deployed commit**.
- In `Dockerfile.api`, no build arguments (`ARG`) or environment variables inject the commit hash from git.
- **Authoritative Fix:**
  Render provides `RENDER_GIT_COMMIT` automatically during container builds. Update `version.ts` to dynamically resolve:
  ```typescript
  gitCommit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA || 'development',
  ```
  and pass `ARG RENDER_GIT_COMMIT` / `ENV RENDER_GIT_COMMIT=$RENDER_GIT_COMMIT` in `Dockerfile.api`.

---

## 3. Evidence Correction 2: Mobile Network Timeouts

### 3.1 The Code Dissection
In [`generated/dart-api/lib/src/api_client.dart:26–35`](../../../generated/dart-api/lib/src/api_client.dart#L26-L35):
```dart
  OprinoApiClient({
    Dio? dio,
    String baseUrl = 'http://10.0.2.2:3000',
  }) : dio = dio ??
            Dio(BaseOptions(
              baseUrl: baseUrl,
              connectTimeout: const Duration(seconds: 10), // <--- ALREADY 10 SECONDS
              receiveTimeout: const Duration(seconds: 10), // <--- ALREADY 10 SECONDS
              headers: {
                'Origin': 'oprino://app',
                'Accept': 'application/json',
              },
            ));
```

And in [`apps/mobile/lib/core/network/media_upload_service.dart:24–28`](../../../apps/mobile/lib/core/network/media_upload_service.dart#L24-L28):
```dart
  MediaUploadService({
    required this.client,
    Dio? rawUploadDio,
    this.baseDirectory,
  }) : _rawUploadDio = rawUploadDio ?? Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 60),
        ));
```

### 3.2 The Technical Correction
- Document 21 claimed that sync requests hung for 30 seconds due to default timeouts. This claim was **factually incorrect**.
- `OprinoApiClient` already bounds socket connections to **10 seconds**.
- The claim of a "30-second socket timeout defect on handover" is **WITHDRAWN as an unverified hypothesis**. Network handover behavior must be evaluated using real device connection resets rather than speculative timeouts.

---

## 4. Evidence Correction 3: Real Skipped Tests in Cloud Storage

### 4.1 The Code Dissection
In [`services/api/src/cloud-storage.integration.test.ts:286–363`](../../../services/api/src/cloud-storage.integration.test.ts#L286-L363), the actual four conditionally skipped tests are:

```typescript
// Test 1 (Line 289)
test('[LIVE R2] Uploads valid synthetic JPEG binary to staging R2 bucket using signed PUT URL', { skip: skipReason }, ...)

// Test 2 (Line 316)
test('[LIVE R2] Verifies physical object existence and byte fidelity via headObject', { skip: skipReason }, ...)

// Test 3 (Line 332)
test('[LIVE R2] Generates presigned download URL and verifies byte-for-byte fidelity', { skip: skipReason }, ...)

// Test 4 (Line 351)
test('[LIVE R2] Safely deletes test object and verifies headObject returns exists: false', { skip: skipReason }, ...)
```

### 4.2 The Technical Correction
- Document 21 erroneously claimed the skipped tests were security/tenancy tests (e.g. "Cross-workspace media access returns 403 Forbidden").
- The four tests are exclusively **end-to-end live Cloudflare R2 round-trip verification tests** (PUT, HEAD, GET download, DELETE cleanup).
- They use `VALID_SYNTHETIC_JPEG` with isolated keys:
  `${stagingWorkspaceId}/attendance/${stagingEmployeeId}/staging-selfie-${Date.now()}-${uuid}.jpg`
  and clean up via `liveDriver.deleteObject(testKey)` in `after()`.
- When `RUN_LIVE_R2_TESTS` is unset, they skip cleanly and fail-closed.

---

## 5. Evidence Correction 4: Real Browser Map Benchmark vs. Node Simulation

### 5.1 Real Browser Instrumentation Results (Chromium)
Direct instrumentation was executed via Chromium browser subagent rendering the exact MapLibre DOM markers, pulse CSS, and update loops from `apps/web/src/app/live-map/page.tsx`:

```
=== MAPLIBRE LIVE-MAP REAL CHROMIUM BROWSER BENCHMARK (RECORDED) ===
┌─────────┬─────────────┬──────────────────┬───────────────────┬──────────────┬──────────────────┬──────────────┐
│ Scenario│ Worker Count│ Initial Mount Ms │ Avg Frame Time Ms │ Recorded FPS │ Max Frame Jank Ms│ Heap Memory  │
├─────────┼─────────────┼──────────────────┼───────────────────┼──────────────┼──────────────────┼──────────────┤
│ 1       │ 25 workers  │ 22.4 ms          │ 63.94 ms          │ 16 FPS       │ 1,233.4 ms       │ 13.6 MB      │
│ 2       │ 50 workers  │ 16.4 ms          │ 43.02 ms          │ 23 FPS       │ 116.6 ms         │ 13.6 MB      │
│ 3       │ 100 workers │ 44.9 ms          │ 142.11 ms         │ 7 FPS        │ 3,533.6 ms       │ 13.6 MB      │
│ 4       │ 200 workers │ 123.9 ms         │ 221.21 ms         │ 5 FPS        │ 1,266.5 ms       │ 13.6 MB      │
└─────────┴─────────────┴──────────────────┴───────────────────┴──────────────┴──────────────────┴──────────────┘
```

### 5.2 Root-Cause Analysis of Browser Frame Drop:
1. **Infinite CSS Pulse Animations:** Each worker marker renders an element with `animation: pulse 1.5s infinite`. At 100 markers, the browser compositor manages 100 overlapping CSS keyframe animations, forcing continuous layer repaints.
2. **DOM Style Recalculation:** MapLibre moves DOM markers via inline CSS `transform: translate(...)` on HTML elements. Moving 100+ DOM nodes synchronously causes massive layout thrashing.
3. **Confirmed Architectural Requirement:** For fleets > 50 workers, MapLibre markers must be converted from HTML DOM elements to a **MapLibre GeoJSON Symbol/Circle Layer** rendered directly on the WebGL canvas.

---

## 6. Evidence Correction 5: Live Map Defects Discovered

### 6.1 Confirmed Defect: Continuous Viewport Bounds Snapping
- **Location:** `apps/web/src/app/live-map/page.tsx:475–481`
- **Code:**
  ```typescript
  // Fit bounds if we have workers and not currently zoomed on a single worker
  if (hasValidCoords && !selectedWorker && workers.length > 0) {
    currentMap.fitBounds(bounds, {
      padding: 60,
      maxZoom: 14,
      duration: 1000,
    });
  }
  ```
- **Reproduction:** As soon as any worker emits a telemetry update via SSE, `workers` state updates, triggering the effect and forcing `fitBounds(bounds)`. If a supervisor is manually panning to inspect a street or zooming in on an incident, the map violently snaps back to the bounding box of all workers every few seconds.
- **Fix:** Guard `fitBounds` with an `isInitialLoad` ref, or trigger it only upon clicking an explicit "Fit Fleet" button.

### 6.2 Confirmed Defect: Stale Closure in Marker Click Handler
- **Location:** `apps/web/src/app/live-map/page.tsx:396–414`
- **Code:**
  ```typescript
  if (!marker) {
    const el = document.createElement('div');
    el.addEventListener('click', () => {
      setSelectedWorker(worker); // <--- CAPTURES INITIAL WORKER OBJECT IN CLOSURE
      ...
    });
    ...
  } else {
    marker.setLngLat([worker.longitude, worker.latitude]);
    // Does NOT update the click event listener closure!
  }
  ```
- **Reproduction:** Marker click listeners are attached only once when the marker is created. Over the next 2 hours, as telemetry updates arrive via SSE, the click handler retains the initial `worker` reference. When the supervisor clicks the marker, `selectedWorker` receives 2-hour-old stale telemetry.
- **Fix:** Look up the latest worker from state or a mutable ref: `setSelectedWorker(workersRef.current.get(worker.userId))`.

### 6.3 Security Risk: Potential DOM XSS via `innerHTML`
- **Location:** `apps/web/src/app/live-map/page.tsx:427–471`
- **Code:**
  ```typescript
  el.innerHTML = `
    ...
    <span>${worker.userName}</span>
    ...
  `;
  ```
- **Risk:** If `worker.userName` contains `<img src=x onerror=...>`, direct string interpolation into `el.innerHTML` will execute script in the supervisor's browser.
- **Fix:** Replace `el.innerHTML` with safe DOM construction (`document.createElement`, `textContent`) or sanitize through DOMPurify.

---
*End of Document 22 — Final Audit Evidence Corrections*
