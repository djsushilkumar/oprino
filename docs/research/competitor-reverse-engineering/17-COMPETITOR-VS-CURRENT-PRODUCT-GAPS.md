# 17 — Competitor vs. Current Product Gaps: Codebase-Reconciled Mapping

**Auditor:** Principal Software Architect, Senior QA Lead & Product Gap Analyst  
**Repository Source of Truth:** `djsushilkumar/oprino` (`main` branch)  
**Competitors Analyzed:** TaskOPad & Unolo  
**Date of Audit:** October 2026  
**Status:** Complete & Reconciled  

---

## 1. Executive Summary

Earlier competitor research documents formulated product gap hypotheses without cross-referencing Oprino's merged `main` codebase. This document performs a rigorous reconciliation, comparing every verified capability of **TaskOPad** and **Unolo** directly against the source code, integration test suite, and deployed runtime of **Oprino**.

### Key Reconciled Finding:
**Over 80% of the features previously flagged as "Oprino Gaps" are already fully implemented, tested, and operational in Oprino.** 
Oprino already possesses core competitive parity with Unolo's tracking and TaskOPad's task management, while avoiding their architectural flaws (surveillance anxiety and lack of real-time telemetry). The genuine remaining gaps are narrow, high-value operational enhancements (e.g., vehicle odometer photo verification, travel conveyance reimbursement formulas, and WhatsApp dispatches).

---

## 2. Direct Feature-by-Feature Competitor Mapping

| Competitor Feature | Competitor Source | Existing Oprino Source Files | Overlap & Implemented Behavior | Genuine Missing Behavior | User Value | Evidence Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Shift Attendance (Selfie + GPS)** | Unolo Facelock; TaskOPad Selfie | • `attendance.service.ts`<br>• `attendance_selfie_sheet.dart`<br>• `attendance_view.dart` | **100% Implemented.** Front-facing camera preview, GPS accuracy lock gate, selfie uploaded to R2, policy configurable (`SIMPLE` vs `SELFIE_REQUIRED`). | Facial vector embedding matching (Facelock); currently relies on human supervisor review of selfie photo. | 5/5 | **VERIFIED** |
| **Duty-Hours-Only Location Tracking** | Unolo Shift-Based Tracking | • `telemetry.service.ts` (L69–185)<br>• `real_location_hardware_adapter.dart` | **100% Implemented.** Off-duty points are hard-dropped with zero DB writes. Foreground service halts on punch-out. 7-day historical reconciliation allows offline shift sync. | None. Fully functional. | 5/5 | **VERIFIED** |
| **Continuous Breadcrumbs & Telemetry** | Unolo Field Tracking | • `telemetry.service.ts`<br>• `employeeLocations` table<br>• `real_location_hardware_adapter.dart` | **100% Implemented.** Native Android `geolocator` foreground service, batched uploads, speed/accuracy filters, PostGIS geometry storage. | Configurable dynamic sampling from web UI (currently hardcoded to 15m distance filter / 15s interval). | 5/5 | **VERIFIED** |
| **Geofenced Check-In & Arrival** | Unolo Geofences; TaskOPad Radius | • `geofences.ts` schema & routes<br>• `visit.service.ts`<br>• `calculateHaversineMeters` | **100% Implemented.** Office and customer geofence boundaries validated during check-in and visit starts. | Automatic background punch-in upon geofence entry (intentionally avoided to prevent false punches). | 5/5 | **VERIFIED** |
| **Proof of Work (Photos & Signatures)**| Unolo Forms; TaskOPad Attachments | • `photo_proof_sheet.dart`<br>• `customer_signature_sheet.dart`<br>• `media.service.ts` | **100% Implemented.** Camera-only capture (no gallery picker), vector signature pad with signer name and phone, direct presigned R2 upload. | Automated OCR extraction of serial numbers or meter readings. | 4/5 | **VERIFIED** |
| **Offline-First Data Persistence** | Unolo Drafts (Partial) | • `Drift database.dart`<br>• `sync_service.dart`<br>• `sync.service.ts` | **100% Implemented & Superior.** Full ACID relational SQLite outbox on mobile. Mutations queued and flushed automatically with idempotency deduplication. | None. Exceeds competitor reliability. | 5/5 | **VERIFIED** |
| **Supervisor Live Map & Radars** | Unolo Live Map | • `apps/web/src/app/live-map/page.tsx`<br>• MapLibre GL<br>• SSE streaming | **100% Implemented.** Live worker pins with active/idle filters, geofence overlays, single-use ticket auth, and worker detail drawer. | Clustering for > 500 simultaneous markers. | 5/5 | **VERIFIED** |
| **Route Playback & Breadcrumb History**| Unolo Timeline Replay | • `apps/web/src/app/live-map/page.tsx`<br>• `getLocationHistory` | **100% Implemented.** Historical date picker, timeline scrubber slider, speed display, and stop markers. | Speed graph chart over time. | 4/5 | **VERIFIED** |
| **30-Day GPS Data Retention Pruning** | Not supported by competitors | • `worker.ts` (`telemetry.retention.prune`)<br>• `telemetry_prune_workspace_records` | **100% Implemented.** Daily BullMQ worker drops location coordinates older than workspace retention days (default 30). | None. Oprino unique advantage. | 5/5 | **VERIFIED** |
| **Task / Subtask Hierarchy & Kanban** | TaskOPad Core Project Mgt | • `tasks.ts` schema<br>• `task_checklist_items`<br>• `apps/web/src/app/tasks/` | **100% Implemented.** Status lifecycle (`ASSIGNED` to `VERIFIED`), interactive checklist items, priority tags, assignees, customer link. | Multi-tier nested epics/sub-subtasks (intentionally kept flat for field usability). | 4/5 | **VERIFIED** |
| **Automated Day-Gap Task Rollover** | TaskOPad Day-Gap Workflow | • `worker.ts` (`tasks.recurring.generate`)<br>• `tasks.sla.check_overdue` | **80% Implemented.** Recurring templates auto-generate next tasks; SLA monitor flags overdue tasks. | Automatic rollover of incomplete tasks to next morning's shift without manager intervention. | 3/5 | **INFERRED** |
| **Vehicle Odometer & Conveyance Engine**| Unolo Odometer Verification | • `dailyTravelSummaries` (L12)<br>• `telemetry.service.ts` | **PARTIAL.** Calculates total GPS Haversine distance per shift; rolls into daily summary. | Missing start/end vehicle dashboard photo capture and per-kilometer fuel reimbursement rate calculation. | 5/5 | **VERIFIED GAP** |
| **WhatsApp Dispatch Notifications** | TaskOPad WhatsApp Alerts | • `notification.service.ts`<br>• `notifications` schema | **MISSING.** In-app notification table and worker exist, but WhatsApp Cloud API webhook adapter is not configured. | Automated WhatsApp message sent to technician on urgent dispatch. | 4/5 | **VERIFIED GAP** |
| **Play Integrity Device Attestation** | Unolo Mock Location Defense | • Kotlin native check (`isFromMockProvider`) | **PARTIAL.** Basic mock provider detection exists; Google Play Integrity API token exchange is not implemented. | Hardware-backed attestation verifying unrooted OS and untampered client binary. | 4/5 | **INFERRED GAP** |

