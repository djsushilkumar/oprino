# Oprino Documentation Index

Welcome to the central technical documentation library for **Oprino** — the multi-industry task management, workforce operations, and field tracking SaaS platform for SMBs.

All documentation is version-controlled and categorized by operational domain.

---

## 0. प्रोजेक्ट ओनर गाइड्स (Owner Guides — सरल हिंदी)

अगर आप प्रोजेक्ट के मालिक या गैर-तकनीकी स्टेकहोल्डर हैं, तो इन तीन सरल हिंदी गाइड्स से शुरुआत करें:
* 📖 **[प्रोजेक्ट ओनर स्टार्ट गाइड](OWNER-START-HERE-HI.md)** — Oprino क्या है, यह क्या काम करता है, और इसे अपने कंप्यूटर पर कैसे चलाएं।
* 📊 **[प्रोजेक्ट वर्तमान स्थिति रिपोर्ट](PROJECT-STATUS-HI.md)** — क्या 100% काम कर रहा है, क्या अधूरा है, और लॉन्च से पहले क्या जरूरी है।
* ⚙️ **[सम्पूर्ण सिस्टम एवं कार्यप्रणाली गाइड](COMPLETE-SYSTEM-GUIDE-HI.md)** — पूरे सिस्टम की कार्यप्रणाली, सभी वर्कफ़्लो आरेख और सरल शब्दकोश।

---

## 1. Primary Entry Points & Authoritative Specifications

| Domain | Authoritative Document | Purpose & Description |
|---|---|---|
| **System Overview** | [`docs/architecture/SYSTEM-OVERVIEW.md`](architecture/SYSTEM-OVERVIEW.md) | High-level system architecture, component tiering, and core invariants. |
| **Repository Map** | [`docs/architecture/REPOSITORY-MAP.md`](architecture/REPOSITORY-MAP.md) | Exhaustive directory tree, module entry points, and monorepo boundaries. |
| **Bug Register** | [`docs/audits/BUG-REGISTER.md`](audits/BUG-REGISTER.md) | Verified defects, severity rankings, root causes, and regression tests. |
| **Feature Matrix** | [`docs/audits/FEATURE-VERIFICATION-MATRIX.md`](audits/FEATURE-VERIFICATION-MATRIX.md) | Source-level feature verification: Working, Blocked, Out of Scope. |
| **Current Release Gates** | [`V1-COMMERCIAL-LAUNCH-CHECKLIST.md`](releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md) | Release checklist: outstanding storage, signing, physical GPS, and owner acceptance gates. |
| **Release Candidate** | [`V1-RELEASE-CANDIDATE-REPORT.md`](releases/V1-RELEASE-CANDIDATE-REPORT.md) | Stabilized V1 candidate, recorded verification evidence, and rollout prerequisites. |
| **Product Baseline** | [`docs/product/OPRINO-MASTER-PRD.md`](product/OPRINO-MASTER-PRD.md) | Controlling 30-section product specification, business rules, and non-goals. |
| **V1 Scope Boundaries** | [`docs/product/V1-SCOPE.md`](product/V1-SCOPE.md) | Non-negotiable MUST, SHOULD, LATER, and OUT-OF-SCOPE classifications. |
| **System Architecture** | [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](architecture/OPRINO-TECHNICAL-ARCHITECTURE.md) | Master C4 technical architecture document with Mermaid diagrams across all tiers. |
| **ADR Register** | [`docs/architecture/ADR/README.md`](architecture/ADR/README.md) | Canonical index of all 21 Architecture Decision Records (ADR-001 to ADR-021). |
| **Brand System** | [`docs/brand/OPRINO-BRAND-SYSTEM.md`](brand/OPRINO-BRAND-SYSTEM.md) | Authoritative design tokens, color palette, typography rules, and logo variations. |
| **Agent Handoff** | [`docs/handoff/CODEX-CLOUD-HANDOFF.md`](handoff/CODEX-CLOUD-HANDOFF.md) | Handoff specifications, core invariants, and active gates for coding agents. |

---

## 2. Directory Navigation

