# YCSU Platform

Central registry and entry point for the YCSU product ecosystem — a static page listing every YCSU product, its status, and where to find it. Deployed at `main.ycsu.cc`.

See `PROJECT_CONTEXT.md` and `DECISIONS.md` for the durable project record, and the canonical [`ysu-ai-core`](https://github.com/blackeirose/ysu-ai-core) for cross-project governance.

## Structure

```
index.html      The entire site — fetches and renders registry.json
registry.json   Product registry data (edit this to add/update products)
netlify.toml    Netlify build/publish config (pure static, no build step)
```

## Local development

No build step. Open `index.html` directly, or serve the folder with any static server, e.g.:

```bash
npx serve .
```

## Updating the registry

Edit `registry.json` directly and commit. Only update a product's fields once its real state (DNS, deployment, repo) has been verified — do not guess.

## Deployment

See `DEPLOYMENT.md` for the live URL, Netlify site details, and the current `main.ycsu.cc` DNS status.
