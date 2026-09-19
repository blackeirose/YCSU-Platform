# MAIN v1.3 — Product lifecycle + Writing 12–20

Status: RELEASED / PRODUCTION VERIFIED — 2026-09-18 Pacific (2026-09-19 UTC). No owner action required.

- Canonical Core: 57a69136b7473718dfcf26311ae801f033696f05 (current AGENTS/AI_CORE and required shared references read).
- Base main:13985dbfb5c9f7b6fb99a181a0b3c671f8905c1e, including the owner's latest article edits.
- Feature branch:feat/main-v1-3-product-lifecycle. Reviewed implementation/checkpoint SHA:8c0d5ed294e25d32ec8f1dfd1f06424c8b3cfe5c (committed/pushed clean before production mutation).
- Production/LKG Netlify:6aadd0b0941aa8845e985d20; existing site9c0bd872-1f70-4468-b853-e87b9b3269d5, ycsu-platform-registry. Git CD disconnected.
- Supabase:existing ysu-tool-tracker, fzydsnxxcdllkjxwdiwn. No new project/service or system installation.
- Applied migration:source20260919024704_product_lifecycle.sql; Supabase history20260919031554_product_lifecycle. Schema/API reads confirm the four columns, constraints and existing11 product rows. Existing functions ACTIVE:registry-ops8, writing-ops4, writing-content5.
- Automated:71/71 PASS; validate/build PASS. Independent reviewer43/43 plus final affected10/10 PASS, including real LKG parser compatibility. No open code/security blocker.
- Browser acceptance: actual Chrome153 headless, desktop1440x1000 and mobile390x844 touch emulation. Bundled Playwright used isolated browser profiles after the native/CUA connection timed out. No user restart or manual QA was required.

## Implemented contract
Visible/Hidden/Archived/Deleted are independent of Product maturity. Hidden keeps its slot; lifecycle-v1 public reads carry only id/name/lifecycleState/sortOrder. Archived/Deleted are omitted publicly, retained in owner recovery sections. Restore retains prior visible/hidden state and original slot. Soft Delete needs confirmation; no Create Product or hard-delete UI. Exact owner or existing management key only, no browser DB grants.
Inactive mixed-order slots persist. Product lifecycle and both reorder paths are serialized; stale presentation or product versions reject rather than overwrite. Legacy reorder requires presentationRevision, available from registry-ops read-owner. Legacy public clients receive visible-only original fields to avoid their strict parser falling back to stale snapshots. Candidate snapshot is empty and runtime fails closed when live visibility cannot be checked. Products count includes Hidden, excludes inactive and Writing.
Writing sizes12–20(default18) are shared across parsing/editor/API/static render. Fixed font, inline formatting and independent title/sidebar sizes remain.

## Recovery before mutation
Private local recovery data (never deployed/committed):C:/Users/ysu/Codex_Workspaces/MAIN-release-evidence/v13-product-lifecycle/before-migration.json and backend-before.json. Captured11 full product rows, original ranks/home_order, presentation revision3/settings, previous production ID and deployed function sources (registry7/writing-ops3/writing-content4). No credentials stored.
Before any frontend release, restore tested products and intended article size through authenticated backend and compare original facts/order. Retain audit revision/updated_at increments; do not rewind audit history. Prefer retaining the corrected fail-closed backend with additive schema. Do not drop lifecycle data or restore raw table grants/full static exports. Old frontend rollback is suitable only after original active states are restored; it cannot implement new Hidden placeholders. After new states are used, use a reviewed privacy-preserving rollback build or fix forward.

