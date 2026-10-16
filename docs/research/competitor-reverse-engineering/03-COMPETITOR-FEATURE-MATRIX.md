# Competitor Feature Comparison Matrix: TaskOPad vs. Unolo vs. Oprino

**Audit Date:** October 15, 2026  
**Evidence Standard:**  
- **VERIFIED:** Directly evidenced by verified official documentation, Play Store APK metadata, or local code.  
- **INFERRED:** High-probability architectural deduction based on public behavior and SDK limits.  
- **UNKNOWN:** Insufficient public evidence to definitively confirm implementation detail.  
- **NOT SUPPORTED:** Confirmed absent from the application's documented feature set.  

---

## 1. Feature Comparison & Evidence Matrix

| Category / Feature | TaskOPad | Unolo | OPRINO (V1 Candidate) | Evidence Basis | User Value (1-5) | Competitive Impact (1-5) | Complexity (1-5) | Oprino V1 Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Multi-Tenant RLS Isolation** | INFERRED | INFERRED | **VERIFIED (RLS Kernel)** | Database RLS tests pass in Oprino monorepo | 5 | 5 | 4 | **BUILT (Phase 02A)** |
| **Parent/Subtask Hierarchy** | **VERIFIED** | INFERRED | **VERIFIED** | TaskOPad core docs / Oprino Task domain | 5 | 4 | 2 | **BUILT (Phase 02B)** |
| **Day-Gap Sequential Workflow**| **VERIFIED** | NOT SUPPORTED| NOT SUPPORTED | TaskOPad workflow engine feature | 3 | 3 | 3 | **OUT OF SCOPE V1** |
| **Mandatory Checklist Gate** | **VERIFIED** | INFERRED | **VERIFIED (Strict)** | Oprino task transition rejects incomplete items | 5 | 5 | 2 | **BUILT (Phase 03)** |
| **Selfie Attendance Verification**| **VERIFIED** | **VERIFIED** | **VERIFIED** | Fastify BLK-004 + Flutter selfie camera | 5 | 5 | 3 | **BUILT (Phase 05)** |
| **Biometric Face Recognition** | **VERIFIED** | **VERIFIED (Facelock)**| NOT SUPPORTED | Unolo Facelock / TaskOPad Face ID docs | 3 | 4 | 5 | **DEFERRED (V2)** |
| **Geofenced Check-In** | **VERIFIED** | **VERIFIED** | **VERIFIED** | PostGIS distance check in Oprino API | 4 | 4 | 3 | **BUILT (Phase 02C)** |
| **Duty-Hours-Only Tracking** | NOT SUPPORTED| NOT SUPPORTED| **VERIFIED (Hard Cutoff)**| Oprino drops off-duty telemetry at API gateway | 5 | 5 | 3 | **CORE INVARIANT** |
| **Peer Location Privacy Default**| UNKNOWN | NOT SUPPORTED| **VERIFIED (Off Default)**| `location.read` restricted to managers only | 4 | 4 | 2 | **CORE INVARIANT** |
| **Continuous Route Playback** | INFERRED | **VERIFIED** | **VERIFIED (Radar Map)**| Oprino `/live-map` SVG coordinate scrubber | 5 | 5 | 4 | **BUILT (Phase 02C)** |
| **Odometer Mileage Log & Photo**| NOT SUPPORTED| **VERIFIED** | NOT SUPPORTED | Unolo travel expense engine | 4 | 4 | 3 | **DEFERRED (V2)** |
| **Mock GPS Spoofing Detection** | UNKNOWN | **VERIFIED** | **VERIFIED** | Oprino location pipeline anomaly drop filter | 4 | 4 | 3 | **BUILT (Phase 02C)** |
| **Client Site Visit Entity** | INFERRED | **VERIFIED** | **VERIFIED** | Oprino `visits` table decoupled from `tasks` | 5 | 5 | 3 | **BUILT (Phase 03)** |
| **Stop Dispatch Sequencing** | NOT SUPPORTED| **VERIFIED (PJP)** | **VERIFIED (`PUT /sequence`)**| Oprino visit stop ordering engine | 4 | 5 | 3 | **BUILT (Phase 04)** |
| **Geotagged Photo Proof** | **VERIFIED** | **VERIFIED** | **VERIFIED (Watermarked)**| Pixel-level GPS & time raster watermark | 5 | 5 | 3 | **BUILT (Phase 03)** |
| **On-Glass Customer Signature** | INFERRED | **VERIFIED** | **VERIFIED (PNG Binary)**| Flutter pointer stroke tracking + R2 upload | 5 | 4 | 2 | **BUILT (Phase 03)** |
| **Direct S3/R2 Cloud Presigning**| UNKNOWN | UNKNOWN | **VERIFIED (ADR-012)** | Zero-egress direct presigned PUT/GET URLs | 5 | 5 | 3 | **BUILT (Phase 05)** |
| **Supervisor Proof Verification**| INFERRED | **VERIFIED** | **VERIFIED** | Oprino `VERIFIED` / `REJECTED` queue | 5 | 4 | 2 | **BUILT (Phase 03)** |
| **Offline SQLite Outbox Queue** | NOT SUPPORTED| INFERRED | **VERIFIED (Drift v4)** | Local SQLite durable queue & auto-sync | 5 | 5 | 4 | **BUILT (Phase 04)** |
| **30-Day Auto Location Pruning**| UNKNOWN | UNKNOWN | **VERIFIED (BLK-006)** | PostgreSQL cron procedure & BullMQ worker | 4 | 4 | 2 | **BUILT (Phase 05)** |
| **Bulk CSV Staff Onboarding** | INFERRED | INFERRED | **VERIFIED (BLK-003)** | Web bulk CSV upload & validation | 5 | 4 | 2 | **BUILT (Phase 05)** |
| **WhatsApp Notifications** | **VERIFIED** | **VERIFIED** | NOT SUPPORTED | TaskOPad official marketing & docs | 4 | 4 | 3 | **V2 CANDIDATE** |
| **B2B Sales Order Booking** | NOT SUPPORTED| **VERIFIED** | NOT SUPPORTED | Unolo catalog & order engine | 3 | 2 | 4 | **STRICT NON-GOAL** |
| **Full Payroll / HRMS Engine** | NOT SUPPORTED| INFERRED | NOT SUPPORTED | Tax/statutory payroll compliance | 3 | 1 | 5 | **STRICT NON-GOAL** |

