# REGISTRY_SCHEMA.md

**YCSU Platform — Registry & Product Manifest Specification**
**Version:** 1.0 (established at v1.0.0 release, 2026-08-28)

The typed source of truth is [`registry.schema.ts`](../registry.schema.ts) — this document explains it in prose and defines the related per-product manifest format. If this document and the `.ts` file ever disagree, the `.ts` file wins; fix this document.

---

## 1. Registry Field Reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable kebab-case identifier. Never reused for a different product. |
| `name` | string | Full product name. |
| `shortName` | string | Short form for tight UI contexts. |
| `description` | string | One sentence. |
| `category` | string | Free-text grouping label (e.g. "Platform Infrastructure"). |
| `platformLayer` | enum | `Platform` / `Management` / `Product` — see `PLATFORM_MODEL.md` §1. Default to `Product` unless certain. |
| `maturity` | enum | `Idea` / `Planning` / `Prototype` / `Internal Alpha` / `Beta` / `Production` |
| `deployment` | enum | `Not Deployed` / `Local` / `Internal` / `Public` / `Archived` |
| `visibility` | enum | `Private` / `Internal` / `Public` |
| `version` | string \| null | e.g. `"v1.0.0"`. Null iff `versionSource` is `"none"`. |
| `versionSource` | enum | `github-release` / `git-tag` / `package` / `manual` / `none` |
| `mainUrl` | string \| null | **Only ever set to a URL you have personally verified is live right now.** |
| `plannedUrl` | string \| null | The intended future URL. Never rendered as an active Launch link. |
| `githubUrl` | string \| null | Canonical repository. |
| `trackerUrl` | string \| null | Deep link into this product's own Tracker entry, if confirmed. |
| `docsUrl` | string \| null | Link to the product's own documentation (often its `PROJECT_CONTEXT.md` on GitHub). |
| `roadmapUrl` | string \| null | |
| `certification` | enum | `Not Certified` / `YCSU Certified` — see `PLATFORM_MODEL.md` §6. |
| `lastUpdated` | string (ISO date) | When this row's facts were last verified against real state. |
| `statusNote` | string \| null | Short honest caveat, e.g. "DNS not configured yet." |

## 2. The `mainUrl` / `plannedUrl` Rule

This is the single most important rule in the schema: **the Registry represents verified reality, not project intention.**

- If a domain is planned but does not currently resolve/serve the product, it goes in `plannedUrl`, `mainUrl` stays `null`, and `deployment` stays `"Not Deployed"` (or `"Local"`/`"Internal"` if it runs somewhere non-public).
- Only move a URL from `plannedUrl` to `mainUrl` after directly verifying it (DNS resolves, HTTP 200, correct content) — not from a roadmap document, not from what "should" be true.
- The UI must never render a `plannedUrl` as a clickable Launch action.

`scripts/validate-registry.mjs` mechanically rejects an entry that sets both fields at once, or sets `mainUrl` while `deployment` is `"Not Deployed"`.

---

## 3. Product Manifest Specification (`ycsu-product.json`)

A **Product Manifest** is a small, self-contained JSON file a product's own repository can carry, describing itself in a schema compatible with (but simpler than) the central Registry. It is the intended future hand-off unit for `FUTURE_AI_CORE_HANDOFF.md`'s registration pipeline.

**Not implemented in v1**: no discovery, no automatic sync, no validation pipeline. This is a specification and one real example only.

**Canonical filename:** `ycsu-product.json`, at the root of the product's own repository.

**Shape:**

```json
{
  "schemaVersion": "1.0",
  "id": "ycsu-platform",
  "name": "YCSU Platform",
  "version": "v1.0.0",
  "maturity": "Production",
  "deployment": "Public",
  "visibility": "Public",
  "mainUrl": "https://main.ycsu.cc",
  "repository": "https://github.com/blackeirose/YCSU-Platform",
  "certification": "YCSU Certified",
  "lastUpdated": "2026-08-28"
}
```

Field meanings are identical to the matching fields in `registry.schema.ts` — a manifest is conceptually a single-product subset of a Registry entry, not a separate schema. A future AI CORE pipeline should be able to read a manifest and produce a Registry entry (or diff against the existing one) without knowing anything about how `main.ycsu.cc`'s UI is implemented.

A real example lives at [`manifests/ycsu-platform/ycsu-product.json`](../manifests/ycsu-platform/ycsu-product.json) in this repository.

Do not create a second, conflicting manifest schema elsewhere — extend this one.
