# PROJECT_CONTEXT.md

**YSU AI Development System**
**Project Version:** v1.1.0 — "Registry Management Foundation" (released 2026-08-29)

This document describes the current durable context of this project. It should allow a new AI agent or developer to understand the project without relying on previous conversation history.

For confirmed design or architecture decisions and their reasoning, see `DECISIONS.md`.

---

# 1. PROJECT IDENTITY

## Project Name

`YCSU Platform`

## Short Description

A registry-driven product directory and public entry point for the YCSU product ecosystem. Lists each YCSU product (Workflow Hub, Tracker, ADCC, Rachel's Animal Kingdom, and future products) with its domain, deployment status, and maturity. As of v1.1, the data lives in a Supabase table — `product_registry` — and can be created/updated/archived directly by any authorized client (e.g. ChatGPT via an API call) without editing this repository's code.

## Product Type

Registry-driven web application / product directory

## Current Status

**v1.1.0 — released.** Live in production at `https://main.ycsu.cc`. The homepage is generic and Registry-driven (no per-product rendering code); the Registry itself is a Supabase table with RLS (public read, no direct write policy) and a single authenticated write interface (`registry-ops`). See `DEPLOYMENT.md` for infrastructure state, `docs/DATA_LAYER.md` for the data architecture, and `docs/REGISTRY_OPERATIONS.md` for how authorized clients operate it.

---

# 2. PRODUCT PURPOSE

## Primary Goal

Give the YCSU ecosystem a single public entry point (`main.ycsu.cc`) that shows what products exist, their current status, and where to find them — **and** let that information be kept current by direct, authorized machine operation rather than by an engineer editing source files for every routine change.

## Primary User

The repository owner (`blackeirose` / `ysu`), any AI assistant they authorize to operate the Registry (e.g. ChatGPT), and anyone visiting `main.ycsu.cc` to find a YCSU product.

## Core Use Case

**Visit `main.ycsu.cc` → see every YCSU product as a card (name, status, domain, deployment info) → click through to a live product, or see at a glance what's still in development.**

**Operationally:** *"Move Rachel to Production"* or *"Add Kuula AI Assistant"* → an authorized client calls `registry-ops` → the database updates → `main.ycsu.cc` reflects it immediately. No code edit, no commit, no redeploy. This round trip was tested and verified working at v1.1.0 release (see `DECISIONS.md` DEC-014).

## Out of Scope (v1.1)

- Authentication / accounts for site visitors
- Automated *discovery* of product state (GitHub Release detection, deployment health polling, webhook automation) — authorized agents still assert facts they've verified themselves
- The AI CORE Product Registration Pipeline / Product Manifest ingestion — documented, not built (`docs/FUTURE_AI_CORE_HANDOFF.md`)
- The full "YCSU Platform" operating framework (Platform/Management/Product layers) described in the broader product vision — this product is only the public registry UI + data layer representing it, not the framework itself
- A user-facing admin dashboard or CMS

---

# 3. CURRENT PRODUCT STATE

## Working Features

- Generic, Registry-driven card renderer (`index.html`) — no product-specific components; adding product #50 requires zero UI code changes
- Live read path: `index.html` fetches directly from Supabase PostgREST (`product_registry`, public anon key, RLS-scoped to read-only)
- Fallback: on fetch failure, falls back to a bundled `data/registry.snapshot.json` (never written back)
- Write path: `registry-ops` Supabase Edge Function — authenticated via a custom secret (`REGISTRY_API_KEY`, not a Supabase Auth session), validates payloads, writes via `service_role` server-side. Supports create / update / archive / unarchive / (administrative) delete
- Database-enforced schema: enum CHECK constraints, `mainUrl`/`plannedUrl` mutual exclusivity, `version`/`versionSource` consistency, and the mechanical part of the certification checklist — all enforced at the DB layer, not just client-side
- `scripts/validate-registry.mjs` + `scripts/snapshot-registry.mjs` — offline validation and on-demand snapshot refresh of the disaster-recovery copy
- All 5 v1.0.0 products migrated into the table with their verified v1.0.0 facts preserved (not re-guessed)
- Governance docs: `docs/PLATFORM_MODEL.md`, `docs/DATA_LAYER.md`, `docs/REGISTRY_OPERATIONS.md`, `docs/REGISTRY_SCHEMA.md`, `docs/FUTURE_AI_CORE_HANDOFF.md`
- Responsive 3/2/1-column card grid, light/dark theme, status-first hierarchy, and three-line Status Notes
- Manual product showcase previews derived from Registry slugs at `/assets/previews/{slug}.webp`; Live, development, and planned states use the same generic renderer. See `assets/previews/README.md` and DEC-016.

## In Development

Manual product previews are implemented as a presentation-only enhancement; production deployment state remains recorded in `DEPLOYMENT.md`. The next broader milestone is not yet scoped — see `docs/FUTURE_AI_CORE_HANDOFF.md`'s "V2+" section for the documented (not implemented) direction.

---

# 4. ARCHITECTURE SUMMARY

## Current Architecture Pattern

Registry-driven static frontend + managed backend-as-a-service (Supabase). No custom server, no build step, no framework on the frontend.

## Architecture Summary

**Read:** `Browser → index.html → Supabase PostgREST (anon key, RLS read-only) → render cards`
**Write:** `Authorized client → registry-ops Edge Function (secret-key auth + validation) → service_role write → product_registry`

Full diagrams in `docs/DATA_LAYER.md`.

---

# 5. TECHNOLOGY SUMMARY

## Frontend / Interface

Plain HTML + CSS + vanilla JS. No framework, no build step, no dependencies.

## Backend

Supabase Edge Function (`registry-ops`, Deno/TypeScript) — the only write path. No other backend.

## Database

Supabase Postgres, project `ysu-tool-tracker` (ref `fzydsnxxcdllkjxwdiwn`, reused — see `docs/DATA_LAYER.md` §1 for why), table `public.product_registry`. RLS enabled; public read policy only, no write policy for any role.

## Authentication

None for site visitors. The write interface uses a single shared secret (`REGISTRY_API_KEY`), not Supabase Auth — see `docs/DATA_LAYER.md` §3.

---

# 6. SOURCE CONTROL

## Canonical Repository

`https://github.com/blackeirose/YCSU-Platform`

## Default Branch

`main`

## Repository Role

Canonical source of truth for this project's **code** (frontend, Edge Function source, migrations, docs). As of v1.1, it is **not** the source of truth for Registry **data** — that's the Supabase table. `data/registry.snapshot.json` in this repo is a disaster-recovery/audit copy, refreshed on demand, not authoritative.

---

# 7. DEPLOYMENT

## Deployment Required?

Yes — both the static frontend (Netlify) and the Edge Function (Supabase).

## Current Deployment Platform

Netlify (frontend, per `ysu-ai-core/docs/SERVICES.md` §5 default) + Supabase Edge Functions (write interface).

## Production Status

See `DEPLOYMENT.md` for current live URL and infrastructure state.

## Deployment Relationship

GitHub (`blackeirose/YCSU-Platform`, `main` branch) → manual `netlify deploy --prod` for the frontend (see `DEPLOYMENT.md` for the one-click dashboard option — not yet enabled) → `main.ycsu.cc`. Separately: `supabase functions deploy registry-ops --project-ref fzydsnxxcdllkjxwdiwn` for the write interface, and `supabase db query --linked -f <migration>` (or an eventual `supabase db push`) for schema migrations. **Routine Registry data changes require neither** — that's the entire point of v1.1.

---

# 8. DOMAIN

## Custom Domain

`main.ycsu.cc` — live, DNS attached, HTTPS valid (verified 2026-08-28, reconfirmed 2026-08-29).

## Domain Role

Primary public entry point for the YCSU ecosystem.

## DNS / Registrar

Namecheap (`ycsu.cc` zone). No DNS automation exists for this zone — unchanged from v1.0.0, see `ysu-ai-core/docs/DOMAIN_REGISTRY.md` §2A.

---

# 9. DATA AND STORAGE

## Does the Product Store Persistent Data?

Yes — the Supabase `product_registry` table is the runtime source of truth. `data/registry.snapshot.json` is a manually-refreshed backup/audit copy, not live data.

## Storage Location

Supabase Postgres (`ysu-tool-tracker` project) + a snapshot file in this repository.

## Existing Data Must Be Preserved?

Yes — the 5 products migrated from v1.0.0 represent verified ecosystem state; prefer `archive` over `delete` for any product that should stop appearing in the default view (see `docs/PLATFORM_MODEL.md` §2/§7).

---

# 10. EXTERNAL SERVICES

| Service | Purpose | Required? |
|---|---|---|
| GitHub | Canonical source control (code, not data) | Yes |
| Netlify | Static hosting + CD for the frontend | Yes |
| Supabase | Registry database + `registry-ops` Edge Function | Yes (new in v1.1) |
| Namecheap | DNS for `main.ycsu.cc` | Yes, manual only |

---

# 11. IMPORTANT CONSTRAINTS

- `main.ycsu.cc` must remain a read/presentation surface — do not add write logic to the frontend; all writes go through `registry-ops`.
- Never add an INSERT/UPDATE/DELETE RLS policy for `anon` or `authenticated` on `product_registry` without a deliberate, documented decision — the current model relies on there being exactly one write path.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `REGISTRY_API_KEY` to the frontend or commit them to source.
- `mainUrl` must only ever be set to a URL that has been personally verified live right now; an unverified/future domain belongs in `plannedUrl` — enforced at the database layer now, not just by convention (see `docs/REGISTRY_SCHEMA.md` §2).
- Registry entries for products this project did not build should only be updated when their real state is verified — never guessed.
- DNS changes to the `ycsu.cc` zone always require explicit user action.
- Scope remains frozen per `docs/PLATFORM_MODEL.md` §8 / `docs/FUTURE_AI_CORE_HANDOFF.md`: no GitHub API sync, no AI CORE automation, no live-status polling, no site-visitor auth, no admin dashboard. Do not add these without an explicit new milestone decision.

---

# 12. CURRENT DEVELOPMENT FOCUS

v1.1.0 is released. The manual product-preview presentation enhancement is implemented; it does not change Registry data or the write architecture. Preview images are owner-selected assets, and the enhancement is not a claim of a new production deployment.

---

# 13. NEXT LIKELY MILESTONE

Not yet scoped. `docs/FUTURE_AI_CORE_HANDOFF.md`'s "V2+" section documents (without implementing) a full product-lifecycle pipeline: GitHub → deployment → production validation → `ycsu-product.json` manifest → AI CORE verification → the same `product_registry` table v1.1 already writes to. Do not begin building that without an explicit decision to start it.

---

# 14. PROJECT-SPECIFIC DOCUMENTATION

- `AGENTS.md` — agent entry instructions
- `PROJECT_CONTEXT.md` — this file
- `DECISIONS.md` — confirmed durable project decisions
- `DEPLOYMENT.md` — live deployment record (source of truth for infra state)
- `registry.schema.ts` — typed registry schema
- `docs/PLATFORM_MODEL.md` — governance model (layers, Product vs Utility, lifecycle, version/certification rules)
- `docs/DATA_LAYER.md` — Supabase architecture, RLS/security model, fallback/snapshot model
- `docs/REGISTRY_OPERATIONS.md` — the operations contract authorized clients (e.g. ChatGPT) use
- `docs/REGISTRY_SCHEMA.md` — schema field reference + Product Manifest specification
- `docs/FUTURE_AI_CORE_HANDOFF.md` — v1.1 (current) vs. V2+ (future) pipeline architecture

---

# 15. MAINTENANCE RULE

Update this file when product purpose, architecture, deployment, domain, services, or current development direction durably change. Registry **data** changes (a product's maturity, version, etc.) never touch this file or require a commit — use `registry-ops` per `docs/REGISTRY_OPERATIONS.md`. Run `node scripts/snapshot-registry.mjs` then `node scripts/validate-registry.mjs` periodically (e.g. before a release) to keep the disaster-recovery snapshot current and schema-valid.
