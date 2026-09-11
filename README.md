# YCSU Platform — v1.3.0 "Owner-only Product Links"

A registry-driven product directory and public entry point for the YCSU product ecosystem — every product, its status, and where to find it, kept current by direct authorized machine operation, not by editing this repository. **Live at [main.ycsu.cc](https://main.ycsu.cc).**

See `PROJECT_CONTEXT.md` and `DECISIONS.md` for the durable project record, `docs/` for the governance and data-layer model, and the canonical [`ysu-ai-core`](https://github.com/blackeirose/ysu-ai-core) for cross-project governance.

## Structure

```
index.html                The site — fetches live from Supabase, falls back to the snapshot below
assets/previews/            Optional manual WebP previews named by Registry slug
registry.schema.ts          Canonical typed schema (documentation contract, no build step)
netlify.toml                 Netlify build/publish config (allowlisted dist output)
data/
  registry.public.snapshot.json     Public-safe fallback copy — NOT the runtime source of truth
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

Run `npm run build` to create the public-only `dist` folder. `index.html` needs `http(s)://` (not `file://`) since it fetches live data — serve the folder with any static server:

```bash
npx serve dist
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

**Refreshing the public-safe fallback snapshot** (occasionally, e.g. before a release):

```bash
node scripts/snapshot-registry.mjs
node scripts/validate-registry.mjs
```

## Owner card ordering

Use **Owner sign in** in the footer and open the emailed link for the existing authorized Supabase owner account. Drag the grip directly with a mouse, or hold a non-interactive card area for 500 ms before dragging. On touch, hold the grip for 500 ms. Release to save. Links retain their normal behavior. A focused grip also supports Arrow keys, Home, and End; Escape cancels a drag.

Order is stored in nullable `product_registry.sort_order`, ascending with nulls last and a stable name fallback. Saves use only `registry-ops`; public visitors and offline snapshot views cannot reorder. A failed save restores the previous display order; reload before retrying to retrieve any newer order. Owner sessions cannot perform other Registry writes. See DEC-017 and `docs/REGISTRY_OPERATIONS.md`.

Run `npm ci`, `npm test`, and `npm run validate` for local validation. Test dependencies are development-only; the static packaging step has no runtime dependencies. The owner confirmed real-device drag/touch acceptance on 2026-09-11; production owner mouse-grip drag/save/reload and failure rollback have also passed.

## Product Preview Images

Preview images are **manually curated and updated only as part of an explicit MAIN maintenance task**. The owner does not need to capture them personally: an authorized AI/development agent such as Codex may open the verified production URL, select a representative current state, capture it, convert it to WebP, and update the asset. No scheduled, background, deployment-triggered, or unattended screenshot automation is permitted. Add or replace `assets/previews/{slug}.webp`, matching the Registry slug exactly. Use a current homepage/interface screenshot, preferably WebP from a 1440 × 900 viewport (16:10); do not upscale small images. No screenshot path belongs in Supabase.

Public/Live cards show the image or a graceful fallback; Local/Internal cards show DEVELOPMENT PREVIEW; Not Deployed cards show IN PROGRESS; planned domains are owner-only and non-clickable. The grid uses 3 columns on desktop, 2 on tablet, and 1 on mobile. See [the manual workflow and display rules](assets/previews/README.md). Image changes require the existing frontend deployment process; metadata updates continue to appear without redeployment.

## Deployment

See `DEPLOYMENT.md` for the live URL, Netlify site details, Supabase project/function details, and current infrastructure status.

## v1.3 owner-only links

Public visitors receive product metadata with protected URL fields absent, non-clickable previews, no action links and no reorder controls. The existing owner session unlocks full links and ordering after server UUID validation. Logout removes them immediately. Direct raw-table reads are denied for every browser role; all reads use registry-ops. See DEC-018 and docs/DATA_LAYER.md.

Only dist may be deployed. It excludes manifests, docs, SQL, tests and full exports. The public snapshot validator rejects protected fields and URL-bearing values. Public Git history/architectural docs can still mention YCSU domains; this feature controls the current MAIN runtime interface, not access to downstream products.
