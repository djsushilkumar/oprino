# OPRINO — Canonical Research & Reverse Engineering Index

**Document Status:** CANONICAL & PERMANENT  
**Classification:** Research Portal, Competitor Deconstruction, Empirical Evidence  
**Scope:** TaskOPad & Unolo Reverse Engineering, Feature Benchmarks, Architecture Recommendations  
**Research Lead:** Principal Product Architect & Senior Reverse Engineer  
**Date of Audit:** October 2026  

---

## 1. Executive Summary

This directory contains the complete, unredacted, evidence-backed reverse engineering study of **TaskOPad** (`com.taskopad.taskopad`) and **Unolo** (`smartsense.co.in.sensephone`), alongside Oprino's strategic response, architectural reviews, and production gap analyses.

### Target Competitors Profile:
1. **TaskOPad** ([taskopad.com](https://www.taskopad.com)): Hybrid project and task management software with desktop-heavy roots and bolt-on attendance.
2. **Unolo** ([unolo.com](https://unolo.com)): Field Force Management (FFM) and Sales Force Automation (SFA) platform focusing on GPS tracking, FMCG retail order booking, and beat planning.

### Research Methodology & Confidence Taxonomy:
In accordance with professional reverse engineering and architecture standards, all findings are strictly categorized:
- **OBSERVED:** Directly captured and verified via UI inspection, official developer documentation, network traffic, or APK manifest analysis.
- **INFERRED:** Architecturally deduced from observable behaviors, error schemas, latency patterns, and standard engineering practice.
- **HYPOTHETICAL:** Theoretical system designs proposed for evaluation.

---

## 2. Master Research Deliverables Directory

The complete 26-document research suite is stored under [`competitor-reverse-engineering/`](./competitor-reverse-engineering/):

### Part I: Foundations, Methodology & Evidence
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`00-RESEARCH-INDEX.md`](./competitor-reverse-engineering/00-RESEARCH-INDEX.md) | **Research Master Index** | OBSERVED | Executive mission, toolchain verification (REA MCP, ADB, physical OnePlus testbed), and research boundaries. |
| [`10-EVIDENCE-AND-SOURCES.md`](./competitor-reverse-engineering/10-EVIDENCE-AND-SOURCES.md) | **Evidence & Source Catalog** | OBSERVED | Catalog of official Play Store listings, documentation URLs, pricing disclosures, and ADB inspection dumps. |
| [`11-RESEARCH-LIMITATIONS.md`](./competitor-reverse-engineering/11-RESEARCH-LIMITATIONS.md) | **Research Boundaries & Ethics** | OBSERVED | Legal, ethical, and technical boundary declarations (zero proprietary source theft, public surface analysis only). |
| [`12-EVIDENCE-VALIDATION-REPORT.md`](./competitor-reverse-engineering/12-EVIDENCE-VALIDATION-REPORT.md) | **Evidence Validation Report** | OBSERVED | Adversarial fact-checking separating observed evidence from competitor marketing hype. |

### Part II: Deep Competitor Audits
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`01-TASKOPAD-PRODUCT-AUDIT.md`](./competitor-reverse-engineering/01-TASKOPAD-PRODUCT-AUDIT.md) | **TaskOPad Product Audit** | OBSERVED | Deconstruction of TaskOPad modules (A through G), entity models, pricing tiers, and desktop-centric friction. |
| [`02-UNOLO-PRODUCT-AUDIT.md`](./competitor-reverse-engineering/02-UNOLO-PRODUCT-AUDIT.md) | **Unolo Product Audit** | OBSERVED | Audit of Unolo FFM/SFA, Facelock biometric attendance, odometer algorithms, travel claims, and retail beat planning. |

### Part III: Comparative Deconstruction & Workflows
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`03-COMPETITOR-FEATURE-MATRIX.md`](./competitor-reverse-engineering/03-COMPETITOR-FEATURE-MATRIX.md) | **Competitor Feature Matrix** | OBSERVED | 60+ capability side-by-side comparison across TaskOPad, Unolo, and Oprino with explicit evidence labels. |
| [`04-WORKFLOW-RECONSTRUCTION.md`](./competitor-reverse-engineering/04-WORKFLOW-RECONSTRUCTION.md) | **Workflow Reconstruction** | OBSERVED / INFERRED | 12 end-to-end user journeys reconstructed via Mermaid state charts and transition rules. |
| [`05-UI-UX-PATTERN-ANALYSIS.md`](./competitor-reverse-engineering/05-UI-UX-PATTERN-ANALYSIS.md) | **UI/UX Pattern Analysis** | OBSERVED | Mobile ergonomic analysis, tap-depth comparisons, bottom-sheet affordances, and high-contrast field design. |
| [`06-TECHNICAL-BEHAVIOR-ANALYSIS.md`](./competitor-reverse-engineering/06-TECHNICAL-BEHAVIOR-ANALYSIS.md) | **Technical Behavior Analysis** | OBSERVED / INFERRED | Observable API payloads, background service lifecycle, battery drain benchmarks, and Android permission sets. |

### Part IV: Strategy, Positioning & Scope Discipline
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`07-OPRINO-GAP-ANALYSIS.md`](./competitor-reverse-engineering/07-OPRINO-GAP-ANALYSIS.md) | **Oprino Strategic Gap Analysis** | OBSERVED | Strategic differentiation: privacy-first duty tracking, zero-cost cloud blueprint, and service-market focus. |
| [`13-CORRECTED-COMPETITIVE-GAPS.md`](./competitor-reverse-engineering/13-CORRECTED-COMPETITIVE-GAPS.md) | **Corrected Gaps & Anti-Features** | OBSERVED | Strict boundary enforcement: rejecting Unolo's 24/7 surveillance and FMCG retail ordering as non-goals. |
| [`17-COMPETITOR-VS-CURRENT-PRODUCT-GAPS.md`](./competitor-reverse-engineering/17-COMPETITOR-VS-CURRENT-PRODUCT-GAPS.md) | **Competitor vs Current Product Gaps** | OBSERVED | Net gap reconciliation eliminating false needs based on real codebase audit. |

