# FUTURE_AI_CORE_HANDOFF.md

**Status: v1.1 CURRENT (direct authorized Registry operations) vs. V2+ FUTURE (full pipeline) — see the distinction below. Only the v1.1 section is implemented.**

This describes what v1.1 actually enabled, and where the Registry is still headed once AI CORE eventually takes over the *full product lifecycle* (not just Registry metadata edits). It exists so the schema and structure don't have to be redesigned again later — not as a task list for the next session to start building.

---

## v1.1 (CURRENT, implemented 2026-08-29): Direct Authorized Registry Operations

```
ChatGPT / authorized tool
  ↓  (Bearer REGISTRY_API_KEY)
registry-ops Edge Function   ← authenticates + validates
  ↓  (service_role, server-side only)
Central Product Registry (Supabase product_registry table)
  ↓  (public read, anon key)
main.ycsu.cc
```

This is real and working: an authorized client can create, update, archive, unarchive, or (administratively) delete a Registry entry via HTTPS, and `main.ycsu.cc` reflects the change immediately — no source edit, no commit, no redeploy. See `DATA_LAYER.md` and `REGISTRY_OPERATIONS.md` for the full contract.

**What v1.1 does NOT do:** it does not know anything about a product's actual GitHub repository, deployment pipeline, or Manifest file. An authorized agent still has to know the true facts (has this actually been deployed? does this GitHub Release actually exist?) and call `registry-ops` with them. v1.1 makes the *last mile* (Registry ↔ homepage) direct and code-free; it does not automate *discovering or verifying* those facts.

---

## V2+ (FUTURE, not implemented): Full Product Lifecycle Pipeline — "YCSU Product Registration Pipeline"

```
AI Agent
  ↓
GitHub
  ↓
Deployment
  ↓
Production Validation
  ↓
YCSU Product Manifest (ycsu-product.json — see REGISTRY_SCHEMA.md §3)
  ↓
AI CORE Product Registration Pipeline   ← not yet built
  ↓
Central Product Registry (same product_registry table v1.1 already writes to)
  ↓
main.ycsu.cc
```

This is the difference from v1.1: instead of an authorized agent manually asserting "this is now live, here's the version," the *product's own repository* carries a self-declared manifest, and AI CORE — not a human, not an ad hoc agent call — validates deployment/version facts (e.g. by actually checking the GitHub Release exists, the URL resolves) before writing to the Registry. v1.1 skips that verification step and trusts the calling agent to have checked; V2 is meant to remove that trust requirement.

**Do not conflate the two.** v1.1 enables direct authorized operations on already-known facts. V2 automates *discovering and verifying* those facts in the first place.

## The Architectural Rule Both Versions Protect

**`main.ycsu.cc` is a Registry UI / read surface, not an orchestration engine.** This was true in v1.0 (a static file), remains true in v1.1 (a live database read, no write logic in the frontend), and stays true in V2 (AI CORE owns orchestration; the frontend still just reads `product_registry`).

## Why V2 Is Still Deferred, Not Built Now

Building GitHub API sync, automated deployment/version verification, or manifest ingestion would mean:

- automated trust decisions (certification, go-live) made from a manifest a product author wrote about themselves, with no independent verification step yet designed
- solving a coordination problem (multiple products, multiple agents, automatic ingestion) before there was any real usage data on how v1.1's direct-operation model holds up in practice
- deployment health monitoring, webhook automation, and release detection — all explicitly out of v1.1 scope and not evaluated yet

The schema and manifest spec in `REGISTRY_SCHEMA.md` remain deliberately compatible with this future pipeline (`RegistryProduct` in `registry.schema.ts` vs. the manifest shape) so that when AI CORE is ready to own full lifecycle automation, the v1.1 data model and write interface don't need to be redesigned — only a second, additional write path (manifest ingestion → the same `product_registry` table, likely via the same kind of authenticated interface `registry-ops` already demonstrates) needs to be added.

## Open Design Questions (Not Answered Here)

- Does AI CORE call `registry-ops` itself once it exists, or get its own dedicated write path?
- Is manifest validation fully automatic, or does certification always require a human approval step?
- How does the "Management Layer" (see `PLATFORM_MODEL.md` §1 — not yet architected) relate to this pipeline, if at all?
- Should `registry-ops`' `REGISTRY_API_KEY` model be replaced with per-client credentials once more than one authorized agent uses it regularly?

These should be answered deliberately in a future milestone, not inferred from this document.
