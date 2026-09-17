# PROJECT_CONTEXT.md

## Workspace and release authority

Canonical source is `blackeirose/YCSU-Platform`, `main`. The current active checkout is `C:\Users\ysu\Claude_Workspaces\YCSU-Platform`. `C:\Users\ysu\Codex_Workspaces\YCSU-UMS-preview` is a secondary validation checkout, not UMS source; compare it with canonical state before reuse. `YCSU-Platform_AI-WORK-Package` is the historical v1.1 archive, not current security/build/deployment instructions. Preserve all copies.

The last verified deployment record is in `DEPLOYMENT.md`; this documentation remediation does not reverify or change production. GitHub remains the canonical handoff destination; local documentation commits are not published until deliberately pushed. Current documented releases are manual, dist-only; automatic Git-linked CD is not configured and must not be enabled implicitly. Follow the release gate in `DEPLOYMENT.md`.

**YSU AI Development System**
**Project Version:** v1.4.0 — Mobile Email OTP Sign-In (2026-09-11)

## Product and current state

YCSU Platform is the Registry-driven public product directory at https://main.ycsu.cc. Canonical code: `blackeirose/YCSU-Platform`, branch `main`. Supabase `public.product_registry` remains the runtime metadata source of truth. Active products render through one generic implementation. Guests browse public metadata and curated previews; only the existing owner receives Product/planned/GitHub/Tracker/Docs/Roadmap URLs and may reorder.

v1.2.0 was released separately after YuCheng confirmed desktop and real-device touch/drag. v1.3 adds read access control while preserving ordering, layout, business facts and the management API. Release evidence lives in `DEPLOYMENT.md` and `docs/releases/`. Owner-only Product Links is CLOSED / COMPLETE after final security acceptance on 2026-09-16; see `docs/releases/owner-links-security-acceptance-2026-09-16.md` for the current production evidence and explicit verification limits.

## Architecture and access boundary

Plain HTML/CSS/JavaScript, pinned Supabase Auth SDK loaded for owner access, and the existing `registry-ops` Edge Function. No frontend framework or second login system. A deterministic Node build copies approved public files into `dist` for Netlify.

- Guest: homepage → registry-ops `read-public` → fixed server allowlist → generic cards. Protected fields are absent, including null placeholders. URL-bearing text is redacted server-side without mutating stored metadata.
- Owner: existing Supabase session → server `getUser(token)` and exact confirmed, non-anonymous owner UUID → `read-owner` → full records through the same renderer. Owner retains authorize/reorder but cannot perform arbitrary metadata/CRUD writes.
- Management: existing `REGISTRY_API_KEY` permits create/update/archive/unarchive/delete/reorder. Never expose it or service_role in browser assets, source or Drive.
- Database: RLS enabled, zero browser policies. All table and explicit column privileges revoked from PUBLIC, anon and authenticated. Direct PostgREST access is denied even to the owner's browser role. Only the Edge Function's service role reads/writes raw records; reorder RPC remains service-role-only and transactional.

Owner UUID: `38531f7e-e05e-473a-a587-500b1d3aebe5` (identifier, not secret). Email, user_metadata and client flags do not authorize. Signed-in non-owners remain guest-like.

## Data contracts

Schema 1.3 public camelCase fields: id, slug, name, shortName, description, category, platformLayer, maturity, deployment, visibility, operationalStatus, version, versionSource, featured, archived, certification, lastUpdated, statusNote, sortOrder. Preview paths derive from safe slugs and are not Registry metadata.

Protected fields: mainUrl, plannedUrl, githubUrl, trackerUrl, docsUrl, roadmapUrl (snake_case in PostgreSQL). Public JSON omits them entirely. Server redaction also covers endpoint-bearing text. See `registry.schema.ts`, `assets/js/registry-public.mjs` and `docs/DATA_LAYER.md`.

## UI, sessions and ordering

Guests have no action links, planned URLs, preview anchors or reorder grips. Owners see available links; previews launch only valid HTTP(S) main URLs. Development previews remain unlinked.

