# ADR-020: Mobile Application Packaging Strategy (Unified Role-Aware Flutter App)

**Status:** APPROVED (Updated for Flutter Baseline)  
**Date:** October 2026 (Revised & Re-Architected)  
**Deciders:** Lead Systems Architect, Mobile Engineering, Product  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/APP-SURFACES.md`](../product/APP-SURFACES.md))\
**Underlying Framework:** Flutter Stable (Phase 01C Scaffolding; Reference Baseline: Flutter 3.47 / Stable Dart Toolchain) ([`ADR-001`](./ADR-001-mobile-framework.md))

---

## 1. Context & Problem Statement

Phase 00 PRD defines two core mobile operational experiences:
1. **Employee Mobile Surface:** Punch-in/out, agenda, task checklists, photo proof capture, customer signature on glass, and duty-hours background location tracking.
2. **Owner / Manager Mobile Surface:** Live operational map, team attendance oversight, instant proof-of-work approvals, exception alerts, and rapid task creation/dispatch.

The architectural question is how to package these surfaces for distribution on Google Play Store and Apple App Store:
- **Option A:** A **single, unified, role-aware mobile application** ("Oprino") built with Flutter that adapts its UI, navigation, and background services based on the user's active authenticated role.
- **Option B:** **Two separate mobile applications** ("Oprino Field" and "Oprino Manager") published as distinct store listings.

Key evaluation dimensions:
- Frontline user experience (UX) and navigation clarity.
- Security and permission segregation.
- Release management, CI/CD, and App Store review overhead.
- Background location permissions and App Store compliance.
- Frontline operational realities: **SMB Working Foremen and Managers who perform field tasks** (hybrid roles).
- Transistor Software commercial licensing implications.

---

## 2. Alternatives Evaluated

### Option A: Unified Role-Aware Flutter Mobile Application (`com.oprino.app`)
- **Architecture:** A single Flutter codebase and store binary. Upon login, the app inspects `workspace_memberships.role_id` and the user's active permissions:
  - Employees enter the **Field Workspace** (Tasks, Attendance, Checklists, Proof).
  - Owners/Managers enter the **Operations Management Workspace** (Live Map, Approvals, Team Status).
  - Hybrid users (e.g. working foremen, lead technicians, site supervisors) are provided a seamless top-bar surface switcher ("Field Mode" ↔ "Manager Mode").
- **Background Location:** Permission is requested **contextually** only when an employee or field-active user begins an on-duty shift, with prominent in-app disclosure.

### Option B: Separate Binaries ("Oprino Field" & "Oprino Manager")
- **Architecture:** Two distinct mobile apps built from separate entry points, published under separate Bundle IDs (`com.oprino.field` and `com.oprino.manager`).
- **Employee App:** Contains background location foreground services and field task workflows.
- **Manager App:** Contains zero background location capabilities; focused purely on dashboard maps, team tracking, and approvals.

---

## 3. Comparative Evaluation Matrix

| Evaluation Criterion | Weight | Option A: Unified Role-Aware Flutter App | Option B: Separate Store Binaries |
|---|:---:|:---:|:---:|
| **SMB Hybrid User Workflow (Working Foremen)** | 20% | **10 / 10** (Seamless surface switch in 1 app) | 3 / 10 (Must juggle & install 2 apps) |
| **Release Management & CI/CD Overhead** | 20% | **10 / 10** (1 build, 1 review, 1 release) | 4 / 10 (2x builds, 2x reviews, store drift) |
| **Multi-Company Tenancy (Technician & Owner)** | 15% | **10 / 10** (Row-level switch in 1 app) | 3 / 10 (Confusing cross-app conflicts) |
| **Code Sharing & Monorepo Simplicity** | 15% | **10 / 10** (Shared Dart widgets, 1 APK/IPA) | 7 / 10 (Separate bundle entry points) |
| **Commercial Licensing (Transistor Geolocation)**| 10% | **10 / 10** (Single App ID / 1 license) | 5 / 10 (Requires dual license registration) |
| **Brand Identity & App Store Optimization (ASO)**| 10% | **9.5 / 10** (Single canonical listing & reviews)| 6 / 10 (Split brand equity & reviews) |
| **App Store Background Review Scrutiny** | 10% | 8.5 / 10 (Contextual disclosure required) | **9.5 / 10** (Manager app has no GPS review) |
| **Weighted Total** | **100%** | **9.65 / 10** | **5.00 / 10** |

---

## 4. Decision & Rationale

**Selected Architecture: Option A — One Unified Role-Aware Oprino Flutter Application (`com.oprino.app`) with Dynamic Role-Driven Navigation Surfaces.**

### High-Level Mobile Application Architecture:

```text
Oprino Flutter App (com.oprino.app)
├── Employee Mode
│   ├── Duty Punch Card (GPS Verified)
│   ├── My Tasks Agenda & Route
│   ├── Offline Checklists & Status Transitions
│   └── Optical Proof Capture & Customer Sign-on-Glass
├── Manager Mode
│   ├── Real-Time Operational Team Map
│   ├── Proof-of-Work Approvals Inbox
│   ├── Team Attendance & Duty Status Grid
│   └── Instant Field Task Dispatch
└── Owner Quick-Control Surfaces
    ├── Workspace Switcher (Multi-Company Support)
    ├── Daily Operational Metrics Rollup
    └── Critical Exception Broadcast & Emergency Controls
