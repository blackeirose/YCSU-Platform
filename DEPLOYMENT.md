# DEPLOYMENT.md

## Production release gate

Production deploy is a **release event, not a test event**. Follow the current canonical Core's `docs/DEVELOPMENT_WORKFLOW.md`:

**Local validation -> Deploy Preview / Branch Deploy (or an equivalent isolated draft) when remote validation is needed and practical -> QA pass / release readiness -> authorized production release -> production verification.**

Treat a push/merge to an automatically publishing branch, a build hook, and a manual publish command as production release operations. Do not use repeated production deploys as the normal test loop. Preserve stricter project approval, privacy, security, and no-deploy holds. Production-only exceptions require the Core's explicit exception criteria and never substitute for a missing safe test environment. Record the accepted source/candidate and rollback point; verify the released behavior before calling it complete.

Any production commands below are execution references **after** these gates, not authorization to skip them. Historical release evidence is not current permission to release.

Live deployment record for YCSU Platform. Update this file whenever deployment state actually changes — do not let it drift from reality.

---

## Current production — MAIN v1.3 lifecycle, verified 2026-09-18 (Pacific)

Netlify `6aae039f329918d23c9511bf`, published `2026-09-19T03:38:33.698Z`; merge/build `35e7f14ec39b6f20d4d2bf91ad72e0e7fdca91c3`, reviewed implementation `8c0d5ed294e25d32ec8f1dfd1f06424c8b3cfe5c`, feature head `1e84e667c2d1a8783d62e6fe4f6c61c42348d574`. One frontend publication after71/71 tests, independent code/security/readiness PASS, applied lifecycle migration and real backend/browser lifecycle/save/auth gates.32/32 served hashes and15 production browser checks PASS. Product facts/order restored; article17px restored. Previous deploy `6aadd0b0941aa8845e985d20`; rollback must retain the privacy-preserving lifecycle contract. No owner action pending. [Full evidence and limits](docs/releases/main-v1-3-product-lifecycle.md).

## Historical production — Writing v1.2, verified 2026-09-18 (Pacific)

Netlify `6aadd0b0941aa8845e985d20`, published `2026-09-19T00:02:07.048Z`, merge/build `422160a50ece4db33974365fba2c8f34323bcd42`, feature `b3459a3c7b81edd7882645405e67b132086c1469`. One frontend release after65/65 tests, independent37/37 review, isolated desktop/mobile QA and real owner save/restore/logout gates.31/31 served assets match; actual production owner formatting/size save, refresh, guest read and restoration passed. Previous secure frontend rollback `6aadc5abb7561cd759f6c1e3`; retain the compatible new writing-content parser when restoring it. No owner action pending. [Full evidence and limitations](docs/releases/main-writing-v1-2.md).

## Historical production - Writing v1.1 polish, verified 2026-09-18

Netlify `6aadc5abb7561cd759f6c1e3`, published `2026-09-18T23:14:45.917Z`, from canonical source `6bcde873d6a5f30efe9a712cd7f8cbe5dccb2a1d`. One frontend release after actual owner read/save/reload/logout gates. Additive writing-content uses public unauthenticated GitHub reads and a server-only editor token for exact-owner operations. 53/53 full tests plus 9 post-content tests passed; 30/30 deployed assets match; actual production owner no-op save/logout and mobile public deep-link checks passed. Registry/presentation payloads are unchanged. Rollback `6aada2062630da334a6f46db`. No owner action pending. [Full evidence](docs/releases/main-writing-v1-1.md).

## Historical production — first Writing article, verified 2026-09-18

**Make the Impossible Possible** is published at https://main.ycsu.cc/writing/make-the-impossible-possible/. Source `15a6100283e000901009146d55b2315285900cc2`, Netlify `6aada2062630da334a6f46db`, published `2026-09-18T20:41:43.480Z`. Rollback: `6aad8e62321b9fa6785b09b8`. Exact LinkedIn copy and approved cover, owner-approved descriptive cover alt, 29/29 tests, isolated responsive QA and real production browser verification passed. Writing now has exactly 1 article; all 11 live Products and public Writing settings/order are unchanged. All 27 served assets match dist SHA256. One production release, no backend or infrastructure changes. [Full evidence and limits](docs/releases/make-the-impossible-possible-2026-09-18.md).

## Historical production — verified 2026-09-16