## Completed release gates
- Real deployed backend:27/27 checks PASS, including owner authorization, every lifecycle transition, guest/owner raw-table denial, exact Hidden four-key payload, full facts/ranks/home_order preservation, public unauthenticated GitHub HTTP200 versus protected owner edit HTTP200, Writing12 save/readback, guest mutation denial and test-session logout.
- Isolated actual-browser UI:21 checks PASS using candidate dist with actual handlers/all migrations and synthetic products; Delete default Cancel focus/cancel/confirm, hidden geometry/opacity/minimal guest DOM, recovery, keyboard reorder, Writing12 persisted/reload and logout. Additional mouse grip drag and touch500ms hold/autoscroll both persisted after reload and were restored.
- Candidate UI plus REAL deployed backend:22 checks PASS in desktop/mobile browsers. Attended loopback proxy routed only existing Auth/function endpoints; production CORS unchanged. A real Supabase-issued exact-owner session, obtained through a one-use admin-generated magiclink and Auth verification, was placed only in the independent test profile; normal SDK owner revalidation and UI sign-out executed. This is not a new SMTP-delivery or physical-iPhone acceptance claim.
- Real browser Visible/Hide/Show/Archive/Restore/Delete/Restore persisted; Hidden guest payload/DOM contained only allowed identity/state/order and name/UNAVAILABLE. Every tested product returned to original visibility, full facts, sortOrder and canonical mixed slots. Audit revisions intentionally advanced.
- Real browser Writing12 save/reload passed; restored the intended17px and unchanged article body. QA Git commits:a48b749/c9cb860 (12px), d3aa5a5/4fe4cca (17px restoration); final content is byte-identical to the original owner article. No owner edits overwritten.
- Desktop/mobile owner editor read, visible management/links, uniform620px product height, no horizontal page overflow, synchronous logout clearing, storage clearing and guest-only reload passed. No JavaScript exceptions or credential strings in rendered DOM. Current runtime contract does not revoke already-public historical images/Git data.
- Screenshots inspected for desktop/mobile, light/dark, owner/guest/Hidden and12px Writing. Native browser-control outage was bypassed using existing bundled Playwright/Chrome, with no installation or shared browser storage extraction.

## Final publication and production acceptance
- Reviewed implementation SHA:8c0d5ed294e25d32ec8f1dfd1f06424c8b3cfe5c.
- Feature branch release head:1e84e667c2d1a8783d62e6fe4f6c61c42348d574, including evidence and restored article history.
- Merge/build SHA:35e7f14ec39b6f20d4d2bf91ad72e0e7fdca91c3. No runtime or article-content diff from the reviewed implementation.
- Previous deploy:6aadd0b0941aa8845e985d20. New deploy:6aae039f329918d23c9511bf, published2026-09-19T03:38:33.698Z.
- Netlify:existing ycsu-platform-registry / 9c0bd872-1f70-4468-b853-e87b9b3269d5. Git CD remained disconnected. One dist-only draft was promoted once after independent readiness PASS; no additional frontend production deployment.
- 33 dist files, including _headers;32/32 HTTP-served file SHA256 values match the exact build. Publish-boundary scan excludes source/private rollback data, QA banners and credential patterns. Empty Registry snapshot confirmed.
- Production browser15/15 checks PASS: desktop/mobile guest and actual owner sessions, protected edit read, real unchanged/no-op save HTTP200, logout clearing storage/owner DOM, reload remaining guest, uniform card geometry, no overflow/JavaScript exceptions, final product facts/order and17px article restoration.
- Additional settled public Writing checks PASS on desktop/mobile: published article loads without editor credentials, body17px, no guest Edit Article controls. Initial loading states were not counted as final screenshots. Screenshots inspected after content settled.
- Independent reviewer confirmed source/security PASS and release readiness, examined27+21+22 checks and gesture evidence, then independently read production API/public GitHub:11 Visible products, guest links absent and article bytes equal13985db baseline.
- Working tree checked clean after release-record commit/push. Source main tracks canonical origin/main. No tag reused: this milestone is distinct from historicalv1.3.0.

## Limits and owner action
Desktop/mobile QA used Chrome153 with a390px touch-emulated viewport, not a new physical-device test. Real Auth sessions and normal SDK owner checks/sign-out ran; SMTP delivery was not retested or changed. Signed-out denial is the client-cleared session model, not a claim that previously issued access JWTs are immediately cryptographically revoked. Historical public images/Git/deploy data are outside the runtime Hidden contract. No remaining release blocker or owner action.
