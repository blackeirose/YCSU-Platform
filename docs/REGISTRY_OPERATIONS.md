# v1.3 read-access contract (current)

POST the existing registry-ops endpoint with JSON {"operation":"read-public"} for public metadata. No user session is required. Extra selectors or request options are rejected; the server returns only the public field allowlist in DATA_LAYER.md, with all protected fields absent and URL-bearing text redacted. Raw PostgREST reads are no longer available to browser roles.

POST {"operation":"read-owner"} with the existing owner Supabase access token for full active records. The server validates getUser and the exact existing owner UUID, never email or user_metadata. All responses use Cache-Control: no-store. authorize returns canReorder and canReadLinks only after the same validation. Non-owner authenticated sessions cannot obtain links or reorder.

Browser owner capabilities are authorize, read-owner and reorder only. read-public is safe for everyone. Existing management-secret CRUD below remains unchanged. This read extension does not permit owner browser create/update/archive/delete.

Manual snapshot refresh now writes only data/registry.public.snapshot.json through read-public. A current full Registry export must never be committed or deployed. Historical architectural examples below are documentation, not runtime exports.

---

# REGISTRY_OPERATIONS.md

**YCSU Platform — Registry Operations Contract (v1.2)**
**Version:** 1.0 (established at v1.1.0 release, 2026-08-29)

This is the contract an authorized AI assistant or tool (ChatGPT via a Custom GPT Action, Claude, a future script) uses to operate the Product Registry directly — the mechanism behind "Move Rachel to Production" or "Archive this product" happening without anyone editing `main.ycsu.cc` source code.

See `DATA_LAYER.md` for the underlying architecture and security model this contract sits on top of.

---

## 1. Read / List

No authentication required — this is public data.

```
GET https://fzydsnxxcdllkjxwdiwn.supabase.co/rest/v1/product_registry
    ?select=*
Header: apikey: <publishable key — see README for where to find it>
```

Useful filters (standard PostgREST syntax): `&slug=eq.workflow-hub`, `&archived=eq.false`, `&maturity=eq.Production`. This is the same endpoint the homepage itself uses — reads never need the write interface below.

---

## 2. Write Interface

```
POST https://fzydsnxxcdllkjxwdiwn.supabase.co/functions/v1/registry-ops
Header: Authorization: Bearer <REGISTRY_API_KEY>
Header: Content-Type: application/json
```

`REGISTRY_API_KEY` is a secret generated during v1.1 setup — it is not written in this repository or in any durable doc. Retrieve/rotate it in the Supabase dashboard (Project → Edge Functions → Secrets) or ask the project owner for the value they were given when it was created.

Every request body has the shape:

```json
{ "operation": "create | update | archive | unarchive | delete | authorize | reorder", "slug": "...", "data": { ... } }
```

### 2.1 Create

```json
{
  "operation": "create",
  "data": {
    "slug": "kuula-ai-assistant",
    "name": "Kuula AI Assistant",
    "shortName": "Kuula",
    "description": "One sentence.",
    "category": "AI Assistant",
    "maturity": "Prototype",
    "deployment": "Not Deployed"
  }
}
```

**Required:** `slug`, `name`, `description`, `maturity`, `deployment`.
**Everything else is optional** and takes its column default if omitted (`platformLayer: "Product"`, `visibility: "Private"`, `operationalStatus: "Unknown"`, `versionSource: "none"`, `featured: false`, `archived: false`, `certification: "Not Certified"`, `lastUpdated`: today).

Fails with `409` if `slug` already exists, `422` with a `details` array if validation fails.

### 2.2 Update

```json
{ "operation": "update", "slug": "workflow-hub", "data": { "maturity": "Beta" } }
```

`slug` identifies the row (required). `data` may contain any subset of updatable fields — only the fields present are changed. Unless `data.lastUpdated` is explicitly supplied, it is automatically set to today's date (see §4).

This is the operation behind every routine request: *"Set Workflow Hub version to v1.2.0"* → `{"operation":"update","slug":"workflow-hub","data":{"version":"v1.2.0","versionSource":"git-tag"}}`. *"Update Rachel to Production"* → `{"operation":"update","slug":"rachels-animal-kingdom","data":{"maturity":"Production"}}`.

### 2.3 Archive / Unarchive

```json
{ "operation": "archive", "slug": "some-retired-product" }
{ "operation": "unarchive", "slug": "some-retired-product" }
```

No `data` needed. Sets the `archived` boolean and bumps `lastUpdated`. This is the **normal lifecycle action** for retiring a product — prefer it over delete (see `PLATFORM_MODEL.md` §2/§7). An archived product stays in the database and is retrievable via read/list; it simply no longer appears in the homepage's default view (`archived=eq.false`).

### 2.4 Delete (administrative only)

```json
{ "operation": "delete", "slug": "some-product", "data": { "confirm": true } }
```

Hard-deletes the row. Requires `data.confirm === true` as deliberate friction — without it, the request is rejected with a `400` suggesting `archive` instead. Use only when a record was created in error; retiring a real product should always be `archive`.

---

## 2.5 Owner authorization and persistent ordering

Existing management-key calls retain their original permissions. The owner may additionally sign in through the existing Supabase Auth email-link flow. `registry-ops` validates that token with `getUser`, then matches the configured, verified owner UUID; user-editable metadata never grants access. Owner sessions may invoke **only** `authorize` and `reorder`, never product CRUD. The table still has no anon/authenticated write RLS policy.

