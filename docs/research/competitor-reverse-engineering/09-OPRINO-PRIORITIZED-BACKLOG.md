# 09 — Oprino Prioritized Implementation Backlog (P0 – P3)

**Author:** Technical Business Analyst & SaaS Product Architect  
**Context:** Oprino Strategic Product Roadmap & Sprint Planning  
**Target:** V1 MVP & Scaled Operations  
**Date of Creation:** October 2026  
**Status:** Approved for Implementation Planning  

---

> [!WARNING]
> **Historical Archival Notice (Post-PR #7 Merge Audit):**  
> This document reflects early planning hypotheses developed prior to codebase reconciliation. The foundational P0 and P1 items listed below (Duty-Hours Guard, Multi-Tenant RLS, Presigned R2 Uploads, Selfie Attendance, Drift SQLite Outbox, Split-Pane Live Map, and 30-Day Pruning) are **already 100% implemented, verified, and merged on `main`**.  
> **Active Implementation Backlog:** Refer exclusively to [19-ZERO-DUPLICATE-IMPROVEMENT-BACKLOG.md](file:///d:/oprino/oprino/docs/research/competitor-reverse-engineering/19-ZERO-DUPLICATE-IMPROVEMENT-BACKLOG.md) for non-duplicate, verified incremental tasks.

---

## 1. Backlog Structure & Tiers

The backlog items are classified into four rigorous priority tiers:
- **P0 — Foundational Platform, Privacy & Security:** Absolute prerequisites for any field trial. Security, multi-tenant boundaries, duty-hours privacy invariants, and core database schemas.
- **P1 — Essential V1 Core Workflows:** The minimal cohesive loop required for a customer to replace spreadsheets or competitor apps (Punch In -> Task Dispatch -> Visit Check-In -> Proof of Work -> Punch Out -> Manager Approval).
- **P2 — Operational Enhancements & Efficiency:** Automation, geofence radius tuning, route history playback, battery optimizations, and batch CSV exports.
- **P3 — Future Differentiation:** Advanced fraud scoring, AI-driven photo quality checks, client signature verification, and multi-day dispatch route optimization.

---

## 2. Priority P0: Foundational Platform & Privacy Invariants

### [P0-01] Strict Duty-Hours Location Guard & API Gate
- **Feature Description:** Gateway-level validation that immediately rejects incoming GPS breadcrumbs if the employee is not currently in an active attendance session.
- **User Story:** *As a field employee, I want absolute confidence that my employer cannot track my location before punch-in or after punch-out, so that my personal privacy is guaranteed.*
- **Acceptance Criteria:**
  - Fastify middleware checks Redis key `active_duty:{workspaceId}:{userId}`.
  - If inactive, returns `HTTP 403 Forbidden` (`DUTY_NOT_ACTIVE`).
  - Zero database writes occur for rejected location telemetry.
  - Mobile app terminates foreground location service immediately upon punch-out.
- **Dependencies:** Attendance session state machine, Redis cache.
- **Estimated Complexity:** Medium (3 Story Points).
- **Implementation Risks:** Race condition if mobile device submits queued offline points recorded during shift after punch-out occurs. (Mitigation: validate timestamp of point against shift start/end interval).
- **Competitive Evidence:** Major employee dissatisfaction observed in Unolo reviews regarding invasive 24/7 background tracking.
- **Recommended Release Phase:** Phase 01 (V1 Core).

---

### [P0-02] 5-Stage Multi-Tenant Data Isolation with PostgreSQL RLS
- **Feature Description:** Comprehensive database-level tenant isolation enforcing workspace boundaries across all tables using PostgreSQL Row-Level Security.
- **User Story:** *As an enterprise business owner, I require mathematical certainty that another company on Oprino can never access my customer locations, employee telemetry, or proof-of-work records.*
- **Acceptance Criteria:**
  - Every transactional database client executes `SET LOCAL app.current_workspace_id = :id`.
  - RLS policies enabled on `tasks`, `attendance_sessions`, `client_locations`, `location_breadcrumbs`, and `visit_records`.
  - Automated integration test verifies cross-tenant read/write attempts are rejected with zero rows returned.
- **Dependencies:** Drizzle ORM schema, Neon/PostgreSQL pool manager.
- **Estimated Complexity:** High (5 Story Points).
- **Implementation Risks:** Connection poolers (e.g. PgBouncer) may leak session state if transaction mode is not strictly enforced.
- **Competitive Evidence:** Table stakes for B2B SaaS; TaskOPad and Unolo both isolate tenants at database/schema level.
- **Recommended Release Phase:** Phase 01 (V1 Core).

---

### [P0-03] Direct Cloudflare R2 Presigned Media Ingestion
- **Feature Description:** Client-side WebP compression and direct-to-storage presigned upload for all selfie attendance and proof-of-work photos.
- **User Story:** *As the platform operator, I want mobile media uploads to bypass our Fastify application servers completely, so that server RAM/CPU stays low and bandwidth egress costs are zero.*
- **Acceptance Criteria:**
  - API endpoint `POST /media/presign-upload` validates MIME type (`image/webp`, `image/jpeg`) and returns presigned S3/R2 PUT URL.
  - Mobile client compresses image locally (< 300KB WebP) and uploads directly to Cloudflare R2 (`oprino-production-media`).
  - Mobile client confirms upload with API by providing `media_key` and SHA-256 hash.
- **Dependencies:** Cloudflare R2 bucket credentials, AWS S3 SDK.
- **Estimated Complexity:** Medium (3 Story Points).
- **Implementation Risks:** Network failure midway through upload. Client must retry presigned PUT before committing visit mutation.
- **Competitive Evidence:** Competitor backend servers suffer from high memory consumption and timeout errors during peak photo submission hours.
- **Recommended Release Phase:** Phase 01 (V1 Core).

---

## 3. Priority P1: Essential V1 Workflows

### [P1-01] Selfie + Geofenced Attendance Punch
- **Feature Description:** Mobile attendance punch-in and punch-out with live camera face preview, pre-check GPS accuracy gate, and PostGIS geofence verification.
- **User Story:** *As a field manager, I want to verify that an employee is physically at their designated work base and is actually who they claim to be when clocking in.*
- **Acceptance Criteria:**
  - Camera preview enforces front-facing camera with oval face guide.
  - Punch-in button disabled until GPS accuracy is under 25 meters.
  - Server validates distance via `ST_DWithin` against assigned office/branch coordinate.
  - Offline punch-in supported with timestamp and stored in SQLite outbox.
- **Dependencies:** `attendance_sessions` table, Cloudflare R2 storage, mobile camera module.
- **Estimated Complexity:** High (5 Story Points).
- **Implementation Risks:** Poor lighting or low GPS accuracy in dense urban high-rises. (Mitigation: Provide screen auto-flash and fallback "Regularization Request" flow).
- **Competitive Evidence:** Unolo Facelock and TaskOPad Selfie Attendance are primary selling points for SMB managers.
- **Recommended Release Phase:** Phase 02 (V1 Core).

---

### [P1-02] Field Visit Check-In & Proof-of-Work Capture
- **Feature Description:** Stop-by-stop customer visit workflow featuring one-tap check-in, arrival geofence detection, interactive completion checklist, photo capture, and customer digital signature pad.
- **User Story:** *As a field service technician, I want to arrive at a client location, complete my maintenance checklist, capture photo proof, and get the client's signature quickly without navigating complex menus.*
- **Acceptance Criteria:**
  - Stop card shows client name, address, distance, and 1-tap call/navigate buttons.
  - Arrive/Check-in creates a `visit_record` with `IN_PROGRESS` status and arrival timestamp.
  - Proof of work requires mandatory camera photos (disallowing gallery uploads) and touch signature canvas.
  - Complete button updates status to `COMPLETED` and flushes record to server.
- **Dependencies:** `client_locations`, `tasks`, `visit_records` schemas, signature canvas library.
- **Estimated Complexity:** High (8 Story Points).
- **Implementation Risks:** Customer refuses to sign on technician's phone screen. (Mitigation: Optional OTP or "Customer Unavailable" exception reason).
- **Competitive Evidence:** Core operational workflow in both TaskOPad and Unolo.
- **Recommended Release Phase:** Phase 02 (V1 Core).

---

### [P1-03] Offline-First Drift SQLite Mutation Sync
- **Feature Description:** Client-side relational SQLite database with persistent outbox queue and background sync runner for flawless operation without cellular connectivity.
- **User Story:** *As a field worker in a basement or remote site, I want all my actions to save instantly without loading spinners or failure alerts, syncing automatically when connectivity returns.*
- **Acceptance Criteria:**
  - All local mutations assigned client UUID and monotonic sequence index.
  - Background WorkManager flushes pending outbox items upon network reconnection.
  - Server idempotency handler prevents duplicate state transitions or duplicate records.
- **Dependencies:** Drift SQLite / Room on mobile, Fastify idempotency middleware.
- **Estimated Complexity:** High (8 Story Points).
- **Implementation Risks:** Merge conflicts if manager edits task while worker completes it offline. (Rule: Worker completion always wins).
- **Competitive Evidence:** TaskOPad fails completely offline; Unolo has partial offline drafts with high sync failure rates.
- **Recommended Release Phase:** Phase 02 (V1 Core).

---

### [P1-04] Responsive Manager Live Fleet & Dispatch Dashboard
- **Feature Description:** Real-time web dashboard split-pane showing active field personnel pins on Mapbox/Leaflet, duty status badges, and pending proof-of-work approval cards.
- **User Story:** *As an operations manager, I want to see which technicians are currently on duty, where they are, and immediately review submitted visit photos so I can approve customer jobs.*
- **Acceptance Criteria:**
  - Map displays live pins of on-duty workers with directional heading.
  - Telemetry updates streamed via Server-Sent Events (SSE) or 15s polling without page reload.
  - Clicking a worker shows their route timeline for today and current visit.
  - PoW drawer allows 1-click photo inspection, approve, or reject with comment.
- **Dependencies:** Next.js 14 web app, Leaflet/Mapbox GL JS, SSE API endpoint.
- **Estimated Complexity:** High (8 Story Points).
- **Implementation Risks:** Map performance lag when rendering > 100 simultaneous moving markers. (Mitigation: Marker clustering via Leaflet.markercluster).
- **Competitive Evidence:** Essential operational hub for Unolo and TaskOPad supervisors.
- **Recommended Release Phase:** Phase 03 (V1 Core).

---

## 4. Priority P2: Operational Enhancements

### [P2-01] Automated 30-Day GPS Telemetry Pruning Worker
- **Feature Description:** Scheduled background worker that permanently drops raw location breadcrumbs older than 30 days while retaining attendance, visit, and mileage aggregates.
- **User Story:** *As a platform administrator, I want old GPS breadcrumbs automatically deleted to keep NVMe storage lean and ensure compliance with our 30-day privacy retention promise.*
- **Acceptance Criteria:**
  - Scheduled pg_cron or BullMQ job runs daily at 03:00 UTC.
  - Deletes all records in `location_breadcrumbs` where `recorded_at < NOW() - INTERVAL '30 days'`.
  - Aggregates (total distance, start/end time, visit duration) remain intact on `attendance_sessions`.
- **Dependencies:** BullMQ worker, PostgreSQL partition table.
- **Estimated Complexity:** Low (2 Story Points).
- **Implementation Risks:** Heavy lock contention during bulk DELETE. (Mitigation: Use partition dropping or batch chunked deletes).
- **Competitive Evidence:** Differentiator; competitors hoard GPS coordinates indefinitely.
- **Recommended Release Phase:** Phase 04.

---

### [P2-02] Route History Playback & Odometer Mileage Calculation
- **Feature Description:** Interactive timeline slider on web dashboard that replays a technician's GPS trajectory over their shift, showing travel stops, speeds, and total distance.
- **User Story:** *As a fleet supervisor, I want to review the exact route taken by a driver and verify their claimed travel distance for fuel reimbursement.*
- **Acceptance Criteria:**
  - Timeline scrubber allows forward/backward scrubbing through the employee's shift.
  - Calculates total distance using PostGIS `ST_Length(ST_MakeLine(coordinate ORDER BY recorded_at)::geography)`.
  - Flags excessive idle stops (> 30 minutes outside client geofences).
- **Dependencies:** PostGIS spatial queries, Web map canvas.
- **Estimated Complexity:** Medium (5 Story Points).
- **Implementation Risks:** GPS jitter causing inflated mileage calculation. (Mitigation: Kalman filtering and speed threshold filtering < 2 km/h).
- **Competitive Evidence:** High-demand capability in Unolo ("Conveyance Tracking").
- **Recommended Release Phase:** Phase 04.

---

### [P2-03] WhatsApp Business Notification Webhooks
- **Feature Description:** Instant automated dispatch notifications and visit reminders sent to technicians and clients via official WhatsApp Business API.
- **User Story:** *As a field technician, I want to receive new urgent task dispatches via WhatsApp so I don't miss assignments when my phone is in my pocket.*
- **Acceptance Criteria:**
  - BullMQ notification queue triggers WhatsApp template message on new task creation.
  - Message includes task title, client address, and deep-link into Oprino mobile app.
- **Dependencies:** WhatsApp Cloud API / Twilio gateway, BullMQ worker.
- **Estimated Complexity:** Medium (3 Story Points).
- **Implementation Risks:** WhatsApp per-message conversation costs. (Mitigation: Configurable per-tenant; default to free push notifications).
- **Competitive Evidence:** Heavily marketed feature by TaskOPad in the Indian SMB market.
- **Recommended Release Phase:** Phase 04.

---

## 5. Priority P3: Future Differentiation

### [P3-01] Automated Velocity / Teleportation Fraud Anomaly Detection
- **Feature Description:** Real-time heuristic engine that flags impossible location shifts (e.g. moving 50 km in 5 minutes) or mock location providers.
- **User Story:** *As an enterprise manager, I want automated alerts when an employee uses fake GPS apps or records fraudulent check-ins.*
- **Acceptance Criteria:**
  - Heuristic calculates speed between consecutive breadcrumbs; speeds > 120 km/h flag `FRAUD_ANOMALY`.
  - Android `location.isFromMockProvider()` natively triggers immediate manager notification.
- **Dependencies:** BullMQ ingestion pipeline.
- **Estimated Complexity:** Medium (5 Story Points).
- **Implementation Risks:** False positives from GPS multi-path reflection in tunnels or dense high-rises.
- **Recommended Release Phase:** Phase 05.

---

### [P3-02] Offline Speech-to-Text Voice Visit Notes
- **Feature Description:** In-app voice recording transcribed directly to visit notes, enabling technicians with dirty or gloved hands to dictate reports.
- **User Story:** *As an HVAC or automotive technician, I want to speak my inspection notes out loud rather than typing on a small keyboard.*
- **Acceptance Criteria:**
  - Native microphone button records voice memo; transcribes to text via on-device speech engine or Whisper API.
- **Dependencies:** Mobile audio recording module.
- **Estimated Complexity:** High (5 Story Points).
- **Implementation Risks:** Background ambient noise in industrial plants degrading transcription accuracy.
- **Recommended Release Phase:** Phase 05.

---

## 6. Backlog Summary & Milestone Allocation

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IMPLEMENTATION ROADMAP MILESTONES                    │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 1 (Sprint 1–2): FOUNDATION & COMPLIANCE                      │
│   • P0-01: Strict Duty-Hours Location Guard                            │
│   • P0-02: 5-Stage Multi-Tenant Isolation with PostgreSQL RLS         │
│   • P0-03: Direct Cloudflare R2 Presigned Media Ingestion              │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 2 (Sprint 3–5): V1 CORE FIELD LOOP                           │
│   • P1-01: Selfie + Geofenced Attendance Punch                         │
│   • P1-02: Field Visit Check-In & Proof-of-Work Capture                │
│   • P1-03: Offline-First Drift SQLite Mutation Sync                    │
│   • P1-04: Responsive Manager Live Fleet & Dispatch Dashboard          │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 3 (Sprint 6–7): OPERATIONAL ENHANCEMENTS                     │
│   • P2-01: Automated 30-Day GPS Telemetry Pruning Worker               │
│   • P2-02: Route History Playback & Odometer Calculation               │
│   • P2-03: WhatsApp Business Notification Webhooks                     │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 4 (Sprint 8+): ADVANCED DIFFERENTIATION                      │
│   • P3-01: Velocity / Teleportation Fraud Anomaly Detection            │
│   • P3-02: Offline Speech-to-Text Voice Visit Notes                    │
└────────────────────────────────────────────────────────────────────────┘
```

---
*End of Document 09 — Oprino Prioritized Implementation Backlog*
