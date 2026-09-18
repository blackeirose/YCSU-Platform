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
2. **Article index:** `settings.article_order` overrides Markdown `display_order`; remaining ties use newest date, then slug.
3. **Featured article:** explicit `settings.featured_slug`, then a Markdown `featured: true` article, then newest date. Index/home order never changes featured selection.

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
