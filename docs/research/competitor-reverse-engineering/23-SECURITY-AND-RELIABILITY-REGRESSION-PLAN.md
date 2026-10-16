# 23 — Security and Reliability Regression Plan

**Author:** Senior QA Lead, Application Security Architect & Principal Systems Engineer  
**Baseline Target:** `djsushilkumar/oprino` (`main` branch @ `12d3ee3`)  
**Scope:** Live Map Security, Mobile Handover & Battery Harness, Isolated Cloud Staging  
**Date of Creation:** October 2026  
**Status:** Approved for Implementation Testing  

---

## 1. Executive Summary & Purpose

This document provides focused, reproducible regression testing plans to validate the fixes for the defects and security risks discovered during the post-REA production reliability audit. It explicitly avoids testing destructive behavior against live production databases and requires isolated testbeds for all network and storage validations.

---

## 2. Suite 1: Live Map Security & UX Regression Suite

### 2.1 Test Case MAP-SEC-001: DOM XSS Prevention via `textContent`
- **Objective:** Verify that malicious user names containing script tags or image error handlers are rendered as harmless text and never executed in the supervisor's browser.
- **Test File:** `apps/web/src/app/live-map/live-map-security.test.tsx`
- **Synthetic Test Payloads:**
  ```typescript
  const maliciousNames = [
    '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" onerror="window._xssAttack=true;">',
    '<script>window._xssAttack=true;</script>',
    '<b onmouseover="window._xssAttack=true;">Hover Me</b>',
    '"><svg/onload=window._xssAttack=true>',
  ];
  ```
- **Test Execution:**
  1. Render MapLibre marker with worker object containing `userName: maliciousNames[i]`.
  2. Inspect the rendered DOM node.
  3. Assert:
     ```typescript
     expect(window._xssAttack).toBeUndefined();
     expect(markerElement.querySelector('img')).toBeNull();
     expect(markerElement.textContent).toContain(maliciousNames[i]);
     ```
- **Pass Criteria:** Zero script execution; plain text escaping verified across all four payloads.

---

### 2.2 Test Case MAP-UX-001: Stale Closure Elimination in Marker Clicks
- **Objective:** Verify that clicking a live worker marker opens the *latest* telemetry state rather than the state when the marker was initially mounted.
- **Test Execution:**
  1. Mount marker for `userId: 'usr_01'` with initial position: `lat: 28.61, speed: 0 km/h, recordedAt: 10:00 AM`.
  2. Simulate SSE `location_update` event: `lat: 28.75, speed: 45 km/h, recordedAt: 10:15 AM`.
  3. Simulate supervisor clicking the marker element: `markerElement.click()`.
  4. Assert:
     ```typescript
     expect(selectedWorker.recordedAt).toBe('10:15 AM');
     expect(selectedWorker.speed).toBe(45);
     expect(selectedWorker.latitude).toBe(28.75);
     ```
- **Pass Criteria:** `selectedWorker` matches the latest received SSE payload.

---

### 2.3 Test Case MAP-UX-002: Viewport Bounds Preservation During Pan/Zoom
- **Objective:** Verify that background SSE telemetry updates do not violently reset or snap the supervisor's manual map pan/zoom.
- **Test Execution:**
  1. Initial map load executes `currentMap.fitBounds(bounds)` once to frame the fleet.
  2. Simulate user dragging the map: `map.setCenter([77.30, 28.80])` and `map.setZoom(16)`.
  3. Emit 5 consecutive worker telemetry updates over SSE.
  4. Assert:
     ```typescript
     expect(map.getCenter().lng).toBeCloseTo(77.30, 2);
     expect(map.getZoom()).toBe(16);
     ```
- **Pass Criteria:** Map center and zoom remain undisturbed during background telemetry streaming.

---

## 3. Suite 2: Mobile Network Handover & Offline Queue Drainage