### Part V: Architectural Alignment & ADR Governance
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`08-OPRINO-ARCHITECTURE-RECOMMENDATIONS.md`](./competitor-reverse-engineering/08-OPRINO-ARCHITECTURE-RECOMMENDATIONS.md) | **Architecture Recommendations** | INFERRED | Architectural blueprints: PostGIS schemas, BullMQ event queues, and Oracle/Neon deployment topology. |
| [`14-ARCHITECTURE-DECISION-REVIEW.md`](./competitor-reverse-engineering/14-ARCHITECTURE-DECISION-REVIEW.md) | **Architecture Decision Review** | OBSERVED | Analysis of ADR-014 (SSE tickets), ADR-015 (Spatial clustering), and ADR-016 (Self-healing sync). |
| [`15-IMPLEMENTATION-READINESS-GATE.md`](./competitor-reverse-engineering/15-IMPLEMENTATION-READINESS-GATE.md) | **Implementation Readiness Gate** | OBSERVED | Quality criteria, test coverage benchmarks, and pre-implementation sign-off gates. |

### Part VI: Codebase Audit & Production Hardening
| File | Title | Confidence | Key Insights & Content |
|---|---|---|---|
| [`16-EXISTING-OPRINO-IMPLEMENTATION-MATRIX.md`](./competitor-reverse-engineering/16-EXISTING-OPRINO-IMPLEMENTATION-MATRIX.md) | **Existing Implementation Matrix** | OBSERVED | Codebase verification proving RLS, duty-gate, offline Drift sync, and live maps are already built. |
| [`18-PRODUCTION-QUALITY-AUDIT.md`](./competitor-reverse-engineering/18-PRODUCTION-QUALITY-AUDIT.md) | **Production Quality Audit** | OBSERVED | Verification of database schemas, migration files, API contracts, and test suite execution. |
| [`19-ZERO-DUPLICATE-IMPROVEMENT-BACKLOG.md`](./competitor-reverse-engineering/19-ZERO-DUPLICATE-IMPROVEMENT-BACKLOG.md) | **De-duplicated Improvement Backlog** | OBSERVED | Engineering backlog stripped of duplicate tasks and false gaps. |
| [`20-RECOMMENDED-NEXT-ACTIONS.md`](./competitor-reverse-engineering/20-RECOMMENDED-NEXT-ACTIONS.md) | **Recommended Next Actions** | OBSERVED | Pragmatic tactical plan for production verification and release gating. |
| [`21-PRODUCTION-RELIABILITY-VALIDATION.md`](./competitor-reverse-engineering/21-PRODUCTION-RELIABILITY-VALIDATION.md) | **Production Reliability Validation** | OBSERVED | Live cloud health check and endpoint probe results on Neon, Upstash, and Render. |
| [`22-FINAL-AUDIT-EVIDENCE-CORRECTIONS.md`](./competitor-reverse-engineering/22-FINAL-AUDIT-EVIDENCE-CORRECTIONS.md) | **Audit Evidence Corrections** | OBSERVED | Correction of historical audit discrepancies against physical repository reality. |
| [`23-SECURITY-AND-RELIABILITY-REGRESSION-PLAN.md`](./competitor-reverse-engineering/23-SECURITY-AND-RELIABILITY-REGRESSION-PLAN.md) | **Security Regression Plan** | OBSERVED | Automated regression checks for RLS multi-tenancy, duty boundaries, and device tokens. |
| [`24-VERIFIED-PRODUCTION-HARDENING-BACKLOG.md`](./competitor-reverse-engineering/24-VERIFIED-PRODUCTION-HARDENING-BACKLOG.md) | **Verified Hardening Backlog** | OBSERVED | Targeted hardening actions for V1 launch stabilization. |
| [`25-PRODUCTION-ENVIRONMENT-VERIFICATION-REPORT.md`](./competitor-reverse-engineering/25-PRODUCTION-ENVIRONMENT-VERIFICATION-REPORT.md) | **Production Environment Verification** | OBSERVED | Verification of deployed infrastructure, fail-closed guards, and live cloud performance. |

---

## 3. Archived Technical Spikes

Historical architectural exploration code spikes are preserved in [`research/archived-spikes/`](../../research/archived-spikes/):
- **`spike_c_auth`:** Early mobile authentication and Dio interceptor exploration.
- **`spike_d_openapi`:** Initial OpenAPI generation and Dart client prototyping.
- **`spike_e_security`:** Installation identity and secure device storage experimentation.
