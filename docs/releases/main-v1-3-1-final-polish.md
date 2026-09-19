# MAIN v1.3.1 — Final UI / Content Polish

Status: candidate; production publication pending live content readback and final QA.

- Core:57a69136b7473718dfcf26311ae801f033696f05, fresh canonical AGENTS/AI_CORE/UI/workflow/gates/services/workspace/communication/agentic references read.
- Base main:82333522f94b4779c0d6bf0e51a516957c7da3d0; clean and equal origin/main at preflight.
- Branch:feat/main-v1-3-1-final-polish. Existing Netlify site9c0bd872-1f70-4468-b853-e87b9b3269d5 independently confirmed published6aae039f329918d23c9511bf. Git CD remains disconnected.
- Scope:Writing model/card CSS only; curated social-capture-tool.webp; two operational Registry text fields and existing Writing display title. No schema, Auth, lifecycle, reader/editor implementation or other Product/preview change.
- Card:WRITING/count → h2 YSU Journal →16:10 cover → h3 featured title → date/category → excerpt → YSU Journal footer. Existing title-driven empty/list reader naming also inherits Journal; Writing type and routes stay unchanged.
- Preview:real public https://tools.ycsu.cc/capture landing/sign-in state, HTTP200, Chrome153,1440x900, WebP22712 bytes. Empty email input, no account/private content, no image fabrication or remote screenshot service. Development overlay preserved.
- Tests:73/73 PASS (71 existing plus2 scoped tests), validate/build PASS. Existing lifecycle tests unchanged.
- Isolated browser regression:21 checks PASS at1440/390; plus mouse drag and touch long-press/autoscroll save/reload/restore PASS. No JavaScript exceptions. Writing12 save/reload tested only in fixture Git and restored; real article content unchanged.
- Recovery:previous deploy retained; private pre-write Registry backup under C:/Users/ysu/Codex_Workspaces/MAIN-release-evidence/v131-final-polish/registry-before.json. Restore only targeted copy/title via existing operational APIs if needed; never overwrite unrelated rows or relax security.

Pending:independent review, Registry English/title operational write/readback, live-data candidate QA, merge/single production publication, production owner/guest/logout and asset hashes.
