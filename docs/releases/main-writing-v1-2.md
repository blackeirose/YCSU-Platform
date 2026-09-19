# MAIN Writing v1.2 — released and verified

Status: RELEASED / production owner save, refresh, guest and logout verified. Production: https://main.ycsu.cc/.

## Release identity

| Record | Value |
|---|---|
| Core revision | `57a69136b7473718dfcf26311ae801f033696f05` |
| Base main | `1689a757208c5a9667e72fe11496065ecc946583` |
| Feature branch | `feat/main-writing-v1-2-formatting` |
| Feature SHA | `b3459a3c7b81edd7882645405e67b132086c1469` |
| Merge/build SHA | `422160a50ece4db33974365fba2c8f34323bcd42` |
| Previous production / rollback | `6aadc5abb7561cd759f6c1e3` |
| New production deploy | `6aadd0b0941aa8845e985d20` |
| Published | `2026-09-19T00:02:07.048Z` |
| Existing Netlify site | `9c0bd872-1f70-4468-b853-e87b9b3269d5` |
| Final restored content SHA | `322f578363be75ea02af4e9136278609e9d0fc8e` |

Gate Full. One frontend production publish, promoting the accepted draft. Git CD remains disconnected. No new service/dependency, Admin/system install, DB/Auth/SMTP/Registry/presentation/DNS changes. Existing writing-content alone was redeployed with the compatible schema extension; exact-owner validation and public/editor credential separation remain unchanged.

## Requested final report

1. **Files changed:** `assets/js/writing-format.mjs` (new pure selection transforms), `writing-editor.mjs` (toolbar/size/preview), `writing-content.mjs` (shared schema/parser/renderer), `assets/writing.css`, `supabase/functions/writing-content/handler.mjs`, `tests/writing-format.test.mjs`, `tests/writing-content-api.test.mjs`, article frontmatter, PROJECT_CONTEXT, DECISIONS, DESIGN, DEPLOYMENT, docs/WRITING, this release note and asset evidence JSON.
2. **Allowed sizes:** numeric 17,18,19,20px only, with line heights1.65/1.62/1.6/1.58 respectively.
3. **Default:** 18px. Old articles remain valid; missing field defaults safely. One fixed existing system-sans family. Chosen size applies to the whole body on all viewports, not title/metadata/sidebar/controls.
4. **Toolbar:** Bold, Italic, H2, H3, Quote, Link; native compact text-size selector; Ctrl/Cmd+B/I; immediate expanded preview. Selection is retained across toolbar clicks.
5. **Markdown mappings:** `**text**`, `*text*`, `## Heading`, `### Subheading`, `> Quote`, `[Label](https://...)`. Same-selection mixed emphasis renders as strong+em. No canonical HTML, font/color/alignment picker or per-span size.
6. **Persistence:** optional numeric `body_font_size` in canonical article frontmatter, validated by the shared parser and owner-only server patch allowlist. Existing atomic Git save persists body/size together. Public runtime and static build use bounded `data-body-size` selectors. No localStorage-only setting.
7. **Tests:** final validate/build and **65/65 full tests PASS**; after merge/current restored article, build/validate and **26/26 affected tests PASS**. Independent reviewer **37/37 targeted tests PASS**, plus reproductions of edge cases. Initial62 tests missed real issues, which were fixed and added as regressions before release.
8. **Desktop QA:** actual Chrome1440x1000, current approved article in isolated memory fixture; mouse drag ->Bold ->Italic ->20px preview ->save ->refresh passed. Title32px,metadata13px,index13px retained. Actual deployed-backend candidate and actual production each passed a real reversible body/size save with Git commit/readback. Actual protected Netlify draft inspected before promotion.
9. **Mobile QA:** actual isolated Chrome390x844 owner toolbar wraps without horizontal overflow;17px save/readback and light/dark views visually inspected. Production390x844 DOM confirms18px and no page overflow. A final production mobile screenshot/control retry encountered browser/CDP timeouts; do not claim that attempt as separate mobile-owner visual PASS. Same deployed31-file artifact was verified against the isolated accepted build. No physical-device touch acceptance claim.
10. **Security QA:** real guest read-article/save-article return401. Existing tests cover invalid/nonowner sessions, logout races and token-independent public reads. An independent guest IAB on production rendered the temporarily formatted20px article with no toolbar and Owner sign in. Real production logout immediately removed all Product links and formatting/editor capability. No token/service-role patterns in dist/public responses; no secret values retrieved. Source/Markdown URLs404; public routes200. Production console warnings/errors empty; no Netlify badge.
11–14. **SHAs and deploy IDs:** see release identity table.
15. **Limits:** this remains a lightweight Markdown textarea plus visual action toolbar and preview. Partial/mixed existing markup, code/image/link syntax and structural markers are safely refused with a hint; select plain text within the structure or the complete emphasized phrase. Link accepts one plain-text line. Unsupported rich-text operations stay absent. Public GitHub rate limits retain the existing static fallback. Dynamic edits appear immediately; static/no-JS/SEO updates require the next attended build/release. Browser viewport checks do not substitute for physical-device touch testing.
16. **Owner action:** none required. No manual QA/token-settings request was needed.

## Real reversible acceptance

Before frontend publication, the attended loopback candidate used normal real six-digit owner Auth and the deployed function (no session export, bypass or production CORS change). Only the selected first body line was emphasized; all form fields were compared before save. Commit `6ceada8a9357188eda51527133fbf91ba508c005` changed that line to combined bold/italic and body_font_size19. Reload confirmed both. Restore `0c084ef871185bafeeb8a073b6931b1f4fdfcd8d` returned the exact original body and size18. Only the explicit18 frontmatter field differs from the pre-feature article; original wording, images and other metadata were preserved. Real logout removed owner links/controls before frontend publication.

After release, the real main.ycsu.cc owner editor repeated the carefully compared reversible test at20px. Commit `95a2ef3004edbb12b90437268b993d12c2afd3e1` persisted it. Owner refresh and an independent guest browser confirmed strong+em and20px. Restore `322f578363be75ea02af4e9136278609e9d0fc8e` exactly matches the merge article; `git diff 422160a 322f578 -- content/writing/make-the-impossible-possible.md` is empty. No artificial QA wording remains. Normal history only, no force push.

## Production evidence and recovery

- **31/31 runtime files** SHA256 match accepted dist; [asset evidence](main-writing-v1-2-assets.json).
- registry-ops/writing-ops public payloads deeply match pre-release baseline:11Products and all home/article order/featured settings preserved.
- writing-content public200, exactly1approvedarticle, size18. Public reads never require the editor token.
- `/`, `/writing/`, article deep URL200. Canonical Markdown and Edge source routes404.
- Temporary isolated and real-backend loopback servers stopped; temporary browser tabs closed and viewport override reset.
- Independent review found and verified fixes for repeated multi-paragraph toggles, partial emphasis, mixed markup, links losing emphasis, structural-prefix corruption and NUL token collision. No unresolved actionable finding. Reviewed source hashes: format `E356821BB849F31DBF12E5F15FF27C0490D23EDF8FC632FE2C8197F12D0C8EDB`; content `F760FC1C6CE0A674B9FAD15737F1930E184DD4DC514F9B799A4836C0357BB590`.
- Recovery: restore previous secure frontend deploy if required and retain the compatible new writing-content backend so the optional body_font_size remains readable. Do not roll back the parser to a version rejecting that field without a separately reviewed content migration. Keep owner authorization and public-token independence intact.
