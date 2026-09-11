# REGISTRY_SCHEMA.md

**YCSU Platform — Registry & Product Manifest Specification**
**Version:** 1.1 (updated at v1.1.0 release, 2026-08-29)

The typed source of truth is [`registry.schema.ts`](../registry.schema.ts) — this document explains it in prose and defines the related per-product manifest format. If this document and the `.ts` file ever disagree, the `.ts` file wins; fix this document.

**As of v1.1, the runtime source of truth is the Supabase `product_registry` table**, not a file in this repository — see `DATA_LAYER.md`. This schema still governs both: the table's columns, `registry-ops`' request/response shape, and `data/registry.snapshot.json`'s structure are all the same shape described here, just spelled snake_case in the database and camelCase everywhere else.

---

## 1. Registry Field Reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | DB-assigned UUID. Stable once created; not human-meaningful. |
| `slug` | string | Stable, human-meaningful, kebab-case identifier — the business key used by every `registry-ops` operation. Never reused for a different product. |
| `name` | string | Full product name. |
| `shortName` | string | Short form for tight UI contexts. |
| `description` | string | One sentence. |
| `category` | string | Free-text grouping label (e.g. "Platform Infrastructure"). |
| `platformLayer` | enum | `Platform` / `Management` / `Product` — see `PLATFORM_MODEL.md` §1. Default to `Product` unless certain. |
| `maturity` | enum | `Idea` / `Planning` / `Prototype` / `Internal Alpha` / `Beta` / `Production` |
| `deployment` | enum | `Not Deployed` / `Local` / `Internal` / `Public` / `Archived` |
| `visibility` | enum | `Private` / `Internal` / `Public` |
| `operationalStatus` | enum | `Live` / `Pending` / `Offline` / `Unknown` (default). Purely operational, set manually — not automated in v1.1. Never a stand-in for maturity/deployment/visibility. |
| `version` | string \| null | e.g. `"v1.0.0"`. Null iff `versionSource` is `"none"`. |
| `versionSource` | enum | `github-release` / `git-tag` / `package` / `manual` / `none` |
| `mainUrl` | string \| null | **Only ever set to a URL you have personally verified is live right now.** |
| `plannedUrl` | string \| null | The intended future URL. Never rendered as an active Launch link. |
| `githubUrl` | string \| null | Canonical repository. |
| `trackerUrl` | string \| null | Deep link into this product's own Tracker entry, if confirmed. |
| `docsUrl` | string \| null | Link to the product's own documentation (often its `PROJECT_CONTEXT.md` on GitHub). |
| `roadmapUrl` | string \| null | |
| `featured` | boolean | Featured presentation metadata (default `false`). Manual order uses `sortOrder`. |
| `sortOrder` | integer or null | Manual display rank; ascending, nulls last, then deterministic name/slug fallback. |
| `archived` | boolean | True if this entry should not appear in the default active view (default `false`). Prefer archiving over deleting — see `PLATFORM_MODEL.md` §2/§7 and `REGISTRY_OPERATIONS.md` §2.3. |
| `certification` | enum | `Not Certified` / `YCSU Certified` — see `PLATFORM_MODEL.md` §6. |
| `lastUpdated` | string (ISO date) | Last **meaningful** metadata change — see `REGISTRY_OPERATIONS.md` §4 for exact semantics (distinct from the DB's always-automatic `updated_at`). |
| `statusNote` | string \| null | Short honest caveat, e.g. "DNS not configured yet." |

## 2. The `mainUrl` / `plannedUrl` Rule

This is the single most important rule in the schema: **the Registry represents verified reality, not project intention.**

- If a domain is planned but does not currently resolve/serve the product, it goes in `plannedUrl`, `mainUrl` stays `null`, and `deployment` stays `"Not Deployed"` (or `"Local"`/`"Internal"` if it runs somewhere non-public).
- Only move a URL from `plannedUrl` to `mainUrl` after directly verifying it (DNS resolves, HTTP 200, correct content) — not from a roadmap document, not from what "should" be true.
- The UI must never render a `plannedUrl` as a clickable Launch action.

This rule is now enforced at three layers: `scripts/validate-registry.mjs` (the offline snapshot check), `registry-ops`' request validation, and a database CHECK constraint (`main_or_planned_not_both` in `supabase/migrations/20260829000001_product_registry.sql`) — the database is the layer that actually can't be bypassed.

---

## 3. Product Manifest Specification (`ycsu-product.json`)

A **Product Manifest** is a small, self-contained JSON file a product's own repository can carry, describing itself in a schema compatible with (but simpler than) the central Registry. It is the intended future hand-off unit for `FUTURE_AI_CORE_HANDOFF.md`'s registration pipeline — **not** the live homepage database (that's the Supabase `product_registry` table, written only through `registry-ops`; see `DATA_LAYER.md` and `REGISTRY_OPERATIONS.md`). The Central Registry represents which products YCSU officially recognizes; a Product Manifest is just that product's own self-declaration.

**Not implemented in v1.1**: no discovery, no automatic sync, no ingestion pipeline. This remains a specification and one real example only — v1.1 added a direct, authorized *operations* path (`registry-ops`), not manifest automation. Those are different milestones; see `FUTURE_AI_CORE_HANDOFF.md`.

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

## Manual display order (v1.2)

`sort_order` is a nullable PostgreSQL integer; `sortOrder: number | null` is its external contract. Existing active products are backfilled at 10-point intervals using the previous featured/name order. New or legacy null ranks appear after explicit ranks, with name then stable slug/ID tie-breaking. Archived products remain absent from the default homepage. `featured` keeps its metadata meaning and is not overloaded as an order field.

The live Registry is authoritative. The one-way snapshot includes `sortOrder`; older snapshots with no rank remain readable. Reordering is persisted exclusively through `registry-ops` and never changes version, certification, operational state, or public last-update dates.
