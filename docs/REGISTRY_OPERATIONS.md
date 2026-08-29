# REGISTRY_OPERATIONS.md

**YCSU Platform — Registry Operations Contract (v1.1)**
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
{ "operation": "create | update | archive | unarchive | delete", "slug": "...", "data": { ... } }
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

- No bulk/batch operations — one `slug` per call.
- No schema migration via this endpoint (adding a new field is a code change to `registry-ops` + a DB migration, not a Registry operation).
- No way to bypass the `mainUrl`/`plannedUrl` or certification rules — they are not "soft" guidance, they are enforced at two layers (function + database).
