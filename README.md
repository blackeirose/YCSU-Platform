# YCSU Platform — v1.0.0 "Product Registry Foundation"

Central registry and entry point for the YCSU product ecosystem — a static page listing every YCSU product, its status, and where to find it. **Live at [main.ycsu.cc](https://main.ycsu.cc).**

See `PROJECT_CONTEXT.md` and `DECISIONS.md` for the durable project record, `docs/` for the governance model, and the canonical [`ysu-ai-core`](https://github.com/blackeirose/ysu-ai-core) for cross-project governance.

## Structure

```
index.html            The entire site — fetches and renders registry.json
registry.json          Product registry data (edit this to add/update products)
registry.schema.ts      Canonical typed schema (documentation contract, no build step)
netlify.toml            Netlify build/publish config (pure static, no build step)
scripts/
  validate-registry.mjs  Manual (non-CI) registry validator — run before committing
manifests/
  ycsu-platform/ycsu-product.json  Example Product Manifest (see docs/REGISTRY_SCHEMA.md §3)
docs/
  PLATFORM_MODEL.md       Platform/Management/Product layers, Product vs Utility, lifecycle, version & certification rules
  REGISTRY_SCHEMA.md      Field-by-field schema reference + Product Manifest spec
  FUTURE_AI_CORE_HANDOFF.md  Future registration pipeline — documented, not implemented
```

## Local development

No build step. Open `index.html` directly (registry fetch needs `http(s)://`, not `file://`), or serve the folder with any static server, e.g.:

```bash
npx serve .
```

## Updating the registry

1. Edit `registry.json` directly — see `docs/REGISTRY_SCHEMA.md` for field meanings and enum values.
2. Only update a product's fields once its real state (DNS, deployment, repo) has been verified — do not guess. `mainUrl` must only ever point to something you've confirmed is live right now; an unverified future domain belongs in `plannedUrl`.
3. Run the validator before committing:

```bash
node scripts/validate-registry.mjs
```

## Deployment

See `DEPLOYMENT.md` for the live URL, Netlify site details, and current infrastructure status.