### 3.1 Test Case NET-001: Wi-Fi to 4G Cellular Handover Drainage
- **Test Environment:** Physical OnePlus 12R connected via ADB (`5abd6fc0`).
- **Prerequisites:** Device connected to local Wi-Fi with mobile 4G data enabled.
- **Execution Steps:**
  1. Populate 3 completed visit mutations in local Drift SQLite outbox:
     ```bash
     adb shell am start -n com.oprino.app/.MainActivity
     ```
  2. Initiate outbox sync runner while immediately cutting Wi-Fi:
     ```bash
     adb shell svc wifi disable
     ```
  3. Observe mobile client logcat:
     ```bash
     adb logcat -s OprinoSync:V Dio:V
     ```
  4. Verify:
     - In-flight request cancels cleanly within the 10-second `connectTimeout`.
     - Drift SQLite keeps mutations in `PENDING` status without data loss.
     - Device automatically routes subsequent retry over mobile cellular interface (`rmnet_data0`).
     - Fastify API returns `HTTP 200` with `appliedCount: 3`.
- **Pass Criteria:** Zero duplicate records created; outbox drained to `SYNCED` within 15 seconds.

---

## 4. Suite 3: Real Android GPS Power Consumption Benchmark

### 4.1 Test Case PWR-001: 8-Hour Empirical Battery Drain on OnePlus 12R
- **Objective:** Measure real physical battery consumption and CPU wakelocks rather than relying on configuration estimates.
- **Test Script:** `apps/mobile/scripts/benchmark_battery.sh`
- **Execution Steps:**
  1. Charge OnePlus 12R to 100%; connect via wireless ADB.
  2. Reset batterystats:
     ```bash
     adb shell dumpsys batterystats --reset
     ```
  3. Trigger mobile Punch-In; verify foreground service starts:
     ```bash
     adb shell dumpsys activity services com.oprino.app
     ```
  4. Turn off screen (`adb shell input keyevent 26`); lock device for 4 hours stationary.
  5. Move device for 2 hours (simulated transit via hardware GPS).
  6. Trigger mobile Punch-Out; verify foreground service terminates immediately.
  7. Dump battery statistics:
     ```bash
     adb shell dumpsys batterystats --charged com.oprino.app > battery_audit.txt
     ```
- **Evaluation Metrics:**
  - `UID ... Total cpu time`: Must be < 15 minutes over 8 hours.
  - `Wake lock total duration`: Must drop to 0 after punch-out.
  - `Battery percentage consumed`: Must be **< 8.0% of 5500 mAh capacity**.

---

## 5. Suite 4: Isolated Cloud Staging Storage Suite

### 5.1 Test Case CLOUD-001: Safe Staging Execution of the 4 Skipped R2 Tests
- **Safety Invariant:** Never run live tests against `oprino-production-media`. Tests must execute exclusively against an isolated staging bucket (`oprino-staging-media`) using dedicated non-production credentials.
- **Prerequisites:**
  ```bash
  export RUN_LIVE_R2_TESTS=true
  export S3_BUCKET_NAME=oprino-staging-media
  export S3_ENDPOINT=https://0cad926d06114606182aafd3cc19542b.r2.cloudflarestorage.com
  export S3_ACCESS_KEY_ID=${STAGING_R2_KEY}
  export S3_SECRET_ACCESS_KEY=${STAGING_R2_SECRET}
  ```
- **Execution:**
  ```bash
  pnpm --filter @oprino/api test -- src/cloud-storage.integration.test.ts
  ```
- **Verification:**
  1. `[LIVE R2] Uploads valid synthetic JPEG binary to staging R2 bucket using signed PUT URL` passes.
  2. `[LIVE R2] Verifies physical object existence and byte fidelity via headObject` passes.
  3. `[LIVE R2] Generates presigned download URL and verifies byte-for-byte fidelity` passes.
  4. `[LIVE R2] Safely deletes test object and verifies headObject returns exists: false` passes.
  5. `after()` hook confirms all `createdKeys` are deleted, leaving zero orphaned objects in the staging bucket.

---
*End of Document 23 — Security and Reliability Regression Plan*
