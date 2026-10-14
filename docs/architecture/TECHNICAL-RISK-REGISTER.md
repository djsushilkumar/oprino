# Oprino Technical Risk Register & Mitigation Strategy

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Controlling Documents:** 
- Phase 00 Approved PRD ([`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md))
- [`docs/architecture/SECURITY-ARCHITECTURE.md`](./SECURITY-ARCHITECTURE.md)
- [`docs/architecture/FAILURE-MODES.md`](./FAILURE-MODES.md)

---

## 1. Overview & Risk Assessment Methodology

The Oprino Technical Risk Register tracks architectural, operational, and compliance risks across the platform lifecycle. Risks are evaluated based on:
- **Probability (P):** Low (1), Medium (2), High (3)
- **Impact / Severity (S):** Low (1), Medium (2), High (3), Critical (4)
- **Risk Score:** Probability × Severity (Scale: 1 to 12)
  - **Critical Risk (Score 9–12):** Requires architectural redundancy and automated safeguards.
  - **High Risk (Score 6–8):** Requires active mitigation and automated monitoring.
  - **Medium Risk (Score 3–5):** Standard mitigation and code review guards.
  - **Low Risk (Score 1–2):** Periodic review.

---

## 2. Technical Risk Matrix

| Risk ID | Risk Description | Category | Prob (1-3) | Sev (1-4) | Score | Mitigation Architecture | Contingency Plan | Status |
|---|---|:---:|:---:|:---:|:---:|---|---|:---:|
| **TR-01** | **OEM Android Battery Killers:** Budget Chinese OEM devices (Xiaomi/MIUI, Oppo/ColorOS, Vivo) aggressively terminate the background location foreground service. | Mobile | 3 | 3 | **9 (Critical)** | Use Transistor Software background geolocation plugin with sticky native foreground service, persistent notification channel, and OEM battery-optimization white-listing screen. | Provide in-app device-specific battery setup guides (`dontkillmyapp.com` patterns); alarm manager auto-restart. | **Mitigated** |
| **TR-02** | **App Store Background Location Rejection:** Apple App Store or Google Play rejects the app for requesting background location permissions. | Compliance | 2 | 4 | **8 (High)** | Explicit in-app prominent disclosure dialog before asking permission; clear demonstration video showing duty-hours field dispatch utility; persistent ongoing notification; strict zero off-duty tracking policy. | Appeal with formal B2B enterprise PRD documentation; support foreground-only tracking fallback if required during review. | **Mitigated** |
| **TR-03** | **Cross-Tenant Data Leakage:** Developer writes custom SQL query omitting `workspace_id` filter, exposing tenant data. | Security | 2 | 4 | **8 (High)** | 1. Mandatory application repository layer injects tenant filter.<br>2. PostgreSQL Row-Level Security (RLS) acts as database-level fallback.<br>3. Automated multi-tenant negative integration tests in CI. | Immediate incident response, session invalidation, automated security patch deployment. | **Mitigated** |
| **TR-04** | **Off-Duty Tracking Violation:** Location coordinates recorded while employee is off-duty, causing labor violation. | Privacy | 1 | 4 | **4 (Medium)** | 3-Layer Defense: Native service stop, local SQLite queue purging of post-duty points, and server-side zero-trust active shift check before DB insert. | Automated auto-punchout engine; immediate data drop if points arrive off-duty. | **Mitigated** |
| **TR-05** | **GPS Telemetry Database Storage Explosion:** Hundreds of active workers generate millions of breadcrumbs, causing database IOPS exhaustion. | Scalability | 3 | 2 | **6 (High)** | Range-partitioning by day (`telemetry.employee_locations`) + Automated 30-day partition drop via BullMQ + Pre-purge mileage aggregation. | Dynamically increase partition drop frequency to 7 or 14 days if storage thresholds reach 80%. | **Mitigated** |
| **TR-06** | **Live Map Web UI Degradation:** Web dashboard lags when rendering 150+ moving technician markers and active task routes simultaneously. | Frontend | 2 | 3 | **6 (High)** | Use WebGL vector maps (MapLibre GL / Mapbox) with GeoJSON source clustering and debounced marker position interpolation (requestAnimationFrame). | Implement viewport marker culling (only render pins within current bounding box). | **Mitigated** |
| **TR-07** | **Offline Sync Mutation Conflict Storm:** Technicians offline for 6 hours submit 500 queued operations, creating state machine conflicts with online manager changes. | Data Sync | 2 | 3 | **6 (High)** | Append-only outbox design with deterministic resolution matrix ([`SYNC-CONFLICT-MATRIX.md`](./SYNC-CONFLICT-MATRIX.md)); client-generated UUIDs; idempotent server replay. | Batch processing with partial success responses (`MERGED_PARTIAL`, `APPLIED_WITH_AUDIT`). | **Mitigated** |
| **TR-08** | **High-Memory Consumption from Headless PDF Generation:** Concurrent multi-page report PDF rendering saturates worker container RAM. | Infrastructure | 2 | 3 | **6 (High)** | Concurrency limit of 2 simultaneous Puppeteer render jobs in dedicated worker container; streaming CSV preferred for raw data; memory limits with auto-restart. | Queue throttling; fall back to pre-rendered HTML view. | **Mitigated** |
| **TR-09** | **Mobile Offline Database Corruption:** Unclean app shutdown or full storage corrupts client SQLite database file. | Mobile | 1 | 3 | **3 (Medium)** | Use Drift + SQLite (`drift` with `package:sqlite3` / Bundled Native SQLite) with WAL mode (Write-Ahead Logging); periodic integrity checks (`PRAGMA integrity_check`); isolate-safe transaction queues (`NativeDatabase.createInBackground`). | Automatic database reset and resync from server state if file is unrecoverable. | **Mitigated** |
| **TR-10** | **Emergency SOS Push Delivery Delay:** Cellular latency or APNs/FCM delays prevent immediate manager alert. | Safety | 2 | 3 | **6 (High)** | Multi-channel redundancy: High-priority FCM/APNs push + Real-time SSE live map flasher + Immediate transactional SMS/Email fallback. | Manager dashboard sounds continuous audible alarm when SOS event received via SSE. | **Mitigated** |

---

## 3. Risk Monitoring & Review Cadence

- **Weekly Architecture Review:** Review Sentry crash logs, BullMQ queue retry statistics, and API p95 latencies.
- **Pre-Release Checklists:** Verify all mobile background services pass battery and permission validation on physical test devices (Xiaomi, Samsung, iPhone).
- **Security Audits:** Automated dependency scans and secret leak detection executed on every commit.

---

## 4. Compliance with Phase 00 Approved Scope

- Ensures proactive mitigation of critical field workforce failure modes.
- Guarantees complete alignment with privacy mandates and sustainable unit economics.
