# DECISIONS.md

## Reading historical decisions

DEC-018/DEC-019 and current `PROJECT_CONTEXT.md` define the accepted secure read/build/auth boundary. Earlier version-specific records retain their historical reasoning and do not authorize public full-record reads, repository-root publishing, or old full-snapshot recovery. Surface any remaining conflict before action. Production publication follows the current Core release gate; historical candidate releases are not standing authorization for production QA.

**YSU AI Development System**
**Project:** YCSU Platform

This file is the project decision record. For current project state, see `PROJECT_CONTEXT.md`.

---

# DECISION INDEX

| ID | Decision | Status |
|---|---|---|
| DEC-001 | Static, data-driven registry (no backend) for v1.0.0 | SUPERSEDED by DEC-010 (v1.1.0) |
| DEC-002 | Dedicated repository rather than folding into an existing YCSU repo | ACTIVE |
| DEC-003 | Netlify as deployment platform | ACTIVE |
| DEC-004 | DNS for `main.ycsu.cc` is a manual, user-performed step, not automated | LOCKED |
| DEC-005 | Formal typed registry schema + manual validator, no build step | ACTIVE (extended, not superseded, by v1.1) |
| DEC-006 | `mainUrl` / `plannedUrl` split — Registry represents verified reality only | LOCKED |
| DEC-007 | Product Manifest (`ycsu-product.json`) specified but not auto-discovered | ACTIVE |
| DEC-008 | AI CORE Product Registration Pipeline documented, not implemented, in v1 | LOCKED |
| DEC-009 | v1.0.0 scope frozen — no backend, no orchestration, no automation | SUPERSEDED by DEC-015 (v1.1.0) |
| DEC-010 | Supabase as the Registry Data Layer, replacing the static JSON file | LOCKED |
| DEC-011 | Reuse `ysu-tool-tracker` Supabase project; dedicated `product_registry` table | LOCKED |
| DEC-012 | Zero write RLS policies; all writes via `registry-ops` with custom secret auth | LOCKED |
| DEC-013 | `data/registry.snapshot.json` is disaster-recovery/audit only, one-way, manual | LOCKED |
| DEC-014 | No-redeploy round-trip test as the v1.1.0 release gate | LOCKED |
| DEC-015 | v1.1.0 scope frozen — direct Registry operations only, no lifecycle automation | LOCKED |
| DEC-016 | Manual static product previews derived from Registry slugs | LOCKED |
| DEC-017 | Owner-authenticated persistent card ordering through registry-ops | ACTIVE |
| DEC-018 | Server-enforced owner-only Product links and public-safe reads | ACTIVE |
| DEC-019 | Six-digit mobile email OTP with unchanged owner authorization | ACTIVE |

---

## DEC-001 — Static, Data-Driven Registry (No Backend) for v1

**Status:** SUPERSEDED by DEC-010 (2026-08-29) — v1.0.0's "no backend" was the correct decision for that milestone's actual requirement (a read-only directory with no external write requirement). It stopped being correct once v1.1.0's requirement changed to "authorized external tools must be able to write directly" — see DEC-010's Context. This entry is kept for history, not as current guidance.
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

Deploy via Netlify. Git-linked continuous deployment was an initial intention, not the current configured state. Current recorded releases are manual and publish approved `dist` contents only; see `PROJECT_CONTEXT.md` and `DEPLOYMENT.md`. Enabling CD is a separate authorized configuration change, not a prerequisite for routine documentation work.

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

**Status:** PARTIALLY SUPERSEDED by DEC-018. The typed schema remains applicable; the v1.0 no-build restriction and historical alternatives below no longer describe the current dist-only build boundary.
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

**Status:** SUPERSEDED by DEC-015 (2026-08-29) for the v1.1.0 milestone; kept for history as an accurate record of the v1.0.0 release gate.
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

---

## DEC-010 — Supabase as the Registry Data Layer

**Status:** LOCKED
**Date:** 2026-08-29

### Decision

`product_registry` moves from a static `registry.json` file to a Supabase Postgres table. The frontend reads it live via PostgREST; the file `data/registry.snapshot.json` remains only as a disaster-recovery/audit copy (DEC-013).

