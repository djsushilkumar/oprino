# ADR-018: API Architecture, Protocol Selection, Contracts & Error Handling

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, Backend Engineering, Frontend & Mobile Leads  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/OPRINO-MASTER-PRD.md`](../product/OPRINO-MASTER-PRD.md))

---

## 1. Context & Problem Statement

Oprino exposes backend capabilities to three diverse clients:
1. **Next.js Web Dashboard:** High-density data tables, real-time live map monitoring, operational reporting.
2. **Flutter Mobile Application:** Field workers on spotty 3G/4G/5G connections, requiring lightweight payloads, deterministic error codes, idempotent mutation replays, and battery-efficient transfers.
3. **Future Third-Party Integrations (V1.5+):** External SMB systems (ERP, HRMS, payroll, webhooks).

The API architecture must guarantee:
- **Contract Type Safety:** Zero synchronization drift between backend response payloads and client data hooks.
- **Robust Field Network Resiliency:** Deterministic retry semantics with idempotency keys.
- **Developer Velocity:** Automatic OpenAPI 3.1 specification generation and interactive documentation.
- **Multi-Tenant Scoping & Security:** Uniform tenant extraction, route-level authorization guards, and standardized error envelopes.

---

## 2. Alternatives Evaluated

### Alternative A: Typed Pragmatic REST (Fastify + Zod / TypeBox + OpenAPI 3.1)
- **Architecture:** Standard RESTful HTTP/JSON endpoints with strict compile-time and runtime validation using Fastify JSON Schema / TypeBox and Zod schemas shared across the monorepo. OpenAPI 3.1 schema auto-generated via `@fastify/swagger`.
- **Pros:**
  - Standard HTTP caching, proxying, and CDN compatibility.
  - Trivial to debug via cURL, Postman, or standard HTTP inspectors.
  - Native support for standard HTTP idempotency headers (`Idempotency-Key`).
  - Zero lock-in: Seamlessly consumable by future third-party partner integrations and webhooks.
  - Native streaming support for large CSV exports and SSE live map feeds.
- **Cons:** Requires explicit cursor-based pagination and filter design per endpoint.

### Alternative B: GraphQL (Apollo Server / Mercurius)
- **Architecture:** Single `/graphql` endpoint with typed schema and client-directed queries.
- **Pros:** Prevents over-fetching by allowing clients to request specific fields.
- **Cons:** Extreme caching complexity over HTTP; query complexity attacks can easily exhaust multi-tenant database connection pools; over-engineered for mobile field operations; poor fit for large streaming exports.

### Alternative C: tRPC
- **Architecture:** End-to-end typed RPC protocol tightly binding Next.js/React Native to Node.js backend.
- **Pros:** Zero-overhead client-server type inference without code generation.
- **Cons:** Completely locks the API into TypeScript; cannot be consumed by non-TypeScript third-party integrators, mobile background services, or standard webhooks without heavy adapter layers.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | Alternative A: Typed Pragmatic REST | Alternative B: GraphQL | Alternative C: tRPC |
|---|:---:|:---:|:---:|
| **Mobile Network Resiliency & Caching** | 25% | **9.5 / 10 (Standard HTTP/CDN)** | 6 / 10 | 8 / 10 |
| **OpenAPI & 3rd-Party Integration Readiness** | 20% | **10 / 10 (OpenAPI 3.1 native)** | 7 / 10 | 3 / 10 (TS-only) |
| **Monorepo End-to-End Type Safety** | 20% | **9.5 / 10 (Shared Zod DTOs)** | 9 / 10 | 10 / 10 |
| **Streaming & Large Payload Handling** | 15% | **10 / 10 (Native SSE & Streams)** | 4 / 10 | 6 / 10 |
| **DoS Defense & Predictable Query Cost** | 20% | **9.5 / 10 (Fixed endpoints)** | 4 / 10 (Unbounded trees) | 8.5 / 10 |
| **Weighted Total** | **100%** | **9.50 / 10** | **6.05 / 10** | **7.10 / 10** |

---

## 4. Decision & Rationale

**Selected Architecture: Alternative A — Typed Pragmatic REST with OpenAPI 3.1 and Shared Zod / TypeBox Contracts.**

### Rationale:
1. **Field Network Durability:** REST allows straightforward idempotency keys on mutation endpoints (`POST`, `PUT`, `PATCH`), enabling the mobile offline sync engine to safely replay failed transactions without duplicate side-effects.
2. **Integration-Ready & Cross-Language Boundary:** OpenAPI 3.1 provides the authoritative specification bridging Fastify TypeScript route schemas with the Flutter client, enabling automated generation of strongly-typed Dart clients (`oprino_api` via `openapi-generator-cli dart-dio`) while simultaneously preparing the foundation for future external SMB software integrations.
3. **Defense-in-Depth against DoS:** GraphQL allows arbitrary nested queries that can bring down a multi-tenant relational database. Fixed REST endpoints allow granular rate limiting, precise SQL query tuning, and index optimization.

---

## 5. API Design Standards & Guidelines

### 5.1 URI Naming Conventions
- Base path: `/v1/`
- Resources: Plural nouns, lowercase, kebab-case for compound words:
  - `/v1/tasks`
  - `/v1/attendance-records`
  - `/v1/employee-locations`
  - `/v1/operational-exceptions`
- Sub-resources for strict containment:
  - `/v1/tasks/:taskId/comments`
  - `/v1/tasks/:taskId/proof`
- RPC-style verbs used only when modeling complex lifecycle transitions:
  - `POST /v1/attendance-records/punch-in`
  - `POST /v1/attendance-records/punch-out`
  - `POST /v1/sync/mutations` (Batch outbox replay)

### 5.2 Standard Response & Error Envelope
All non-204 responses return a consistent JSON envelope.

**Success Response (Single Resource):**
```json
{
  "data": {
    "id": "e9b21a8d-27b9-4a92-9694-811c7ff16b92",
    "title": "HVAC Compressor Repair",
    "status": "IN_PROGRESS",
    "createdAt": "2026-10-04T12:00:00Z"
  }
}
```

**Success Response (Paginated Collection):**
```json
{
  "data": [ ... ],
  "pagination": {
    "nextCursor": "eyJzb3J0VmFsdWUiOiIyMDI2LTEwLTA0... ",
    "hasMore": true,
    "totalCount": 142
  }
}
```

**Error Response Envelope:**
```json
{
  "error": {
    "code": "TASK_ALREADY_COMPLETED",
    "message": "Cannot submit proof for a task that has already been finalized.",
    "statusCode": 409,
    "requestId": "c71a32ff-4b82-411a-9f45-6677f48be011",
    "timestamp": "2026-10-04T12:15:30Z",
    "details": [
      {
        "field": "status",
        "issue": "Current status is COMPLETED"
      }
    ]
  }
}
```

### 5.3 Standard Error Code Taxonomy
- `BAD_REQUEST` (400): Malformed JSON or syntax error.
- `VALIDATION_ERROR` (422): Zod/TypeBox schema validation failure.
- `UNAUTHENTICATED` (401): Missing, expired, or invalid session token.
- `FORBIDDEN` (403): User lacks permission (RBAC) or tenant mismatch.
- `NOT_FOUND` (404): Resource does not exist within the workspace.
- `CONFLICT` (409): State conflict or unique constraint violation.
- `PRECONDITION_FAILED` (412): ETag / version mismatch during optimistic update.
- `RATE_LIMITED` (429): Tenant or user exceeded rate limit.
- `INTERNAL_SERVER_ERROR` (500): Unexpected unhandled error (Sentry logged).

### 5.4 Pagination Standard
- High-volume, real-time collections (locations, logs, task lists, events) MUST use **Cursor-Based Pagination**:
  - Request: `GET /v1/tasks?cursor=abc123xyz&limit=50`
  - Encodes the indexed sort column (e.g. `created_at` + `id`) in base64 URL-safe string.
  - Prevents "missing item" or "duplicate item" page drift when records are inserted dynamically while a user scrolls.

### 5.5 Idempotency Enforcement
- Mutating endpoints (`POST /v1/sync/mutations`, `POST /v1/tasks`, `POST /v1/attendance-records/punch-in`) accept an optional/mandatory header:
  `Idempotency-Key: <UUIDv4>`
- The key is cached in Redis for 24 hours. If an identical key arrives while the request is in progress, it waits; if already completed, it returns the cached HTTP response instantly without re-executing logic.

---

## 6. Consequences & Trade-offs

- **Positive:**
  - Clean, universally recognized API standard accessible by web, mobile, CLI, and third-party developers.
  - Complete compile-time type safety via shared `@oprino/contracts`.
  - Immune to GraphQL query complexity exploits.
- **Negative:**
  - Can occasionally lead to slightly larger payloads than GraphQL if endpoints return fields the client doesn't display.
- **Mitigation:**
  - Provide lightweight "summary" DTOs for list views and "detail" DTOs for detailed modal/page views.

---

## 7. Compliance with Phase 00 Approved Scope

- Ensures compatibility with V1 PRD requirements and prepares the foundation for V1.5+ open integrations.
- Enforces multi-tenant isolation and strict RBAC error responses across all endpoints.