Source `f2c464ebda178a0da2528cc70f51638069582e4d`, Netlify deployment `6aa73f14dcefc0bfdb32050d`, ready/published 2026-09-14 00:27:27.812 UTC. Product release remains v1.4.0; the only subsequent runtime change is the manually curated UMS preview. Final owner-only link security acceptance is **PASS / CLOSED**. All 19 served files match the reviewed build; the live public Registry has 11 products. See [final acceptance and evidence limits](docs/releases/owner-links-security-acceptance-2026-09-16.md).

## v1.4.0 accepted release baseline — Mobile Email OTP Sign-In

Final production deployment: `6aa49d8b2ef630b94b973b22`, ready/published 2026-09-12 00:32:12 UTC from source `bc3f715` (accepted runtime unchanged). All 18 public runtime files match dist SHA256. Public Registry validates eight products and MAIN v1.4.0; direct protected-column read returns 401; source docs, email template and former full snapshot return 404. Clean guest DOM has 8 cards, 0 product anchors and 0 card buttons; owner reload has 24 anchors and 8 reorder buttons. Both show v1.4.0 with zero console errors; guest has no overflow or Netlify badge. Only MAIN version changed in the before/after public metadata comparison. User-selected ordering is preserved.

v1.4.0 is now the accepted current production release. Secure v1.3 rollback deployment: `6aa489b6f0b74e7b1f8b75f6`; retain RLS/privilege denial, public-safe artifacts and the compatible email link fallback during recovery.

## v1.3 secure release baseline — 2026-09-11

Final release deploy: **`6aa489b6f0b74e7b1f8b75f6`**, ready/published 2026-09-11 23:07:35 UTC. HTML, owner module, MAIN preview and public snapshot SHA256 match dist. MAIN Registry version is v1.3.0 / github-release. Tag v1.3.0 points to accepted source commit `a0c07ff`; subsequent release-record/snapshot commit contains the final Registry version. Release: https://github.com/blackeirose/YCSU-Platform/releases/tag/v1.3.0.

The current deployment uses registry-ops v5, active with custom JWT authorization (`verify_jwt=false`), and migration `20260911225043_owner_only_registry_links.sql`. Raw product_registry RLS remains enabled; PUBLIC, anon and authenticated have no table/column read or write privileges and no policies. Public reads now use registry-ops `read-public`; owner full reads use `read-owner` after exact UUID verification. Management CRUD and the service-role-only reorder transaction remain intact.

Frontend candidate `90ac06b35faa7c611618a40578cd000a8537cb84` deployed as `6aa485b4d8321b4b271147c1`. Only allowlisted dist files were zipped. Build: `node scripts/build-site.mjs`; Netlify publish: `dist`. Never deploy the repository root. No-store headers apply to API and static responses. Current security evidence and release acceptance: `docs/releases/v1.3.0.md`.

Verified production: public response contains 8 products and zero protected keys; requests for each of the six link columns and select=* are denied (401 with anon key). Old full snapshot, live manifest, Edge source and docs URLs return 404. Management full-read comparison confirms all business metadata unchanged by the access migration. Actual clean-browser guest DOM has zero anchors and zero grips; owner has 24 card anchors and 8 grips. Mouse reorder saved, survived reload and was restored to the initial order without a deploy. New-tab owner session restore and cross-tab logout passed. Guest responsive widths 1440/820/390 retain 3/2/1 columns without horizontal overflow; loaded images and console checked.

