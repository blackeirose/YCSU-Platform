# MAIN Writing v1 — content and publishing contract

Writing is public editorial content, never a `product_registry` row. Exactly one Writing card shares the Product grid and its responsive sizing. Products statistics count Products only. No full CMS, upload service, comments, search, or automatic publishing is implemented.

## Canonical sources

- Articles: `content/writing/*.md` (UTF-8, flat frontmatter).
- Media: `public/writing/<slug>/<filename>`; served at `/writing/<slug>/<filename>`.
- Static generator: `scripts/writing-content.mjs`; `npm run build` emits `dist/data/writing.json`, `/writing/index.html`, and `/writing/<slug>/index.html`.
- Every article route has static visible body, title, excerpt metadata, canonical and Open Graph tags. JavaScript upgrades it to the same reader used from MAIN; the static body survives manifest failure.
- Only media belonging to published slugs is copied. No automatic screenshots or background publishing.

```yaml
---
title: "Approved article title"
slug: "stable-article-slug"
date: "2026-09-18"
category: "AI & Architecture"
cover: "/writing/stable-article-slug/cover.webp"
cover_alt: "A concise description of the approved cover image."
excerpt: "Optional short summary."
linkedin_url: "https://www.linkedin.com/posts/..."
facebook_url: null
video_url: null
featured: false
display_order: 10
---
Approved Markdown body.
```

Optional `cover_alt` (up to 1000 characters) describes the article cover in the static page, reader and homepage card; omitted/blank values fall back to the title. A different owner cover override retains the title fallback. This is article metadata only, not a persistent presentation setting.

Required: nonempty title (up to 200 characters), lowercase hyphenated slug (up to 100), valid ISO date, nonempty body. Other fields are optional; omit them or use `null`. `featured` is boolean; `display_order` is an integer. Strings with punctuation should be JSON-style double-quoted. Dates must be quoted. Flat scalar fields only; unknown or duplicate keys fail the build. Slugs `index`, `assets`, and `data` are reserved. Treat a published slug as permanent; changing it needs a redirect maintenance task.

Supported Markdown: paragraphs, headings (`#` promoted to `h2`, `##`–`######` retained), ordered/unordered lists, blockquotes, fenced code, inline code, strong/emphasis, HTTPS links, and images with mandatory alt text. Raw HTML is escaped; unsupported Markdown extensions (tables, arbitrary embeds, nested YAML, plugins) are not enabled. Optional video is an explicit “Watch video” link, avoiding third-party iframe loading/tracking. Local images/video must exist in the article's own media directory. Allowed file types: WebP, PNG, JPG/JPEG, GIF, AVIF, MP4, WebM. No symlinks, SVG/scripts, traversal, or unrecognized media files.

## Three independent states

1. **Home grid:** `main_presentation.home_order` stores active Product IDs plus the `writing` sentinel. Missing/new IDs append in existing Registry order; stale IDs disappear. Before the first mixed save, existing Product order remains unchanged. Legacy Registry reorder still works as the fallback; once a mixed order is saved, MAIN uses that presentation order. No Product `sort_order` or other metadata is written by this feature.
2. **Article index:** articles absent from `settings.article_order` come first, sorted by date descending then slug ascending; listed articles follow in their saved relative order. With no manual order, all articles use date/slug order. Legacy Markdown `display_order` remains stored but does not drive this index.
3. **MAIN cover article:** valid explicit `settings.featured_slug`, otherwise newest date then slug. Legacy Markdown `featured` remains stored but does not override this fallback. Index/home order never changes MAIN cover selection.

Owner settings also support card title (footer; empty-state heading), description, homepage excerpt override, cover URL and featured video URL. Article title remains the card's main heading when articles exist. Empty override values restore article/default values. These values are **public**, so never paste private Product destinations or secrets. Markdown body remains Git canonical. Featured video override appears only with the featured article in the runtime viewer; the static article preserves its Markdown video URL.

## Security and persistence

