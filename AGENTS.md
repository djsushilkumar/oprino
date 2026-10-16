# Agent Guidelines for Oprino (Codex Cloud & AI Assistants)

Welcome to the Oprino repository. All autonomous and assisted coding agents working on this codebase must adhere to the following mandatory instructions:

1. **Restore Persistent Project Memory First:** Always inspect the permanent agent memory suite in [`docs/agent/`](./docs/agent/) before proposing or modifying any code:
   - [`docs/agent/OPRINO-PROJECT-BRAIN.md`](./docs/agent/OPRINO-PROJECT-BRAIN.md) — System mission, core invariants, tech stack, and scope boundaries.
   - [`docs/agent/OPRINO-CURRENT-STATE.md`](./docs/agent/OPRINO-CURRENT-STATE.md) — Live cloud deployment reality, build gates, and test status.
   - [`docs/agent/OPRINO-SESSION-HANDOFF.md`](./docs/agent/OPRINO-SESSION-HANDOFF.md) — Incoming session restoration protocol and session history.
   - [`docs/agent/OPRINO-OPEN-ISSUES.md`](./docs/agent/OPRINO-OPEN-ISSUES.md) — Active commercial launch blockers and engineering items.
2. **Consult Controlling Product PRD:** Read [`docs/product/OPRINO-MASTER-PRD.md`](./docs/product/OPRINO-MASTER-PRD.md) before implementing or modifying any user-facing feature or domain workflow.
3. **Consult Relevant ADRs:** Read the applicable Architecture Decision Records in [`docs/architecture/ADR/README.md`](./docs/architecture/ADR/README.md) prior to writing code or introducing new dependencies.
4. **Preserve Brand Assets & Tokens:** Do not modify, compress, or replace the approved assets in `Oprino-Brand-Kit/`. Adhere strictly to the design tokens codified in [`docs/brand/OPRINO-BRAND-SYSTEM.md`](./docs/brand/OPRINO-BRAND-SYSTEM.md).
5. **Never Silently Change Frozen Requirements:** Phase 00 requirements are locked. Technology must adapt to product requirements, never vice-versa.
6. **Preserve Core Invariants:**
   - **Duty-Hours-Only Tracking:** Off-duty location tracking must **NEVER** occur. Peer location visibility remains **OFF by default**.
   - **Multi-Tenant Isolation:** Enforce 5-stage tenant verification; always use transaction-scoped `SET LOCAL app.current_workspace_id` in database queries.
7. **Never Commit Secrets:** Do not commit `.env` files, API keys, private keys, or credentials. Rely strictly on environment variables validated with Zod schemas.
8. **Enforce Comprehensive Testing:** Write and maintain automated tests for multi-tenant isolation, RBAC route guards, offline mutation sync, and duty-boundary cutoffs before considering any feature complete.
9. **Record Architecture Changes via ADRs:** Any material change to technologies, frameworks, storage, or protocols requires an explicit, numbered ADR.
10. **Flag Ambiguities & Conflicts:** If an implementation detail conflicts with the frozen PRD or architecture specifications, **stop and report the conflict immediately** instead of guessing.
