# PROJECT_CONTEXT.md

**YSU AI Development System**
**Project Version:** v1.0.0 — "Product Registry Foundation" (locked 2026-08-28)

This document describes the current durable context of this project. It should allow a new AI agent or developer to understand the project without relying on previous conversation history.

For confirmed design or architecture decisions and their reasoning, see `DECISIONS.md`.

---

# 1. PROJECT IDENTITY

## Project Name

`YCSU Platform`

## Short Description

A static, data-driven product registry and entry point for the YCSU product ecosystem. Lists each YCSU product (Workflow Hub, Tracker, ADCC, Rachel's Animal Kingdom, and future products) with its domain, deployment status, and maturity, sourced from a single `registry.json` file.

## Product Type

Static web application / product directory

## Current Status

**v1.0.0 — locked and released.** Live in production at `https://main.ycsu.cc`. DNS attached, HTTPS valid, Team Protection disabled, registry schema formalized. See `DEPLOYMENT.md` for current infrastructure state and `docs/PLATFORM_MODEL.md` for the governance model this release established.

---

# 2. PRODUCT PURPOSE

## Primary Goal

Give the YCSU ecosystem a single public entry point (`main.ycsu.cc`) that shows what products exist, their current status, and where to find them — the "front door" of the ecosystem.

## Primary User

The repository owner (`blackeirose` / `ysu`) and anyone visiting `main.ycsu.cc` to find a YCSU product.

## Core Use Case

**Visit `main.ycsu.cc` → see every YCSU product as a card (name, status, domain, deployment info) → click through to a live product, or see at a glance what's still in development.**

## Out of Scope (v1)

- Authentication / accounts
- A backend or database — the registry is a static JSON file edited directly
- Automatic DNS/deployment status polling (registry entries are updated manually by an agent when state changes)
- The full "YCSU Platform" operating framework (Platform/Management/Product layers) described in the broader product vision — v1 is only the public registry UI representing it, not the framework itself

---

# 3. CURRENT PRODUCT STATE

## Working Features

- Static HTML/CSS/JS page (`index.html`) that fetches and renders `registry.json`
- Formal typed registry schema (`registry.schema.ts`) — `platformLayer`, `maturity`, `deployment`, `visibility`, `version`/`versionSource`, `mainUrl`/`plannedUrl`, `certification`, and optional links, documented in `docs/REGISTRY_SCHEMA.md`
- `scripts/validate-registry.mjs` — manual (non-CI) validator enforcing the schema and the "verified reality only" rule (a `plannedUrl` can never masquerade as `mainUrl`)
- YCSU Product Manifest specification (`docs/REGISTRY_SCHEMA.md` §3) with a real example at `manifests/ycsu-platform/ycsu-product.json`
- Governance docs: `docs/PLATFORM_MODEL.md` (Platform/Management/Product layers, Product vs Utility, lifecycle, version/certification models), `docs/FUTURE_AI_CORE_HANDOFF.md` (documented, not implemented)
- Responsive card grid, light/dark theme via `prefers-color-scheme`; verified on desktop/tablet/mobile

## In Development

Nothing currently blocked. Next milestone is not yet scoped — see `docs/FUTURE_AI_CORE_HANDOFF.md` for the documented (not implemented) direction.

---

# 4. ARCHITECTURE SUMMARY

## Current Architecture Pattern

Pattern A (static site) — no server, no build step, no framework. `index.html` fetches `registry.json` client-side.

## Architecture Summary

**Browser → `index.html` → `fetch('registry.json')` → render cards**

No backend, no database, no authentication.

---

# 5. TECHNOLOGY SUMMARY

## Frontend / Interface

Plain HTML + CSS + vanilla JS. No framework, no build step, no dependencies.

## Backend

None.

## Database

None. `registry.json` is the data source and is hand-edited / agent-edited directly in the repository.

## Authentication

None.

---

# 6. SOURCE CONTROL

## Canonical Repository

`https://github.com/blackeirose/YCSU-Platform`

## Default Branch

`main`

## Repository Role

Canonical source of truth for this project's code and registry data.

---

# 7. DEPLOYMENT

## Deployment Required?

Yes

## Current Deployment Platform

Netlify (per `ysu-ai-core/docs/SERVICES.md` §5 default)

## Production Status

See `DEPLOYMENT.md` for the current live URL and DNS status — this file is not the source of truth for real-time deployment state.

## Deployment Relationship

GitHub (`blackeirose/YCSU-Platform`, `main` branch) → manual `netlify deploy --prod` (see `DEPLOYMENT.md` for the one-click dashboard option to make this automatic — not yet enabled) → `main.ycsu.cc`, **live**.

---

# 8. DOMAIN

## Custom Domain

`main.ycsu.cc` — **live**, DNS attached, HTTPS valid (verified 2026-08-28).

## Domain Role

Primary public entry point for the YCSU ecosystem.

## DNS / Registrar

Namecheap (`ycsu.cc` zone). No DNS automation exists for this zone — every change is a manual step in the Namecheap dashboard until Terraform + the Namecheap provider is adopted (see `ysu-ai-core/Claude_Workspaces/Shared/Claude_Instructions/YCSU_DEPLOYMENT_AUTOMATION_PLAN.md`).

---

# 9. DATA AND STORAGE

## Does the Product Store Persistent Data?

Yes — `registry.json`, committed to the repository, hand/agent-edited.

## Storage Location

Repository file (`registry.json`).

## Existing Data Must Be Preserved?

Yes — registry entries for other YCSU products should not be removed without confirming with the user; they represent the ecosystem's current known state.

---

# 10. EXTERNAL SERVICES

| Service | Purpose | Required? |
|---|---|---|
| GitHub | Canonical source control | Yes |
| Netlify | Static hosting + CD | Yes |
| Namecheap | DNS for `main.ycsu.cc` | Yes, manual only |

No Supabase or other backend service is used.

---

# 11. IMPORTANT CONSTRAINTS

- Must remain static/data-driven — do not introduce a backend unless a future requirement (e.g. live status polling, user accounts) genuinely needs one, per `ysu-ai-core/docs/SERVICES.md`.
- `registry.json` must conform to `registry.schema.ts` — run `node scripts/validate-registry.mjs` before committing a registry change.
- `mainUrl` must only ever be set to a URL that has been personally verified live right now; an unverified/future domain belongs in `plannedUrl` and must never render as an active Launch link (see `docs/REGISTRY_SCHEMA.md` §2).
- `registry.json` entries for products this project did not build should only be updated when their real state is verified (live DNS check, repo inspection, or explicit user confirmation) — never guessed.
- DNS changes to the `ycsu.cc` zone always require explicit user action (see `DEPLOYMENT.md` and `ysu-ai-core/docs/DOMAIN_REGISTRY.md` §2A).
- v1 scope is frozen (see `docs/PLATFORM_MODEL.md` §8): no GitHub API sync, no Supabase backend, no AI CORE automation, no live-status polling, no auth. Do not add these without an explicit new milestone decision.

---

# 12. CURRENT DEVELOPMENT FOCUS

v1.0.0 is released and locked. No open work.

---

# 13. NEXT LIKELY MILESTONE

Not yet scoped. `docs/FUTURE_AI_CORE_HANDOFF.md` documents (without implementing) the direction: a "YCSU Product Registration Pipeline" where products submit a `ycsu-product.json` manifest and AI CORE synchronizes it into `registry.json`, rather than agents hand-editing this repository per product change. Do not begin building that pipeline without an explicit decision to start it.

---

# 14. PROJECT-SPECIFIC DOCUMENTATION

- `AGENTS.md` — agent entry instructions
- `PROJECT_CONTEXT.md` — this file
- `DECISIONS.md` — confirmed durable project decisions
- `DEPLOYMENT.md` — live deployment record (source of truth for infra state)
- `registry.schema.ts` — typed registry schema
- `docs/PLATFORM_MODEL.md` — governance model (layers, Product vs Utility, lifecycle, version/certification rules)
- `docs/REGISTRY_SCHEMA.md` — schema field reference + Product Manifest specification
- `docs/FUTURE_AI_CORE_HANDOFF.md` — future pipeline architecture (documented, not implemented)

---

# 15. MAINTENANCE RULE

Update this file when product purpose, architecture, deployment, domain, services, or current development direction durably change. Update `registry.json` whenever a tracked product's real-world status changes (verified, not assumed) — and re-run `node scripts/validate-registry.mjs` after.
