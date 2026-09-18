# MAIN Writing v1 — release record

Status: RELEASED / PRODUCTION VERIFIED on 2026-09-18.

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

## Final release and verification

- Feature SHA: 57cca7e8facf779871ce51fd13e7ebfa0a8561c9, branch feat/main-writing-v1.
- Merge/runtime source: 2b2cdac08cbf0e5e2db0cff917778a147d70b0c6. Normal no-ff merge and pushes; no force push. Working tree was clean before deployment.
- Existing site: ycsu-platform-registry / 9c0bd872-1f70-4468-b853-e87b9b3269d5; no new project or automatic Git deploy.
- Candidate and final production deploy: 6aad8e62321b9fa6785b09b8. Uploaded as deploy-preview, verified through the existing authenticated Netlify browser, then promoted unchanged at 2026-09-18T19:20:50.868Z. Production https://main.ycsu.cc/.
- Preview retains pre-existing Netlify SSO protection. Anonymous direct artifact HTTP returned 401, not a broken asset. Signed-in browser loaded the candidate and /writing/ refresh correctly. Cross-origin backend access falls back to the safe snapshot in preview; full owner/backend QA was isolated locally. No protection was weakened. Production exposes the correct 11 live records.
- Supabase migration applied as 20260918191717/main_writing_presentation. Local CLI-created file was renamed from 20260918185542 to this actual applied version during closeout; SQL bytes unchanged, preventing future migration-history mismatch.
- writing-ops ACTIVE v1, custom handler Auth, verify_jwt=false. Registry function/Auth/SMTP settings untouched. Raw Writing/Product reads and anonymous owner/settings/order operations return 401; SQL confirms RLS, no browser policies/grants and no anon/authenticated RPC execution.
- Public Writing projection contains only ok/settings/home_order, never owner revision. Initial default settings remain {}. Production owner moved Writing first, saw Order saved, refreshed to confirm, then moved it back last and compared the entire grid order with the original: identical. The saved mixed order now contains 12 IDs at revision 2. An extra attempt to clear the stored order after UI restoration was rejected by automatic approval review as unnecessary production mutation; no reset was applied or retried. The owner-restored order is retained.
- All 11 Product rows, including ranks and metadata, retain the exact pre-release aggregate hash 7bb5994f3e9286f584d34c68ffb8e16b. Writing added no Product row and no Product count.
- Actual existing owner session showed 35 Product links and available Arrange/Writing settings. Settings dialog opened with the correct zero-article state. Desktop reader, Escape, scroll lock, logout and immediate link/control removal passed. A fresh guest tab had 11 Products / 12 cards, zero Product links/grips, no editor or Netlify badge, no broken images and no console errors/warnings.
- Actual 390×844 production viewport: single list state with reader hidden, no overflow; /writing/ reload retained the empty viewer; browser Back returned to MAIN and closed it. Desktop production viewer used index + reader. No approved article exists, so real article-specific URLs/media were validated with clearly labelled isolated fixtures and static generator tests, not fabricated production content.
- All 25 served runtime files match local SHA256; /, /writing and /writing/ return 200. QA article/server/source and unsafe full snapshot paths return 404. Headers: no-store, DENY, nosniff. Machine-readable evidence: main-writing-v1-assets.json.
- Supabase security advisor: no new blocking findings. RLS-with-no-policy INFO is intentional for the two service-only tables ([explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)); pre-existing leaked-password-protection WARN remains outside this OTP feature scope ([reference](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). No settings were weakened.

## Handoff / limits

The ordinary production build has zero articles and no QA media. Approved future articles follow docs/WRITING.md; use existing conversation/file connectors to retrieve approved copy/images after explicit Publish to MAIN instruction. Supported Markdown is the documented safe subset; video uses an optional link rather than embedding a new player. Native physical-device touch was not newly exercised in this session; existing accepted touch behavior is retained and covered by pointer/touch regression tests. No owner action is required to finish this release. Owner was signed out as part of the requested production logout acceptance; sign in normally to edit later.

Rollback: restore Netlify deploy 6aa73f14dcefc0bfdb32050d. Keep the additive Writing backend unused if rolling back frontend; preserve the secure Registry boundary and Product data. No repeated production trial deploys were used.

Closeout portability check: Windows Git checkout changed fixture line endings to CRLF, exposing two test-only string-replacement assumptions. Fixture input is now normalized before test mutations (the production Markdown parser already normalized CRLF). The production exclusion assertion now rejects QA articles while permitting future approved articles. No runtime change or second production deploy was needed.
Final closeout rerun: npm test 28/28 PASS. Migration rename verified as the identical Git blob; runtime source remains identical to the deployed merge.

## Exact changed-file inventory

- `.gitignore`
- `AGENTS.md`
- `DECISIONS.md`
- `DEPLOYMENT.md`
- `DESIGN.md`
- `PROJECT_CONTEXT.md`
- `README.md`
- `assets/js/owner-access.mjs`
- `assets/js/writing-model.mjs`
- `assets/js/writing-viewer.mjs`
- `assets/js/writing.mjs`
- `assets/writing.css`
- `content/writing/.gitkeep`
- `docs/WRITING.md`
- `docs/releases/main-writing-v1-assets.json`
- `docs/releases/main-writing-v1.md`
- `index.html`
- `public/writing/.gitkeep`
- `scripts/build-site.mjs`
- `scripts/qa-writing-server.mjs`
- `scripts/writing-content.mjs`
- `supabase/config.toml`
- `supabase/functions/writing-ops/handler.ts`
- `supabase/functions/writing-ops/index.ts`
- `supabase/migrations/20260918191717_main_writing_presentation.sql`
- `tests/fixtures/content/writing/qa-first.md`
- `tests/fixtures/content/writing/qa-second.md`
- `tests/fixtures/public/writing/qa-first/cover.webp`
- `tests/registry-access.test.mjs`
- `tests/writing-session.test.mjs`
- `tests/writing.test.mjs`

