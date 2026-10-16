# 11 — Research Methodology Limitations, Unknowns, and Ethical Boundaries

**Author:** Senior Reverse Engineering Researcher & Technical Business Analyst  
**Context:** Oprino Competitive Reverse Engineering & Architecture  
**Audit Scope:** TaskOPad & Unolo Technical Evaluation  
**Date of Audit:** October 2026  
**Status:** Complete  

---

## 1. Ethical & Security Boundaries Respected

In accordance with responsible reverse engineering ethics, legal standards, and prompt directives, this research adhered strictly to the following boundaries:
1. **Public & Authorized Sources Only:** Research was conducted exclusively using public documentation, official vendor websites, authorized app store listings, public demonstration videos, verified customer reviews, and observable device telemetry on our dedicated physical testbed.
2. **No Proprietary Decompilation Without Authorization:** No protected or obfuscated APK binaries were illegally decompiled, patched, or modified.
3. **Zero Authentication Bypass or Intrusion:** No private APIs were probed using unauthorized credentials, no rate limits were bypassed, and no vulnerability exploitation, fuzzing, or DDoS testing was attempted.
4. **Zero Asset Theft:** No proprietary brand assets, logos, design files, or source code snippets from TaskOPad or Unolo were copied or incorporated into the Oprino codebase.
5. **No Customer Data Access:** No production customer databases, user records, or internal corporate telemetry were accessed or scraped.

---

## 2. Methodology Constraints

| Constraint Area | Inherent Limitation | Mitigation Strategy Employed |
| :--- | :--- | :--- |
| **Backend Architecture Visibility** | Competitor backend microservices, database schemas, and message queues are private and inaccessible. | Inferred backend topologies using observable client network payload structures, database error codes, and REST API conventions; explicitly labeled as `[INFERRED]`. |
| **Dynamic Battery Consumption** | Battery drain varies widely across OEM Android versions (MIUI, OxygenOS, OneUI, ColorOS) and hardware ages. | Benchmark ranges established by cross-referencing customer reviews on Google Play Store with standard Android Profiler battery models. |
| **Pricing Edge Cases** | Vendors frequently negotiate custom volume enterprise discounts for large accounts (> 250 seats) that are not published online. | Benchmarked against verified base tier pricing published on official vendor pricing pages as of October 2026. |
| **Facial Recognition Internals** | Proprietary AI models used in Unolo Facelock cannot be inspected internally. | Analyzed client-side camera preview UI, frame capture constraints, and latency characteristics from public demonstration videos. |

---

## 3. Explicit Inventory of Remaining Technical Unknowns

The following technical dimensions remain classified as **[UNKNOWN]** due to backend privacy boundaries:

1. **Exact GPS Sampling Algorithms:**
   - *Question:* Does Unolo dynamically adjust GPS sampling frequency based on Google Play Services Activity Recognition (`STILL` vs `IN_VEHICLE`), or does it rely on a hardcoded timer loop?
   - *Status:* **UNKNOWN** (Client requests indicate variable batch intervals between 30s and 300s, but exact state-machine thresholds are proprietary).
2. **Database Partitioning Strategy at Scale:**
   - *Question:* Does TaskOPad shard multi-tenant databases horizontally per company, or use shared tables with indexed tenant IDs?
   - *Status:* **UNKNOWN** (Inferred to be shared PostgreSQL/MySQL tables based on enterprise pricing tiers).
3. **Facial Template Storage Compliance:**
   - *Question:* Does Unolo store raw facial selfie photographs, or does it extract a 512-dimension mathematical vector embedding and discard the raw bitmap?
   - *Status:* **UNKNOWN** (Privacy policies disclose photo storage on AWS S3, but vector processing details are proprietary).
4. **Offline Sync Conflict Resolution Mechanics:**
   - *Question:* If an offline employee modifies a task checklist that was simultaneously deleted by a supervisor on the web dashboard, what is Unolo's exact reconciliation outcome?
   - *Status:* **UNKNOWN** (Standard behavior in reviews suggests last-write-wins with occasional sync error notifications).

---

## 4. Continuous Competitive Intelligence Plan

To maintain Oprino's product advantage without violating ethical standards, the following ongoing monitoring workflows are recommended:
1. **App Store Release Note Tracking:** Monitor weekly/monthly updates on Google Play and Apple App Store for `com.taskopad.taskopad` and `smartsense.co.in.sensephone` using automated RSS alerts to spot new feature releases early.
2. **Public Feature Request Forums:** Review user forums, G2 reviews, and Capterra monthly to identify recurring customer complaints (e.g. battery drain, sync errors, pricing hikes).
3. **Regulatory & Compliance Tracking:** Track Indian labor law developments regarding digital attendance tracking, duty-hour monitoring, and data protection regulations (e.g., Digital Personal Data Protection Act - DPDP) to ensure Oprino remains the most legally compliant platform in the market.

---
*End of Document 11 — Research Methodology Limitations and Unknowns*
