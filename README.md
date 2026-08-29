# YCSU Platform — v1.1.0 "Registry Management Foundation"

A registry-driven product directory and public entry point for the YCSU product ecosystem — every product, its status, and where to find it, kept current by direct authorized machine operation, not by editing this repository. **Live at [main.ycsu.cc](https://main.ycsu.cc).**

See `PROJECT_CONTEXT.md` and `DECISIONS.md` for the durable project record, `docs/` for the governance and data-layer model, and the canonical [`ysu-ai-core`](https://github.com/blackeirose/ysu-ai-core) for cross-project governance.

## Structure

```
index.html                The site — fetches live from Supabase, falls back to the snapshot below
registry.schema.ts          Canonical typed schema (documentation contract, no build step)
netlify.toml                 Netlify build/publish config (pure static, no build step)
data/
  registry.snapshot.json     Disaster-recovery/audit copy — NOT the runtime source of truth
scripts/
  validate-registry.mjs      Manual (non-CI) validator for the snapshot
  snapshot-registry.mjs      Refreshes the snapshot from the live Registry (DB -> file, one-way)
manifests/
  ycsu-platform/ycsu-product.json  Example Product Manifest (see docs/REGISTRY_SCHEMA.md §3)
supabase/
  migrations/                 SQL: table, constraints, RLS policy
  functions/registry-ops/     The authenticated write interface (Deno Edge Function)
  config.toml                 Function deploy config (verify_jwt = false — see docs/DATA_LAYER.md)
docs/
  PLATFORM_MODEL.md           Platform/Management/Product layers, Product vs Utility, lifecycle, version & certification rules
  DATA_LAYER.md                Supabase architecture: why this project, table schema, RLS/security model, fallback/snapshot model
  REGISTRY_OPERATIONS.md       The contract authorized clients (e.g. ChatGPT) use to create/update/archive records
  REGISTRY_SCHEMA.md           Field-by-field schema reference + Product Manifest spec
  FUTURE_AI_CORE_HANDOFF.md    v1.1 (current, direct ops) vs. V2+ (future, full lifecycle pipeline)
```

## Local development

No build step. `index.html` needs `http(s)://` (not `file://`) since it fetches live data — serve the folder with any static server:

```bash
npx serve .
```

## Updating the Registry

**Routine changes (maturity, version, deployment, archiving, etc.) are database operations, not file edits** — see `docs/REGISTRY_OPERATIONS.md` for the full contract. In short:

```bash
curl -X POST https://fzydsnxxcdllkjxwdiwn.supabase.co/functions/v1/registry-ops \
  -H "Authorization: Bearer $REGISTRY_API_KEY" -H "Content-Type: application/json" \
  -d '{"operation":"update","slug":"workflow-hub","data":{"maturity":"Beta"}}'
```

No commit, no redeploy — `main.ycsu.cc` reflects it on next page load. `REGISTRY_API_KEY` is a Supabase Function secret; retrieve/rotate it in the Supabase dashboard, never in this repo.

**Schema or table changes** (adding a field, changing a constraint) are a real code change: edit `registry.schema.ts`, add a migration under `supabase/migrations/`, update `registry-ops` if the write contract changes, and update `docs/REGISTRY_SCHEMA.md` / `docs/REGISTRY_OPERATIONS.md`.

**Refreshing the disaster-recovery snapshot** (occasionally, e.g. before a release):

```bash
node scripts/snapshot-registry.mjs
node scripts/validate-registry.mjs
```

## Deployment

See `DEPLOYMENT.md` for the live URL, Netlify site details, Supabase project/function details, and current infrastructure status.
