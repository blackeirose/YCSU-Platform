# MAIN v1.3.1 — Final UI / Content Polish

Status: RELEASED / PRODUCTION VERIFIED. Owner action: NONE.

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

Release complete. Feature c3e0f01827c443004bef079c3cdb86cc8dbb6f26; merge/build bdf6ed9e59f92410159856dc48b51c4dec14d475. One production publication: previous6aae039f329918d23c9511bf → new6aae22f53d17fbcf50985c6c, published2026-09-19T05:52:18.006Z. Existing site only; Git CD disconnected.34 staged files; all33 HTTP-served files SHA256 match (Netlify _headers is configuration).

## Operational content readback

Existing registry-ops manager update:only description/statusNote changed; lastUpdated2026-09-14 explicitly preserved. Full11 Product projections and presentation order compared before/after. Lifecycle states/revisions, name, version, category, maturity, deployment, URLs, all other rows unchanged. Existing writing-ops exact-owner CAS settings update changed only title to YSU Journal; settings and home_order preserved. No migration or Edge Function deployment.

Description, exact readback:

> Captures Facebook text and original images that remain readable without login, with shareable HTML, Markdown, and JSON results available for 24 hours. V0.1.1 Experimental.

Status note, exact readback:

> V0.1.1 is deployed and verified through the normal Owner workflow. A previously failed post was saved successfully on a second production attempt: 1,458 characters plus one original 1672×941 image. The first attempt with the same content remained Partial because final image evidence was insufficient, so consistent Complete results are not claimed. Cloud regression results: single-image Complete (607 + 1), multi-image Partial (601 + 2); Facebook login limitations and an unknown total image count remain classified as Partial. 92 tests and independent review PASS. Error classification and eligibility for one retry are determined by the server, with a 120-second countdown. The UMS-style white-background UI, 24-hour expiry, and 5-minute cleanup remain. An existing occasional polling login prompt can be recovered by Refresh and is not claimed as fixed. ChatGPT/Gemini consumer reading of this release has not been verified; the earlier one-time ChatGPT pass on V0.1 remains historical only. PR #4 merged; runtime f976127; Netlify 6aa79bf081648b68b96c0986.

Minor final QA repair:empty/loading card now renders only the h2 Journal navigation link, avoiding a duplicate h3 Journal name. Featured articles retain their own h3/link below cover. Affected24/24 Writing/routing/editor/session checks PASS after this change.

## Final production acceptance

- Real https://main.ycsu.cc:18/18 browser checks PASS, desktop1440/light and mobile390/dark touch emulation. Guest/owner top labels, h2 and cover top align exactly; images decode, no horizontal/internal Journal overflow, featured title below cover, whole-card mouse/tap navigation works. Social Capture has its actual1440x900 image, DEVELOPMENT PREVIEW and exact approved English DOM text. No browser JavaScript exceptions.
- Actual owner article read/editor and unchanged no-op save returned200/unchanged:true. Article17px and content preserved. Existing lifecycle controls and arrange grip intact. Logout clears owner storage and protected links/controls; reload stays guest. Isolated regression21 checks plus mouse/touch ordering tests cover actual reversible lifecycle/order mutations without touching production state in this polish task.
- Production security readback6/6 PASS: current Hidden product contains exactly id/lifecycleState/name/sortOrder; archived/deleted absent. Guest Registry/Writing owner-read and article read/save return401. Public Writing returns200 without credential fields/patterns. Static deployment secret/QA-marker scan PASS; fallback remains empty/privacy-safe.
- No production lifecycle mutation, schema migration, backend deployment, Auth change or article edit. Owner's separately changed Hidden state preserved. English operational update changed only description/statusNote; title update changed only settings.title plus its audit revision.
- Limitations: Chromium mobile emulation, not fresh physical-device/SMTP acceptance. Social Capture preview is the real public signed-out landing/input state. Automatic approval review rejected the unnecessary Social Capture login because it could expose private Recent posts; the public screenshot fulfilled the task without that access. No scheduled/unattended screenshot mechanism was created.
- Local QA diagnostic incident: a failed assertion printed a temporary test Auth session. Its test session was subsequently signed out (refresh revoked), the private evidence was sanitized, and diagnostics now assert booleans/redact credential-shaped errors. This was not deployed or included in public assets. Logout does not imply immediate expiry of already issued access JWTs. No raw credential is retained in this report.

Writing runtime files:assets/js/writing-model.mjs and assets/writing.css. Preview:assets/previews/social-capture-tool.webp. Scoped tests:tests/writing.test.mjs and tests/writing-visual.test.mjs. No owner action required.