The existing owner session is reused. `writing-ops` validates the Auth user using Supabase `getUser`, exact existing owner UUID, confirmed email and nonanonymous account; it never trusts a browser owner flag or forwards tokens to arbitrary endpoints. The singleton table is RLS-enabled with no browser grants/policies. Only service_role can invoke the atomic CAS RPC. Public read explicitly returns `settings` and `home_order`; revision is owner-only. Operations patch settings or home order separately. A conflict leaves the stored state unchanged. A network failure may hide an already committed save; reload to check the latest state. Another save is disabled until reload. Logout clears the editor/revision immediately and rejects delayed session/JSON responses. `registry-ops`, Product schema, six-digit OTP and existing protected-link projection are unchanged.

## Explicit publishing workflow

An article draft being complete is **not** publication authorization. Start only after YuCheng explicitly says **「更新這篇到 MAIN」 / “Publish to MAIN”** and identifies the article. That maintenance instruction authorizes normal content preparation, validation and the stated release scope; preserve any explicit release hold.

1. Load current canonical AI Core and MAIN context; inspect branch/working tree and production baseline.
2. Retrieve the final approved copy and actual final images already available in the referenced 主編 conversation or connected files. Use available connectors/context directly; do not require manual recopying. If the approved version/assets truly cannot be recovered, report the exact missing source. Never invent prose/images or publish a draft as approved.
3. Create/update the Markdown file and static media, preserving approved wording. Include the provided original LinkedIn URL and optional Facebook URL. Choose a stable slug; provide meaningful image alt text. Optimize approved images as needed; do not create screenshot automation.
4. Run `npm run validate`, `npm run build`, `npm test`. Inspect generated metadata, article route, card selection and article index. Do not silently change owner-selected ordering/featured state.
5. Preview real desktop/mobile interactions, images, social/video destinations, refresh and Back/Forward. Perform independent review appropriate to the diff.
6. Commit/push through normal history and the existing MAIN release process only when explicitly authorized and all gates pass. Verify the real production article URL and record source SHA/deploy ID/rollback in canonical release documentation.

No chat-to-repo backend or unattended automation is installed. Existing chat/file tools provide the retrieval step during an attended maintenance task.

## Local QA

`node scripts/build-site.mjs --qa` creates **dist-qa**, using only `tests/fixtures/content/writing` and its fixture media. `node scripts/qa-writing-server.mjs` serves it on **127.0.0.1:4173**, with an in-memory PGlite database and clearly labelled fake owner session. It makes no production data/Auth calls and never sends email. The QA banner can switch light/dark CSS for visual checks. `--empty` on the server serves the ordinary empty production build with the same isolated backend. Server restart resets fixture settings.

Production always uses ordinary **`npm run build` → dist**. Never deploy `dist-qa`, the QA server, fixture SDK, or test articles. Test articles are explicitly labelled and excluded from ordinary output. Real Writing content starts at zero articles for this release; no fabricated work is published.

## v1.1 — contextual editing (supersedes v1 presentation-only editing)
Owner opens a published article and chooses Edit Article. Fields: title,date,category,excerpt,Markdown body,cover/cover description,inline images,video URL,LinkedIn andFacebook URL. Existing assets may be selected for cover; inline URLs and uploaded replacements update references automatically. Set as MAIN cover and Reorder articles are contextual actions; no Writing settings link remains on home.

Optional tags now support a safe block list, for example tags followed by two-space-indented '- AI' entries. Maximum30 unique nonempty strings,80characters each. No arbitrary YAML, anchors, nested objects or filter UI. Absent tags stay absent; edit/save preserves tags plus featured/display_order. Parser/render/serializer are shared by build and backend in assets/js/writing-content.mjs.

New writing-content operations: read-public returns rendered canonical article manifest; read-article and save-article require existing exact owner getUser verification. Fixed repo/main only, existing content/writing/<slug>.md only; save accepts expected blob revision and editable fields, rejects stale article/repo heads. Immutable replacement assets are committed together through Git Database APIs and force:false ref update. No Product table/write model changes. A successful response includes commit and exact public_article. Missing credential denies editing. Error or conflict leaves editor unsaved/uncertain and requires cancel/reopen before retry.

