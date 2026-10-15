# ADR-002: Web Application Stack Selection

**Status:** Proposed / Recommended for Phase 01A  
**Date:** October 2026  
**Deciders:** Lead Systems Architect, Web Engineering  
**Controlling Document:** Phase 00 Approved Product Baseline ([`docs/product/APP-SURFACES.md`](../product/APP-SURFACES.md))

---

## 1. Context & Problem Statement

The Oprino Web Dashboard serves as the central operational command station for business owners, dispatchers, and operations managers. Core operational responsibilities include:
- **High-Density Data Grids:** Viewing, sorting, filtering, and bulk-updating hundreds of employees, tasks, and client sites.
- **Interactive Live Operational Map:** Clustered real-time markers for active field staff, route playback breadcrumbs, and geofence overlays.
- **Bulk CSV Import & Export Studio:** Uploading large CSV rosters with real-time mapping preview; exporting PDF/Excel attendance and SLA reports.
- **Multi-Tenant Administration:** Seamless switching between organizational workspaces with role-aware permission rendering.

The web stack must deliver rapid development velocity, strong TypeScript integration with shared monorepo packages, excellent client-side interactivity, and low operational maintenance.

---

## 2. Alternatives Evaluated

### Alternative A: Next.js (App Router, React 19, TypeScript)
- **Overview:** Full-stack React framework providing Server Components (RSC) for initial page loads and metadata, coupled with rich Client Components (`"use client"`) for interactive operational dashboards.
- **Routing & Server Boundaries:** Hybrid file-based routing. Authenticated dashboard routes run as client-rendered shells backed by server route handlers for secure cookie validation and API proxying.
- **Ecosystem:** First-class support for TanStack Query, TanStack Table, Mapbox GL / MapLibre, Tailwind CSS, and shared monorepo packages.

### Alternative B: Vite + Single Page Application (React SPA)
- **Overview:** Pure client-side React single-page application bundled with Vite.
- **Pros:** Fast local build times, simple hosting (static assets deployable to CDN / Cloudflare Pages / AWS S3 + CloudFront).
- **Cons:** No native server-side rendering for public marketing/auth pages; requires a separate server or backend proxy for HTTP-only secure cookie session hydration; larger initial JavaScript bundle parsing on client devices.

### Alternative C: Remix / React Router v7
- **Overview:** Modern React full-stack framework with fine-grained nested routing and robust server data loaders.
- **Pros:** Clean web standards-based form actions and loader patterns.
- **Cons:** Smaller ecosystem compared to Next.js; slightly steeper learning curve for teams; less optimized for complex monorepo setups with shared React Native packages.

---

## 3. Comparative Evaluation Matrix

| Criterion | Weight | Next.js (App Router) | Vite React SPA | Remix / React Router v7 |
|---|:---:|:---:|:---:|:---:|
| **High-Density Dashboard Interactivity** | 20% | 9.5 / 10 | 9 / 10 | 9 / 10 |
| **Monorepo Shared Contracts & UI Tokens** | 20% | **10 / 10** | 8.5 / 10 | 8.5 / 10 |
| **Authentication & Cookie Session Handling** | 15% | **9.5 / 10** | 7 / 10 | 9 / 10 |
| **Map & Realtime Client Integration** | 15% | 9 / 10 | 9.5 / 10 | 9 / 10 |
| **Deployment Flexibility (Node / Docker / Vercel)**| 15% | 9 / 10 | 9.5 / 10 (Static) | 8.5 / 10 |
| **Ecosystem Maturity & Talent Availability** | 15% | **10 / 10** | 9 / 10 | 7.5 / 10 |
| **Weighted Total** | **100%** | **9.50 / 10** | **8.75 / 10** | **8.60 / 10** |

---

## 4. Decision

**Adopt Next.js (App Router, TypeScript) for the Oprino Web Application.**

### Architectural Strategy:
1. **Server vs. Client Boundaries:**
   - Public marketing, login, and tenant invitation landing pages leverage Server-Side Rendering (SSR) and Static Site Generation (SSG) for fast first contentful paint and security.
   - The authenticated operational dashboard (`/admin/*`) utilizes Client-Side Component shells (`"use client"`) with **TanStack Table** for high-density data grids and **TanStack Query** for caching, background re-fetching, and optimistic mutations.
2. **State Management:**
   - Server state: TanStack Query (managing task lists, employee rosters, and visit logs with automatic cache invalidation).
   - Client UI state: Zustand (lightweight store for sidebar collapse, map active layers, and multi-tenant active workspace selection).
3. **Styling & Design Tokens:**
   - Ingest `05-Design-Tokens/Oprino-tokens.json` directly into **Tailwind CSS** configuration to enforce the authoritative Oprino brand palette (Cobalt, Navy, Mint, Paper, Slate) and Space Grotesk / Manrope typography.
4. **Data Grid & Visualization:**
   - TanStack Table v8 for virtualized high-performance tables with multi-column sorting, column filtering, and bulk selection.
   - Recharts / Chart.js for executive KPI trends and attendance breakdown charts.

---

## 5. Consequences & Mitigations

- **Consequence:** React Server Components (RSC) can cause confusion if developers attempt to render client-only map libraries (like Mapbox GL) on the server.  
  *Mitigation:* Isolate all map and interactive canvas views into dedicated client components (`"use client"`) using Next.js dynamic imports with `{ ssr: false }`.
- **Consequence:** Full-stack Next.js applications require a Node.js server container or specialized platform for server functions.  
  *Mitigation:* Containerize Next.js using a multi-stage Docker build, allowing deployment to standard container infrastructure (AWS ECS, Google Cloud Run, Railway, or VPS).
- **Reversal Cost:** Medium. Transitioning to a pure Vite SPA or Remix would require rewriting routing conventions and data fetching hooks.