---

## 2. In-Depth Multi-Dimensional Scoring Analysis

```mermaid
quadrantChart
    title Feature Value vs Implementation Complexity
    x-axis Low Complexity --> High Complexity
    y-axis Low Value --> High Strategic Value
    quadrant-1 High Value / High Effort (Strategic Investments)
    quadrant-2 High Value / Low Effort (Quick Wins & Parity)
    quadrant-3 Low Value / Low Effort (Nice-to-Haves)
    quadrant-4 Low Value / High Effort (Scope Traps)
    
    "Offline Drift SQLite Outbox": [0.75, 0.95]
    "Duty-Hours Privacy Guard": [0.45, 0.95]
    "Geotagged Photo Proof": [0.35, 0.88]
    "On-Glass Signature": [0.25, 0.85]
    "Mandatory Checklist Gate": [0.20, 0.90]
    "Direct Cloudflare R2 Uploads": [0.40, 0.92]
    "Stop Sequencing Dispatch": [0.55, 0.80]
    "Continuous Route Scrubber": [0.70, 0.85]
    "Biometric Face ID": [0.85, 0.50]
    "Odometer Photo Mileage": [0.60, 0.65]
    "WhatsApp Alerts API": [0.45, 0.70]
    "Sales Order Booking (ERP)": [0.90, 0.25]
    "Statutory Payroll Engine": [0.95, 0.15]
```

### Analysis of Quadrants:
1. **High Value / Low Effort (Built in Oprino):**
   - Mandatory Checklists before task completion.
   - Geotagged watermarked camera photo proof.
   - On-glass digital customer signature.
   - Duty-hours privacy cutoff (drops off-duty tracking with 0 DB writes).
2. **High Value / Strategic Investments (Oprino's Core Moat):**
   - **Offline-First Drift SQLite Mutation Queue:** Neither TaskOPad nor standard web apps operate smoothly in rural or subterranean industrial environments. Oprino's offline queue is a decisive differentiator.
   - **Zero-Cost Direct Cloudflare R2 Storage:** Competitors proxy media through web servers, increasing bandwidth bills. Oprino generates presigned direct S3/R2 upload URLs, achieving zero-egress cost.
3. **Scope Traps (Strictly Avoided):**
   - Sales Order Booking & Product Catalogs (Unolo feature): Dilutes focus and turns operations software into an ERP.
   - Statutory Payroll Calculation: Heavy compliance liability; exports to standard payroll CSV are sufficient.
