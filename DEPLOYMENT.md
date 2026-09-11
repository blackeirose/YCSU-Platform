# DEPLOYMENT.md

Live deployment record for YCSU Platform. Update this file whenever deployment state actually changes — do not let it drift from reality.

---

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

## Manual Preview Release — 2026-09-11

The production frontend now renders manually curated previews for all eight current products. ADCC uses its real local development capture with an unlinked DEVELOPMENT PREVIEW label. Plumbing links to `https://tools.ycsu.cc/plumbing-chart/`; Mind Map is Public / Live and retains Planning with no version. Both corrections were persisted through `registry-ops`, read back, and included in the validated eight-product snapshot.

The initial preview-card production deployment is `6aa46283940d50974f2624ce`, from merge commit `bd630439e17a5a032f9de30e9ac304548e252bf9`. The MAIN self-preview was then captured from that real production UI and included in the follow-up release. The latest published deployment is available in the existing [Netlify deployment history](https://app.netlify.com/projects/ycsu-platform-registry/deploys).

The Netlify CLI stalled before creating a deployment. The release therefore used Netlify's official ZIP deployment API against the existing site ID, with a complete archive of Git-tracked files and an `_headers` file equivalent to `netlify.toml`. Local credentials, `.git`, `.netlify`, temporary capture files, and test fixtures were excluded. Production returned HTTP 200 with the three configured security headers. The Powered by Netlify badge is disabled at the site level. No new site or screenshot automation was created.

## Registry Data Layer (Supabase) — Current State (deployed 2026-08-29)

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

**Option A — one-time dashboard setup for automatic deploys (recommended):**
In the Netlify admin (link above) → Site configuration → Build & deploy → Link repository → select `blackeirose/YCSU-Platform`, branch `main`.

**Option B — manual deploy from this machine:**
```bash
cd YCSU-Platform
netlify deploy --prod --site 9c0bd872-1f70-4468-b853-e87b9b3269d5 --dir .
```

If `netlify status` shows a project name other than `ycsu-platform-registry`, check `.netlify/state.json` — it should read `{"siteId": "9c0bd872-1f70-4468-b853-e87b9b3269d5"}`. (An earlier session's killed background command silently created an orphan site named `ycsu-platform` (id `45cec71d-b50f-4022-a82f-493d538de318`, no custom domain, unused) and left it linked in that file; this was found and fixed during v1.1.0 work. The orphan site itself was not successfully deleted — the Netlify CLI/API was intermittently timing out on delete calls at the time — and is a harmless but real leftover cleanup item.)

## Redeploying the Registry Write Interface After a Code Change

```bash
cd YCSU-Platform
supabase functions deploy registry-ops --project-ref fzydsnxxcdllkjxwdiwn --no-verify-jwt
```

## Applying a New Database Migration

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

## Persistent ordering candidate — 2026-09-11

Production migration `20260911215355_product_registry_sort_order.sql` adds nullable integer order and a service-role-only transactional RPC. All eight active products were backfilled in the original visual order, 10–80. Readback confirmed unchanged business metadata and `last_updated`. Existing public SELECT RLS remains; no client write policy was added.

`registry-ops` version 4 is deployed with custom authentication and `verify_jwt=false`. Anonymous and invalid-token requests return 401; the existing management key remains accepted. Verified owner Auth sessions may only authorize and reorder. The exact Auth redirect `https://main.ycsu.cc/` was added; Tracker's Site URL and redirect remain unchanged. The security advisor reports only the previously recorded project-wide leaked-password-protection warning.

Frontend candidate commit `65c1f6fc0dc032b7f5d5a0ab933885f8a705c0dc` is published as Netlify deployment `6aa4790f9db8fbe97d6562f7` (ready, 2026-09-11 21:56 UTC). Production HTML, scripts, CSS, vendored SDK and snapshot return 200 with SHA256 matching the source. Public desktop/tablet/mobile checks show 3/2/1 columns, no overflow, no drag controls, eight loaded previews, no Netlify badge and no console errors. A normal Plumbing preview click opens its canonical production route.

The existing authorized management client moved Mind Map to the first position through production `registry-ops`; a fresh MAIN browser load displayed the persisted order without a deploy. A second authorized operation restored the original 10–80 order. Readback confirmed no business metadata changes. This verifies production persistence, but does not substitute for owner Auth/UI acceptance. The v1.2 candidate awaits production owner sign-in, browser UI reorder/reload/restore, and native mouse/touch acceptance. Do not create the v1.2.0 release/tag until production persistence passes. Six local tests and independent code review passed, including transactional conflicts, authorization, link exclusion, pointer capture, keyboard order and failed-save rollback. Browser QA verified responsive layouts and keyboard save/reload/rollback using an isolated local fixture; it did not verify production Auth or native touch.

Rollback: restore frontend commit `20d335ca6999c75917defde305ff6a1b486e0ae4` (Netlify deploy `6aa462ff3de1603f93416599`) and redeploy that commit's original `registry-ops/index.ts` with `verify_jwt=false`. The additive column/RPC can remain unused; remove the MAIN Auth redirect only if owner login is being withdrawn. No Tracker changes are required.
