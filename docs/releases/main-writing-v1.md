# MAIN Writing v1 — release record

Status: implementation and release QA in progress; production unchanged until final gate.

- Canonical Core read from GitHub: `7a11fa58253cbd2e1587a97e01af15e054aec442`.
- Branch: `feat/main-writing-v1`, based on local governance commit `e9abd06235375206bb4f46f31ae9a4ec6897e080`; preserved it. Initial origin/main `ef3fbe454d3a71798e21a612546a41a4c5d31afb`.
- Previous production source: `f2c464ebda178a0da2528cc70f51638069582e4d`.
- Rollback Netlify deploy: `6aa73f14dcefc0bfdb32050d`, existing site `9c0bd872-1f70-4468-b853-e87b9b3269d5` / ycsu-platform-registry.
- Task explicitly authorizes production release after all gates; no automatic Git deploy is configured.
- Independent reviewer: `/root/review_reorder`. Design/source review found and independently reproduced two P2 issues (direct-entry close history; manifest failure replacing static body). Both fixed, independently rechecked. Removed a remaining renamed-variable catch defect; final independent source review PASS after those fixes; review did not claim full-suite or browser execution. Network-failure wording was clarified to avoid assuming an unconfirmed save never committed.
- Existing 17 regression tests passed after initial integration. Eleven new tests cover model, parser/build, RLS/CAS/API, viewer/history, manifest failure and owner/logout races. Final complete suite: 28/28 PASS (17 existing + 11 new), with Registry validator and normal production build PASS.
- Isolated browser QA uses real Chrome with PGlite fixtures and no production writes. Mixed keyboard order survived reload; settings changed featured/index order independently while preserving home position. First-row Product/Writing cards measured equal at 332×606px at 1440px owner layout. Mobile 390px reader/list and Back passed; static deep route refresh, direct-entry close, cover/inline images and original links passed. Light and dark browser screenshots inspected at 1440×1000, 768×1024, and 390×844. No horizontal overflow; desktop text measure ~705px. Keyboard focus remained inside the native dialog. Real mouse drag/save/reload passed, no ghost remained, logout immediately removed every Product link/grip/editor. Console errors/warnings: none. Native physical touch was not separately re-tested; existing accepted hold behavior and pointer/touch regression tests remain intact.
- Production article count: 0. Two clearly labelled articles exist only under tests/fixtures and dist-qa, never ordinary dist.

Recovery: restore the secure previous frontend deployment. The additive Writing singleton/function may remain unused; do not loosen Registry grants/RLS, change existing Auth, or restore unsafe full snapshots. No existing Product data is migrated or modified.

Final local empty candidate: 390px /writing/ open + reload PASS, zero images and zero articles, no overflow. Formal build includes 26 runtime files including headers; artifact allowlist/secret-fixture audit passed. Source review and test gates are complete; release execution may proceed under the task authorization.
