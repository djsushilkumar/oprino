# Oprino

Oprino is a multi-industry task management, workforce management, and field operations platform for SMBs. The repository contains a Next.js web dashboard, a unified Flutter mobile app, a Fastify API, and a BullMQ worker with shared contracts, database schemas, and brand tokens.

## 👑 प्रोजेक्ट ओनर गाइड्स (Owner Guides — सरल हिंदी)
अगर आप प्रोजेक्ट के मालिक या गैर-तकनीकी स्टेकहोल्डर हैं, तो इन तीन सरल हिंदी गाइड्स से शुरुआत करें:
* 📖 **[प्रोजेक्ट ओनर स्टार्ट गाइड](docs/OWNER-START-HERE-HI.md)** — Oprino क्या है, यह क्या काम करता है, और इसे अपने कंप्यूटर पर कैसे चलाएं।
* 📊 **[प्रोजेक्ट वर्तमान स्थिति रिपोर्ट](docs/PROJECT-STATUS-HI.md)** — क्या 100% काम कर रहा है, क्या अधूरा है, और लॉन्च से पहले क्या जरूरी है।
* ⚙️ **[सम्पूर्ण सिस्टम एवं कार्यप्रणाली गाइड](docs/COMPLETE-SYSTEM-GUIDE-HI.md)** — पूरे सिस्टम की कार्यप्रणाली, सभी वर्कफ़्लो आरेख और सरल शब्दकोश।

## Current status — October 15, 2026

The V1 release candidate is on `release/v1-stabilization`. Local code validation passes, but commercial launch remains gated. Use the [commercial launch checklist](docs/releases/V1-COMMERCIAL-LAUNCH-CHECKLIST.md) and [release candidate report](docs/releases/V1-RELEASE-CANDIDATE-REPORT.md) for release decisions. Earlier phase reports below describe historical milestones, not current launch approval.

Outstanding gates recorded in the checklist are production S3/R2 credentials, Android release signing, a physical background GPS field trial, and owner acceptance. Live cloud health and physical-device behavior were not rechecked during the local project check.

Local validation at commit `d35b8f3`:

- Lint, TypeScript checks, and builds: 18 tasks passed (13 cached).
- API: 182 tests passed, 4 live R2 tests skipped because credentials were absent.
- Web: 7 tests passed; worker: 2 tests passed.
- Flutter: analysis found no issues; all 60 tests passed.

## Repository layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js dashboard |
| `apps/mobile` | Flutter app for employee, manager, and owner roles |
| `services/api` | Fastify API, authentication, tenancy, and domain workflows |
| `services/worker` | BullMQ scheduled and background jobs |
| `packages/contracts` | Zod schemas, OpenAPI export, and Dart client generator |
| `packages/database` | Drizzle schemas, migrations, and database role provisioning |
| `packages/tokens` | Web and Flutter tokens derived from approved brand assets |
| `generated/dart-api` | Generated Dart API client |
| `docs` | Product requirements, architecture, deployment, and release records |

## Local development

Prerequisites: Node.js 22 or newer, pnpm 11.22.0 (as pinned in `package.json`), Flutter on PATH, and Docker Compose. See [contributing](CONTRIBUTING.md), the [agent handoff](docs/handoff/CODEX-CLOUD-HANDOFF.md), and the [frozen PRD](docs/product/OPRINO-MASTER-PRD.md) before changing the project.

From the repository root:

```sh
pnpm install --frozen-lockfile
docker compose up -d
pnpm exec turbo run build
pnpm --filter @oprino/database migrate
pnpm --filter @oprino/database provision-roles
pnpm dev
```

Local defaults use PostgreSQL at port 5432, Redis at 6379, the API at 3001, and the web dashboard at 3000. Supply overrides through environment variables and validate them against each service's configuration schema. Production requires real storage credentials and production authentication settings.

