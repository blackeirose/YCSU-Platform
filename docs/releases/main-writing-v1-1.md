# MAIN Writing v1.1 — released and verified

Status: RELEASED / owner save and logout gates passed. Production https://main.ycsu.cc/.

## Release identity

| Record | Value |
|---|---|
| Feature SHA | `4ec90f7e216280addb57c4ba725d92ff01f6aa30` |
| Merge SHA | `ff463beeeaf9b84daa5ed21a944d88ed625ac391` |
| Backend credential-separation fix | `7f3f5fac1e0cee12db272331c860fa241ae4338e` |
| Canonical content / deployed build source | `6bcde873d6a5f30efe9a712cd7f8cbe5dccb2a1d` |
| Previous production / frontend rollback | `6aada2062630da334a6f46db` |
| New production deploy | `6aadc5abb7561cd759f6c1e3` |
| Published | `2026-09-18T23:14:45.917Z` |
| Existing Netlify site | `9c0bd872-1f70-4468-b853-e87b9b3269d5` |
| Current Core checked | `57a69136b7473718dfcf26311ae801f033696f05` |

One frontend production release, by promotion of the accepted draft. Git CD stays disconnected. Backend writing-content is additive; registry-ops, writing-ops, DB schema, Auth/SMTP, DNS and other apps were not changed. Core 7a11fa was used for implementation; fresh Core 57a69136 was read before final verification (only the designated media-workspace guidance changed). Gate Full; no Admin/system installation.

## Requested report

1. **Files:** frontend `index.html`, `assets/writing.css`, `assets/js/{owner-access,writing,writing-model,writing-viewer,writing-content,writing-editor}.mjs`; content builder and isolated QA server; new `supabase/functions/writing-content/{index.ts,handler.mjs}`, function config; backend/editor/session/visual tests and Git fixture; PROJECT_CONTEXT, DECISIONS, DESIGN, DEPLOYMENT, docs/WRITING and this release record. Acceptance created one immutable replacement WebP and changed only the approved article's cover reference. Full asset hashes: [main-writing-v1-1-assets.json](main-writing-v1-1-assets.json).
2. **Article editing:** contextual Edit Article inside the viewer. Existing Markdown is canonical; fixed repo/main/slug allowlist, blob revision conflict protection and atomic non-force Git commit. No CMS database copy.
3. **Images:** existing asset selection, URL replacement, or validated PNG/JPEG/WebP/GIF upload into the same article directory. Unique replacement filenames preserve originals; Markdown and uploaded media commit together. Cover and inline replacement both passed isolated browser QA; cover also passed real deployed-backend writing/readback.
4. **Security:** exact confirmed nonanonymous Supabase owner via server getUser. Public reads never retrieve/send MAIN_WRITING_GITHUB_TOKEN. Only protected owner read/save uses it. No client secret, raw-table access, arbitrary repo/path, delete or overwrite-original operation. Safe diagnostics include actual GitHub HTTP status/class without upstream body or credentials.
5. **Dimensions:** desktop 880px maximum width / 86dvh; measured 880x860 at 1440x1000; 688px at 768px viewport. Sidebar 170px, body approximately 651px. Mobile full-height separate article/list views.
6. **Frosted surface:** 45% dark backdrop with 8px blur; translucent shell with 20px blur and differentiated index/reader layers. MAIN remains visible around the floating desktop panel.
7. **Typography:** system sans body 18px / 1.65 (29.7px), mobile 17px; desktop title 26–32px, mobile 27px; metadata 13px.
8. **Header:** compact existing sizing retained, title/subtitle/stats aligned left. Homepage Writing settings removed; Arrange cards retained. Cover precedes Writing title; singular 1 ARTICLE fixed.
9. **Tags:** bounded safe YAML block-list strings, preserved across saves; no tag filter UI. Existing slug, featured and display_order are preserved.
10. **Tests:** validate/build passed, full 53/53 tests passed after backend separation fix. After actual cover save, validate/build and 9 relevant Writing tests passed. Original privacy, OTP, reorder, conflict/race and logout regressions retained.
11. **Browser QA:** independent original security review passed after navigation/cache fixes. Root's own browser checks are separately identified below; final delta review is recorded separately. Actual Chrome isolated edit/upload/feature/order/logout passed; latest protected Netlify preview visually inspected; actual production owner read/no-op save/logout, public cards/reader and console checks passed.
12. **Mobile QA:** 1440/768/390 light/dark isolated visual checks passed. Actual production 390x844 guest reader, decoded cover, no overflow, deep-link refresh and Back to Articles passed. No new physical-device touch acceptance is claimed.
13–16. **SHAs / deploy IDs:** see release identity above.
17. **Limits:** max 200 articles, 128KiB per Markdown source, 4 uploads / 4MiB each / 6MiB combined. Public GitHub rate limits or outage can cause fallback to the last deployed static manifest; current code never substitutes the editor token for public access. Runtime edits appear via Git immediately; static/no-JS/SEO content is updated at the next attended build/release. Real production has one article, so multi-article movement/featured independence was proven with isolated fixtures, not fake production content.
18. **Owner action:** none required. Credential replacement resolved the observed GitHub 401 and was verified through the deployed function, not by asking the owner to inspect settings.