Uploads:PNG/JPEG/WebP/GIF,4MiB per image,up to4 images,total6MiB binary/request9MiB. Content limit128KiB per article;200articles/8MiB manifest source budget with4parallel reads. Server validates signatures,paths,ownership and references; rejects SVG,overwrites,unused files and cross-article local paths. Originals are preserved. Browser keeps unsaved edits/files in memory only; logout and navigation invalidate pending responses.

Public runtime checks current main head per request and caches parsed manifests only for the same commit. Media uses immutable raw.githubusercontent.com commit URLs; server never fetches arbitrary supplied image URLs. API failure uses the last deployed static manifest. Static deep-link content,metadata and social-preview HTML update on the next explicit attended build/deploy. Do not claim immediate no-JS/SEO synchronization after a browser edit. No new CMS database,Git auto-deploy or unattended publishing is installed.

QA server now exercises the real content handler against tests/helpers/writing-github-fixture.mjs entirely in memory. --empty serves the ordinary build/current approved article despite its historical flag name. Default uses two explicit QA fixtures. Test saves never write local canonical article files or GitHub. Restart resets state. Production contains only the approved article.

Public reads use unauthenticated GitHub access only; MAIN_WRITING_GITHUB_TOKEN is reserved for exact-owner read/save operations. A missing/expired editor token cannot break the public read path. Safe upstream diagnostics report github_status and response_class without raw errors or secrets. Writing v1.1 was released after actual deployed-backend owner save/logout acceptance; see docs/releases/main-writing-v1-1.md.

## v1.2 — formatting and body text size
`body_font_size: 18` is optional frontmatter. Omitted values default to18; present values must be numeric17,18,19or20. Null, strings, fractions and arbitrary CSS are invalid. The same size applies across desktop/mobile article body; corresponding line heights are1.65/1.62/1.6/1.58. Title, metadata, sidebar, controls and fixed font family do not change. Static builds and public dynamic reads both use it.
In Edit Article, select body text and use B/I/H2/H3/Quote/Link. Preview is expanded by default and updates immediately. Ctrl/Cmd+B/I are supported. The toolbar writes Markdown, and the existing Save writes body plus numeric size atomically to Git. No browser-only persistence.
Partial/mixed existing markup and code/image/link syntax are protected: use plain text or select the complete emphasized phrase. To emphasize a heading/list/quote, select its text without the leading marker. Link expects a single plain-text line and HTTPS URL. These safeguards leave source unchanged on invalid selections. Logout removes editor/toolbar and cancels pending access as before.

## Lifecycle milestone font expansion
Supersedes v1.2 size list only: body_font_size accepts each integer12 through20; default18. Line height for12/13/14/15/16 is1.8/1.78/1.75/1.72/1.68. No arbitrary CSS. Hidden/Archived/Deleted apply only to Products. Mixed home ordering retains inactive Product slots; article ordering/featured settings remain independent.

## v1.3.1 card identity
The display setting/default title is YSU Journal. WRITING remains the type label, data-product-id remains writing, and /writing/ routes and article schema are unchanged. Card order: type/count → h2 Journal name → cover → h3 featured article title → date/category → excerpt → shared-title footer. Existing title-driven empty/list reader naming inherits this display identity; article reader/editor behavior and styles are unchanged.

## Writing v1.3.2 MAIN cover and article order
Owner chooses Set as MAIN cover inside an article. Its image, title, date/category and excerpt immediately drive the homepage card and persist through existing settings CAS. For populated cards, legacy presentation cover/excerpt overrides remain stored but no longer mask the selected article. No-cover/no-excerpt articles use a placeholder/empty excerpt. Empty-card defaults remain. The selected article shows disabled MAIN cover selected and exactly one restrained MAIN COVER index label for owners; guests have neither. A successful settings save still updates shared card state if navigation happens before completion; logout invalidation remains.
New/unlisted articles always precede the manual group. Saving Reorder articles lists all currently known articles; later unlisted publications automatically appear above that list without changing the saved items' relative order. Invalid/removed selected slugs fall back to newest regardless of manual order or legacy featured/display_order. No schema or backend API change.
