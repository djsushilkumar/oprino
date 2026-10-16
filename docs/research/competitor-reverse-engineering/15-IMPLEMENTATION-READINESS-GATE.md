# 15 — Implementation Readiness Gate & Production Roadmap

**Author:** Senior SaaS Product Architect & Technical Business Analyst  
**Context:** Final Pre-Implementation Gate Review & Operational Sign-off  
**Scope:** Oprino V1 Field Operations SaaS  
**Date of Audit:** October 2026  
**Status:** COMPLETE — FORMAL GO WITH PREREQUISITE PROTOCOLS  

---

## 1. Readiness Gate Audit Matrix

To transition from the research and reverse-engineering phase into active sprint implementation, Oprino must satisfy four architectural gates:

| Readiness Gate | Criteria & Invariants | Audit Result | Status | Notes / Conditions |
| :--- | :--- | :---: | :---: | :--- |
| **Gate 1: Product Boundaries** | Strict duty-hours tracking only; peer visibility OFF; 30-day GPS retention; no CRM/ERP/accounting bloat. | PASS | **SATISFIED** | Scope is frozen and validated against competitor audit. |
| **Gate 2: Architecture Integrity** | 5-Stage multi-tenant RLS isolation; GPS integrity pipeline; presigned R2 direct upload; offline Drift SQLite outbox. | PASS | **SATISFIED** | Defense-in-depth validated in Doc 14. |
| **Gate 3: Environment & Testbed** | Live Render API (`/health/ready`), Neon PostgreSQL (`0000`–`0005`), Cloudflare R2, and connected physical OnePlus testbed. | PASS | **SATISFIED** | All cloud services verified operational and healthy. |
| **Gate 4: Empirical Test Harness** | Concrete test protocols for offline airplane-mode stress testing, battery profiling, and GPS spoofing defense. | PASS | **SATISFIED (Conditional)**| Test protocols defined below must run in Sprint 1. |

---

## 2. Empirical Verification Test Protocols for Sprint 1

Before declaring feature benchmarks verified in production, the following empirical test protocols must be executed on the physical OnePlus testbed:

### Protocol A: Offline Airplane-Mode Stress Test
1. **Setup:** Provision 5 scheduled field visits on mobile device with local Drift SQLite cache populated.
2. **Execution:**
   - Engage Airplane Mode (cellular and Wi-Fi disabled).
   - Execute Stop 1: Check in, complete 5-item checklist, capture 2 photos, record customer signature, submit completion.
   - Execute Stop 2: Check in, complete checklist, capture photo, submit completion.
   - Force-kill the mobile application process (`adb shell am force-stop com.oprino.app`).
   - Launch app while still in Airplane Mode; verify local database displays Stop 1 & Stop 2 as `COMPLETED (Queued for Sync)`.
   - Disable Airplane Mode.
3. **Pass Criteria:**
   - WorkManager background service flushes outbox within 60 seconds of network restoration.
   - Direct R2 PUT uploads both photos without routing binary through API gateway.
   - Fastify API returns HTTP 200 with zero duplicate records created.

---

### Protocol B: Standardized 8-Hour Battery Profiling Harness
1. **Setup:** OnePlus 12R (`CPH2707IN`, 5500 mAh battery), screen brightness fixed at 50%, active 4G LTE SIM.
2. **Execution:**
   - 09:00: Punch in with selfie attendance; start continuous Fused Location tracking.
   - Movement profile: 2 hours in-transit (moving at 20–60 km/h), 4 hours stationary (inside office geofence), 2 hours walking.
   - Telemetry upload: Batched every 60s when moving, 300s when stationary.
   - 17:00: Punch out; terminate foreground service.
3. **Pass Criteria:**
   - Total battery consumption attributable to Oprino (`adb shell dumpsys batterystats`) must remain **under 8.0% of total battery capacity**.
   - Zero background location queries executed between 17:01 and 08:59 (verifying zero off-duty drain).

---

### Protocol C: GPS Spoofing & Mock Provider Defense Test
1. **Setup:** Enable Android Developer Options on test device; configure a mock location provider app (e.g. Fake GPS Location).
2. **Execution:**
   - Set mock location coordinate to target client geofence (within 20 meters).
   - Attempt to click "Arrive / Start Visit" in Oprino mobile app.
