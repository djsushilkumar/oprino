# Oprino Documentation Quality & Integrity Audit

**Document:** Comprehensive Documentation Audit, Link Validation & Drift Reconciliation  
**Audit Date:** October 14, 2026  
**Auditor Roles:** Technical Documentation Lead, Principal Software Architect, QA Auditor  
**Baseline Branch:** `docs/v1-repo-and-documentation-audit`  

---

## 1. Executive Summary

This audit assesses the accuracy, consistency, portability, and organizational hygiene of all documentation across `docs/`, root `README.md`, `AGENTS.md`, and the brand repository.

While Oprino possesses deep, structured architecture specifications (21 ADRs, Master PRD, threat models, sync matrices), several significant documentation drifts, link breakages, and unverified readiness declarations have accumulated across development phases.

```
┌────────────────────────────────────────────────────────────────────────┐
│ DOCUMENTATION AUDIT SUMMARY                                            │
├────────────────────────────────────────────────────────────────────────┤
│ Total Nonportable Links Identified (file:///workspace/oprino/):    328 │
│ Duplicate ADR Documents Evaluated:                                  20 │
│ Architecture Drift Instances (Transistorsoft vs ADR-021):           19 │
│ Historical/Stale Statements in Audits Identified:                    4 │
│ Product Surface Access Conflicts Flagged:                            2 │
│ Production Readiness Discrepancies Reconciled:                       5 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Issue Analysis & Resolution

### A. Duplicate ADR Documents

**Finding:**  
Architecture decision files appear in two locations:
1. `docs/architecture/ADR-001-*.md` through `docs/architecture/ADR-021-*.md` (21 files, ranging from 5,204 to 17,156 bytes).
2. `docs/architecture/ADR/ADR-001-*.md` through `docs/architecture/ADR/ADR-020-*.md` (20 files, ranging from 22 to 38 bytes).
3. `docs/architecture/ADR/README.md` acts as the register and indexes all 21 ADRs.

**Exact Comparison:**  
Each file in `docs/architecture/ADR/` is **NOT** a duplicate document. It is a 1-line text file containing a relative path string pointing up one directory:
```text
../ADR-001-mobile-framework.md
```
This occurred because symlinks were created or intended in a Linux/POSIX environment, but were checked into Git on Windows as literal plaintext stub files. Furthermore, `ADR-021-zero-cost-gps-pipeline.md` exists only in `docs/architecture/` and was never stubbed into `docs/architecture/ADR/`.

**Authoritative Location Recommendation & Migration Plan:**
- **Authoritative Location:** `docs/architecture/ADR/` is the standard industry convention for Architecture Decision Records (as referenced by `AGENTS.md`).
- **Safe Migration Strategy (Two-Phase):**
  - **Phase 1 (Non-Destructive — Immediate):** Preserve the 21 full ADR files in `docs/architecture/` where all existing internal documents reference them. Update `docs/architecture/ADR/README.md` to link properly to `../ADR-xxx.md`.
  - **Phase 2 (Consolidation — Post-Approval):** Move all 21 full ADR files into `docs/architecture/ADR/`, delete the 20 stub files, add `ADR-021` directly to `ADR/`, and update references across `docs/` and `AGENTS.md`.

---

### B. Outdated Root README

**Finding:**  
The top-level `README.md` was frozen during Phase 00 (October 2026). It stated that Phase 00 was approved and Phase 01A architecture was pending freeze. It contained zero information regarding:
- The operational SaaS product scope.
- The Turborepo monorepo layout (`apps/web`, `apps/mobile`, `services/api`, `services/worker`).
- Local installation, prerequisites, environment variables, or dev setup.
- Test commands (`pnpm test`, `turbo typecheck`, `flutter test`).
- Current cloud deployment (Neon, Upstash, Render, Vercel).
- Active feature branches and PR dependencies (`feat/zero-cost-gps-field-ops` and `feat/v1-blockers-remediation`).

**Fix Applied:**  
The root `README.md` has been completely restructured into a modern, production-grade project guide covering the full product, technology stack, setup instructions, test commands, deployment architecture, and active branch roadmap.

---

### C. Broken & Nonportable Markdown Links

**Finding:**  
A search across all markdown files revealed **328 instances** of hardcoded, nonportable absolute URI links using the prefix:
`../../...`

When viewed on GitHub, in VS Code on Windows/macOS, or in any clone outside a specific Docker container path, every single one of these 328 links is broken and produces an error or fails to navigate.

**Audit Breakdown by Category:**
- Root & Guidelines (`README.md`, `AGENTS.md`, Brand System): 69 links
- Architectural Decisions & Freeze Checklists (`docs/architecture/`): 182 links
- Audits & Handoffs (`docs/audits/`, `docs/handoff/`): 48 links
- Product Specifications (`docs/product/`): 29 links

**Remediation:**  
All nonportable `../../` paths are being converted into GitHub-compatible relative Markdown links (e.g., `docs/architecture/...` or `../product/...`). A validation script (`scripts/validate-doc-links.mjs`) is introduced to verify that all relative links resolve to existing files.

---

### D. Stale Project Inventory (`docs/audits/PROJECT-INVENTORY.md`)

**Finding:**  
`docs/audits/PROJECT-INVENTORY.md` contains historical statements from the pre-development planning phase:
- *"No application codebase or backend infrastructure has been initialized yet."* (Section 1)
- *"Git Repository: Not yet initialized (.git is absent)."* (Section 3)
- *"Missing Elements: 1. Version Control... 3. Application Skeleton... 4. Environment Configurations"* (Section 4)

**Remediation:**  
Rather than rewriting historical records or pretending older reports describe the present codebase:
1. `docs/audits/PROJECT-INVENTORY.md` is preserved and clearly labeled at the top with an **ARCHIVAL HISTORICAL MILESTONE** banner explaining that it captures the repository state prior to Phase 01 scaffolding.
2. The current technical inventory is codified in `docs/audits/REPOSITORY-STRUCTURE-AUDIT.md` and `docs/audits/PROJECT-STATUS.md`.

---

### E. Architecture Drift: Transistorsoft vs. ADR-021

**Finding:**  
Nineteen documents throughout `docs/architecture/`, `docs/implementation/`, and `docs/handoff/` reference `flutter_background_geolocation` (Transistorsoft) as the background tracking engine.

In commit `2856422`, ADR-021 (`ADR-021-zero-cost-gps-pipeline.md`) was formally adopted, replacing Transistorsoft with the open-source `geolocator` package, an Android foreground service notification, Drift SQLite durable outbox queuing, and MapLibre cartography. This eliminated commercial licensing costs while preserving zero off-duty tracking.

**Code Verification:**  
`apps/mobile/pubspec.yaml` confirms that `geolocator: ^13.0.2` is installed and Transistorsoft is absent.

**Remediation:**  
- A prominent supersession notice is added to `docs/architecture/ADR-008-background-location.md` pointing to ADR-021.
- Historical ADR-008 is preserved intact to maintain architecture evolution history.
- `docs/architecture/ADR/README.md` explicitly lists ADR-021 as superseding the Transistorsoft dependency in ADR-008.

---

### F. Product Surface Consistency & Role Access

**Finding:**  
1. **Mobile Surface:** `docs/product/APP-SURFACES.md` specifies an "Owner / Manager Mobile App" with live map oversight, task dispatching, and approval workflows. In code (`apps/mobile`), only a single 4-tab employee execution interface exists. Managers must use the Web Dashboard for oversight.
2. **Web Surface:** `apps/web/src/components/HeaderNav.tsx` renders all 9 navigation tabs for all authenticated users, including employees. When an employee clicks "Live Map", the API returns 403 Forbidden.
3. **Approved Access Matrix:**
   - Owner/Admin: Full access (Web + Mobile).
   - Manager: Operational access (Web + Mobile).
   - Employee: Mobile execution + **Limited Web Self-Service** (view assigned tasks, own attendance history, profile).
   - Custom Roles: Platform access determined strictly by RBAC permissions.

**Flagged Conflict for Product Decision:**  
The Web frontend currently lacks role-based navigation trimming to hide manager-only routes (`/live-map`, `/team`, `/settings`, `/reports`) from Employee users. An issue is logged for Phase 6 polish to conditionally render nav items based on `context.role.name`.

---

### G. Production Readiness Claims vs. Technical Truth

Several documents (`docs/handoff/CODEX-CLOUD-HANDOFF.md`, `docs/audits/RELEASE-BLOCKERS.md`) declare:
- *"ALL CORE PRODUCTION PHASES (00 THROUGH 05) VERIFIED & PRODUCTION READY"*
- *"ENTERPRISE CORE MONOREPO READY FOR PRODUCTION DEPLOYMENT & FIELD PILOT RELEASE"*

Our rigorous code-and-evidence audit reconciles these claims against actual repository facts:

| Claimed State | Verified Fact from Code & Environment | Severity & Reality |
|---|---|---|
| **"Media Storage Production Ready"** | `services/api/src/services/media.service.ts` uses `/v1/media/mock-upload/*` which discards binary payloads. AWS S3 / Cloudflare R2 is NOT wired. | **High Gap:** Uploaded proof photos and attendance selfies are discarded and cannot be viewed in production. |
| **"Notifications Production Ready"** | In-app notification table works. Push notifications (FCM v1 / APNs) and Email delivery (Resend / SMTP) are completely missing from code. | **Moderate Gap:** Employees do not receive background OS push alerts when assigned tasks. |
| **"Android Release APK Built & Signed"** | Release build scripts fall back to debug keystores; CI generates an ad-hoc debug keystore with password `android`. | **Moderate Gap:** No production Google Play or enterprise keystore is provisioned. |
| **"Physical Mobile Hardware Validated"** | Smoke test (`scripts/smoke_test.mjs`) exercises API routes over HTTP; no real physical walking/driving Doze-mode battery test has occurred. | **Operational Gap:** Android aggressive background task killing remains an uncalibrated field risk. |
| **"Live Cloud 100% Operational"** | Live Render API (`oprino-api.onrender.com`) is deployed from `main` (`8db713b`), which does NOT include PR #1 or the V1 blocker fixes. | **Deployment Gap:** The deployed cloud backend lacks the zero-cost GPS pipeline and BLK-002 through BLK-006. |

---

## 3. Corrective Action Plan

1. **Convert all 328 nonportable links** to relative Markdown links.
2. **Update root `README.md`** to modern 2026 monorepo standards.
3. **Add historical banner** to `docs/audits/PROJECT-INVENTORY.md`.
4. **Add supersession banner** to `docs/architecture/ADR-008-background-location.md`.
5. **Publish comprehensive audit deliverables** (`PROJECT-STATUS.md`, `FEATURE-INVENTORY.md`, `CURRENT-DEPLOYMENT-STATUS.md`, `NEXT-STEPS-ROADMAP.md`, `docs/README.md`).