Security advisors: intentional INFO `rls_enabled_no_policy` on product_registry reflects the closed browser boundary ([explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)); existing project-wide WARN `auth_leaked_password_protection` remains unchanged ([remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). No new exposed-table finding.

Recovery must retain denied raw-table privileges and public-safe assets. Revert a UI change only within the v1.3 safe read contract, or show public fallback without owner links. Historical v1.1/v1.2 full exports and root-directory deployments are not valid recovery targets. Historical immutable deploys/Git history remain historical public artifacts; no destructive history cleanup was requested.

## Frontend (Netlify) — Current State (verified live 2026-09-11)

| Field | Value |
|---|---|
| GitHub repository | [`blackeirose/YCSU-Platform`](https://github.com/blackeirose/YCSU-Platform), branch `main` |
| Netlify site | `ycsu-platform-registry` |
| Netlify site ID | `9c0bd872-1f70-4468-b853-e87b9b3269d5` |
| Netlify admin | https://app.netlify.com/projects/ycsu-platform-registry |
| Netlify subdomain | https://ycsu-platform-registry.netlify.app — live |
| **Production URL** | **https://main.ycsu.cc — LIVE.** DNS resolved, HTTPS valid, HTTP 200, Team Protection disabled (public). |
| Continuous deployment | **Not wired up.** GitHub push does not auto-deploy. See "Redeploying" below. |

## Historical preview release — superseded by the v1.3 publish boundary

The production frontend now renders manually curated previews for all eight current products. ADCC uses its real local development capture with an unlinked DEVELOPMENT PREVIEW label. Plumbing links to `https://tools.ycsu.cc/plumbing-chart/`; Mind Map is Public / Live and retains Planning with no version. Both corrections were persisted through `registry-ops`, read back, and included in the validated eight-product snapshot.

The initial preview-card production deployment is `6aa46283940d50974f2624ce`, from merge commit `bd630439e17a5a032f9de30e9ac304548e252bf9`. The MAIN self-preview was then captured from that real production UI and included in the follow-up release. The latest published deployment is available in the existing [Netlify deployment history](https://app.netlify.com/projects/ycsu-platform-registry/deploys).

The Netlify CLI stalled before creating a deployment. The release therefore used Netlify's official ZIP deployment API against the existing site ID, with a complete archive of Git-tracked files and an `_headers` file equivalent to `netlify.toml`. Local credentials, `.git`, `.netlify`, temporary capture files, and test fixtures were excluded. Production returned HTTP 200 with the three configured security headers. The Powered by Netlify badge is disabled at the site level. No new site or screenshot automation was created.

## Historical v1.1 data-layer record (superseded by v1.3 above)

| Field | Value |
|---|---|
| Project | `ysu-tool-tracker`, ref `fzydsnxxcdllkjxwdiwn` (reused — see `docs/DATA_LAYER.md` §1) |
| Table | `public.product_registry` — RLS enabled, public-read-only policy, zero write policies |
| Write interface | Edge Function `registry-ops`, deployed with `verify_jwt = false` (auth handled in-function: existing management key or verified owner JWT for reorder only) |
| Function endpoint | `https://fzydsnxxcdllkjxwdiwn.supabase.co/functions/v1/registry-ops` |
| Read endpoint | `https://fzydsnxxcdllkjxwdiwn.supabase.co/rest/v1/product_registry` (public anon/publishable key, embedded in `index.html`) |
| `REGISTRY_API_KEY` | Set as a Supabase Function secret (`supabase secrets set`). **Not stored in this repo, in `DECISIONS.md`, or in Google Drive.** Retrieve/rotate via the Supabase dashboard → Edge Functions → Secrets. |
| Security advisor result | Only pre-existing, unrelated finding (`auth_leaked_password_protection`, project-wide Auth setting predating this work) — see `docs/DATA_LAYER.md` §3 |
| No-redeploy round-trip test | **Passed** 2026-08-29 — see `DECISIONS.md` DEC-014 |

---

## Redeploying the Frontend After a Code Change

Continuous deployment (GitHub → Netlify automatic build) is not configured yet. **This is only needed for actual code changes — routine Registry data changes never need this, see `docs/REGISTRY_OPERATIONS.md`.**

**Current delivery mode:** manual, approved `dist` artifacts; recent records use the official ZIP API. Git-linked CD is an unconfigured option requiring a separate authorized configuration task. Do not enable it while following this release runbook.

**Manual release preparation:** run the local checks first, then use a non-production draft for remote QA when needed. Retain the reviewed artifact, acceptance evidence and rollback point. Only after the release gate above passes may an authorized release publish the accepted artifact. The following CLI example is an execution reference, not the normal QA loop:
```bash
cd YCSU-Platform
npm run build
npm run validate
npm test
# Complete required draft/preview QA and release approval before this command.
netlify deploy --prod --site 9c0bd872-1f70-4468-b853-e87b9b3269d5 --dir dist
```

If `netlify status` shows a project name other than `ycsu-platform-registry`, check `.netlify/state.json` — it should read `{"siteId": "9c0bd872-1f70-4468-b853-e87b9b3269d5"}`. (An earlier session's killed background command silently created an orphan site named `ycsu-platform` (id `45cec71d-b50f-4022-a82f-493d538de318`, no custom domain, unused) and left it linked in that file; this was found and fixed during v1.1.0 work. The orphan site itself was not successfully deleted — the Netlify CLI/API was intermittently timing out on delete calls at the time — and is a harmless but real leftover cleanup item.)

## Redeploying the Registry Write Interface After a Code Change

Requires separately authorized backend release scope, isolated validation where practical, QA acceptance and recoverability before execution. Preserve the current auth/RLS/security boundary; a frontend or documentation task does not authorize this operation.

```bash
cd YCSU-Platform
supabase functions deploy registry-ops --project-ref fzydsnxxcdllkjxwdiwn --no-verify-jwt
```

## Applying a New Database Migration

Requires separately authorized data-change scope, migration review, safe validation and rollback/recovery planning before execution. Never use production as a substitute for an unavailable test environment.

```bash
cd YCSU-Platform
supabase link --project-ref fzydsnxxcdllkjxwdiwn   # once per machine/session
supabase db query --linked -f supabase/migrations/<new-file>.sql
```

(`supabase link` requires being authenticated via `supabase login` first — already done on this machine.)

---

## Why No CI Secrets Were Set Up Automatically

Wiring GitHub Actions to redeploy the frontend on push would normally use a `NETLIFY_AUTH_TOKEN` GitHub secret; scripted extraction of the local Netlify auth token was correctly stopped by a safety check in the v1.0.0 session and was not revisited. If you want automatic frontend deploys without touching the dashboard, generate a new Netlify Personal Access Token yourself and add it as a repo secret — Option A above achieves the same result with no token handling at all.

`REGISTRY_API_KEY` was generated by this session (a random 256-bit secret) and set directly as a Supabase Function secret via the CLI — it was never typed into a website form, never committed, and is not printed in this document.

## Historical persistent-ordering candidate — 2026-09-11

Production migration `20260911215355_product_registry_sort_order.sql` adds nullable integer order and a service-role-only transactional RPC. All eight active products were backfilled in the original visual order, 10–80. Readback confirmed unchanged business metadata and `last_updated`. Existing public SELECT RLS remains; no client write policy was added.

`registry-ops` version 4 is deployed with custom authentication and `verify_jwt=false`. Anonymous and invalid-token requests return 401; the existing management key remains accepted. Verified owner Auth sessions may only authorize and reorder. The exact Auth redirect `https://main.ycsu.cc/` was added; Tracker's Site URL and redirect remain unchanged. The security advisor reports only the previously recorded project-wide leaked-password-protection warning.

Frontend candidate commit `65c1f6fc0dc032b7f5d5a0ab933885f8a705c0dc` is published as Netlify deployment `6aa4790f9db8fbe97d6562f7` (ready, 2026-09-11 21:56 UTC). Production HTML, scripts, CSS, vendored SDK and snapshot return 200 with SHA256 matching the source. Public desktop/tablet/mobile checks show 3/2/1 columns, no overflow, no drag controls, eight loaded previews, no Netlify badge and no console errors. A normal Plumbing preview click opens its canonical production route.

The existing authorized management client moved Mind Map to the first position through production `registry-ops`; a fresh MAIN browser load displayed the persisted order without a deploy. A second authorized operation restored the original 10–80 order. Readback confirmed no business metadata changes. This verifies production persistence, but does not substitute for owner Auth/UI acceptance. These initial checks preceded owner acceptance; see the repair verification below for the current state. Do not create the v1.2.0 release/tag until production persistence passes. Six local tests and independent code review passed, including transactional conflicts, authorization, link exclusion, pointer capture, keyboard order and failed-save rollback. Browser QA verified responsive layouts and keyboard save/reload/rollback using an isolated local fixture; it did not verify production Auth or native touch.

Historical v1.2 rollback (NOT valid after v1.3; do not restore public reads/full snapshots): restore frontend commit `20d335ca6999c75917defde305ff6a1b486e0ae4` (Netlify deploy `6aa462ff3de1603f93416599`) and redeploy that commit's original `registry-ops/index.ts` with `verify_jwt=false`. The additive column/RPC can remain unused; remove the MAIN Auth redirect only if owner login is being withdrawn. No Tracker changes are required.


### Owner acceptance repair — 2026-09-11

The owner completed email login. Production owner keyboard reorder, reload and restore passed. The owner reported mouse cards would not move. The repair allows direct mouse grip dragging while retaining the 500 ms card/touch hold, prevents native text selection from taking over eligible mouse gestures, flushes final drop coordinates before cancelling animation frames, and clears the status on unchanged drops. The final-coordinate race was independently reproduced; regression coverage now includes it. Actual browser mouse grip drag/save/reload passed in the isolated fixture, with failed-save rollback retained. Repair commit `63a492eac3711fd02fbc4ac3bec430dc3a392e33` is live in Netlify deployment `6aa47dac3e51c8b5bf6a6aa8`. Production repair assets match source SHA256. With the actual owner session, a real mouse drag moved YCSU Platform from first to second, returned Order saved, survived reload, and a second mouse drag restored the initial order. Readback confirmed all eight products retain their business metadata. No console errors or leftover drag ghost were observed. Eight regression cases now pass (the full seven-case suite, then all five interaction cases after adding the final-drop regression), and independent re-review passed. Native card long-press and physical touch/scroll acceptance remain outstanding; v1.2.0 is still untagged.

## v1.2.0 acceptance complete — 2026-09-11

YuCheng explicitly confirmed desktop and actual-device drag/touch working. Combined with production owner mouse save/reload/restore, metadata readback, failure rollback, responsive checks and independent review, this completes reorder acceptance. The release is separate from the subsequent v1.3 owner-only link feature.

The v1.2.0 tag and GitHub release were published separately at commit `49e2e72` on 2026-09-11; final v1.2 deployment `6aa48245d68ee8218917534c`. The real-device acceptance above is complete, superseding the historical pending notes.


## v1.4 accepted OTP candidate and release

Candidate source `42d25f191de950730343697b9b065ae45657d241` is deployed as `6aa49a34fa3641ec6784ecbb`, ready at 2026-09-12 00:17:57 UTC. HTML, owner-access, email-otp and CSS SHA256 match the reviewed dist. Public read still returns eight safe products; a direct protected-column read is denied. A clean production browser shows the six-digit form, no guest links/grips and no console errors. The last accepted release/LKG remains v1.3.0 (`6aa489b6f0b74e7b1f8b75f6`).

The owner configured Resend Custom SMTP. Dashboard readback confirmed it enabled with smtp.resend.com. OTP length changed from 8 to 6 and persisted across reload; expiry remains 3600 seconds. The reviewed Token + ConfirmationURL email body and subject Your YCSU sign-in code were saved and reloaded successfully. One explicitly authorized sign-in request to the existing owner returned 200 and YuCheng confirmed a six-digit email. No credentials were read/displayed. Shared Site URL remains Tracker; MAIN and Tracker redirects and other email templates were not changed.

All 17 local tests and independent source review passed. Isolated browser UI checks passed at 390/820/1440. YuCheng confirmed actual mobile same-browser OTP verification, links, reorder and session refresh/reopen; new desktop-tab owner restoration also passed; the subsequent v1.4 release is recorded below. Do not confuse a candidate deployment with a new LKG. Recovery uses the v1.3 frontend while preserving the secure Registry boundary and compatible Magic Link email fallback.


Fresh desktop OTP acceptance also passed: YuCheng signed out, requested a new six-digit code and successfully signed in. Desktop and physical-mobile acceptance are complete; final publication/version/deploy records follow below.


GitHub v1.4.0 published at accepted merge `8e3052382dfec453ba92444a5e08d613a4366fc6` on 2026-09-12 00:30:45 UTC. MAIN Registry now reads v1.4.0 / github-release / lastUpdated 2026-09-11. Public before/after comparison found only MAIN version changed; current owner-selected ordering is preserved in the refreshed public-safe snapshot.


## UMS manual preview maintenance — 2026-09-13

Explicit owner request: replace UMS development-preview placeholder with the actual Draft 0.3 interface screenshot. Source `f2c464ebda178a0da2528cc70f51638069582e4d`; deployed `6aa73f14dcefc0bfdb32050d`; prior deployment `6aa49d8b2ef630b94b973b22` is the rollback. Only `/assets/previews/ums.webp` differs from the previous published file manifest (path case normalized for Netlify). Build, public snapshot validation and all 17 existing tests passed. The candidate image decoded in the authorized browser; after publication every public asset hash matched the staged build, and the real MAIN UMS card displayed the new image with DEVELOPMENT PREVIEW. No Registry/Tracker metadata, auth, status or other preview changed. Evidence: docs/releases/ums-preview-2026-09-13.json.

## Owner-only Product Links security closeout — 2026-09-16

PASS / CLOSED. Production remains source f2c464ebda178a0da2528cc70f51638069582e4d, Netlify deployment 6aa73f14dcefc0bfdb32050d. Fresh readback matched all 19 served runtime files; Edge Function v5 source matched the reviewed repository. All 47 HTTP checks and 17 regression tests passed; live RLS/grants, isolated DOM with current data, user-confirmed production owner/guest/logout/incognito behavior and independent source review passed. No runtime or deployment change was required. Detailed evidence and browser-tool limitations: docs/releases/owner-links-security-acceptance-2026-09-16.md.


## MAIN Writing v1 — released 2026-09-18

Feature 57cca7e8facf779871ce51fd13e7ebfa0a8561c9 merged normally at 2b2cdac08cbf0e5e2db0cff917778a147d70b0c6. Explicit task release authorization, 28/28 tests, isolated 1440/768/390 light/dark UI QA and independent source review passed. Existing site ycsu-platform-registry (9c0bd872-1f70-4468-b853-e87b9b3269d5) published accepted draft 6aad8e62321b9fa6785b09b8 at 2026-09-18T19:20:50.868Z. Previous secure rollback: 6aa73f14dcefc0bfdb32050d. No Git CD or new site configured.

Production Writing is empty (no approved articles), beside all 11 unchanged Products. Product count excludes Writing. Actual owner mixed-order save/reload/restore, owner settings availability, desktop/mobile viewer, guest/logout/new-tab security, no badge/broken images/errors, and 25 runtime SHA256 comparisons passed. Full record: docs/releases/main-writing-v1.md and main-writing-v1-assets.json.

Additive Supabase migration version 20260918191717 creates service-only main_presentation and atomic CAS RPC; writing-ops v1 independently validates the existing owner. Local migration filename matches the server-applied version. No product_registry schema/data, registry-ops, Auth or SMTP changes. Never deploy dist-qa. New article routes are generated only from approved content/writing Markdown; optional video is a link. Deploy ordinary dist only.

Rollback restores the previous secure frontend; the new Writing table/function can remain unused. Do not reopen browser table access or restore the old unsafe snapshot. Owner-authenticated ordering acceptance saved the original grid order in the new presentation layer (12 IDs, revision 2); existing Product ranks are untouched.

## Writing v1.1 release procedure
Existing site only:9c0bd872-1f70-4468-b853-e87b9b3269d5. Baseline/rollback6aada2062630da334a6f46db. Git CD remains disabled. Package ordinary dist; never dist-qa.
New additive backend writing-content deploys with --use-api (no Docker), --project-ref fzydsnxxcdllkjxwdiwn and --no-verify-jwt because handler validates the exact owner for all privileged actions. Existing registry-ops/writing-ops and database migrations are untouched. MAIN_WRITING_GITHUB_TOKEN is a server-side fine-grained token limited to this repo with Contents read/write; never reuse/export local gh credentials. Restore the prior frontend and disable/remove only the new function if backend withdrawal is required. Revert an article commit through normal Git history for content recovery; do not force push or delete original media.
Normal owner saves create canonical content commits and become visible through the runtime content API; they do not deploy Netlify. For static/SEO synchronization, fetch latest main, build/test, preview and release through the same attended gate. Exact release evidence is in docs/releases/main-writing-v1-1.md.

## Writing v1.1 backend checkpoint — frontend release held
Owner remote preview acceptance received. Main merged at ff463beeeaf9b84daa5ed21a944d88ed625ac391. Additive writing-content deployed through --use-api. Its unauthorized request checks pass (401/403), but public canonical content read returns 503; identical handler against public GitHub from the workstation succeeds. Token/environment diagnosis is pending. No frontend promotion: production remains 6aada2062630da334a6f46db. See docs/releases/main-writing-v1-1.md for exact scope and remaining gates.

Writing v1.1 backend 7f3f5fa is deployed: public read 200; guest writes denied; real owner edit read reaches GitHub and reports github_status 401 / response_class authentication_failed. Actual candidate logout passed. Owner save remains blocked pending token replacement, so frontend remains 6aada2062630da334a6f46db. Detailed live evidence: docs/releases/main-writing-v1-1.md.

## MAIN v1.3 lifecycle closeout
Released and production verified; see current production entry and docs/releases/main-v1-3-product-lifecycle.md. Private rollback data remains outside the publish directory.