3. **Pass Criteria:**
   - Mobile app detects `location.isMock() == true` or `isFromMockProvider() == true`.
   - Check-in button is disabled; displays error modal: `"Mock location detected. Please disable mock providers in settings."`
   - Zero coordinates submitted to API gateway.

---

## 3. Updated Implementation Roadmap & Backlog Priorities

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CORRECTED SPRINT ALLOCATION                          │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 1 (Foundation, Security & Protocol Validation):                 │
│   • [P0-01] Fastify Shift Duty Guard & Redis Active Key (API Gateway)  │
│   • [P0-02] PostgreSQL Row-Level Security (RLS) on Tasks & Attendance  │
│   • [P0-03] Direct Cloudflare R2 Presigned Upload & WebP Compressor    │
│   • Run Empirical Protocol A (Offline), B (Battery), C (Mock Location) │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 2–3 (V1 Core Operational Loop):                                 │
│   • [P1-01] Mobile Attendance Punch (Selfie Oval + Accuracy Gate)      │
│   • [P1-02] Field Visit Stop Card + Checklist + Signature Pad          │
│   • [P1-03] Drift SQLite Mutation Outbox & Background Sync Runner      │
│   • [P1-04] Responsive Manager Live Fleet & Dispatch Dashboard         │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 4 (Operational Scaling & Maintenance):                          │
│   • [P2-01] Automated 30-Day GPS Telemetry Pruning Worker              │
│   • [P2-02] Route History Playback & Odometer Distance Calculation     │
│   • [P2-03] WhatsApp Business Notification Webhooks                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Production Architecture Risks & Mitigation Controls

| Production Risk | Severity | Root Cause | Mandatory Mitigation Control |
| :--- | :---: | :--- | :--- |
| **Shift-End Photo Upload Concurrency** | High | Hundreds of workers submitting visit photos simultaneously between 16:30 and 17:30. | Direct Cloudflare R2 presigned uploads bypass Fastify API; zero binary streaming touches Node.js memory. |
| **OEM Background App Killers** | High | Aggressive battery managers on Xiaomi, Oppo, and Vivo killing tracking services. | Use Android `FOREGROUND_SERVICE_LOCATION` with a persistent notification; configure battery optimization exemption prompt. |
| **Database Disk Bloat from GPS Points** | Medium | Continuous breadcrumb telemetry accumulating millions of rows over 6+ months. | Partition `location_breadcrumbs` by month; automated daily BullMQ worker drops partitions older than 30 days. |
| **Stale Webhook / Idempotency Duplication** | Medium | Retrying offline sync batches on poor 3G connections. | Transaction-scoped idempotency table in PostgreSQL with Redis deduplication filter. |

---

## 5. Formal GO / NO-GO Recommendation

### **FINAL VERDICT: FORMAL "GO" FOR SPRINT 1 IMPLEMENTATION**

#### Justification:
1. **Market Opportunity is Verified:** The competitive gap is legitimate. TaskOPad is deficient in field telemetry and offline operations; Unolo is weighed down by heavy sales ERP bloat and surveillance friction. Oprino’s focused, privacy-first field operations platform solves an acute SMB need.
2. **Infrastructure is Live and Validated:** Render API, Neon PostgreSQL, Cloudflare R2 storage, and physical device testbeds are healthy, verified, and ready.
3. **Architecture is Hardened:** PostGIS spatial validation has been properly decoupled from GPS coordinate authentication, and direct presigned media uploads eliminate server memory bottlenecks.
4. **Scope Boundaries are Intact:** Strict duty-hours tracking, peer location opacity, 30-day GPS retention, and zero CRM/accounting expansion remain locked.

**Conditions of Sign-off:**  
Active coding may proceed immediately on Sprint 1 foundation items (`P0-01`, `P0-02`, `P0-03`), provided that Empirical Test Protocols A, B, and C are executed and documented on the physical OnePlus testbed during Sprint 1.

---
*End of Document 15 — Implementation Readiness Gate*
