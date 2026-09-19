# MAIN Writing v1.3.2 — MAIN Cover + Default Article Order

Status: reviewed implementation checkpoint; release gates in progress.

- Fresh canonical Core:57a69136b7473718dfcf26311ae801f033696f05 (AGENTS/AI_CORE and relevant UI, workflow, gates, services, workspace, communication, agentic references).
- Clean base main:e602b98910e81b1bbc599bf8c005513450361705, including owner article-date update. Branch:feat/main-writing-v1-3-2-cover-order.
- Existing Netlify site9c0bd872-1f70-4468-b853-e87b9b3269d5 independently confirmed published6aaf1757a66ab60159ad14a1; Git CD disconnected. Existing Supabasefzydsnxxcdllkjxwdiwn only.
- Scope:Writing model/controller/viewer and a restrained owner-only index label. Existing featured_slug/article_order, CAS backend and Auth retained. No Product, schema, backend deploy, article content, media or homepage layout changes.
- Behavior:Set as MAIN cover selects the article's image/title/date/category/excerpt; selected button is disabled. One owner-only MAIN COVER label, none for guests. Empty/invalid/removed selection uses newest date/slug. Unlisted dateDESC/slugASC articles precede manual items, preserving their relative order. Legacy fields remain stored. Navigation during save updates shared card state; logout blocks late UI restoration.
- Initial full78/78 tests PASS; after navigation regression fix17/17 affected PASS. Independent reviewer30/30 tests and code/security PASS. Remaining browser/release checks recorded below when complete.
- Recovery:restore previous secure frontend deployment; preserve article content and current Product state. Temporary cover/order QA will restore only the two target settings through existing owner CAS; private before/after data stays outside dist.
- Managed-device preflight:existing Node/PGlite/Chrome/Playwright only; no admin/install/new service. Mobile QA is browser emulation, not physical-device OTP testing.
