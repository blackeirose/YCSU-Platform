# DECISIONS.md

**YSU AI Development System**
**Project:** YCSU Platform

This file is the project decision record. For current project state, see `PROJECT_CONTEXT.md`.

---

# DECISION INDEX

| ID | Decision | Status |
|---|---|---|
| DEC-001 | Static, data-driven registry (no backend) for v1 | ACTIVE |
| DEC-002 | Dedicated repository rather than folding into an existing YCSU repo | ACTIVE |
| DEC-003 | Netlify as deployment platform | ACTIVE |
| DEC-004 | DNS for `main.ycsu.cc` is a manual, user-performed step, not automated | LOCKED |

---

## DEC-001 — Static, Data-Driven Registry (No Backend) for v1

**Status:** ACTIVE
**Date:** 2026-08-28

### Decision

`YCSU Platform` v1 is a static HTML/CSS/JS site with no backend, no database, and no authentication. Registry data lives in a single `registry.json` file in the repository.

### Context

Per `ysu-ai-core/docs/SERVICES.md`, services should only be introduced when a real requirement exists. The product requirement is "show what YCSU products exist and their status" — a read-only directory. No requirement was identified for a backend (no user accounts, no write-from-the-public, no cross-device sync of user-generated data).

### Reasoning

- matches the explicit v1 requirement ("lightweight and preferably static/data-driven unless there is a compelling existing architectural reason otherwise")
- a JSON file in the repo is sufficient for an agent or the user to update registry entries; no CMS or database adds value at this scale
- keeps the product deployable to Netlify with zero configuration

### Alternatives Considered

- Supabase-backed registry with an admin UI — rejected as unnecessary complexity for a v1 read-only directory.

### Consequences

Positive: zero backend cost, zero credentials, trivial deployment.
Trade-off: updating the registry requires a commit (no live admin UI). Acceptable at this scale.

### Change Conditions

Reconsider if the registry needs to reflect live deployment/DNS status automatically, or if a non-technical contributor needs to edit it without Git access.

---

## DEC-002 — Dedicated Repository

**Status:** ACTIVE
**Date:** 2026-08-28

### Decision

`YCSU Platform` is a new, dedicated GitHub repository (`blackeirose/YCSU-Platform`), not folded into `ysu-ai-core`, `AI-Development-Control-Center`, or `YSU-Architecture-Workflow-Hub`.

### Context

Per the v1 requirements, YCSU Platform is "a formal YCSU Product" distinct from the other products it lists (it is the ecosystem's front door, not a governance/core repo or another product's own repo).

### Reasoning

- `ysu-ai-core` is cross-project governance/standards, not a deployable product
- ADCC and Workflow Hub are themselves listed *inside* this registry — mixing the registry's code into one of the products it lists would be architecturally circular
- a dedicated repo keeps its deploy/DNS lifecycle independent of any other product's

### Alternatives Considered

- Folding into `ysu-ai-core` — rejected; that repo is documentation/standards, not a deployable site.

### Consequences

Positive: clean deploy boundary, independent lifecycle.
Trade-off: one more repository to track — acceptable, consistent with how Tracker/ADCC/Workflow Hub each already have their own repo.

---

## DEC-003 — Netlify as Deployment Platform

**Status:** ACTIVE
**Date:** 2026-08-28

### Decision

Deploy via Netlify, connected to the GitHub repository for continuous deployment.

### Context

`ysu-ai-core/docs/SERVICES.md` §5 names Netlify as the current default for lightweight web applications deployed from GitHub, and explicitly warns against introducing another host without a clear limitation.

### Reasoning

- matches the existing YSU default; the account is already authenticated
- this project has no requirement Netlify can't satisfy (fully static)

### Alternatives Considered

- GitHub Pages — used by Tracker, but Netlify was kept as the default per `SERVICES.md`; no reason found to deviate for this project.

### Consequences

Positive: consistent with stated YSU service defaults, trivial custom-domain + SSL support once DNS is attached.

---

## DEC-004 — DNS for `main.ycsu.cc` Is Manual, Not Automated

**Status:** LOCKED
**Date:** 2026-08-28

### Decision

No DNS record for `main.ycsu.cc` is created automatically. The exact record to add is documented in `DEPLOYMENT.md`, and the user adds it in the Namecheap dashboard themselves.

### Context

Per `ysu-ai-core/docs/DOMAIN_REGISTRY.md` §2A and `Claude_Workspaces/Shared/Claude_Instructions/YCSU_DEPLOYMENT_AUTOMATION_PLAN.md`, no Namecheap API credentials or automation exist for the `ycsu.cc` zone today — this was confirmed, not assumed, during v1 setup (no API key, no IP whitelist configured).

### Reasoning

- there is no technical mechanism available to make this change programmatically
- even once Namecheap automation exists, the canonical plan requires human review of any DNS change before it applies

### Alternatives Considered

- None — this is a hard constraint (missing credential), not a design choice.

### Consequences

Positive: no risk of an unreviewed DNS change affecting other `ycsu.cc` subdomains.
Trade-off: `main.ycsu.cc` cannot go live until the user completes one manual step.

### Change Conditions

Revisit once Namecheap API access + Terraform automation is adopted per the deployment automation plan.