`{"operation":"authorize"}` returns `{"ok":true,"canReorder":true}` only after authorization. All browser writes still target this function; no administrative secret is sent to the browser. Browser CORS permits only `https://main.ycsu.cc`. The existing Supabase Site URL remains Tracker; the exact MAIN URL is an additional allowed auth redirect.

A reorder request contains the complete active product set:

```json
{
  "operation": "reorder",
  "data": {
    "expected": [{"id":"<product UUID>","sortOrder":10}],
    "order": ["<product UUID>"]
  }
}
```

The examples abbreviate the list: every active product must appear exactly once in both arrays. `expected` is the caller's last read ranks, with null allowed for legacy entries. A service-role-only, SECURITY INVOKER database function locks the Registry and applies the entire permutation in one transaction. It rejects stale ranks, missing/new/archived IDs, duplicates, or malformed payloads. Stale state returns HTTP 409. Final ranks use 10,20,30…; only rows whose rank changes are updated. Product metadata and `lastUpdated` stay unchanged; `updated_at` remains the technical audit trail.

Success returns `{"ok":true,"order":[{"id":"<UUID>","sortOrder":10}],"changed":1}`. The UI moves immediately on drop, serializes saves, and restores the previous display order on failure. After a failure, reload before retrying so current authoritative ranks replace stale state. Snapshot fallback never enables reordering.

## 3. Validation Failures

A `422` response has the shape:

```json
{ "ok": false, "error": "validation failed", "details": ["\"maturity\" is required to create a product", "invalid deployment \"Deployed\""] }
```

Enum values (exact strings, case-sensitive) — see `REGISTRY_SCHEMA.md` §1 for the full reference:

- `platformLayer`: `Platform` / `Management` / `Product`
- `maturity`: `Idea` / `Planning` / `Prototype` / `Internal Alpha` / `Beta` / `Production`
- `deployment`: `Not Deployed` / `Local` / `Internal` / `Public` / `Archived`
- `visibility`: `Private` / `Internal` / `Public`
- `operationalStatus`: `Live` / `Pending` / `Offline` / `Unknown`
- `certification`: `Not Certified` / `YCSU Certified`
- `versionSource`: `github-release` / `git-tag` / `package` / `manual` / `none`

Structural rules, enforced both by the function (friendly error) and the database (hard backstop, `DATA_LAYER.md` §2):

- `mainUrl` and `plannedUrl` can never both be set.
- `version` must be null exactly when `versionSource` is `"none"`.
- `mainUrl` requires `deployment` to not be `"Not Deployed"`.
- `certification: "YCSU Certified"` requires `mainUrl`, `githubUrl`, and a real `versionSource` — see `PLATFORM_MODEL.md` §6 for the full checklist (the rest is a judgment call, not mechanically enforced).

**Do not set `mainUrl` to a domain you have not personally verified is live right now.** This is the same rule the v1.0 registry followed; it did not relax in v1.1 — see `REGISTRY_SCHEMA.md` §2.

---

## 4. `lastUpdated` Semantics

`lastUpdated` represents the last **meaningful** Registry metadata change — not a render timestamp, not every touch. `registry-ops` sets it automatically to today's date on `create`/`update`/`archive`/`unarchive` unless the caller explicitly overrides it. The database's `updated_at` column is the separate, always-automatic technical audit trail (every write, no exceptions) — use it for auditing, not as public-facing metadata.

---

## 5. Version Source Rule (Unchanged from v1.0)

A GitHub Release or Git tag remains the canonical version source for a formal YCSU Product. v1.1 does not automate this — an authorized agent should confirm the actual GitHub Release/tag exists before calling `update` with a new `version`/`versionSource: "github-release"` (or `"git-tag"`). Automating this confirmation is `FUTURE_AI_CORE_HANDOFF.md`'s job, not v1.1's.

---

## 6. What This Interface Deliberately Does Not Support

- Product CRUD remains one `slug` per call. The dedicated reorder operation is the only batch write and can change only ranks.
- No schema migration via this endpoint (adding a new field is a code change to `registry-ops` + a DB migration, not a Registry operation).
- No way to bypass the `mainUrl`/`plannedUrl` or certification rules — they are not "soft" guidance, they are enforced at two layers (function + database).

## Lifecycle v1 contract (supersedes archive/unarchive/hard-delete sections)
POST registry-ops `{operation:"lifecycle",data:{id,revision,action,confirm}}`. Exact confirmed nonanonymous owner or existing management key required. revision is product.lifecycleRevision from read-owner. action is hide/show/archive/delete/restore; delete requires confirm:true. Invalid transition400, stale409, missing404, invalid payload422. Returns one full owner product. create/update cannot set archived/state directly; old archive/unarchive/delete requests return422 directing callers to lifecycle. No hard deletion is exposed.
read-public accepts only operation plus optional contract:"lifecycle-v1". New contract returns Hidden with exactly id/name/lifecycleState/sortOrder; legacy contract omits Hidden and sends unchanged visible allowlist. Both omit Archived/Deleted. read-owner includes all states with owner-only lifecycleRevision/deletedAt and full existing metadata/links.
Legacy reorder requires data.presentationRevision in addition to expected/order; obtain it from registry-ops read-owner presentationRevision (also available to the management key) or writing-ops read-owner revision. Missing revision is422, stale mixed revision409. Current Arrange cards uses writing-ops home-order directly; both preserve inactive slots. Lifecycle changes leave business facts and lastUpdated unchanged; updated_at and revision remain technical audit fields.
