# ADR-021: Zero-Cost Duty-Hours GPS Pipeline, Open-Source Mobile Hardware Adapter & MapLibre Cartography

## Status
**Approved** (Oct 2026) — Supersedes commercial Transistorsoft dependency in ADR-008 for development and pilot operations.

## Context
Oprino requires real-device employee GPS tracking, offline-first durable synchronization, duty-boundary enforcement, and live web mapping for field workforce management. 
ADR-008 originally referenced `flutter_background_geolocation` (Transistorsoft), which requires commercial paid licensing for release builds and production deployments. 
To adhere strictly to Oprino's **Zero-Cost Policy** during development and pilot rollout, the platform requires an entirely free and open-source location pipeline across Flutter mobile, Fastify backend, and Next.js web while strictly preserving the Duty-Hours-Only Privacy Invariant.

## Decisions

### 1. Free & Open-Source Mobile Location Hardware Adapter (`geolocator`)
- **Library Selection:** Open-source `geolocator: ^13.0.4` (MIT License). Zero commercial licensing fees.
- **Android Background Location:** Uses native Android Foreground Service with continuous notification (`AndroidSettings(foregroundNotificationConfig: ...)` and `android.permission.FOREGROUND_SERVICE_LOCATION`).
- **iOS Background Location:** Uses native Apple CoreLocation background location capabilities (`AppleSettings(showBackgroundLocationIndicator: true)` and `UIBackgroundModes: location, fetch`).
- **Battery-Conscious Sampling:** Movement-triggered sampling (`distanceFilter: 15m`, interval 15s) with speed-aware displacement filtering.
- **Testing & Simulation Mode:** `SimulatedLocationHardwareAdapter` is retained and decoupled via `useSimulatedLocationProvider` for automated CI, headless test runners, and developer simulation.

### 2. Durable Offline GPS Storage via Drift SQLite (`CachedLocations`)
- Rather than relying on volatile in-memory buffers or proprietary binary databases, GPS coordinates captured while on duty are immediately committed to local SQLite via Drift (`CachedLocations` table).
- **Decoupled Capture & Synchronization:** Location capture terminates synchronously the instant punch-out occurs (preventing any off-duty GPS collection). Unsent on-duty fixes remain durably persisted in SQLite and are transmitted idempotently whenever connectivity is restored.
- **Queue Cleanup:** SQLite records are only deleted upon authoritative HTTP 200/201 ingestion acknowledgement from the backend.

### 3. Backend Telemetry Correctness & Idempotency
- **Historical Duty Reconciliation:** Points uploaded after punch-out are validated against historical duty session intervals (punch-in to punch-out) recorded within the past 7 days, avoiding premature rejection of valid offline work.
- **Idempotent Ingestion & Mileage Rollup:** Ingestion deduplicates point IDs using Drizzle set queries (`inArray`), and calculates incremental Haversine distance deltas exclusively for newly written points, preventing duplicate distance accumulation on client retries.
- **Speed & Timestamp Anomaly Filtering:** Future timestamps exceeding clock skew thresholds (+60s) and teleportation/speed anomalies (>45 m/s) are rejected prior to persistence.
- **Security & Ephemeral Stream Tickets:** Replaced URL bearer tokens with single-use 60-second tickets (`POST /v1/telemetry/stream-ticket`) consumed by SSE stream endpoints (`/v1/telemetry/stream?ticket=...`).

### 4. Zero-Cost Open Geographic Web Map (`maplibre-gl`)
- Replaced Delhi-centered SVG vector approximation with real geographic map rendering using MapLibre GL JS (`maplibre-gl`).
- **Policy-Compliant Tile Layer:** Uses OpenStreetMap and CartoDB Dark Matter raster tiles requiring zero paid API keys, zero per-seat licensing, and offering global coverage matching Oprino's slate dark mode design tokens.
- **Interactive Capabilities:** Dynamic bounding box auto-fit, real coordinates marker rendering, moving vs. stationary state badges, stale location detection (>5 mins), employee selection, daily route trail rendering, and interactive timeline scrubber playback.

## Consequences

### Positive
- **Zero Financial Cost:** $0 in Transistorsoft, Google Maps, or Mapbox commercial software licensing.
- **Offline Resilience:** App crashes, network dropouts, or battery shutdowns do not lose captured duty breadcrumbs.
- **Security Hardening:** Authentication tokens are never exposed in SSE query parameters or server logs.
- **Full Test Coverage:** 100% automated coverage across PostgreSQL RLS isolation, Fastify endpoints, Drift SQLite migrations, and Flutter state notifiers.

### Trade-offs & Limitations
- **OS Force-Stop:** If a user aggressively force-stops the app via OS settings or revokes permissions, background tracking will halt until the application is reopened. (Documented in system user guidelines).
- **Free Tile Usage Limits:** OpenStreetMap and CartoDB tile caches have fair-use policies suitable for development, pilot, and moderate production workloads. For high-volume multi-thousand tenant deployments, self-hosted PMTiles or vector tile servers may be introduced via future ADR without altering the frontend MapLibre consumer.