Supabase Auth persists its session normally. Refresh and a newly opened tab restore access while valid. Logout drops owner records from memory, restores safe public DOM and disables sorting before awaiting sign-out. Cross-tab sign-out and stale asynchronous responses are guarded. Full owner records are never stored in localStorage or a static cache.

Nullable integer sort_order controls display, nulls last with deterministic name/slug fallback. Mouse grip drag is immediate; non-link card areas and touch grips use a 500 ms hold. Arrows/Home/End also work. Transactional saves detect stale order and change only ranks. Failed saves restore the prior display; reload before retrying. Fallback views cannot reorder.

## Fallback, build and previews

`data/registry.public.snapshot.json` is a manually refreshed public-safe fallback, not a full backup or authority. Its script reads only read-public and never writes back. Owner backend failure leaves public cards usable without an offline owner export.

Run `npm run build`, `npm run validate`, then `npm test`. Deploy only dist, never the repository root. Build excludes docs, SQL, tests, manifests and full exports. The old live manifest became a fictional example; the full snapshot was removed from the current tree.

Preview images at `assets/previews/{slug}.webp` are manually curated by the owner or an authorized agent only in explicit MAIN maintenance tasks. No scheduled, background, deployment-triggered or unattended screenshot automation. MAIN's self-preview now shows a guest-only production state. Responsive 3/2/1 columns and the disabled Netlify badge are preserved.

## Services and deployment

Netlify existing site `ycsu-platform-registry`, ID `9c0bd872-1f70-4468-b853-e87b9b3269d5`; custom domain and HTTPS unchanged. Git continuous deployment is not configured. Manual releases use the official ZIP API with dist contents only. Supabase existing project `ysu-tool-tracker`, ref `fzydsnxxcdllkjxwdiwn`, is reused; other applications' Auth and tables are outside this milestone. GitHub is canonical for code/migrations/docs, not live metadata. Registry updates appear on fresh reads without redeployment. Namecheap DNS is unchanged.

## Constraints and future direction

Preserve business facts and DB enum/certification/version/URL constraints. Prefer archive over delete. Set mainUrl only after verifying production; future endpoints belong in plannedUrl. Never guess health, certification or version.

This controls current MAIN runtime access, not global URL secrecy. Public architectural docs, Git history and historical deployments may mention domains. Downstream apps enforce their own access. Do not roll back to public table grants, full snapshots or repository-root deploys; retain the secure read boundary.

Future direction only: MAIN may become authenticated-only if YuCheng chooses; TRACKER, MIND MAP and ADCC may become authenticated-only; HUB may provide public browsing with authenticated launch. No shared SSO, member roles, admin dashboard, other-app login changes, lifecycle pipeline or automatic discovery is included.

## Canonical documentation and maintenance

Read AGENTS.md and canonical YSU AI Core first. DECISIONS.md records durable reasoning (DEC-017 reorder; DEC-018 read boundary). DEPLOYMENT.md records production evidence. DATA_LAYER, REGISTRY_OPERATIONS, REGISTRY_SCHEMA, PLATFORM_MODEL and the preview README define their contracts. Historical handoffs are not current architecture. Durable Drive package: AI Works / 03_Projects / YCSU PLATFORM.

Update canonical docs for architecture/deployment changes. Routine facts use registry-ops without code edits/deploys. Refresh the public snapshot during explicit release maintenance; never export full owner rows to public files.


## v1.4 — Mobile Email OTP Sign-In

MAIN uses a two-stage six-digit email/code flow with existing Supabase Auth and exact server UUID authorization (DEC-019). The owner configured Resend on this exact project. OTP length is 6 (expiry 3600 seconds); the passwordless template includes Token and retains ConfirmationURL for Magic Link compatibility. No SMTP credentials were read or placed in source/chat.

YuCheng confirmed fresh desktop OTP login and physical-mobile original-browser login, product links, sorting and session persistence after refresh/browser reopen. A new desktop production tab also restored the existing owner. All 17 local tests and independent source review passed. The shared Tracker Site URL, allowed redirects and other apps remain unchanged. See DEPLOYMENT.md and docs/releases/v1.4.0.md for release records.
