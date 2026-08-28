# PLATFORM_MODEL.md

**YCSU Platform — Governance Model**
**Version:** 1.0 (established at v1.0.0 release, 2026-08-28)

This is the canonical definition of what YCSU Platform is, what belongs in its Product Registry, and the rules that govern it. Update this file when the model itself changes — not when individual registry entries change (that's `registry.json`).

---

## 1. What YCSU Platform Is

YCSU Platform is the overall YCSU product ecosystem and operating framework. It has three conceptual layers:

- **Platform Layer** — shared infrastructure/identity: domains, the Product Registry, cross-product conventions. `main.ycsu.cc` (this repository) is the public face of the Platform Layer.
- **Management Layer** — orchestration/control of the ecosystem's products. **Not yet architected.** Do not assume this is ADCC, or assign any product to `platformLayer: "Management"`, until that relationship is explicitly decided by the user. See §11 for why this matters.
- **Product Layer** — the individual YCSU products (Workflow Hub, Tracker, ADCC, Rachel's Animal Kingdom, future products).

`main.ycsu.cc` v1 implements only the Product Registry — a curated, read-only directory. It is not the Management Layer and does not orchestrate anything.

---

## 2. Product vs Utility

**Utility** — a single-purpose script, temporary workflow, one-off automation, small experiment, or disposable helper. Typical lifecycle: `Local / Script → GitHub if useful → Done`. A Utility does **not** automatically enter the Registry.

**YCSU Product** — a maintained application, service, system, assistant, package, or experience intended to participate in the YCSU ecosystem. A Product generally has several of: a clear user purpose, a maintained codebase, a repository, a version, expected future updates, a user-facing interface or workflow, a deployment/distribution method, Tracker representation, a lifecycle, and documentation.

**Only appropriate YCSU Products belong in the Product Registry.** `main.ycsu.cc` must remain curated — it is not an idea list. An entry that exists in `registry.json` but doesn't yet meet the Product bar (e.g. no repository, no confirmed intent beyond a name) should say so plainly in `statusNote` rather than being dressed up as more mature than it is.

---

## 3. Product Lifecycle

Conceptual maturity progression:

```
Idea → Planning → Prototype → Internal Alpha → Beta → Production
```

General productization path (not every product passes through every step formally):

```
Concept → Product Definition → Repository → Tracker → Prototype → Test
  → Version → Deploy → Validate → Register → Certification (when qualified)
```

Registration into the Registry (i.e. appearing in `registry.json` with real, non-placeholder data) should require enough maturity and product intent to justify long-term visibility on `main.ycsu.cc`.

---

## 4. Three Independent Dimensions

**Maturity**, **Deployment**, and **Visibility** are independent — never conflate them. A product can be, for example, `Beta` + `Public` + `Not Certified`, or `Production` + `Internal` + `YCSU Certified`. Don't collapse these into one label.

| Dimension | Values | Question it answers |
|---|---|---|
| Maturity | Idea / Planning / Prototype / Internal Alpha / Beta / Production | How far along is the product itself? |
| Deployment | Not Deployed / Local / Internal / Public / Archived | Where does it actually run? |
| Visibility | Private / Internal / Public | Who can access it? |

An optional, purely operational indicator (e.g. "Live" / "Pending" / "Offline" in the UI) may sit on top of `deployment` — it must never be used as a stand-in for `maturity`.

---

## 5. Version Model

Semantic Versioning: `vMAJOR.MINOR.PATCH` (e.g. `v1.0.0`, `v1.1.0`, `v1.1.1`, `v2.0.0`).

- **MAJOR** — architecture/core-product breaking change
- **MINOR** — meaningful feature addition
- **PATCH** — bug fix / minor correction
- Prototype-stage products may use `v0.x.x`.

**Canonical rule:** a GitHub Release or Git tag should ultimately be the canonical version source for a formal YCSU Product (`versionSource: "github-release"` or `"git-tag"`). For v1 of the Registry, values may still be manually synchronized (`versionSource: "manual"` or `"package"`) — there is no automated GitHub API sync in v1 (see `FUTURE_AI_CORE_HANDOFF.md`). Never fabricate a version; use `versionSource: "none"` and `version: null` when genuinely unknown.

---

## 6. Certification — "YCSU Certified"

Certification must never be automatically inferred merely because a site is deployed. Minimum checklist for `certification: "YCSU Certified"`:

- canonical repository confirmed
- version confirmed (real `versionSource`, not `"none"`)
- deployment/distribution confirmed
- primary URL or distribution path verified live
- no known critical blocking issue
- minimum product documentation exists
- Registry metadata substantially complete
- product is considered suitable for ongoing YCSU support

`scripts/validate-registry.mjs` enforces the mechanical part of this (a certified entry must have `mainUrl`, `githubUrl`, and a real `versionSource`) but the full checklist is a human/agent judgment call, not something to automate away.

---

## 7. Registration Rule

A product enters the Registry once it has enough maturity and product intent — not at the "Idea" stage merely because someone thought of a name. When an entry does appear before it's fully qualified (e.g. listed for ecosystem completeness), its `statusNote` must say so honestly rather than implying more readiness than exists.

---

## 8. V1 Scope Boundary

YCSU Platform v1.0.0 is a **static, curated, read-only Product Registry**. It explicitly does NOT include: GitHub API synchronization, a Supabase backend, AI CORE automation, automated product registration, health-monitoring/live-status polling, agent orchestration, a complex dashboard, or authentication. Those are future-version concerns — see `FUTURE_AI_CORE_HANDOFF.md` for the architecture they'll eventually fit into, which is documented but not implemented here.
