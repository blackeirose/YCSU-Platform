# DATA_LAYER.md

**YCSU Platform — Registry Data Layer Architecture (v1.1)**
**Version:** 1.0 (established at v1.1.0 release, 2026-08-29)

This is the canonical description of where Registry data actually lives, how it's secured, and how it's written. For the schema itself see `REGISTRY_SCHEMA.md`; for the write contract see `REGISTRY_OPERATIONS.md`.

---

## 1. Why Supabase, and Why This Project

Per `ysu-ai-core/docs/SERVICES.md` §6, Supabase is the YSU default cloud backend once a real persistence/sync requirement exists. v1.1's requirement is real: routine Registry metadata changes must not require editing/redeploying source files, and an external tool (ChatGPT) needs a durable, remotely-writable, access-controlled store.

**Project reused:** `ysu-tool-tracker` (ref `fzydsnxxcdllkjxwdiwn`), the existing Supabase project already backing `tracker.ycsu.cc`.

**Why reuse instead of a new project:**
- Same org, zero new billing/account surface — a new project was evaluated and found unnecessary.
- The existing project already has an established, working RLS pattern (`tracker_items`: public read, restricted write) that this design extends rather than reinvents.
- `product_registry` is a **separate table**, not an extension of `tracker_items` — a Registry entry and a task-tracking row are conceptually different (see `PLATFORM_MODEL.md` §2/§3), and the two tables share no columns, no foreign keys, no RLS policies. Reusing the *project* does not mean coupling the *data*.

**The other existing Supabase project** (`blackeirose@gmail.com's Project`, ref `tnzenfsuwtzhgqaexixy`) backs an unrelated tool (a "Project Work Plan App") and was not considered appropriate.

---

## 2. Table: `public.product_registry`

Full DDL: `supabase/migrations/20260829000001_product_registry.sql`. Summary:

- One row per Registry entry. `slug` is the stable business key (unique, used by all `registry-ops` operations); `id` is a DB-generated UUID.
- Columns map 1:1 to `registry.schema.ts`'s `RegistryProduct` (snake_case in the DB, camelCase everywhere else — `registry-ops` and the frontend both translate at the boundary).
- `updated_at` is a DB-audit timestamp, auto-set by a trigger on every write. `last_updated` is the public-facing "last meaningful metadata change" date — see `REGISTRY_OPERATIONS.md` for its semantics.
- Database-level CHECK constraints enforce, independent of any application code:
  - all enum fields (`platform_layer`, `maturity`, `deployment`, `visibility`, `operational_status`, `certification`, `version_source`)
  - `version` is null **iff** `version_source = 'none'`
  - `main_url` and `planned_url` are never both set (the v1.0 "verified reality only" rule, now enforced at the data layer, not just by the old client-side validator)
  - `main_url` implies `deployment <> 'Not Deployed'`
  - `certification = 'YCSU Certified'` implies `main_url`, `github_url`, and a real `version_source` are all present (the mechanical part of the certification checklist in `PLATFORM_MODEL.md` §6)

These constraints are a hard backstop — they hold even if `registry-ops`' own validation is ever bypassed, extended incorrectly, or called by a future second write path.

---

## 3. Security Model

**Row Level Security is enabled**, and there is exactly one policy:

```sql
create policy product_registry_public_read
  on public.product_registry for select
  to anon, authenticated
  using (true);
```

**There is no INSERT, UPDATE, or DELETE policy for any role.** This is deliberate and is the core security decision of v1.1: RLS default-denies all writes from `anon` and `authenticated` — including the one pre-existing `authenticated` user in this Supabase project (the same account `tracker_items` trusts for its own writes). That account has **no** write access to `product_registry` unless a policy is explicitly added later.

**The only write path is the `registry-ops` Edge Function** (`supabase/functions/registry-ops/index.ts`), which:

1. Reads an `Authorization: Bearer <token>` header and compares it, in constant application logic (not RLS, not a Supabase Auth session), to a `REGISTRY_API_KEY` secret set via `supabase secrets set` — never committed to source, never exposed to the frontend.
2. Rejects any request without a match (`401`).
3. Validates the payload (required fields, enum values, URL shape, the `mainUrl`/`plannedUrl` and `version`/`versionSource` consistency rules) before touching the database, returning `422` with an error list on failure.
4. Only then writes, using the **service_role key**, which the Edge Function reads from its own server-side environment (`SUPABASE_SERVICE_ROLE_KEY`, auto-injected by Supabase into every Edge Function — never passed over the network, never visible to a caller).

This means: possessing the public anon/publishable key (embedded in `index.html`, by design) grants read-only access and nothing else; only possessing the `REGISTRY_API_KEY` secret grants write access, and that secret lives in exactly two places — the Supabase Function secret store, and the credential the user hands to an authorized client (e.g. a ChatGPT Custom GPT Action's auth configuration). It is not stored in this repository, in `DECISIONS.md`, or anywhere in Google Drive.

**Verified via `supabase db advisors --type security`** after this migration: the only finding was a pre-existing, unrelated warning (`auth_leaked_password_protection`, a project-wide Auth setting predating this work, not touched — out of scope for a change this task didn't request).

---

## 4. Frontend Read Path

`index.html` fetches directly:

```
GET https://fzydsnxxcdllkjxwdiwn.supabase.co/rest/v1/product_registry
    ?select=*&archived=eq.false&order=featured.desc,name.asc
Header: apikey: <publishable/anon key>
```

No server, no build step — this is PostgREST, Supabase's automatic REST layer over the table, scoped by the RLS read policy above. The response rows are mapped to the existing `RegistryProduct` shape client-side and handed to the same generic card renderer that already existed in v1.0 (no product-specific rendering logic was introduced or existed before).

---

## 5. Fallback / Snapshot Model

**Fallback (resilience):** if the live Supabase fetch fails (network error, non-2xx), the frontend falls back to `data/registry.snapshot.json`, bundled in the deployed site. This is logged via `console.warn`, not surfaced as a UI error banner. The fallback path never writes back to Supabase — it is read-only, one direction, and only engaged on failure.

**Snapshot (disaster recovery / audit):** `data/registry.snapshot.json` is refreshed on demand via `node scripts/snapshot-registry.mjs`, which reads the live table and overwrites the file. This is manual and one-way (DB → file). There is no scheduled job, no CI step, and no reverse sync — running the snapshot script is a deliberate, occasional action (e.g. before a release, or after a batch of Registry changes), not routine automation. `node scripts/validate-registry.mjs` checks the snapshot against `registry.schema.ts`'s rules.

---

## 6. What This Deliberately Does Not Do

- No public CRUD API — `registry-ops` is authenticated, not open.
- No exposure of `service_role` to any client, browser, or the frontend bundle.
- No reliance on Supabase Auth `user_metadata` for authorization (the explicit anti-pattern called out in the v1.1 brief) — authorization is a single shared secret checked in function code, not a claim on a user's session.
- No automatic GitHub Release/tag → version sync (see `PLATFORM_MODEL.md` §5 and `FUTURE_AI_CORE_HANDOFF.md`).
- No bidirectional sync between the snapshot file and the database.
