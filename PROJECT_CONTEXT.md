# PROJECT_CONTEXT.md

**YSU AI Development System**
**Project Version:** v1 (initial build, 2026-08-28)

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

v1 — deployed to Netlify, `main.ycsu.cc` DNS not yet attached (pending manual Namecheap step, see `DEPLOYMENT.md`)

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
- Registry schema covering: domain, deployment provider, backend dependency, maturity, status, visibility, notes
- Responsive card grid, light/dark theme via `prefers-color-scheme`

## In Development

- DNS attachment for `main.ycsu.cc` (blocked on a manual Namecheap step — no DNS automation exists yet for the `ycsu.cc` zone, see `docs/DOMAIN_REGISTRY.md` in `ysu-ai-core`)

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

GitHub (`blackeirose/YCSU-Platform`, `main` branch) → Netlify continuous deployment → `main.ycsu.cc` (pending DNS).

---

# 8. DOMAIN

## Custom Domain

`main.ycsu.cc` (target; see `DEPLOYMENT.md` for current attachment status)

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
- `registry.json` entries for products this project did not build should only be updated when their real state is verified (live DNS check, repo inspection, or explicit user confirmation) — never guessed.
- DNS changes to the `ycsu.cc` zone always require explicit user action (see `DEPLOYMENT.md` and `ysu-ai-core/docs/DOMAIN_REGISTRY.md` §2A).

---

# 12. CURRENT DEVELOPMENT FOCUS

v1 build and initial deployment. Next: confirm `main.ycsu.cc` DNS attachment once the user completes the manual Namecheap step, then validate production.

---

# 13. NEXT LIKELY MILESTONE

Once DNS is attached and validated: keep `registry.json` current as other YCSU products (Workflow Hub, ADCC, Rachel's Animal Kingdom) reach their own production deployments.

---

# 14. MAINTENANCE RULE

Update this file when product purpose, architecture, deployment, domain, services, or current development direction durably change. Update `registry.json` whenever a tracked product's real-world status changes (verified, not assumed).