```

### Decisive Rationale:
1. **The SMB "Working Foreman" Reality:** In 10–200 employee SMBs, job boundaries are fluid. A plumbing supervisor, electrical lead, or field sales manager frequently inspects jobs and manages a crew while also performing field tasks and signing for materials. Forcing these users to switch between two different mobile apps on the same physical phone is an intolerable user experience.
2. **Multi-Company Switching Parity:** A user can be a field contractor in Company A and an owner of Company B. A single app allows instant company switching via the profile header, dynamically adapting between Field Mode and Manager Mode.
3. **App Store Review & Release Velocity:** Maintaining two separate mobile applications doubles the CI/CD compilation matrix, doubles TestFlight/Internal Track distributions, and doubles the frequency of App Store review delays.
4. **Licensing Efficiency:** Transistor Software background geolocation licenses are bound by application package name / bundle ID. A single app ID (`com.oprino.app`) avoids doubled commercial licensing costs.
5. **Contextual Permission Governance:** Apple and Google guidelines explicitly allow role-conditional background location. The app requests `ACCESS_BACKGROUND_LOCATION` / `Always Allow` strictly when a user initiates an on-duty shift, preceded by an in-app prominent disclosure explaining duty tracking. Managers who do not punch into field shifts are never prompted for background location.

---

## 5. Architectural Implementation Guidelines

```mermaid
flowchart TD
    LOGIN["User Authenticates via Better Auth REST"]
    MEMBERSHIP["Resolve Active Workspace Membership & Permissions"]
    ROLE_CHECK{"Evaluate Role & Capability Flags"}

    subgraph Surfaces["Dynamic Flutter Shell Routes (GoRouter)"]
        FIELD["Employee Mode Surface<br>• Duty Punch Card<br>• Assigned Tasks Agenda<br>• Offline Checklists<br>• Proof Capture & Signatures"]
        MANAGER["Manager Mode Surface<br>• Real-Time Live Map<br>• Approvals Inbox<br>• Team Attendance Grid<br>• Dispatch Task Modal"]
        OWNER["Owner Quick-Control Surface<br>• Executive Daily Metrics<br>• Multi-Company Switcher<br>• Exception Broadcast"]
    end

    SWITCHER["Surface Switcher Header<br>(For Hybrid Roles / Working Foremen)"]

    LOGIN --> MEMBERSHIP --> ROLE_CHECK
    ROLE_CHECK -- "Role: Employee" --> FIELD
    ROLE_CHECK -- "Role: Manager" --> MANAGER
    ROLE_CHECK -- "Role: Owner" --> OWNER
    ROLE_CHECK -- "Hybrid Role (Foreman / Supervisor)" --> SWITCHER
    SWITCHER <--> FIELD & MANAGER
```

### 5.1 Role-Based Route Navigation (GoRouter + Riverpod / BLoC)
- Navigation tree is dynamically mounted based on the authenticated `activeWorkspaceRole`:
  - `EmployeeShellBranch`: Punch card, My Tasks, Task Detail, Proof Camera, Offline Outbox Status.
  - `ManagerShellBranch`: Live Map, Approvals, Team Status, Quick Dispatch.
  - `OwnerShellBranch`: Executive metric cards, tenant management, team hierarchy oversight.
- Deep links (e.g. from push notifications: `oprino://task/123` or Universal Links) resolve to the appropriate screen regardless of the active surface.

### 5.2 Background Location Activation Guard (Dart)
- `bg.BackgroundGeolocation.start()` is gated by a client permission and duty-shift check:
  ```dart
  Future<void> evaluateLocationTrackingState(DutyState dutyState) async {
    final hasDutyPermission = userPermissions.contains('location:track:duty');
    
    if (dutyState.isOnDuty && hasDutyPermission) {
      // Initialize and start foreground service with prominent duty notification
      await bg.BackgroundGeolocation.start();
    } else {
      // Deterministically stop tracking immediately
      await bg.BackgroundGeolocation.stop();
    }
  }
  ```
- Pure management users viewing live maps never initialize or start the native background tracking service on their personal phones.

---

## 6. Consequences & Trade-offs

- **Positive:**
  - Single mobile app to install, update, and review on App Store & Google Play.
  - Perfect fit for SMB supervisors and working foremen.
  - Single Transistor license; single CI/CD build pipeline.
  - Consistent Impeller-rendered design tokens across all surfaces.
- **Negative:**
  - The single binary contains both the field workflow and the manager dashboard UI components, resulting in a single unified APK/AAB (~18MB download size).
- **Mitigation:**
  - Dart AOT compilation and tree-shaking eliminate unused code, and Impeller's precompiled shaders ensure zero impact on launch latency or runtime memory footprints.

---

## 7. Compliance with Phase 00 Approved Scope

- Fully satisfies the requirement for Employee, Manager, and Owner mobile surfaces while dramatically simplifying mobile distribution and user onboarding.