### 2.1 Audits & Verification (`docs/audits/`)
Current audits, code-backed evidence, blocker registers, and production roadmaps:
- [`PROJECT-STATUS.md`](audits/PROJECT-STATUS.md) — Technical truth audit: what is built, working, and incomplete.
- [`REPOSITORY-STRUCTURE-AUDIT.md`](audits/REPOSITORY-STRUCTURE-AUDIT.md) — Directory inventory, module ownership, and monorepo hygiene.
- [`DOCUMENTATION-AUDIT.md`](audits/DOCUMENTATION-AUDIT.md) — Quality audit analyzing duplicate ADRs, links, and architectural drift.
- [`FEATURE-INVENTORY.md`](audits/FEATURE-INVENTORY.md) — Exhaustive V1 feature-by-feature implementation and readiness matrix.
- [`CURRENT-DEPLOYMENT-STATUS.md`](audits/CURRENT-DEPLOYMENT-STATUS.md) — Neon, Upstash, Render, Vercel, and storage deployment facts.
- [`NEXT-STEPS-ROADMAP.md`](audits/NEXT-STEPS-ROADMAP.md) — Prioritized 9-phase path to commercial production release.
- [`RELEASE-BLOCKERS.md`](audits/RELEASE-BLOCKERS.md) — Register of remediated release blockers (BLK-001 through BLK-006).
- [`TEST-EVIDENCE.md`](audits/TEST-EVIDENCE.md) — Automated integration test logs, pass rates, and coverage metrics.
- [`SECURITY-FINDINGS.md`](audits/SECURITY-FINDINGS.md) — Penetration testing reports, RLS verification, and STRIDE mitigations.
- [`PRODUCTION-LAUNCH-CHECKLIST.md`](audits/PRODUCTION-LAUNCH-CHECKLIST.md) — 10-gate launch criteria and sign-off register.
- [`PROJECT-INVENTORY.md`](audits/PROJECT-INVENTORY.md) — *(Archival Milestone)* Phase 00 pre-development repository audit.

---

### 2.2 Product & Requirements (`docs/product/`)
Approved business and operational requirements:
- [`OPRINO-MASTER-PRD.md`](product/OPRINO-MASTER-PRD.md) — Consolidated Master Product Requirements Document.
- [`V1-SCOPE.md`](product/V1-SCOPE.md) — Lean V1 feature boundaries (MUST, SHOULD, LATER, OUT-OF-SCOPE).
- [`PRODUCT-DEFINITION.md`](product/PRODUCT-DEFINITION.md) — Core principles, primary product loops, and multi-industry target personas.
- [`APP-SURFACES.md`](product/APP-SURFACES.md) — Information architecture for Web Dashboard and Mobile client.
- [`ROLES-AND-PERMISSIONS-PLAN.md`](product/ROLES-AND-PERMISSIONS-PLAN.md) — Default and custom RBAC permissions matrix.
- [`ROADMAP.md`](product/ROADMAP.md) — Phased feature evolution: V1, V1.5, V2, and V3.
- [`COMPETITIVE-POSITIONING.md`](product/COMPETITIVE-POSITIONING.md) — Competitive parity and moat analysis vs TaskOPad and Unolo.
- [`PLAN-FREEZE-CHECKLIST.md`](product/PLAN-FREEZE-CHECKLIST.md) — Phase 00 sign-off verification register.

---