### Context

v1.1.0's actual product requirement is new and real: an external authorized tool (ChatGPT) must be able to create/update/archive Registry entries directly, and `main.ycsu.cc` must reflect those changes without a source edit, commit, or redeploy. DEC-001's "no backend" was correct for v1.0.0's read-only requirement; it does not satisfy this one. Per `ysu-ai-core/docs/SERVICES.md`'s own service-selection order (Product Requirement → Architecture Requirement → Service Selection), a real requirement now exists, so introducing Supabase is not scope creep — it's the documented process working as intended.

### Reasoning

- Supabase is the YSU default cloud backend (`SERVICES.md` §6) once a real persistence/remote-write requirement exists
- PostgREST gives a zero-code public read API for free once RLS is configured — no separate read service needed
- Postgres CHECK constraints let the v1.0.0 validation rules (enum values, `mainUrl`/`plannedUrl` exclusivity, certification checklist) become unbypassable, not just conventions

### Alternatives Considered

- A custom backend API (Node/Express, a serverless function set) — rejected; Supabase's built-in PostgREST + Edge Functions already provide exactly the read/write split needed with less code to maintain.
- Keep `registry.json` and have agents commit+push+redeploy on every change — rejected; this is exactly the constraint v1.1.0 exists to remove (see the acceptance test, DEC-014).

### Consequences

Positive: routine Registry changes are now a database write, not a deployment; database constraints are a hard backstop independent of any single write path's code.
Trade-off: one more external service dependency (mitigated: reused an existing project, DEC-011); the frontend now depends on Supabase's availability for the live view (mitigated: snapshot fallback, DEC-013).

### Change Conditions

Reconsider only if Supabase itself needs replacing (per `SERVICES.md` §21, vendor replacement is allowed without an architecture rewrite — GitHub/Netlify/the domain stay unaffected either way).

---

## DEC-011 — Reuse `ysu-tool-tracker` Supabase Project; Dedicated Table

**Status:** LOCKED
**Date:** 2026-08-29

### Decision

`product_registry` lives in the existing `ysu-tool-tracker` Supabase project (ref `fzydsnxxcdllkjxwdiwn`), as a new table separate from `tracker_items` — not merged into it, and not a new Supabase project.

### Context

