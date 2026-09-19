# MAIN Writing v1.3.2 — MAIN Cover + Default Article Order

Status: RELEASED / PRODUCTION VERIFIED. Owner action: NONE.

- Fresh canonical Core:57a69136b7473718dfcf26311ae801f033696f05 (AGENTS/AI_CORE and relevant UI, workflow, gates, services, workspace, communication, agentic references).
- Clean base main:e602b98910e81b1bbc599bf8c005513450361705, including owner article-date update. Branch:feat/main-writing-v1-3-2-cover-order.
- Existing Netlify site9c0bd872-1f70-4468-b853-e87b9b3269d5 independently confirmed published6aaf1757a66ab60159ad14a1; Git CD disconnected. Existing Supabasefzydsnxxcdllkjxwdiwn only.
- Scope:Writing model/controller/viewer and a restrained owner-only index label. Existing featured_slug/article_order, CAS backend and Auth retained. No Product, schema, backend deploy, article content, media or homepage layout changes.
- Behavior:Set as MAIN cover selects the article's image/title/date/category/excerpt; selected button is disabled. One owner-only MAIN COVER label, none for guests. Empty/invalid/removed selection uses newest date/slug. Unlisted dateDESC/slugASC articles precede manual items, preserving their relative order. Legacy fields remain stored. Navigation during save updates shared card state; logout blocks late UI restoration.
- Initial full78/78 tests PASS; after navigation regression fix17/17 affected PASS. Independent reviewer30/30 tests and code/security PASS. Remaining browser/release checks recorded below when complete.
- Recovery:restore previous secure frontend deployment; preserve article content and current Product state. Temporary cover/order QA will restore only the two target settings through existing owner CAS; private before/after data stays outside dist.
- Managed-device preflight:existing Node/PGlite/Chrome/Playwright only; no admin/install/new service. Mobile QA is browser emulation, not physical-device OTP testing.

## Candidate acceptance

79/79 complete automated tests PASS, validate/build PASS. A final no-JavaScript index change reuses the same date/slug default; its affected11/11 tests PASS. Independent main code/security review30/30 PASS; final static-index delta review PASS. Reviewer corrected the regression fixture to put the older file first alphabetically, ensuring date order is actually tested.

Isolated real Chrome browser15/15 checks PASS at1440 and390, covering owner-only badge, selected/disabled button, older/no-image cover save/reload, manual reorder persistence, two synthetic new publications prepended by date, preserved manual relative order, removed-cover newest fallback, logout and no JavaScript exceptions. Fixture additions exist only in an intercepted in-memory QA manifest; none in production/source articles.

Candidate uses local dist with an attended loopback proxy to existing MAIN services:13/13 browser checks PASS,1440/light and390/dark. Real owner settings writes returned200, homepage image/title/date/category/excerpt updated and survived reload; index order unchanged by cover. Real manual reorder saved/reloaded without changing cover. Both settings and home_order restored and reread exactly; only presentation revision advances as audit evidence. Owner article read/editor/cancel and logout/storage/guest controls passed. No article edit, Product state change, Auth configuration or backend deployment.

Initial live harness tried an unnecessary second read after logout, correctly received403, and was changed to skip cleanup reads after confirmed restoration. This was a QA harness issue, not an application fix. No credentials printed. Private backups and images: C:/Users/ysu/Codex_Workspaces/MAIN-release-evidence/v132-cover-order (outside dist).

Independent final readiness PASS after the static fixture correction. Additional real Chrome no-JavaScript index check PASS.

## Release and production acceptance

- Feature SHA:4faa34cb8c65d4e2f6f576866be6b1bc60199fe8 (implementation checkpoint c68fb8188831b5fb8aee110000b93e0cf7b59a03).
- Merge/build SHA:e1ed82ee2442dac080fc92940c56edf6eaccaa5c.
- Previous deploy:6aaf1757a66ab60159ad14a1. New deploy:6aaf1e77b3d3a8598605e033, published2026-09-19T23:45:20.756Z. Exactly one production publication to existing ycsu-platform-registry; no new site or Git CD change.
- Production13/13 real browser checks PASS at1440/light and390/dark/touch emulation: cover selection200, immediate full card content update and reload persistence; unchanged index order; one owner badge/disabled selected button; real manual reorder save/reload with cover unchanged; exact restoration; owner edit read/cancel, logout/storage clear, guest reload, no overflow or JavaScript exceptions.
- Production8/8 API security checks PASS: guest settings writes for both featured_slug/article_order denied401, guest owner reads/edit/save denied, public Writing read200 without secret patterns, Hidden product exactly four allowed fields, archived/deleted absent. No security configuration or schema change.
-35/35 served production files SHA256 match the accepted build;36 staged files include Netlify _headers configuration. Static secret/fixture/banner scan PASS. Real no-JavaScript production index uses dateDESC order.
- Initial and final settings/home_order match for each live QA viewport; only normal CAS audit revision increases. Preserved current Product lifecycle states, original article content/dates and media. No fake articles were published and no other previews changed.
- Files:assets/js/writing-model.mjs,writing.mjs,writing-viewer.mjs;assets/writing.css;scripts/writing-content.mjs;Writing tests and scoped docs. No changes to Auth, Supabase handlers/migrations, Product code or index.html.
- Limits:mobile is Chromium emulation, not a physical-device/SMTP test. New-publication insertion uses isolated fixtures; no production fake content. Static/no-JavaScript index uses default date order; runtime manual order requires JavaScript as before. Existing legacy featured/display_order and cover/excerpt fields remain stored but do not override the new rules. Original featured_slug was empty and restored empty, so the newest article is the resulting MAIN cover.

Machine-readable checks:main-writing-v1-3-2-evidence.json. No owner action required.
