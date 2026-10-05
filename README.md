# Oprino Workspace

The complete **Oprino Brand Kit (v1.3)** and **Phase 00: Product Planning & Pre-Development Freeze** documentation are established in this workspace.

---

## Phase 00 Documentation (APPROVED & FROZEN)

All product planning, scoping, brand audit, and pre-development freeze documents are formally **APPROVED & FROZEN** by stakeholder sign-off (October 2026). Phase 01 Technical Architecture is authorized to begin:

| Document | Description |
|---|---|
| [`docs/audits/PROJECT-INVENTORY.md`](file:///workspace/oprino/docs/audits/PROJECT-INVENTORY.md) | Repository audit, file inventory, checksum verification, and recommendations. |
| [`docs/brand/OPRINO-BRAND-SYSTEM.md`](file:///workspace/oprino/docs/brand/OPRINO-BRAND-SYSTEM.md) | Authoritative brand rules, colors, typography, spacing, and accessibility constraints. |
| [`docs/product/PRODUCT-DEFINITION.md`](file:///workspace/oprino/docs/product/PRODUCT-DEFINITION.md) | Core product definition, primary product loop, principles, and non-goals. |
| [`docs/product/ROLES-AND-PERMISSIONS-PLAN.md`](file:///workspace/oprino/docs/product/ROLES-AND-PERMISSIONS-PLAN.md) | RBAC architecture for default roles (Owner, Manager, Employee) and custom roles. |
| [`docs/product/V1-SCOPE.md`](file:///workspace/oprino/docs/product/V1-SCOPE.md) | Feature classification (MUST, SHOULD, LATER, OUT OF SCOPE) for lean V1 launch. |
| [`docs/product/APP-SURFACES.md`](file:///workspace/oprino/docs/product/APP-SURFACES.md) | Information architecture for Employee Mobile, Manager Mobile, and Web Dashboard. |
| [`docs/product/COMPETITIVE-POSITIONING.md`](file:///workspace/oprino/docs/product/COMPETITIVE-POSITIONING.md) | Analysis vs TaskOPad & Unolo; parity, differentiation, and long-term moats. |
| [`docs/business/PRICING-STRATEGY.md`](file:///workspace/oprino/docs/business/PRICING-STRATEGY.md) | Hybrid pricing architecture (Starter, Growth, Business, Enterprise) and add-ons. |
| [`docs/product/ROADMAP.md`](file:///workspace/oprino/docs/product/ROADMAP.md) | Phased product roadmap: V1, V1.5, V2, and V3 (with AI decoupled from V1). |
| [`docs/product/OPRINO-MASTER-PRD.md`](file:///workspace/oprino/docs/product/OPRINO-MASTER-PRD.md) | Comprehensive 30-section Master PRD consolidating all specifications. |
| [`docs/product/PLAN-FREEZE-CHECKLIST.md`](file:///workspace/oprino/docs/product/PLAN-FREEZE-CHECKLIST.md) | Gatekeeper checklist verifying pre-development freeze readiness. |

---

## Phase 01A Documentation (COMPLETE — ARCHITECTURE FREEZE PENDING)

All Phase 01A Technical Architecture research, ADRs, specifications, and trade-off analyses are complete and frozen for stakeholder review:

| Document | Description |
|---|---|
| [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md) | Master C4 system architecture document with Mermaid diagrams across all levels. |
| [`docs/architecture/ADR/README.md`](file:///workspace/oprino/docs/architecture/ADR/README.md) | Complete register of all 20 Architecture Decision Records (ADR-001 through ADR-020). |
| [`docs/architecture/TECHNOLOGY-DECISION-MATRIX.md`](file:///workspace/oprino/docs/architecture/TECHNOLOGY-DECISION-MATRIX.md) | Weighted decision matrix evaluating all 20 technology selections against alternatives. |
| [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](file:///workspace/oprino/docs/architecture/SYNC-CONFLICT-MATRIX.md) | Deterministic conflict resolution rules for offline-first mobile synchronization. |
| [`docs/architecture/LOCATION-PIPELINE.md`](file:///workspace/oprino/docs/architecture/LOCATION-PIPELINE.md) | End-to-end GPS acquisition, power management, 3-boundary duty cutoff, and purge pipeline. |
| [`docs/architecture/PRIVACY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/PRIVACY-ARCHITECTURE.md) | Technical enforcement of 30-day retention, peer privacy, and zero off-duty tracking. |
| [`docs/architecture/SECURITY-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/SECURITY-ARCHITECTURE.md) | 5-tier defense-in-depth model: Edge WAF, audited Better Auth, 5-stage tenant verification, and pooled `SET LOCAL` RLS. |
| [`docs/architecture/THREAT-MODEL.md`](file:///workspace/oprino/docs/architecture/THREAT-MODEL.md) | Comprehensive STRIDE threat analysis covering 11 critical threats and architectural mitigations. |
| [`docs/architecture/AUDIT-LOG-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/AUDIT-LOG-ARCHITECTURE.md) | Append-only audit trail design integrated with the Transactional Outbox pattern. |
| [`docs/architecture/TESTING-STRATEGY.md`](file:///workspace/oprino/docs/architecture/TESTING-STRATEGY.md) | Testing pyramid: Vitest unit tests, real PostgreSQL integration tests, and k6 load tests. |
| [`docs/architecture/ENVIRONMENT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/ENVIRONMENT-STRATEGY.md) | 4-tier environment progression, Doppler/Infisical secrets management, and Zod env validation. |
| [`docs/architecture/CONTRACT-STRATEGY.md`](file:///workspace/oprino/docs/architecture/CONTRACT-STRATEGY.md) | Single source of truth across the monorepo via `@oprino/contracts` and Zod schemas. |
| [`docs/architecture/RETENTION-ARCHITECTURE.md`](file:///workspace/oprino/docs/architecture/RETENTION-ARCHITECTURE.md) | Automated 30-day partition drops, pre-purge mileage rollups, and least-privileged maintenance. |
| [`docs/architecture/INFRA-COST-MODEL.md`](file:///workspace/oprino/docs/architecture/INFRA-COST-MODEL.md) | Parameterized SMB unit economics: ~$0.40/user/mo at scale delivering 87-90% gross margin; decoupled software licensing. |
| [`docs/architecture/FAILURE-MODES.md`](file:///workspace/oprino/docs/architecture/FAILURE-MODES.md) | 20 real-world field failure scenarios and automated self-healing recovery runbooks. |
| [`docs/architecture/TECHNICAL-RISK-REGISTER.md`](file:///workspace/oprino/docs/architecture/TECHNICAL-RISK-REGISTER.md) | Risk register with probability, severity, early triggers, and proactive mitigations. |
| [`docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md`](file:///workspace/oprino/docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md) | Final architecture freeze verification ending with `Approval: PENDING`. |

---

## Brand Kit Structure & Quick Links

### 1. Brand Guidelines & Overview
- [Brand Guidelines (Markdown)](file:///workspace/oprino/Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Guidelines.md)
- [Brand Guidelines (PDF)](file:///workspace/oprino/Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Guidelines.pdf)
- [Brand Board (PNG)](file:///workspace/oprino/Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Board.png) | [Brand Board (SVG)](file:///workspace/oprino/Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Board.svg)
- [Canva Templates & Links](file:///workspace/oprino/Oprino-Brand-Kit/Canva-Links.md)
- [Quick Start Guide (Hindi)](file:///workspace/oprino/Oprino-Brand-Kit/START-HERE-Hindi.md)

---

### 2. Logos (`01-Logos/`)
All 16 variations are available in SVG (outlined vector paths, no external font dependencies), 4096px high-res transparent PNG, and vector PDF:

| Layout | Variants | Formats |
|---|---|---|
| **Horizontal** | Full-color, Reversed, Black, White, Flat Navy, Flat Blue | [SVG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/SVG/), [PNG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PNG/), [PDF](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PDF/) |
| **Stacked** | Full-color, Reversed, Black, White | [SVG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/SVG/), [PNG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PNG/), [PDF](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PDF/) |
| **Icon Only** | Full-color, Flat Navy, Black, White | [SVG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/SVG/), [PNG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PNG/), [PDF](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PDF/) |
| **Wordmark** | Flat Navy, White | [SVG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/SVG/), [PNG](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PNG/), [PDF](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/PDF/) |
| **Catalog** | Complete Multi-Page Variation PDF | [Oprino-Logo-Variations.pdf](file:///workspace/oprino/Oprino-Brand-Kit/01-Logos/Oprino-Logo-Variations.pdf) |

---

### 3. Digital Assets (`02-Digital/`)
- **App Icons**: Light & Dark mode (1024px & 4096px 4K)
- **Social Avatar**: 1024px & 4096px 4K
- **Favicons**: 16x16, 32x32, 48x48, 64x64, 128x128, 180x180, 192x192, 512x512, `.ico`, `.svg`, and [site.webmanifest](file:///workspace/oprino/Oprino-Brand-Kit/02-Digital/Favicons/site.webmanifest)

---

### 4. Templates (`03-Templates/`)
- **Business Cards**: 90 x 55 mm trim with 3 mm bleed ([Print PDF](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-Business-Card-Print.pdf), [Front SVG](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-business-card-front.svg), [Back SVG](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-business-card-back.svg))
- **Letterhead**: A4 210 x 297 mm ([Print PDF](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-Letterhead-A4.pdf), [SVG](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-letterhead-template.svg))
- **Social Post Template**: 1080 x 1080 (SVG & 2x PNG)
- **Social Cover Banner**: 1584 x 396 (SVG & 2x PNG)
- **Web Hero Template**: 1600 x 900 (SVG & 2x PNG)
- **Email Signature**: [HTML Template](file:///workspace/oprino/Oprino-Brand-Kit/03-Templates/Oprino-email-signature.html)

---

### 5. Design Tokens & Styling (`05-Design-Tokens/`)
- [CSS Variables](file:///workspace/oprino/Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.css)
- [JSON Design Tokens](file:///workspace/oprino/Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.json)
- [GPL Palette File](file:///workspace/oprino/Oprino-Brand-Kit/05-Design-Tokens/Oprino-palette.gpl)

#### Core Palette:
- **Navy**: `#0F172A` (Wordmark, headings, dark surfaces)
- **Cobalt**: `#164CFF` (Primary action, signature blue)
- **Ocean**: `#087DE5` (Gradient continuation)
- **Mint**: `#20BAAA` (Accent / progress highlight)
- **Deep Blue**: `#1235A4` (Symbol shadow & depth)
- **Slate**: `#475569` (Secondary readable text)
- **Paper**: `#F8FAFC` (Light background / surface)
- **White**: `#FFFFFF` (Background / reversed text)
- **Border**: `#DDE5EF` (Light dividers)

---

### 6. Fonts (`06-Fonts/`)
Open Font License (OFL) files included:
- **Unbounded** (Medium, Variable) – Logo wordmark
- **Space Grotesk** (Regular, SemiBold, Variable) – Headings
- **Manrope** (Regular, SemiBold, Variable) – Body & UI text

---

### 7. Source & Build System (`07-Source/`)
- [Master Vector Icon](file:///workspace/oprino/Oprino-Brand-Kit/07-Source/Oprino-icon-vector-master.svg)
- Vector trace definition & automated Python asset builders
- Original icon provenance and reference images