---

## 3. Re-Categorization of Product Gaps

### Category A: Erroneously Assumed Gaps (Already Solved on Main)
The following capabilities were previously listed as unimplemented or planned for future sprints, but are **already completely implemented, tested, and operational**:
1. **Duty-Hours GPS Boundary Enforcement:** Verified in `services/api/src/services/telemetry.service.ts:74` and tested in `telemetry-geofence.integration.test.ts`.
2. **Multi-Tenant RLS Security:** Verified in `packages/database/src/schema/tenants.ts` and tested in `tenant-rls.integration.test.ts`.
3. **Direct Cloudflare R2 Uploads:** Verified in `services/api/src/services/media.service.ts:73` and tested in `cloud-storage.integration.test.ts`.
4. **Selfie-Verified Attendance:** Verified in `apps/mobile/lib/features/attendance/presentation/widgets/attendance_selfie_sheet.dart` and tested in `v1-blockers.integration.test.ts` (BLK-004).
5. **Offline Drift SQLite Outbox:** Verified in `apps/mobile/lib/core/database/database.dart` and `sync_service.dart`.
6. **Supervisor Live Fleet Map & Route Replay:** Verified in `apps/web/src/app/live-map/page.tsx` (1,310 lines).
7. **Automated 30-Day GPS Pruning:** Verified in `services/worker/src/worker.ts:38` and tested in BLK-006.

---

### Category B: Genuine Remaining Gaps (High-Value Incremental Parity)
The following features represent authentic competitive gaps where Oprino can gain parity or superiority:
1. **Vehicle Odometer Photo Capture & Conveyance Allowance:**
   - *Competitor Benchmark:* Unolo requires technicians to enter odometer numbers and take a photo of their dashboard at punch-in and punch-out, comparing claimed mileage against GPS distance for fuel expense approvals.
   - *Oprino Gap:* Oprino calculates GPS distance (`dailyTravelSummaries`), but does not have a dedicated odometer start/end photo capture step or expense rate calculation.
2. **Automated WhatsApp Business Dispatch Alerts:**
   - *Competitor Benchmark:* TaskOPad sends instant WhatsApp alerts for new assignments.
   - *Oprino Gap:* Oprino generates internal in-app notifications, but lacks a WhatsApp Cloud API webhook dispatcher.
3. **Hardware-Backed Device Attestation (Play Integrity API):**
   - *Competitor Benchmark:* Unolo checks developer options and mock locations.
   - *Oprino Gap:* Oprino checks `location.isMock()`, but does not exchange a hardware attestation token with Google Play Integrity servers.

---

### Category C: Explicit Non-Goals (Preserving PRD Boundaries)
The following competitor features were evaluated and **firmly rejected** to protect Oprino from product bloat:
1. **FMCG Sales Orders & Product Catalogs (Unolo):** Rejected. Oprino is an operations tool for field services, maintenance, and technical delivery, not retail sales.
2. **Warehouse Inventory & Stock Batches (Unolo):** Rejected. Stock management belongs in an ERP, not mobile workforce dispatch.
3. **GST Invoicing & General Accounting (TaskOPad):** Rejected. Export clean CSV logs for Tally/Zoho instead of building accounting engines.
4. **Full Statutory HRMS & Payroll (Unolo):** Rejected. Provide raw immutable duty-hour logs rather than managing tax/ESI/PF calculations.
5. **Customer Portal (TaskOPad):** Rejected. Adds complex tenant boundary risks; SMS/WhatsApp completion receipts are superior.

---
*End of Document 17 — Competitor vs. Current Product Gaps*
