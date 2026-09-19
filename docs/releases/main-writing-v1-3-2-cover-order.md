# MAIN Writing v1.3.2 — MAIN Cover + Default Article Order

Status: RELEASE READY; implementation, tests, independent review and candidate gates PASS.

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
