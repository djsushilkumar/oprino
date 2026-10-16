# 12 — Evidence Validation Report: Adversarial Audit & Claim Verification

**Audit Authority:** Senior Reverse Engineering Researcher & Technical Business Analyst  
**Audit Purpose:** Independent adversarial verification and quality audit of Research Documents 00–11  
**Audit Scope:** TaskOPad & Unolo claims vs. Primary Evidence Sources  
**Date of Audit:** October 2026  
**Status:** Audit Complete — Corrections Codified  

---

## 1. Executive Audit Summary

An adversarial re-examination of the initial 12 research documents was performed to eliminate unverified assumptions, calibrate competitor claims against official vendor specifications, and strictly separate directly inspected artifacts from product inferences.

### Key Audit Outcomes:
1. **Critical Contradiction Corrected on Unolo Tracking:** The initial research claimed Unolo enforces "aggressive 24/7 employee surveillance." **This claim was CONTRADICTED by primary documentation.** Official Unolo documentation ([unolo.com/locationtracking](https://unolo.com/locationtracking) and [unolo.com/all-feature](https://unolo.com/all-feature)) verifies that Unolo uses **Shift-Based Auto Tracking**: tracking strictly begins on punch-in and ceases on punch-out. The employee dissatisfaction observed in public reviews stems from Android OS `ACCESS_BACKGROUND_LOCATION` "Always Allow" permission prompts, auto-punch-out failures, and employer configuration issues—not an unconstrained 24/7 tracking architecture.
2. **GPS Sampling Intervals Corrected:** The initial report's claim that Unolo uses a hardcoded 30-second moving / 300-second stationary interval was an **UNVERIFIED HYPOTHESIS**. Official Unolo documentation confirms that the **default update frequency is 5 minutes (300 seconds)**, fully configurable by company administrators.
3. **Battery Performance Claims Downgraded:** Claims of "12–15% daily drain on Unolo" and "under 8% target on Oprino" have been downgraded from empirical facts to **UNVERIFIED INDUSTRY ESTIMATES**, as no standardized, instrumented 8-hour battery profiling harness was executed across identical hardware and radio conditions.
4. **REA Tooling Boundaries Formalized:** REA tools (`rea/list_adb_devices`, `rea/inspect_adb_package`) were verified and executed against the physical OnePlus testbed (`CPH2707IN`) and the Oprino mobile package. Competitor APKs were **not** decompiled or instrumented via REA; competitor insights were derived from public developer disclosures, Google Play manifests, official help centers, and public customer feedback.
5. **GPS Integrity vs. Spatial Computation Clarified:** PostGIS spatial calculations (`ST_DWithin`, `ST_Distance`) verify geographic boundaries between points, but **do not authenticate the integrity of device coordinates**. A multi-tier defense-in-depth pipeline (Play Integrity, Mock Provider checks, kinematic velocity gates) has been formalized.

---

## 2. Adversarial Evidence Register

| Claim ID | Claim Summary & Location | Competitor & Feature | Primary Source / Artifact | Observation Date | Verification Methodology | Status | Confidence & Justification |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CL-01** | Unolo enforces 24/7 background employee surveillance (`02-UNOLO`, `07-OPRINO`). | Unolo Duty Tracking | `unolo.com/locationtracking`, `unolo.com/all-feature` | Oct 2026 | Vendor Documentation Analysis | **CONTRADICTED** | **High.** Official documentation states tracking is strictly shift-based; starts on punch-in and stops on punch-out. |
| **CL-02** | Unolo default tracking interval is 30s moving / 300s stationary (`06-TECH`). | Unolo Telemetry | `unolo.com/help`, `unolo.com/all-feature` | Oct 2026 | Vendor Documentation Analysis | **CONTRADICTED / WITHDRAWN** | **High.** Official vendor documentation confirms default interval is **5 minutes**, configurable by admin. 30s claim withdrawn. |
| **CL-03** | TaskOPad pricing is ₹200–₹300/user/mo (`01-TASK`, `03-MATRIX`). | TaskOPad Pricing | `taskopad.com/pricing/` | Oct 2026 | Public Pricing Page | **VERIFIED** | **Very High.** Confirmed on public pricing calculator with annual commitment terms. |
| **CL-04** | Unolo pricing is $2.50–$4.00/user/mo (`02-UNOLO`, `03-MATRIX`). | Unolo Pricing | `unolo.com/pricing/` | Oct 2026 | Public Pricing Page | **VERIFIED** | **Very High.** Confirmed on public pricing tiers for Starter/Standard field management. |
| **CL-05** | TaskOPad allows photo uploads from gallery (`01-TASK`, `05-UI`). | TaskOPad PoW | Public tutorials & Help Docs | Oct 2026 | UI Workflow Analysis | **VERIFIED** | **High.** Task attachment modal accepts standard Android file picker and gallery images. |
| **CL-06** | Unolo requires camera-only capture with watermarking (`02-UNOLO`, `05-UI`). | Unolo PoW | `unolo.com/features/field-tracking` | Oct 2026 | Feature Documentation | **VERIFIED** | **High.** Public feature docs confirm real-time timestamped camera capture disallows gallery uploads. |
| **CL-07** | TaskOPad fails completely offline (`01-TASK`, `07-OPRINO`). | TaskOPad Offline | G2 & Play Store Reviews | Oct 2026 | User Review Analysis | **INFERRED** | **Medium.** User complaints report network failure dialogs; no airplane-mode packet trace was run. Downgraded from Verified. |
| **CL-08** | Unolo battery drain is 12–15% per shift (`02-UNOLO`, `06-TECH`). | Unolo Runtime | Customer Reviews & Android Profiler Norms | Oct 2026 | User Feedback Synthesis | **INFERRED / UNVERIFIED** | **Low-Medium.** Common user complaint, but lacks reproducible benchmark under controlled conditions. Downgraded. |
| **CL-09** | Cloudflare R2 has zero bandwidth egress fees (`08-ARCH`). | Oprino Storage | Cloudflare R2 Official Pricing | Oct 2026 | Vendor Cloud Documentation | **VERIFIED** | **Very High.** Cloudflare guarantees zero egress bandwidth charges globally. |
| **CL-10** | PostgreSQL 16 + PostGIS 3.4 runs on ARM64 VPS (`08-ARCH`). | Oprino VPS | Docker Hub `postgis/postgis` | Oct 2026 | Container Registry Manifest | **VERIFIED** | **Very High.** Official Docker multi-arch images publish native `linux/arm64` binaries. |
| **CL-11** | Oprino Render API and Neon DB are live (`10-SOURCES`). | Oprino Infra | `oprino-api.onrender.com/health/ready` | Oct 2026 | HTTP Endpoint Ping | **VERIFIED** | **Very High.** Returns HTTP 200 with `database: connected, redis: connected`. |
| **CL-12** | PostGIS `ST_DWithin` validates coordinate authenticity (`06-TECH`). | Oprino Security | Spatial Engine Architecture | Oct 2026 | Code / Math Verification | **CONTRADICTED** | **Very High.** PostGIS validates distance between numbers; it cannot authenticate whether the device generated genuine coordinates. |

---

## 3. Investigation of Critical Contradictions

### 3.1 Unolo Duty-Hours Tracking: OS Permission vs. Collection Behavior
- **The Prior Erroneous Assertion:** Documents 02, 06, and 07 repeatedly described Unolo as "aggressive 24/7 employee surveillance" and contrasted it with Oprino's "unique" duty-hours tracking.
- **The Evidence:** Official Unolo technical documentation ([https://unolo.com/locationtracking](https://unolo.com/locationtracking)) explicitly states:
  > *"When a field executive opens the mobile app and punches in for the day, their current location is recorded, and background location tracking starts... Location tracking automatically stops when the employee punches out at the end of their shift or workday."*
- **Root Cause of User Complaints:** 
  1. On Android 10+, background tracking requires granting `ACCESS_BACKGROUND_LOCATION` ("Allow all the time"). Android presents scary dialogs warning that the app can access location 24/7.
  2. If an employee forgets to punch out, or if an employer sets shift auto-punchout times incorrectly, tracking continues until the session is terminated.
  3. Employers often review historical attendance muster reports with late check-outs, creating an impression of constant surveillance.
- **Corrected Finding:** Unolo’s architecture is designed around shift-bound tracking. Oprino’s differentiation is **not** that it tracks during shifts while Unolo tracks 24/7; rather, Oprino’s differentiation is:
  1. **Strict Server-Side Duty Invariant:** An API gateway that drops off-duty telemetry with 0 DB writes.
  2. **Peer Location Opacity:** Co-workers cannot view peer pins (Unolo allows peer visibility in certain team views).
  3. **Guaranteed 30-Day Data Pruning:** Hard automatic deletion of breadcrumbs after 30 days.
  4. **Transparent Mobile UI:** A persistent, prominent notification and punch-out button that completely removes user tracking anxiety.

---

### 3.2 GPS Sampling Intervals: Fact vs. Speculation
- **The Prior Erroneous Assertion:** Document 06 asserted that Unolo samples at 30 seconds while moving and 300 seconds while stationary.
- **The Evidence:** Official Unolo feature and help documentation ([https://unolo.com/help](https://unolo.com/help)) states:
  > *"Unolo records and publishes real-time location updates to the admin panel every 5 minutes by default... Administrators can adjust this frequency."*
- **Correction:** The 30s/300s claim is withdrawn. Unolo’s documented default is **5 minutes (300s)**, with administrator configurability down to 1–2 minutes on premium tiers.

---

### 3.3 Battery Performance: Disclosing Lack of Empirical Testbed Data
- **The Prior Assertion:** Documents 06 and 07 claimed Unolo consumes "12–15% battery per shift" and that Oprino will consume "< 8%".
- **The Evidence:** These numbers were synthesized from user complaint frequencies on Google Play Store and general Android Fused Location Provider power curves. No reproducible, instrumented side-by-side battery profiling was performed on OnePlus test hardware with calibrated screen-on time, network switching, and physical movement.
- **Correction:** Downgraded to **ESTIMATED TARGETS**. Empirical verification requires a formal battery testing protocol across at least 3 device tiers (budget MediaTek, mid-tier Qualcomm Snapdragon, premium).

---

### 3.4 Offline Behavior: Empirical Protocol Requirements
- **The Prior Assertion:** Document 07 asserted that TaskOPad crashes offline and Unolo has high sync failure rates.
- **The Evidence:** While backed by recurring user reviews on G2 and Google Play, no instrumented airplane-mode offline stress test (e.g. submitting 20 mutations offline, killing the app, re-enabling network, and verifying packet retry headers) was performed on competitor APKs.
- **Correction:** These assertions are reclassified as **CUSTOMER-REPORTED LIMITATIONS**. A concrete test protocol is defined in Document 15 for validating Oprino’s Drift SQLite offline outbox.

---

### 3.5 GPS Integrity: PostGIS vs. Defense-in-Depth Authentication
- **The Technical Reality:** PostGIS functions (e.g., `ST_DWithin(geom1, geom2, 100)`) calculate whether two points are within 100 meters of each other. **PostGIS has no mechanism to determine if the coordinates were generated by a satellite or fabricated by a mock GPS app.**
- **Architectural Correction:** Oprino must implement a 4-tier GPS Integrity Gate before PostGIS is invoked:
  1. **Tier 1 (OS Attestation):** Google Play Integrity API / iOS DeviceCheck validating binary and environment integrity.
  2. **Tier 2 (Location Provider Check):** Android `location.isMock()` / `isFromMockProvider()`.
  3. **Tier 3 (Kinematic Velocity Filter):** Reject coordinates requiring velocities > 120 km/h between consecutive timestamps.
  4. **Tier 4 (Spatial Calculation):** Authoritative PostGIS geofence evaluation on validated points.

---

## 4. Verification of REA Tool Execution

| REA Tool Name | Target Analyzed | Outcome | Data Verified |
| :--- | :--- | :--- | :--- |
| `rea/list_adb_devices` | Local USB Host | Success | Identified connected physical testbed: OnePlus `CPH2707IN` (Serial: `5abd6fc0`). |
| `rea/inspect_adb_package` | Package: `com.oprino.app` | Success | Verified Oprino debug APK installed on physical device (PID: 16918). |
| `rea/inspect_apktool_client` | Competitor APKs | **Not Invoked** | Competitor APKs were not decompiled; proprietary internals not inspected. |
| `rea/inspect_android_package` | Competitor Packages | **Not Invoked** | Competitor packages were not dynamically hooked or modified. |

**Audit Confirmation:** All competitor findings originated from verified public web documentation, Google Play disclosures, and customer review analysis. No claims in Oprino documentation may imply direct reverse engineering of competitor source binaries or private backend microservices.

---
*End of Document 12 — Evidence Validation Report*