## Actual owner save gate before frontend publication

A temporary attended loopback-only candidate served the accepted frontend and proxied only fixed Supabase Auth routes and permitted read/save operations. It used the normal pinned SDK and six-digit OTP flow; no existing session was exported, no Auth bypass/CORS relaxation was added, and no credential/request bodies were logged. It was stopped after acceptance.

Before secret replacement, exact real owner response was HTTP 502 with `github_status:401`, `response_class:authentication_failed`; public read and direct unauthenticated GitHub both returned 200. This failure held frontend publication.

After the owner replaced the secret:
- Real owner read-article returned 200.
- No-op save returned 200 / unchanged:true and retained main SHA 3870b33.
- Uploading the same approved cover and saving returned 200 / unchanged:false, creating canonical commit 6bcde87. Only cover metadata changed. Body and other metadata stayed identical.
- Original and replacement image SHA256 both equal `5f2040fb825d6019721090eba159a006d49c9826591a9711f7a58595ed1f8282`. Original cover.webp remains.
- Reload displayed the newly committed immutable raw-GitHub media URL with a decoded image.
- Sign-out immediately removed Product links and owner controls; subsequent article refresh kept public reading with no Edit Article, feature or reorder buttons.

Only after this gate passed was the latest canonical article rebuilt, previewed and published. Earlier draft 6aadad555 was never promoted.

## Production readback

- All **30/30 served runtime files** match dist SHA256; exact evidence in the linked JSON.
- `/`, `/writing/`, and the article deep link return 200. Source Markdown, Edge Function source and docs routes return 404.
- Public registry-ops and writing-ops payloads are deeply identical to the pre-task baseline: all 11 Products, mixed home order, article order and featured selection preserved.
- writing-content read-public returns 200 with exactly one approved article and its new immutable cover URL.
- Actual production owner opened Edit Article, loaded original and replacement image options, saved without changes and returned to the reader. Canonical main remained 6bcde87, proving no-op behavior.
- Actual production sign-out immediately left only Owner sign in and zero Product links. Deep-link refresh remained guest-only; article and image remained available.
- No Powered by Netlify badge and no console warnings/errors. Production mobile reader/back-to-list passed without overflow.
- Guest read/save requests returned 401; invalid owner session and foreign origin returned 403. Dist/public response scans found no GitHub credential patterns, editor secret name or service-role patterns. The secret itself was never retrieved or displayed.

## Recovery

Restore secure frontend deploy 6aada2062630da334a6f46db if needed. Keep denied raw table access and public-safe assets. The additive backend can remain unused or be withdrawn independently. Recover article content with normal Git history; never force-push or delete original media. No automated publishing or screenshot workflow was added.

## Independent final delta review

Independent reviewer /root/writing_security_review rechecked exact runtime commit 7f3f5fa after the original review: PASS, no actionable security findings. Public reads never access/send the editor token; diagnostics contain only bounded status and fixed classification. Reviewer independently ran 14/14 backend tests. This source review is separate from the real browser and production evidence above. Core revision 57a69136b7473718dfcf26311ae801f033696f05.
