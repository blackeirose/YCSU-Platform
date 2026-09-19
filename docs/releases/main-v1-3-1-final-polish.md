# MAIN v1.3.1 — Final UI / Content Polish

Status: release-ready; independent review and candidate gates passed; production publication pending.

- Core:57a69136b7473718dfcf26311ae801f033696f05, fresh canonical AGENTS/AI_CORE/UI/workflow/gates/services/workspace/communication/agentic references read.
- Base main:82333522f94b4779c0d6bf0e51a516957c7da3d0; clean and equal origin/main at preflight.
- Branch:feat/main-v1-3-1-final-polish. Existing Netlify site9c0bd872-1f70-4468-b853-e87b9b3269d5 independently confirmed published6aae039f329918d23c9511bf. Git CD remains disconnected.
- Scope:Writing model/card CSS only; curated social-capture-tool.webp; two operational Registry text fields and existing Writing display title. No schema, Auth, lifecycle, reader/editor implementation or other Product/preview change.
- Card:WRITING/count → h2 YSU Journal →16:10 cover → h3 featured title → date/category → excerpt → YSU Journal footer. Existing title-driven empty/list reader naming also inherits Journal; Writing type and routes stay unchanged.
- Preview:real public https://tools.ycsu.cc/capture landing/sign-in state, HTTP200, Chrome153,1440x900, WebP22712 bytes. Empty email input, no account/private content, no image fabrication or remote screenshot service. Development overlay preserved.
- Tests:73/73 PASS (71 existing plus2 scoped tests), validate/build PASS. Existing lifecycle tests unchanged.
- Isolated browser regression:21 checks PASS at1440/390; plus mouse drag and touch long-press/autoscroll save/reload/restore PASS. No JavaScript exceptions. Writing12 save/reload tested only in fixture Git and restored; real article content unchanged.
- Recovery:previous deploy retained; private pre-write Registry backup under C:/Users/ysu/Codex_Workspaces/MAIN-release-evidence/v131-final-polish/registry-before.json. Restore only targeted copy/title via existing operational APIs if needed; never overwrite unrelated rows or relax security.

Independent code/security review and final readiness: PASS. Reviewer independently reran21 affected tests and compared operational before/after projections. Live candidate18/18 checks PASS at1440/390: exact three-row alignment, real screenshot/English copy, whole-card navigation, real owner edit/no-op save, controls and unchanged order, logout/storage clearing/reload, no browser exceptions. Mobile is Chromium touch emulation, not a physical-device run. Owner's concurrently observed Hidden product remains untouched.

Pending:merge/single production publication, production owner/guest/logout and asset hashes.

## Operational content readback

Existing registry-ops manager update:only description/statusNote changed; lastUpdated2026-09-14 explicitly preserved. Full11 Product projections and presentation order compared before/after. Lifecycle states/revisions, name, version, category, maturity, deployment, URLs, all other rows unchanged. Existing writing-ops exact-owner CAS settings update changed only title to YSU Journal; settings and home_order preserved. No migration or Edge Function deployment.

Description, exact readback:

> Captures Facebook text and original images that remain readable without login, with shareable HTML, Markdown, and JSON results available for 24 hours. V0.1.1 Experimental.

Status note, exact readback:

> V0.1.1 is deployed and verified through the normal Owner workflow. A previously failed post was saved successfully on a second production attempt: 1,458 characters plus one original 1672×941 image. The first attempt with the same content remained Partial because final image evidence was insufficient, so consistent Complete results are not claimed. Cloud regression results: single-image Complete (607 + 1), multi-image Partial (601 + 2); Facebook login limitations and an unknown total image count remain classified as Partial. 92 tests and independent review PASS. Error classification and eligibility for one retry are determined by the server, with a 120-second countdown. The UMS-style white-background UI, 24-hour expiry, and 5-minute cleanup remain. An existing occasional polling login prompt can be recovered by Refresh and is not claimed as fixed. ChatGPT/Gemini consumer reading of this release has not been verified; the earlier one-time ChatGPT pass on V0.1 remains historical only. PR #4 merged; runtime f976127; Netlify 6aa79bf081648b68b96c0986.

Minor final QA repair:empty/loading card now renders only the h2 Journal navigation link, avoiding a duplicate h3 Journal name. Featured articles retain their own h3/link below cover. Affected24/24 Writing/routing/editor/session checks PASS after this change.
