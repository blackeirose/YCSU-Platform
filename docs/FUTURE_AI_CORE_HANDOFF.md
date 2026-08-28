# FUTURE_AI_CORE_HANDOFF.md

**Status: FUTURE / V2+ — documented for architectural continuity only. Nothing in this document is implemented.**

This describes where the Registry is headed once AI CORE takes over product-registration orchestration. It exists so v1's schema and structure don't have to be redesigned later — not as a task list for this session or the next one to start building.

---

## The Future Pipeline: "YCSU Product Registration Pipeline"

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
Central Product Registry (registry.json)
  ↓
main.ycsu.cc
```

## The Architectural Rule This Protects

**`main.ycsu.cc` is a Registry UI / read surface. AI CORE will eventually own orchestration and product-registration synchronization.**

Concretely, once this pipeline exists:

- Agents should **not** directly edit `main.ycsu.cc`'s UI code (`index.html`) every time a product changes state.
- Agents should instead submit/update a standardized `ycsu-product.json` manifest in the product's own repository.
- AI CORE should validate that manifest (against the certification checklist in `PLATFORM_MODEL.md` §6, the URL-verification rule in `REGISTRY_SCHEMA.md` §2, etc.) and synchronize it into `registry.json`.
- `main.ycsu.cc` keeps rendering `registry.json` exactly as it does today — the presentation layer does not need to change when the pipeline is added.

## Why This Is Deferred, Not Built Now

v1's explicit goal is a trustworthy, correctly-structured foundation — not automation. Building GitHub API sync, a validation service, or write access to `registry.json` from outside this repository would mean:

- a backend/service where none currently exists (contradicts the static, data-driven v1 requirement)
- automated trust decisions (certification, go-live) with no human review step yet designed
- solving a coordination problem (multiple products, multiple agents, one registry) before the schema it would coordinate around has even shipped

The schema and manifest spec in `REGISTRY_SCHEMA.md` were deliberately written to be compatible with this future pipeline (see `RegistryProduct` in `registry.schema.ts` vs. the manifest shape) so that when AI CORE is ready to own this, no v1 data model needs to be redesigned — only a synchronization mechanism needs to be added on top.

## Open Design Questions (Not Answered Here)

- Does AI CORE write `registry.json` directly via a PR, or does `main.ycsu.cc` gain a minimal write path?
- Is manifest validation fully automatic, or does certification always require a human approval step?
- How does the "Management Layer" (see `PLATFORM_MODEL.md` §1 — not yet architected) relate to this pipeline, if at all?

These should be answered deliberately in a future milestone, not inferred from this document.
