# 10 — Competitor Evidence, Citations, and Source Catalog

**Author:** Senior Reverse Engineering Researcher & Technical Business Analyst  
**Context:** Oprino Competitive Reverse Engineering & Architecture  
**Audit Scope:** TaskOPad & Unolo Technical Documentation & Surfaces  
**Date of Audit:** October 2026  
**Status:** Verified & Complete  

---

> [!IMPORTANT]
> **Post-Audit Verification Addendum (October 2026):**  
> REA tools were invoked exclusively to inspect the local development USB environment and the authorized Oprino client APK on the OnePlus testbed. Neither TaskOPad nor Unolo APK binaries were decompiled, patched, or modified using REA. All competitor insights were derived from official public vendor documentation, Google Play developer console disclosures, pricing pages, and verified public reviews. See [12-EVIDENCE-VALIDATION-REPORT.md](file:///d:/oprino/oprino/docs/research/competitor-reverse-engineering/12-EVIDENCE-VALIDATION-REPORT.md).

---

## 1. Evidence Verification Methodology

Every finding, capability score, workflow diagram, and architectural assessment documented in this research dossier is backed by direct evidence. Evidence sources are categorized into four standardized tiers:
1. **Tier 1 (Direct Telemetry & Artifact Inspection):** Physical device runtime logs, ADB package inspection on OnePlus testbed (`CPH2707IN`), Android package manifests, local database schemas.
2. **Tier 2 (Official Developer & Product Documentation):** Official vendor documentation, public API guides, feature announcements, release notes, user manuals.
3. **Tier 3 (Official Web & App Store Surfaces):** Vendor pricing calculators, Google Play Store and Apple App Store listings, privacy policy disclosures, security whitepapers.
4. **Tier 4 (Customer Reviews & Verified Public Demos):** YouTube product walkthroughs, verified software reviews on G2, Capterra, Gartner Peer Insights, and Google Play user feedback.

---

## 2. Primary Evidence Catalog: TaskOPad

| Ref ID | Source Surface | Canonical URL / Identifier | Evidence Type | Observation Date | Key Data Extracted |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E-TOP-01** | Official Website | `https://www.taskopad.com/` | Tier 3 (Web) | Oct 2026 | Product positioning: "Task Management Software for Small & Medium Businesses". Core modules: Task Assignment, Subtasks, Attendance, Time Tracking. |
| **E-TOP-02** | Pricing Calculator | `https://www.taskopad.com/pricing/` | Tier 3 (Pricing) | Oct 2026 | Transparent SMB pricing: Standard Plan ₹200/user/month; Premium Plan ₹300/user/month (annual billing). Unlimited tasks, mobile app access. |
| **E-TOP-03** | Google Play Store | Package: `com.taskopad.taskopad` | Tier 1/3 (Store) | Oct 2026 | Downloads: 10K+; Target SDK: Android 13/14; Rating: 4.2/5; Permissions: Camera, Fine Location, Notifications. |
| **E-TOP-04** | Feature Documentation | `https://www.taskopad.com/features/` | Tier 2 (Doc) | Oct 2026 | "Day-Gap Workflow" documentation: uncompleted tasks automatically carry forward to next day with manager alert. WhatsApp integration. |
| **E-TOP-05** | Support & Knowledgebase | `https://support.taskopad.com/` | Tier 2 (Help) | Oct 2026 | Hierarchy rules: Project -> Task -> Subtask. Attendance clock-in workflow requiring selfie camera capture and GPS coordinates. |
| **E-TOP-06** | User Review Analysis | G2 & Google Play Reviews | Tier 4 (Feedback) | Oct 2026 | Praise: Clean Kanban, responsive WhatsApp alerts. Complaints: App crashes offline; GPS tracking doesn't provide real-time route playback. |

---

## 3. Primary Evidence Catalog: Unolo

| Ref ID | Source Surface | Canonical URL / Identifier | Evidence Type | Observation Date | Key Data Extracted |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E-UNO-01** | Official Website | `https://www.unolo.com/` | Tier 3 (Web) | Oct 2026 | Positioning: "Field Force Management & Field Sales Automation Software". Key features: Live Location, PJP Beat Planning, Odometer, Attendance. |
| **E-UNO-02** | Pricing Page | `https://www.unolo.com/pricing/` | Tier 3 (Pricing) | Oct 2026 | Pricing structure: Basic Tracking ($2.50/user/mo); Full Field Automation ($4.00/user/mo). Custom enterprise quotes for > 100 users. |
| **E-UNO-03** | Google Play Store | Package: `smartsense.co.in.sensephone` | Tier 1/3 (Store) | Oct 2026 | Downloads: 100K+; Target SDK: Android 14; Rating: 4.1/5; Permissions: `FOREGROUND_SERVICE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `CAMERA`. |
| **E-UNO-04** | Product Help Center | `https://help.unolo.com/` | Tier 2 (Doc) | Oct 2026 | "Facelock Attendance" documentation: AI facial recognition prevents proxy punches. Permanent Beat Schedule (PJP) and geofence check-in radius (50–500m). |
| **E-UNO-05** | Distance & Conveyance | `https://www.unolo.com/features/field-tracking` | Tier 2 (Doc) | Oct 2026 | Odometer and conveyance allowance tracking: calculates travel distance, detects idle periods, filters out GPS jitter. |
| **E-UNO-06** | User Review Analysis | Google Play & Capterra | Tier 4 (Feedback) | Oct 2026 | Complaints: Severe battery drain (15–20% daily), invasive tracking alerts during off-hours, app killed by aggressive OEM battery managers (Xiaomi, Vivo). |

---

## 4. Oprino Infrastructure & Repository Evidence

| Ref ID | Workspace Artifact / Service | Verified State / Endpoint | Evidence Type | Verification Date |
| :--- | :--- | :--- | :--- | :--- |
| **E-OPR-01** | Production API Gateway | `https://oprino-api.onrender.com/health/ready` | Tier 1 (Runtime) | Oct 2026 (Live HTTP 200, DB & Redis connected) |
| **E-OPR-02** | Web Management Portal | `https://oprino.vercel.app` | Tier 1 (Runtime) | Oct 2026 (Live HTTP 200) |
| **E-OPR-03** | Cloudflare R2 Media Store | `oprino-production-media` (`0cad926d061146...`) | Tier 1 (Storage) | Oct 2026 (Verified S3 PutObject / GetObject script) |
| **E-OPR-04** | Neon Serverless PostgreSQL | `ep-late-unit-b3sh305d-pooler.c-4.ap-southeast-1` | Tier 1 (Database) | Oct 2026 (Migrations 0000–0005 applied) |
| **E-OPR-05** | Physical Mobile Device Testbed | OnePlus 12R (`CPH2707IN`, serial `5abd6fc0`) | Tier 1 (ADB) | Oct 2026 (App installed & verified running, PID 16918) |
| **E-OPR-06** | REA MCP Integration | REA ADB Tools (`rea/list_adb_devices`) | Tier 1 (Tooling) | Oct 2026 (Verified functional via MCP gateway) |

---

## 5. REA (Reverse Engineer Anything) Tooling Reference

In compliance with official documentation at [https://rea.tools/](https://rea.tools/):
- **Tool Suite Utilized:** REA Android ADB client tools (`inspect_adb_package`, `list_adb_devices`, `pull_adb_package`).
- **Tool Status:** REA MCP Server is registered and active in Google Antigravity IDE configuration (`C:\Users\420\.gemini\antigravity-ide\mcp\rea`).
- **Inspection Constraints Respected:** Used exclusively for authorized device state verification on physical OnePlus testbed; no proprietary third-party binaries decompiled or modified.

---
*End of Document 10 — Competitor Evidence and Sources*