Two existing Supabase projects were inspected before deciding anything (per the v1.1.0 brief's explicit instruction not to assume a new backend is required). `ysu-tool-tracker` already backs `tracker.ycsu.cc` and has an established, working RLS pattern (public read, restricted write) this design extends. The other project backs an unrelated tool.

### Reasoning

- avoids a new paid/account resource for a five-row table
- `tracker_items` is task-tracking shaped (progress, priority, resource, hours) — structurally and conceptually different from Registry data; overloading it was explicitly rejected by the brief and would have been wrong regardless
- a separate table means zero coupling risk: no shared columns, no shared policies, no shared triggers with `tracker_items`

### Alternatives Considered

- New dedicated Supabase project for the Registry — rejected as unnecessary; project-level isolation wasn't needed since table-level isolation (RLS, no shared schema) already achieves the real goal (no accidental coupling).
- Add registry columns to `tracker_items` — rejected outright per the brief; a Registry entry and a tracked task are different entities with different lifecycles.

### Consequences

Positive: no new billing surface, reuses a proven security pattern, zero coupling with existing Tracker data.
Trade-off: `product_registry`'s availability is now tied to the same project as the Tracker's — acceptable, since both are already part of the same YSU infrastructure with the same actual uptime dependency.

---

## DEC-012 — Zero Write RLS Policies; All Writes via `registry-ops`

**Status:** LOCKED
**Date:** 2026-08-29

### Decision

`product_registry` has Row Level Security enabled with exactly one policy (public `SELECT`). There is no `INSERT`/`UPDATE`/`DELETE` policy for `anon` or `authenticated` — including the one pre-existing `authenticated` user in this Supabase project. The only way to write is the `registry-ops` Edge Function, which checks a custom secret (`REGISTRY_API_KEY`) in application code and then writes using `service_role` server-side.

### Context

The brief was explicit and specific: "do not rely on `user_metadata` for authorization," "avoid insecure broad 'authenticated can update everything' unless admin authorization is properly enforced," and "do not expose `service_role` credentials to frontend/browser code." The existing `tracker_items` pattern (any `authenticated` user can write) was inspected and deliberately not replicated here, since it doesn't distinguish "some logged-in user" from "the one authorized Registry operator."

### Reasoning

- a shared secret checked in function code, not a Supabase Auth claim, sidesteps the `user_metadata`-authorization anti-pattern entirely — there's no session or claim to trust or forge
- zero write policies means even a compromised or newly-created `authenticated` session in this project has no path to `product_registry` — the attack surface for "some other authenticated user accidentally/maliciously writes to the Registry" is fully closed, not just narrowed
- `service_role` never leaves the Edge Function's server-side environment; it is never sent over the network to a caller and never appears in `index.html`

### Alternatives Considered

- Extend the `tracker_items` pattern (any `authenticated` user can write) to `product_registry` — rejected; explicitly the anti-pattern the brief warned against, and does not distinguish "authorized Registry operator" from "anyone with any Supabase Auth session in this project."
- A Supabase Auth user per authorized agent, with an RLS policy checking `auth.uid()` — considered and rejected for v1.1.0: requires session/token refresh handling in the calling client (awkward for a stateless HTTP-calling tool like a ChatGPT Action) for no additional security benefit over a bearer secret at this single-operator scale. Revisit if multiple distinct authorized identities need independently revocable access (see `docs/FUTURE_AI_CORE_HANDOFF.md`'s open questions).

### Consequences

Positive: the security model is simple enough to fully verify by reading one function and one migration file; verified via `supabase db advisors` (only a pre-existing, unrelated finding remained) and by direct negative testing (wrong key → 401; anon-key direct write attempt → 0 rows affected, data unchanged).
Trade-off: a single shared secret is an all-or-nothing credential — anyone holding it can perform any write operation. Acceptable at "one authorized operator" scale; revisit if that changes.

---

## DEC-013 — Snapshot Is Disaster-Recovery/Audit Only, One-Way, Manual

**Status:** PARTIALLY SUPERSEDED by DEC-018. Manual, one-way handling remains applicable. The historical full snapshot below is retired; current `data/registry.public.snapshot.json` is public-safe fallback only, not a full backup or authority. Never restore or deploy full owner exports.
**Date:** 2026-08-29

### Decision

`data/registry.snapshot.json` is refreshed only by manually running `node scripts/snapshot-registry.mjs` (DB → file). There is no scheduled job, no CI step, no automatic trigger, and no reverse (file → DB) direction.

### Context

The brief explicitly warned against "bidirectional sync complexity in v1.1" and asked for the snapshot to be clearly backup/reference, not the routine write source.

### Reasoning

- a one-way, manual refresh is trivially safe to reason about — it can never overwrite live data, and stale snapshot data can never silently become authoritative
- the frontend's fallback path reads the snapshot only on a live fetch failure, and never writes it anywhere

### Alternatives Considered

- A scheduled/automatic snapshot refresh — rejected as unnecessary automation for v1.1's scope; a manual step before a release or after a batch of changes is sufficient at this data volume.

### Consequences

Positive: zero risk of the snapshot silently becoming a second source of truth.
Trade-off: the snapshot can go stale between manual refreshes — acceptable, since it is a fallback and audit artifact, not something anything depends on being current.

---

## DEC-014 — No-Redeploy Round-Trip Test as the Release Gate

**Status:** LOCKED
**Date:** 2026-08-29

### Decision

Before tagging v1.1.0, a real Registry write (via `registry-ops`, simulating an authorized-tool call) was performed against a live production field, confirmed to appear on `https://main.ycsu.cc` with no code edit/commit/redeploy, then reverted. Two negative tests were also run: an unauthorized key was rejected (401), and a direct anon-key write attempt via PostgREST affected zero rows.

### Context

The brief named this explicitly as "the defining acceptance criterion for v1.1" and instructed not to tag/release until it passed.

### Reasoning

- proves the entire architecture end-to-end rather than trusting each layer's correctness individually
- the negative tests prove the security model, not just the happy path

### Alternatives Considered

None — this was a named, non-negotiable release gate.

### Consequences

Positive: v1.1.0 ships with direct evidence the core promise (registry change → homepage update, no redeploy) actually works, not just architectural intent.

---

## DEC-015 — v1.1.0 Scope Frozen

**Status:** LOCKED
**Date:** 2026-08-29

### Decision

v1.1.0 ships as: the Registry Data Layer (Supabase table + RLS), the `registry-ops` write interface, a Registry-driven generic frontend, a snapshot/fallback model, and the migrated v1.0.0 data. It does **not** ship: the AI CORE Product Registration Pipeline, GitHub webhook automation, automatic release/version detection, deployment health monitoring, a full admin dashboard, a user-facing CMS, complex role management, or automatic Product Manifest ingestion.

### Context

Explicit, repeated instruction in the v1.1.0 brief: "Do not build [the excluded list]... Do not expand scope."

### Reasoning

- v1.1.0's completion principle is a correct, secure, directly-operable Registry foundation — not full lifecycle automation
- every excluded item has a natural home in the V2+ pipeline documented in `docs/FUTURE_AI_CORE_HANDOFF.md`

### Alternatives Considered

None — direct instruction.

### Consequences

Positive: v1.1.0 is a stable, reviewable, lockable release with a clear boundary against V2's much larger scope.
Trade-off: full lifecycle automation (auto-verifying a product's real deployment/version state) remains a manual, agent-asserted step until V2.

### Change Conditions

Only reconsider scope in a new, explicitly-scoped milestone.

---

## DEC-016 — Manual Static Product Preview Images

**Status:** LOCKED
**Date:** 2026-09-11

### Decision

The homepage remains `Browser → index.html → Supabase product_registry → generic card renderer`. Optional preview images are manually curated and updated only as part of an explicit MAIN maintenance task at `/assets/previews/{slug}.webp`, derived from the Registry slug with no database field or per-product rendering component.

Public/Live products show the image or “Preview unavailable.” Local/Internal products show a manual image or neutral fallback, always labeled DEVELOPMENT PREVIEW with the existing deployment status retained. Not Deployed products show a designed IN PROGRESS placeholder, name, and non-clickable planned domain; no screenshot is requested. Other operational states do not claim to be Live or request a screenshot.

### Reasoning and consequences

The owner does not need to capture previews personally. During an explicit MAIN maintenance task, an authorized AI/development agent such as Codex may open the verified production URL, select a representative current state, capture the screenshot, convert it to WebP, and update the preview asset. Manual curation describes the deliberate selection and task-scoped update, not a requirement for the owner to operate the capture tools. Product-status changes alone do not trigger screenshot updates. This avoids uncontrolled captures and keeps metadata authoritative in Supabase. Images require a frontend deployment; metadata still uses the existing no-redeploy Registry write workflow. Missing assets are normal and never block card rendering.

No scheduled, background, deployment-triggered, or unattended screenshot automation is permitted. Browser capture and conversion tools may be used within an explicit MAIN maintenance task; they must not become an automatic capture service or job. Remote screenshot services, iframes, synthetic screenshots, schema changes, and frontend write logic remain outside this presentation enhancement. See `assets/previews/README.md` for capture/export and maintenance guidance.

---

## DEC-017 — Owner-authenticated persistent card ordering

**Status:** ACTIVE — explicitly approved by the owner on 2026-09-11.

The v1.2 milestone adds persistent manual card ordering while preserving the approved card design. It narrowly extends DEC-012/DEC-015: public viewing remains unauthenticated, and the existing verified Supabase Auth owner may authorize/reorder through the existing `registry-ops` function. All other operations still require the original management key. No anon/authenticated table write policy is added; administrative secrets remain server-side.

Use nullable integer `sort_order`, deterministic null-last fallback, and an atomic service-role-only SECURITY INVOKER reorder function with expected-state conflict detection. Saves change only necessary ranks, not product facts. Optimistic UI restores the prior order after a failed save. A 500 ms non-link long press, a subtle grip, and keyboard arrow/Home/End support expose this focused operation without a CMS or a separate edit page. Snapshot fallback is always read-only.

The prior release remains the last known good state until owner login, production reorder/reload, and restoration of intended order pass. Recovery is to restore the prior frontend and Edge Function; the additive nullable column and inactive restricted function can remain without affecting the previous renderer. There is no need to destroy data for rollback.


## DEC-018 — Public metadata and owner-only links

**Status:** ACTIVE — explicitly requested by YuCheng on 2026-09-11 for v1.3.0.

MAIN remains publicly browsable. The existing exact Supabase Auth owner UUID is the only browser identity allowed to retrieve Product links or reorder. This supersedes the public full-record reads in DEC-012/DEC-016 and extends DEC-017 with read-only owner access; no other browser write capability is added.

The existing registry-ops Edge Function exposes read-public and read-owner. Public reads return a fixed field allowlist with URL-bearing text redacted server-side; protected URL fields are absent. Full reads require the existing server-side getUser UUID verification or management key. All table and column privileges for PUBLIC/anon/authenticated are revoked, the public SELECT policy is removed, and RLS remains enabled. Only the existing service role accesses raw rows behind this boundary. No extra service, view, definer function or Auth system is introduced.

Only a public-safe snapshot is committed and deployed. Static publishing uses an explicit dist allowlist, excluding source docs, migrations, manifests and old full exports. Owner data remains memory-only and uses no-store responses; logout clears it immediately and invalidates pending reads. Current public architectural docs and historical commits/deploys may already disclose domains; these changes enforce MAIN's current runtime access contract, not global URL secrecy or authentication for downstream products.

v1.2.0 is the accepted historical baseline. Recovery for v1.3 must retain raw-table denial and public-safe static artifacts; prefer a public-only fallback if owner reads fail. Restoring old public grants or a full snapshot would reverse the authorized boundary and is not a routine rollback.

Future identity targets are planning only: MAIN may become authenticated-only by a later owner decision; TRACKER, MIND MAP and ADCC may become authenticated-only; HUB may keep public browsing with authenticated launch. None of those apps is changed here.


## DEC-019 — Mobile email OTP with unchanged owner authorization

**Status:** ACTIVE — accepted for v1.4.0.
**Date:** 2026-09-11

The owner explicitly requested a six-digit Email OTP flow so mobile users can return to their original browser instead of depending on a Magic Link opening the correct browser context. Reuse pinned supabase-js 2.116.0: signInWithOtp with shouldCreateUser:false and the explicit MAIN redirect, then verifyOtp with email/token/type=email. Use one numeric-keypad/autofill-compatible field, a 60-second resend cooldown and safe errors. Do not store OTPs or create a custom login/session system.

Supabase Auth establishes the session; registry-ops still checks the exact existing owner UUID. Non-owners gain no links, ordering or writes. A delayed OTP result must match the newest Auth-event session before owner validation, preserving cross-tab sign-out and identity changes. The existing Magic Link callback support remains; the deployed email template includes both Token and ConfirmationURL.

This project is shared with Tracker. Its Site URL is currently https://tracker.ycsu.cc/ and both Tracker and MAIN redirects are allowed. Keep that shared fallback unchanged; MAIN already sends emailRedirectTo: location.origin + '/'. OTP verification requires no redirect. No other app, Registry architecture, grants or owner permission changes are included.

Inspection found Custom SMTP disabled with empty sender/host/username, a link-only default template, and email OTP length 8 (expiry 3600 seconds). At that initial inspection, the owner's existing Resend service was not configured on this Supabase project. The owner subsequently configured existing Resend on this project. SMTP enabled/host readback passed, OTP length was changed to 6 and read back after reload, and the reviewed token-plus-link subject/body were saved and read back. One explicitly authorized OTP request returned 200; YuCheng confirmed receiving exactly six digits. No SMTP credential was read, displayed or transferred into chat. Preserve unrelated email templates and redirect settings. Do not deploy the six-digit UI until SMTP, the six-digit setting and real desktop delivery are verified. A controlled candidate deployment then enables the owner's real MAIN mobile acceptance. Do not merge, tag, publish v1.4 or replace the v1.3 LKG until that same-browser mobile acceptance passes. The released v1.3 frontend remains the recovery baseline. Controlled OTP candidate deployment `6aa49a34fa3641ec6784ecbb` is live; only OTP length and the passwordless email subject/body were changed by this agent. Shared redirects and unrelated templates remain unchanged.


YuCheng subsequently confirmed physical-mobile OTP login, product links, card ordering and session persistence across refresh/browser reopen. A fresh desktop tab also restored the existing owner session. This satisfies the required real-mobile acceptance before release.

YuCheng also confirmed a fresh desktop request/code/login succeeds after signing out. All requested owner desktop/mobile acceptance checkpoints are complete. Release this as v1.4.0 separately from v1.3.0.

## DEC-020 — MAIN Writing v1 (2026-09-18)
Writing is an independent content type, never a Product. Its single card shares the Product grid and mixed ordering, but not Product metadata/statistics. Markdown is canonical; media is static repo content. The smallest persistence addition is a service-only main_presentation singleton in the existing Supabase project. Separate home_order, article_order and featured_slug prevent implicit coupling; legacy Product ranks remain the initial/fallback order and are never rewritten by Writing.
The viewer uses clean editorial typography and restrained frosted framing: desktop index + reader, mobile separate list/reader states. Real static article pages preserve deep links, refresh, SEO and no-JS content. Optional video is a link, avoiding a new embed subsystem. Owner edits lightweight presentation settings using existing Auth; no full CMS or body editor.
Publishing requires explicit owner instruction such as 「更新這篇到 MAIN」. Approved conversation copy/images should be retrieved using available tools, without manual shuttling when already accessible. Draft completion alone never publishes. No unattended publishing or screenshot automation. Detailed contract: docs/WRITING.md. User's Writing v1 task authorizes release only after implementation, tests, isolated QA and review gates.

## DEC-021 — Writing v1.1 contextual editing and visual polish (2026-09-18)
Explicit owner authorization supersedes DEC-020's no-body-editor boundary only for existing published Writing articles. No full CMS or Product editing is added. Homepage retains Arrange cards; Edit Article, Set as featured and Reorder articles live inside the reader.
Markdown in content/writing remains canonical. The new writing-content Edge Function verifies the existing exact confirmed nonanonymous owner via getUser, then uses server-only MAIN_WRITING_GITHUB_TOKEN for the fixed blackeirose/YCSU-Platform/main repository. Only an existing slug's Markdown and new immutable image files in its own public/writing directory may change. Git blob SHA and non-force ref update reject concurrent changes; text and assets commit atomically. No delete, arbitrary path, repo, branch, credentials or Product operations are accepted. Tags, featured flags and display_order survive editing.
Public runtime content is generated from the current canonical Git commit; each request checks main head, reusing parsed content only for the same commit. Save returns the exact committed public article so another instance's cache cannot replace it with old content. GitHub failure falls back to the last deployed static manifest. Static no-JS/SEO pages are rebuilt during the next attended release, not on each edit. No Git auto-deploy, unattended publishing, screenshot service or new database is introduced.
Images are PNG/JPEG/WebP/GIF uploads, validated by filename/signature and size. Originals remain for recovery. Replacement filenames are unique within the current article. Existing image selection and URL replacement remain available; URLs are not fetched by the backend.
Home grid order, article index order and featured selection remain separate. Desktop uses a smaller floating frosted panel, modern system-sans editorial typography and compact left-aligned header. Mobile keeps full-height article/list states. Tags support a bounded safe YAML block list with no filter UI.

Writing v1.1 credential separation: explicit owner instruction requires read-public to use unauthenticated public GitHub access and never retrieve MAIN_WRITING_GITHUB_TOKEN. Only owner-authorized edit/read and save operations use that secret. Failed GitHub calls return bounded github_status/response_class diagnostics without upstream bodies or secrets. Frontend publication requires actual owner save/logout acceptance; this gate passed for the release recorded in docs/releases/main-writing-v1-1.md.

## DEC-022 — Writing v1.2 semantic formatting and body size (2026-09-18)
Explicit owner request adds limited visual controls to the existing Markdown textarea and live preview. Markdown remains canonical, never rendered HTML. Bold/Italic map to **text**/*text*, H2/H3 to ##/###, Quote to > and Link to safe HTTPS Markdown. One fixed existing Writing system font; no font picker, colors, per-span sizes or rich-text CMS. One frontmatter body_font_size integer applies to the whole body, allowlisted to17/18/19/20 (default18). It persists through owner Git saves and reaches public/static readers, with bounded data attributes rather than freeform CSS. Title, metadata, sidebar and controls remain independent.
Formatting retains selection and supports repeated toggles and same-selection combined bold/italic. Selections crossing partial/mixed existing markup, code/images/link syntax, or structural markers are rejected with a recovery hint instead of rewriting ambiguous source. Select plain text within the structure or the complete emphasized phrase. Existing raw Markdown editing remains available. Exact-owner authorization, logout invalidation and token-free public reads are preserved.

## DEC-023 — Product lifecycle and Writing 12–20 (2026-09-19)
Explicit owner authorization extends the existing owner backend to Hide/Show, Archive/Restore and recoverable Delete/Restore. Preserve exact-owner Auth and owner-only links.

## MAIN v1.3 — Product Lifecycle milestone (released / production verified)
This feature milestone is distinct from the historical v1.3.0 Product Links release. Visible/Hidden/Archived/Deleted are separate from maturity, deployment and existing visibility enums. Exact owner receives full records and contextual lifecycle controls; no Create Product UI or hard-delete UI. Hidden remains in the active order; guests receive only id/name/lifecycleState/sortOrder and see name + UNAVAILABLE. Archived/Deleted are absent publicly and recoverable in owner-only compact sections. Restore preserves the previous active visibility, including Hidden.
The lifecycle RPC atomically checks lifecycle_revision, changes constrained state fields and advances presentation revision. Existing archived is a compatibility projection, true for archived/deleted only. Mixed ordering retains inactive slots. Legacy reorder additionally requires presentationRevision from writing-ops read-owner, preventing stale Product ranks from overwriting newer mixed order. No new browser table grants.
Current frontend sends read-public contract lifecycle-v1. Legacy clients receive the original visible-only allowlist, with Hidden omitted rather than leaked or rendered incorrectly. Public links remain owner-only. An offline Registry cannot validate current visibility: static snapshot is empty, build rejects nonempty snapshots, and runtime shows catalog unavailable instead of stale Products. Writing remains independently available. Previously public Git/history/static images are not made globally private by this runtime projection.
Writing body_font_size supports integer12–20, default18; title/sidebar/metadata and inline formatting are unchanged. Final production evidence and limitations: docs/releases/main-v1-3-product-lifecycle.md.

## DEC-024 — Journal card identity and scoped Social Capture polish
Explicit MAIN v1.3.1 request: name the Writing card YSU Journal, preserving WRITING as the content type and existing routes/schema/whole-card navigation. Reuse the existing title setting; align only Writing's card with unchanged Product meta/name/preview rows. Preserve the independent reader/editor. Add only Social Capture's manually curated real public landing screenshot, and translate its two Registry text fields through the existing management operation with factual limitations and all other fields retained. One frontend release after tests, real browser QA and Registry readback.

## DEC-025 — MAIN cover and newest-first article insertion
Explicit Writing v1.3.2 decision: retain featured_slug and article_order as independent settings. MAIN cover uses the selected published article for all card article content, with newest date/slug fallback. Owner-only cover label and clear contextual action; no guest management UI. Unlisted articles sorted date DESC/slug ASC precede manual-ranked items, whose relative order is preserved. Legacy Markdown featured/display_order and presentation override fields stay stored for compatibility; they do not override the new selection/order rules. No schema, Auth, Product or reader redesign.
