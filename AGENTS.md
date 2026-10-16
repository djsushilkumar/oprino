# Agent Guidelines for Oprino (Codex Cloud & AI Assistants)

Welcome to the Oprino repository. All autonomous and assisted coding agents working on this codebase must adhere to the following mandatory instructions:

---

## 1. Mandatory Session Protocols

### Session Start Protocol (Mandatory First Step)
Every agent session **MUST** begin by declaring:
1. **What am I working on?** (The exact user-requested task and active branch)
2. **What is already done?** (Verified code, passing tests, existing PRs)
3. **What will I change?** (Target files and surgical scope of edits)
4. **How will I test it?** (Automated test commands and manual verification steps)

### Session End Protocol (Mandatory Final Step — Hindi Summary)
Every agent session **MUST** conclude with a concise owner-facing summary in Hindi:
- **आज क्या बनाया या ठीक किया?**
- **App में क्या बदलाव दिखेगा?**
- **कौन से tests वास्तव में pass हुए?**
- **क्या अभी बाकी है?**
- **मालिक को अब क्या करना है?**

---

## 2. Core Operating Rules

1. **Read Current State First, Not Stale Phase Reports:**
   - Always inspect [`docs/PROJECT-STATUS-HI.md`](./docs/PROJECT-STATUS-HI.md) as the single owner-facing dashboard.
   - Inspect [`docs/agent/OPRINO-CURRENT-STATE.md`](./docs/agent/OPRINO-CURRENT-STATE.md) and [`docs/agent/OPRINO-PROJECT-BRAIN.md`](./docs/agent/OPRINO-PROJECT-BRAIN.md) for technical reality and invariants.
   - Historical milestone documents (`docs/audits/`, `docs/implementation/`) are point-in-time audit logs; **NEVER** treat old reports as the current state of the application.
2. **Consult Controlling Product PRD:** Read [`docs/product/OPRINO-MASTER-PRD.md`](./docs/product/OPRINO-MASTER-PRD.md) and [`docs/product/V1-SCOPE.md`](./docs/product/V1-SCOPE.md) before proposing or implementing any user-facing feature.
3. **Strict Separation of Status States:**
   - Explicitly separate **IMPLEMENTED**, **TESTED**, **DEPLOYED**, and **OWNER-APPROVED**.
   - **NEVER infer one from another** (e.g., code written does not mean tested; passing tests does not mean deployed; deployment does not mean owner-approved).
4. **No Unnecessary Reports:**
   - Do **NOT** create a new Markdown report for every task.
   - Update existing canonical documents ([`docs/PROJECT-STATUS-HI.md`](./docs/PROJECT-STATUS-HI.md), [`docs/agent/OPRINO-CURRENT-STATE.md`](./docs/agent/OPRINO-CURRENT-STATE.md), and GitHub PR descriptions).
5. **Continue Existing Work Without Overwriting:**
   - Continue ongoing authentication and device security remediation from its actual verified progress (`edffd4b`). Do not restart, refactor, or overwrite working code.
6. **Preserve Core Invariants:**
   - **Duty-Hours-Only Tracking:** Off-duty location tracking must **NEVER** occur. Peer location visibility remains **OFF by default**.
   - **Multi-Tenant Isolation:** Enforce 5-stage tenant verification; always use transaction-scoped `SET LOCAL app.current_workspace_id` in database queries.
7. **Never Commit Secrets:** Do not commit `.env` files, API keys, private keys, or credentials. Rely strictly on environment variables validated with Zod schemas.
8. **Enforce Comprehensive Testing:** Write and maintain automated tests for multi-tenant isolation, RBAC route guards, offline mutation sync, and duty-boundary cutoffs before considering any feature complete.
9. **Record Architecture Changes via ADRs:** Consult [`docs/architecture/ADR/README.md`](./docs/architecture/ADR/README.md). Any material change to technologies, frameworks, storage, or protocols requires an explicit, numbered ADR.
10. **Zero Scope Creep & Owner Approval Gate:**
    - No new features, production deployments, branch merges, destructive cleanups, or changes to frozen requirements without explicit owner authorization.
