# 20 — Recommended Next Actions & Executive Roadmap

**Auditor:** Principal Software Architect, Senior QA Lead & Product Gap Analyst  
**Context:** Strategic Post-Audit Guidance & Operational Next Steps  
**Repository State:** `main` branch (V1 Stabilization PR #7 Merged, All 187 Integration Tests Passing)  
**Date of Audit:** October 2026  
**Status:** Approved for Executive Execution  

---

## 1. Executive Summary: What Works, What Needs Fixing, What Needs Adding

Following an exhaustive audit of the `djsushilkumar/oprino` codebase on `main` reconciled against verified competitor intelligence on TaskOPad and Unolo, the engineering reality is clear:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OPRINO OPERATIONAL REALITY                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. WHAT ALREADY WORKS (100% Implemented & Passing 187 Integration Tests):              │
│    • 5-Stage Multi-Tenant Isolation with PostgreSQL Row-Level Security (RLS)           │
│    • Strict Duty-Hours GPS Ingestion Gate (0 DB writes for off-duty points)             │
│    • 7-Day Historical Reconciliation for offline points uploaded post punch-out        │
│    • Direct-to-Storage Presigned Cloudflare R2 Uploads (Zero-Egress Media Store)       │
│    • Front-Facing Selfie Attendance with GPS Accuracy Pre-Check Gate                   │
│    • Offline-First Drift SQLite Outbox with Monotonic Resync & Deduplication           │
│    • Web Live Fleet Map Split-Pane with MapLibre GL & Single-Use SSE Streaming         │
│    • Interactive Breadcrumb Route History Playback with Timeline Scrubber              │
│    • Automated 30-Day GPS Telemetry Pruning Worker (BullMQ + PostgreSQL Stored Proc)   │
│    • Recurring Task Generation & Overdue SLA Notification Monitors                     │
│    • Employee Bulk CSV Import (100 members/batch) with Formula Sanitization            │
│    • Customer Geofence Verification, Photo Proofs, and Vector Signature Pads           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. WHAT NEEDS FIXING / PROFILING (Reliability & Scalability Hardening):                │
│    • Run Empirical 8-Hour Battery Profiling Harness on OnePlus Testbed (`QA-001`)      │
│    • Add MapLibre GeoJSON Marker Clustering for Fleets > 100 Personnel (`PERF-001`)   │
│    • Implement Cellular/Wi-Fi Handover Network Watchdog in Mobile Sync (`REL-001`)     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. WHAT GENUINELY NEEDS TO BE ADDED (Targeted P2 Competitor Parity):                   │
│    • Vehicle Odometer Photo Verification & Fuel Conveyance Calculator (`PAR-001`)      │
│    • WhatsApp Business Cloud API Outbound Dispatch Webhooks (`PAR-002`)                │
│    • Automated Day-Gap Morning Task Rollover (`PAR-003`)                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Immediate Operational Milestones

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EXECUTION TIMELINE & MILESTONES                      │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: QA BENCHMARKING & RELIABILITY HARDENING (Sprint 1: Weeks 1–2) │
│   1. Execute `QA-001`: Run automated 8-hour battery profiling script   │
│      on connected physical OnePlus testbed (serial `5abd6fc0`).        │
│   2. Implement `PERF-001`: Add MapLibre marker clustering to           │
│      `apps/web/src/app/live-map/page.tsx` for large fleet rendering.   │
│   3. Implement `REL-001`: Add network handover watchdog in             │
│      `apps/mobile/lib/core/sync/sync_service.dart`.                    │
│   4. Implement `SEC-001`: Integrate Play Integrity attestation gate.   │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: HIGH-IMPACT COMPETITOR PARITY (Sprint 2: Weeks 3–4)           │
│   1. Implement `PAR-001`: Add Odometer dashboard photo capture sheet   │
│      and fuel reimbursement calculator (Unolo parity).                 │
│   2. Implement `PAR-002`: Configure WhatsApp Cloud API dispatch webhook│
│      in `services/worker/src/worker.ts` (TaskOPad parity).             │
│   3. Implement `PAR-003`: Deploy Day-Gap task morning rollover worker. │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: PRODUCTION SCALING & ORACLE ARM64 VPS (Sprint 3: Weeks 5–6)   │
│   1. Deploy Docker Compose production stack onto Oracle Cloud Ampere A1│
│      ARM64 VPS (4 OCPU / 24 GB RAM) with Caddy reverse proxy.          │
│   2. Validate multi-tenant RLS under 500 concurrent simulated field   │
│      executives using k6 or Autocannon load testing scripts.           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Non-Goals & Architectural Defense

To protect Oprino from the architectural bloat that degrades Unolo and TaskOPad, the following non-goals remain **locked and non-negotiable**:
1. **No CRM Sales Funnels or Lead Pipelines:** Keep Oprino focused on service delivery, maintenance, inspection, and operations. Do not build lead stages, deal pipelines, or commission calculators.
2. **No Retail Merchant Order-Taking or Product Catalogs:** Do not replicate Unolo’s 500-SKU FMCG catalog. Technicians execute service checklists, not retail store orders.
3. **No Invoicing, GST Billing, or General Accounting:** Do not build a billing engine. Provide clean, tamper-evident CSV and JSON export endpoints for external integration with Tally, Zoho Books, or QuickBooks.
4. **No Full Statutory HRMS or Payroll Calculations:** Do not calculate tax deductions (TDS), provident fund (PF), or employee insurance (ESI). Provide raw, verified shift attendance hours and overtime logs.
5. **No Public Customer Portal:** Avoid expanding external tenant attack surfaces. Customers receive lightweight, cryptographically signed visit completion receipts via SMS/WhatsApp.

---

## 4. Preservation of PR #7 Merged State

- **Directive:** The merge of `release/v1-stabilization` (PR #7) into `main` (`commit 6d1c42f`) is fully approved and validated.
- **Do Not Revert or Restart:** Under no circumstances should foundational architecture sprints be restarted. All future engineering effort must proceed incrementally against the Zero-Duplicate Backlog (`19-ZERO-DUPLICATE-IMPROVEMENT-BACKLOG.md`).
- **Continuous Integration Standard:** All future PRs must pass the existing 187 integration tests (`pnpm test` in `services/api` and `apps/web`) with zero regressions.

---
*End of Document 20 — Recommended Next Actions & Executive Roadmap*