### 2.3 Architecture & System Design (`docs/architecture/`)
Deep technical specifications, invariants, and failure recovery:
- [`OPRINO-TECHNICAL-ARCHITECTURE.md`](architecture/OPRINO-TECHNICAL-ARCHITECTURE.md) — Master C4 system architecture.
- [`ADR/README.md`](architecture/ADR/README.md) — Architecture Decision Register (ADR-001 through ADR-021).
- [`LOCATION-PIPELINE.md`](architecture/LOCATION-PIPELINE.md) — Duty-hours GPS pipeline, power management, and cutoff rules.
- [`PRIVACY-ARCHITECTURE.md`](architecture/PRIVACY-ARCHITECTURE.md) — 3-boundary duty control, 30-day retention, and zero off-duty tracking.
- [`SECURITY-ARCHITECTURE.md`](architecture/SECURITY-ARCHITECTURE.md) — 5-tier defense-in-depth model, tenant verification, and pooled RLS.
- [`SYNC-CONFLICT-MATRIX.md`](architecture/SYNC-CONFLICT-MATRIX.md) — Deterministic offline-first synchronization rules.
- [`CONTRACT-STRATEGY.md`](architecture/CONTRACT-STRATEGY.md) — Single-source-of-truth `@oprino/contracts` schema design.
- [`RETENTION-ARCHITECTURE.md`](architecture/RETENTION-ARCHITECTURE.md) — Automated telemetry pruning and pre-purge distance rollups.
- [`INFRA-COST-MODEL.md`](architecture/INFRA-COST-MODEL.md) — Unit economics modeling ~$0.40/user/month at scale.
- [`FAILURE-MODES.md`](architecture/FAILURE-MODES.md) — 20 field failure scenarios and automated recovery runbooks.
- [`THREAT-MODEL.md`](architecture/THREAT-MODEL.md) — STRIDE threat analysis and architectural mitigations.
- [`AUDIT-LOG-ARCHITECTURE.md`](architecture/AUDIT-LOG-ARCHITECTURE.md) — Append-only audit trail and transactional outbox pattern.
- [`TESTING-STRATEGY.md`](architecture/TESTING-STRATEGY.md) — Testing pyramid across Vitest, PostgreSQL, and Flutter.
- [`ENVIRONMENT-STRATEGY.md`](architecture/ENVIRONMENT-STRATEGY.md) — 4-tier environment progression and secrets governance.

---

### 2.4 Cloud Deployment (`docs/deployment/`)
Hosting topologies and operations:
- [`FREE-CLOUD-DEPLOYMENT-GUIDE.md`](deployment/FREE-CLOUD-DEPLOYMENT-GUIDE.md) — Step-by-step setup across Neon (PostgreSQL), Upstash (Redis), Render (Fastify API), and Vercel (Next.js 15).

---

### 2.5 Business & Monetization (`docs/business/`)
- [`PRICING-STRATEGY.md`](business/PRICING-STRATEGY.md) — Hybrid pricing architecture (`Starter`, `Growth`, `Business`, `Enterprise`) and add-ons.

---

### 2.6 Historical Implementation Reports (`docs/implementation/`)
Archival milestone completion reports:
- [`PHASE-02A-IDENTITY-TENANCY-REPORT.md`](implementation/PHASE-02A-IDENTITY-TENANCY-REPORT.md) — Identity, workspace, and multi-tenant foundation.
- [`PHASE-02B-TASK-ATTENDANCE-REPORT.md`](implementation/PHASE-02B-TASK-ATTENDANCE-REPORT.md) — Task and attendance core domain.
- [`PHASE-02C-LOCATION-PIPELINE-REPORT.md`](implementation/PHASE-02C-LOCATION-PIPELINE-REPORT.md) — GPS location pipeline and geofencing.
- [`PHASE-03-FIELD-OPERATIONS-REPORT.md`](implementation/PHASE-03-FIELD-OPERATIONS-REPORT.md) — Customer sites, visits, and proof of work.
- [`PHASE-04-ADVANCED-OPERATIONS-REPORT.md`](implementation/PHASE-04-ADVANCED-OPERATIONS-REPORT.md) — Dispatch routing, recurring tasks, and reports.
- [`PHASE-05-PRODUCTION-HARDENING-REPORT.md`](implementation/PHASE-05-PRODUCTION-HARDENING-REPORT.md) — Security hardening, rate limiting, and metrics.

---

## 3. Contributing Guidelines for Documentation

1. **Relative Markdown Links Only:** Never commit absolute local URI paths (such as `file:///...` or Windows drive letters like `C:\` or `D:\`). Always use portable relative Markdown links (such as `../product/V1-SCOPE.md` or `./PROJECT-STATUS.md`).
2. **Preserve Invariant Principles:** Off-duty location tracking must NEVER occur; multi-tenant isolation must remain strictly enforced.
3. **Do Not Silently Alter Historical ADRs:** Superseded architecture decisions must be marked with a clear supersession note linking to the newer ADR, rather than modifying historical text.
4. **Evidence-Based Claims:** When declaring a feature or gate "Complete" or "Verified", link directly to test files, CI run IDs, or source code.
