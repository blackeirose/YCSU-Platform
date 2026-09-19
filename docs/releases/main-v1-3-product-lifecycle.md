# MAIN v1.3 — Product lifecycle + Writing 12–20

Status: implementation checkpoint; production frontend release HOLD pending real backend and browser gates.

- Canonical Core: 57a69136b7473718dfcf26311ae801f033696f05 (current AGENTS/AI_CORE and required shared references read).
- Base main:13985dbfb5c9f7b6fb99a181a0b3c671f8905c1e, including the owner's latest article edits.
- Feature branch:feat/main-v1-3-product-lifecycle.
- Production/LKG Netlify:6aadd0b0941aa8845e985d20; existing site9c0bd872-1f70-4468-b853-e87b9b3269d5, ycsu-platform-registry. Git CD disconnected.
- Supabase:existing ysu-tool-tracker, fzydsnxxcdllkjxwdiwn. No new project/service or system installation.
- Prepared migration:20260919024704_product_lifecycle.sql. Not yet applied at this checkpoint.
- Automated:71/71 PASS; validate/build PASS. Independent reviewer43/43 plus final affected10/10 PASS, including real LKG parser compatibility. No open code/security blocker.
- Browser control timed out during prior/current attempts. Do not count source or jsdom checks as desktop/mobile browser acceptance.

## Implemented contract
Visible/Hidden/Archived/Deleted are independent of Product maturity. Hidden keeps its slot; lifecycle-v1 public reads carry only id/name/lifecycleState/sortOrder. Archived/Deleted are omitted publicly, retained in owner recovery sections. Restore retains prior visible/hidden state and original slot. Soft Delete needs confirmation; no Create Product or hard-delete UI. Exact owner or existing management key only, no browser DB grants.
Inactive mixed-order slots persist. Product lifecycle and both reorder paths are serialized; stale presentation or product versions reject rather than overwrite. Legacy reorder requires presentationRevision, available from registry-ops read-owner. Legacy public clients receive visible-only original fields to avoid their strict parser falling back to stale snapshots. Candidate snapshot is empty and runtime fails closed when live visibility cannot be checked. Products count includes Hidden, excludes inactive and Writing.
Writing sizes12–20(default18) are shared across parsing/editor/API/static render. Fixed font, inline formatting and independent title/sidebar sizes remain.

## Recovery before mutation
Private local recovery data (never deployed/committed):C:/Users/ysu/Codex_Workspaces/MAIN-release-evidence/v13-product-lifecycle/before-migration.json and backend-before.json. Captured11 full product rows, original ranks/home_order, presentation revision3/settings, previous production ID and deployed function sources (registry7/writing-ops3/writing-content4). No credentials stored.
Before any frontend release, restore tested products and intended article size through authenticated backend and compare original facts/order. Retain audit revision/updated_at increments; do not rewind audit history. Prefer retaining the corrected fail-closed backend with additive schema. Do not drop lifecycle data or restore raw table grants/full static exports. Old frontend rollback is suitable only after original active states are restored; it cannot implement new Hidden placeholders. After new states are used, use a reviewed privacy-preserving rollback build or fix forward.

## Remaining release gates
Commit checkpoint before production mutation; apply migration and redeploy the three existing functions; verify real owner session lifecycle/save/readback/logout, guest denials and data restoration. Complete1440/390 browser QA when reliable control is available. Only then merge and publish one verified dist build; verify production hashes and leave clean Git state. Backend deployment alone does not authorize frontend publication.