To validate TypeScript packages and documentation:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test
node scripts/validate-doc-links.mjs
```

Build before running API tests: they execute compiled files in `dist`. API integration tests require the local PostgreSQL/PostGIS and Redis services, migrations, and roles. The test suite creates and removes test records; use a development or disposable database. Live R2 tests require separate storage credentials and are skipped when absent.

Mobile checks run separately:

```sh
cd apps/mobile
flutter pub get
flutter analyze
flutter test
```

For the current GPS implementation, see [ADR-021](docs/architecture/ADR-021-zero-cost-gps-pipeline.md), which supersedes the earlier Transistorsoft dependency for development and pilot operations. Off-duty tracking is prohibited; peer location visibility is off by default; tenant isolation uses transaction-scoped RLS.

The [documentation index](docs/README.md) links to all specifications. Approved assets in [Oprino-Brand-Kit](Oprino-Brand-Kit/README.md) must be preserved.

## Planning and brand reference archive

The sections below retain the original planning and brand reference links. For current release readiness, use the dated checklist above.

---

## Phase 00 Documentation (APPROVED & FROZEN)

All product planning, scoping, brand audit, and pre-development freeze documents were formally **APPROVED & FROZEN** by stakeholder sign-off (October 2026). These remain the controlling product baseline:

| Document | Description |
|---|---|
| [`docs/audits/PROJECT-INVENTORY.md`](./docs/audits/PROJECT-INVENTORY.md) | Repository audit, file inventory, checksum verification, and recommendations. |
| [`docs/brand/OPRINO-BRAND-SYSTEM.md`](./docs/brand/OPRINO-BRAND-SYSTEM.md) | Authoritative brand rules, colors, typography, spacing, and accessibility constraints. |
| [`docs/product/PRODUCT-DEFINITION.md`](./docs/product/PRODUCT-DEFINITION.md) | Core product definition, primary product loop, principles, and non-goals. |
| [`docs/product/ROLES-AND-PERMISSIONS-PLAN.md`](./docs/product/ROLES-AND-PERMISSIONS-PLAN.md) | RBAC architecture for default roles (Owner, Manager, Employee) and custom roles. |
| [`docs/product/V1-SCOPE.md`](./docs/product/V1-SCOPE.md) | Feature classification (MUST, SHOULD, LATER, OUT OF SCOPE) for lean V1 launch. |
| [`docs/product/APP-SURFACES.md`](./docs/product/APP-SURFACES.md) | Information architecture for Employee Mobile, Manager Mobile, and Web Dashboard. |
| [`docs/product/COMPETITIVE-POSITIONING.md`](./docs/product/COMPETITIVE-POSITIONING.md) | Analysis vs TaskOPad & Unolo; parity, differentiation, and long-term moats. |
| [`docs/business/PRICING-STRATEGY.md`](./docs/business/PRICING-STRATEGY.md) | Hybrid pricing architecture (Starter, Growth, Business, Enterprise) and add-ons. |
| [`docs/product/ROADMAP.md`](./docs/product/ROADMAP.md) | Phased product roadmap: V1, V1.5, V2, and V3 (with AI decoupled from V1). |
| [`docs/product/OPRINO-MASTER-PRD.md`](./docs/product/OPRINO-MASTER-PRD.md) | Comprehensive 30-section Master PRD consolidating all specifications. |
| [`docs/product/PLAN-FREEZE-CHECKLIST.md`](./docs/product/PLAN-FREEZE-CHECKLIST.md) | Gatekeeper checklist verifying pre-development freeze readiness. |

---

## Phase 01A Documentation (APPROVED & FROZEN)

Phase 01A is approved and frozen per the handoff. The ADR register includes subsequent approved decisions, including ADR-021; individual documents preserve their original decision dates and review statuses:

| Document | Description |
|---|---|
| [`docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md`](./docs/architecture/OPRINO-TECHNICAL-ARCHITECTURE.md) | Master C4 system architecture document with Mermaid diagrams across all levels. |
| [`docs/architecture/ADR/README.md`](./docs/architecture/ADR/README.md) | Complete register of all 20 Architecture Decision Records (ADR-001 through ADR-020). |
| [`docs/architecture/TECHNOLOGY-DECISION-MATRIX.md`](./docs/architecture/TECHNOLOGY-DECISION-MATRIX.md) | Weighted decision matrix evaluating all 20 technology selections against alternatives. |
| [`docs/architecture/SYNC-CONFLICT-MATRIX.md`](./docs/architecture/SYNC-CONFLICT-MATRIX.md) | Deterministic conflict resolution rules for offline-first mobile synchronization. |
| [`docs/architecture/LOCATION-PIPELINE.md`](./docs/architecture/LOCATION-PIPELINE.md) | End-to-end GPS acquisition, power management, 3-boundary duty cutoff, and purge pipeline. |
| [`docs/architecture/PRIVACY-ARCHITECTURE.md`](./docs/architecture/PRIVACY-ARCHITECTURE.md) | Technical enforcement of 30-day retention, peer privacy, and zero off-duty tracking. |
| [`docs/architecture/SECURITY-ARCHITECTURE.md`](./docs/architecture/SECURITY-ARCHITECTURE.md) | 5-tier defense-in-depth model: Edge WAF, audited Better Auth, 5-stage tenant verification, and pooled `SET LOCAL` RLS. |
| [`docs/architecture/THREAT-MODEL.md`](./docs/architecture/THREAT-MODEL.md) | Comprehensive STRIDE threat analysis covering 11 critical threats and architectural mitigations. |
| [`docs/architecture/AUDIT-LOG-ARCHITECTURE.md`](./docs/architecture/AUDIT-LOG-ARCHITECTURE.md) | Append-only audit trail design integrated with the Transactional Outbox pattern. |
| [`docs/architecture/TESTING-STRATEGY.md`](./docs/architecture/TESTING-STRATEGY.md) | Testing pyramid: Vitest unit tests, real PostgreSQL integration tests, and k6 load tests. |
| [`docs/architecture/ENVIRONMENT-STRATEGY.md`](./docs/architecture/ENVIRONMENT-STRATEGY.md) | 4-tier environment progression, Doppler/Infisical secrets management, and Zod env validation. |
| [`docs/architecture/CONTRACT-STRATEGY.md`](./docs/architecture/CONTRACT-STRATEGY.md) | Single source of truth across the monorepo via `@oprino/contracts` and Zod schemas. |
| [`docs/architecture/RETENTION-ARCHITECTURE.md`](./docs/architecture/RETENTION-ARCHITECTURE.md) | Automated 30-day partition drops, pre-purge mileage rollups, and least-privileged maintenance. |
| [`docs/architecture/INFRA-COST-MODEL.md`](./docs/architecture/INFRA-COST-MODEL.md) | Parameterized SMB unit economics: ~$0.40/user/mo at scale delivering 87-90% gross margin; decoupled software licensing. |
| [`docs/architecture/FAILURE-MODES.md`](./docs/architecture/FAILURE-MODES.md) | 20 real-world field failure scenarios and automated self-healing recovery runbooks. |
| [`docs/architecture/TECHNICAL-RISK-REGISTER.md`](./docs/architecture/TECHNICAL-RISK-REGISTER.md) | Risk register with probability, severity, early triggers, and proactive mitigations. |
| [`docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md`](./docs/architecture/PHASE-01A-FREEZE-CHECKLIST.md) | Final architecture freeze verification ending with `Approval: PENDING`. |

---

## Brand Kit Structure & Quick Links

### 1. Brand Guidelines & Overview
- [Brand Guidelines (Markdown)](./Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Guidelines.md)
- [Brand Guidelines (PDF)](./Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Guidelines.pdf)
- [Brand Board (PNG)](./Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Board.png) | [Brand Board (SVG)](./Oprino-Brand-Kit/04-Guidelines/Oprino-Brand-Board.svg)
- [Canva Templates & Links](./Oprino-Brand-Kit/Canva-Links.md)
- [Quick Start Guide (Hindi)](./Oprino-Brand-Kit/START-HERE-Hindi.md)

---

### 2. Logos (`01-Logos/`)
All 16 variations are available in SVG (outlined vector paths, no external font dependencies), 4096px high-res transparent PNG, and vector PDF:

| Layout | Variants | Formats |
|---|---|---|
| **Horizontal** | Full-color, Reversed, Black, White, Flat Navy, Flat Blue | [SVG](./Oprino-Brand-Kit/01-Logos/SVG), [PNG](./Oprino-Brand-Kit/01-Logos/PNG), [PDF](./Oprino-Brand-Kit/01-Logos/PDF) |
| **Stacked** | Full-color, Reversed, Black, White | [SVG](./Oprino-Brand-Kit/01-Logos/SVG), [PNG](./Oprino-Brand-Kit/01-Logos/PNG), [PDF](./Oprino-Brand-Kit/01-Logos/PDF) |
| **Icon Only** | Full-color, Flat Navy, Black, White | [SVG](./Oprino-Brand-Kit/01-Logos/SVG), [PNG](./Oprino-Brand-Kit/01-Logos/PNG), [PDF](./Oprino-Brand-Kit/01-Logos/PDF) |
| **Wordmark** | Flat Navy, White | [SVG](./Oprino-Brand-Kit/01-Logos/SVG), [PNG](./Oprino-Brand-Kit/01-Logos/PNG), [PDF](./Oprino-Brand-Kit/01-Logos/PDF) |
| **Catalog** | Complete Multi-Page Variation PDF | [Oprino-Logo-Variations.pdf](./Oprino-Brand-Kit/01-Logos/Oprino-Logo-Variations.pdf) |

---

### 3. Digital Assets (`02-Digital/`)
- **App Icons**: Light & Dark mode (1024px & 4096px 4K)
- **Social Avatar**: 1024px & 4096px 4K
- **Favicons**: 16x16, 32x32, 48x48, 64x64, 128x128, 180x180, 192x192, 512x512, `.ico`, `.svg`, and [site.webmanifest](./Oprino-Brand-Kit/02-Digital/Favicons/site.webmanifest)

---

### 4. Templates (`03-Templates/`)
- **Business Cards**: 90 x 55 mm trim with 3 mm bleed ([Print PDF](./Oprino-Brand-Kit/03-Templates/Oprino-Business-Card-Print.pdf), [Front SVG](./Oprino-Brand-Kit/03-Templates/Oprino-business-card-front.svg), [Back SVG](./Oprino-Brand-Kit/03-Templates/Oprino-business-card-back.svg))
- **Letterhead**: A4 210 x 297 mm ([Print PDF](./Oprino-Brand-Kit/03-Templates/Oprino-Letterhead-A4.pdf), [SVG](./Oprino-Brand-Kit/03-Templates/Oprino-letterhead-template.svg))
- **Social Post Template**: 1080 x 1080 (SVG & 2x PNG)
- **Social Cover Banner**: 1584 x 396 (SVG & 2x PNG)
- **Web Hero Template**: 1600 x 900 (SVG & 2x PNG)
- **Email Signature**: [HTML Template](./Oprino-Brand-Kit/03-Templates/Oprino-email-signature.html)

---

### 5. Design Tokens & Styling (`05-Design-Tokens/`)
- [CSS Variables](./Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.css)
- [JSON Design Tokens](./Oprino-Brand-Kit/05-Design-Tokens/Oprino-tokens.json)
- [GPL Palette File](./Oprino-Brand-Kit/05-Design-Tokens/Oprino-palette.gpl)

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
- [Master Vector Icon](./Oprino-Brand-Kit/07-Source/Oprino-icon-vector-master.svg)
- Vector trace definition & automated Python asset builders
- Original icon provenance and reference images
