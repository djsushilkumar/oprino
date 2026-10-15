# Oprino — Comprehensive Testing Guide & Quality Gates

**Date:** October 15, 2026  
**Auditor & QA Lead:** Principal QA & Test Automation Lead  
**Scope:** V1 Monorepo Quality Verification  

---

## 1. Testing Architecture & Philosophy

Oprino enforces an uncompromising 5-tier testing pyramid to guarantee commercial launch readiness:

```
                  ┌──────────────────────┐
                  │ 5. Physical OEM Test │ (ADB / Hardware APK)
               ┌──┴──────────────────────┴──┐
               │ 4. Browser Journey E2E     │ (Playwright / Web Agent)
            ┌──┴────────────────────────────┴──┐
            │ 3. API & Cloud Integration Tests │ (Live PostGIS & Redis)
         ┌──┴──────────────────────────────────┴──┐
         │ 2. Database RLS & Multi-Tenant Tests   │ (Disposable DB / pgTAP)
      ┌──┴────────────────────────────────────────┴──┐
      │ 1. Unit & Contract Regression Tests          │ (Vitest / Flutter Test)
      └──────────────────────────────────────────────┘
```

**Non-Negotiable Rule:** NO FAKE PASS RESULTS. Mocks are restricted to unit tests. All multi-tenant, duty boundary, offline sync, and media tests run against real storage, real database, and real rendered interfaces.

---

## 2. Test Execution Commands

### Tier 1: Static Analysis, Types & Linting
```bash
# Verify entire monorepo builds and typechecks (8 packages)
pnpm turbo build
pnpm typecheck
pnpm lint
```

### Tier 2: Backend Unit & Integration Tests
```bash
# Contract schemas & Dart generator regression test
pnpm --filter @oprino/contracts test

# Media storage driver unit tests (S3 / Local storage HMAC security)
pnpm --filter @oprino/api test services/api/src/media-storage.unit.test.ts

# V1 Blockers integration suite (BLK-002 through BLK-006)
pnpm --filter @oprino/api test services/api/src/v1-blockers.integration.test.ts

# Multi-tenant RLS isolation tests
pnpm --filter @oprino/api test services/api/src/tenant-rls.integration.test.ts

# Telemetry, Geofence & Duty Boundary tests
pnpm --filter @oprino/api test services/api/src/telemetry-geofence.integration.test.ts
```

### Tier 3: Flutter Mobile Verification
```bash
cd apps/mobile

# Flutter static analysis (0 errors, 0 warnings)
flutter analyze

# Flutter unit and widget test suite
flutter test test/media_workflow_and_offline_reliability_test.dart
flutter test test/location_service_test.dart
flutter test test/app_config_test.dart
flutter test test/field_operations_mobile_test.dart
```

### Tier 4: Isolated Pilot Testing Harness
```bash
# Runs full isolated pilot suite against simulated mobile devices
node scripts/test_pilot_scenarios.mjs

# Verifies pilot packaging and security hardening gates
node scripts/verify_pilot_hardening_gates.mjs
```

### Tier 5: Real End-to-End User Journey Tests
- **Admin Journey:** Account signup -> Workspace onboarding -> Employee CSV upload -> Settings configuration.
- **Manager Journey:** Signin -> Live map radar inspection -> Supervisor proof verification -> Reports review.
- **Employee Journey:** Signin -> Duty punch-in with selfie -> GPS breadcrumbs -> Task checklist completion -> Photo proof -> Punch-out.

---

## 3. CI/CD Automated Pipelines

The repository defines two GitHub Actions workflows:
1. `.github/workflows/ci.yml`: Triggered on pull requests and pushes to `main` and feature branches. Runs Turbo build, all 88+ integration tests against live PostGIS 17 & Redis 7 containers, Flutter tests, and end-to-end smoke test.
2. `.github/workflows/android-pilot-apk.yml`: Builds signed/debug APK artifacts and verifies binary size and reflection rules.
