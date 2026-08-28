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
| DEC-005 | Formal typed registry schema + manual validator, no build step | LOCKED |
| DEC-006 | `mainUrl` / `plannedUrl` split — Registry represents verified reality only | LOCKED |
| DEC-007 | Product Manifest (`ycsu-product.json`) specified but not auto-discovered | ACTIVE |
| DEC-008 | AI CORE Product Registration Pipeline documented, not implemented, in v1 | LOCKED |
| DEC-009 | v1.0.0 scope frozen — no backend, no orchestration, no automation | LOCKED |

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

---

## DEC-005 — Formal Typed Registry Schema, No Build Step

**Status:** LOCKED
**Date:** 2026-08-28

### Decision

The registry's shape is formally defined in `registry.schema.ts` (TypeScript types, not executed by the browser) and enforced by a standalone, manually-run validator (`scripts/validate-registry.mjs`, zero dependencies, not wired into CI).

### Context

v1.0.0 needed to establish "data is trustworthy" and "ready for AI CORE takeover" without introducing a build step, bundler, or CI pipeline — all of which would exceed the frozen static/data-driven scope.

### Reasoning

- a `.ts` file with no build step still serves as a precise, tooling-friendly type contract a future build step or AI CORE integration can target directly
- a plain Node script with no dependencies validates correctness without adding CI, a package manager lockfile, or automation the v1 scope explicitly excludes
- keeps `index.html` unchanged in its execution model (still plain fetch + render)

### Alternatives Considered

- A real build step (tsc, bundler) — rejected, adds infrastructure disproportionate to a 5-entry static registry and outside the frozen v1 scope.
- No formal schema at all, just prose conventions — rejected; directly contradicts the "Registry structure is correct" completion principle.

### Consequences

Positive: a future agent or AI CORE pipeline has an exact, checkable contract instead of prose conventions.
Trade-off: the schema and the JSON can still drift if `validate-registry.mjs` isn't run — it's a manual discipline, not an enforced gate. Acceptable for v1; a CI gate is a natural (but out-of-scope-for-now) V2 addition.

---

## DEC-006 — `mainUrl` / `plannedUrl` Split

**Status:** LOCKED
**Date:** 2026-08-28

### Decision

Every registry entry has two separate URL fields: `mainUrl` (only ever set once personally verified live) and `plannedUrl` (informational only, never rendered as an active Launch link).

### Context

The v1.0.0 continuation brief was explicit: "The Registry must represent verified reality, not project intention." Before this decision, the old `url` field conflated "the domain we intend this product to use" with "a link that actually works," which produced a misleading UI for every not-yet-deployed product.

### Reasoning

- prevents the Registry from silently drifting into an aspirational roadmap
- makes the distinction mechanically checkable (`validate-registry.mjs` rejects an entry with both fields set, or `mainUrl` set while `deployment` is `"Not Deployed"`)

### Alternatives Considered

- A single `url` field with a status flag — rejected; too easy for a future edit to flip the flag without re-verifying the URL actually works.

### Consequences

Positive: a visitor can trust that every clickable Launch link on `main.ycsu.cc` actually goes somewhere live.
Trade-off: none identified — this is strictly more correct than the prior single-field model.

---

## DEC-007 — Product Manifest Specified, Not Auto-Discovered

**Status:** ACTIVE
**Date:** 2026-08-28

### Decision

`docs/REGISTRY_SCHEMA.md` §3 defines a `ycsu-product.json` manifest format, with one real example (`manifests/ycsu-platform/ycsu-product.json`). No discovery, fetching, or synchronization of manifests from other repositories is implemented.

### Context

Section 10 of the v1.0.0 brief asked for the specification and an example, explicitly not automatic discovery/sync — this is preparatory work for `DEC-008`'s future pipeline.

### Reasoning

- gives future products a stable target format to adopt incrementally, without this repository needing to reach into their repositories
- keeps the manifest schema conceptually compatible with `registry.schema.ts` rather than inventing a second, divergent shape

### Alternatives Considered

- Skip the manifest spec until the pipeline is actually built — rejected; the brief specifically wants the data model future-proofed now so it doesn't need reshaping later.

### Consequences

Positive: `DEC-008`'s future pipeline has a target format to consume without redesigning the schema.
Trade-off: the one example manifest is not yet consumed by anything — it's pure specification until a pipeline exists to read it.

---

## DEC-008 — AI CORE Product Registration Pipeline: Documented, Not Implemented

**Status:** LOCKED
**Date:** 2026-08-28

### Decision

`docs/FUTURE_AI_CORE_HANDOFF.md` describes a future pipeline (agent → GitHub → deployment → manifest → AI CORE validation/sync → `registry.json` → `main.ycsu.cc`) in prose and a diagram only. No code, service, GitHub Action, or write-access mechanism for it exists in this repository.

### Context

Explicit instruction: document the future architecture so `main.ycsu.cc` stays a "Registry UI / read surface" conceptually, without building the orchestration layer now.

### Reasoning

- keeps v1.0.0's scope honest — "future AI CORE takeover is explicitly supported by the architecture" means the schema is compatible with it, not that the pipeline exists
- prevents a half-built automation surface with no review step from shipping inside what's supposed to be a stable, locked v1

### Alternatives Considered

- Build a minimal version now (e.g. a GitHub Action that reads manifests) — explicitly rejected by the brief ("Do not implement it today").

### Consequences

Positive: the door stays open architecturally without any of the trust/security questions of automated registry writes needing to be answered under time pressure.
Trade-off: every registry update until this pipeline exists is still a manual repository edit.

### Change Conditions

Only begin implementation after an explicit user decision to start that milestone — not as an incremental extension of v1 maintenance.

---

## DEC-009 — v1.0.0 Scope Frozen

**Status:** LOCKED
**Date:** 2026-08-28

### Decision

YCSU Platform v1.0.0 ships as: a static registry UI, a formal schema, a manual validator, a manifest specification, and governance documentation. No backend, no GitHub API sync, no Supabase, no AI CORE automation, no health/status polling, no authentication, no complex dashboard.

### Context

Explicit instruction across the entire v1.0.0 continuation brief, restated multiple times: "Do not expand v1... Once those are true, stop."

### Reasoning

- the completion principle is structural correctness and trustworthiness, not feature breadth
- every excluded item has a natural home in a future, deliberately-scoped milestone (see `DEC-008`)

### Alternatives Considered

None — this is a direct instruction, not a design tradeoff.

### Consequences

Positive: v1.0.0 is a stable, reviewable, lockable release rather than a moving target.
Trade-off: several genuinely useful capabilities (live status, automated sync) are deliberately deferred.

### Change Conditions

Only reconsider scope in a new, explicitly-scoped milestone (v1.1.0+ or v2.0.0 per the version model in `docs/PLATFORM_MODEL.md` §5).
