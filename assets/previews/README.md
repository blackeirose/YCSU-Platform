# Product Preview Images

Preview images are manually curated and updated only as part of an explicit MAIN maintenance task. The owner does not need to capture them personally: an authorized AI/development agent such as Codex may open the verified production URL, select a representative current state, capture the screenshot, convert it to WebP, and update the preview asset. Supabase `product_registry` remains the only source of product metadata.

## File convention

Store each image at `/assets/previews/{slug}.webp`. The filename must match the Registry slug exactly, including lowercase and hyphens (for example `workflow-hub.webp`). The renderer derives the path; do not add image URLs or paths to Supabase, manifests, or the snapshot.

## Manual maintenance

1. Within an explicit MAIN maintenance task, the owner or an authorized AI/development agent opens the verified production URL and selects a representative current homepage or interface state. Capture the selected state for the preview; a product change alone does not trigger capture or an asset update.
2. Recommend a **1440 × 900** source viewport and approximately **16:10** aspect ratio. The card crops consistently with `object-fit: cover` and favors the top of the image. Keep the important content near the top; do not upscale a low-resolution screenshot.
3. Export as **WebP**, with readable interface text and a modest file size (aim for 100–250 KB when practical). Review for private information before publishing: all files here are public, including previews of local/internal products.
4. Replace `{slug}.webp`, review the card at desktop/tablet/mobile sizes and in light/dark mode, then commit and publish through the existing frontend deployment workflow. Unlike Registry metadata, an image file change needs a frontend deployment. If an old image persists, reload without cache and verify the deployed asset.
5. Update Registry metadata separately through the existing authorized Registry operations when needed. Do not change metadata merely to match or test an image.

## Display rules

- **Public + Live:** load the static image and link the preview to a valid `mainUrl`; a missing or undecodable image shows “Preview unavailable,” never a broken-image icon.
- **Local / Internal:** load an optional manual image with a DEVELOPMENT PREVIEW label; otherwise show a neutral development placeholder. Keep LOCAL ONLY / INTERNAL visible. Development previews are not launch links.
- **Not Deployed:** always show IN PROGRESS, product name, and any planned domain as text. Never request an image or make the planned domain clickable.
- **Other operational states:** show “Preview unavailable” without requesting a screenshot. Public Pending/Offline/Unknown entries retain their actual status, not a Live label.

No scheduled, background, deployment-triggered, or unattended screenshot automation is permitted. Using browser capture and conversion tools during an explicit MAIN maintenance task is permitted; do not turn that workflow into an automatic capture service or job. Remote screenshot services, iframe previews, and synthetic application screenshots remain out of scope. New Registry products use the same renderer automatically; the image is the only optional manually curated visual asset. Missing previews may be supplied by the owner or an authorized agent during an explicit MAIN maintenance task.

## Curated release capture batch — 2026-09-11

All eight targets were opened and freshly captured during this explicit MAIN maintenance task. ADCC is a real local development interface, not a fabricated application image. No screenshot includes a Netlify badge, permission prompt, loading/error page, email address, or private document content. The source viewport was 1440 × 900; scrollbar-bearing native captures are 1425 × 891. No image was upscaled. WebP quality is 88, or 82 for Rachel artwork. All eight assets decode successfully.

| Asset | Capture target | Selected state | Resolution | Size (KiB) |
| --- | --- | --- | --- | ---: |
| `ycsu-platform.webp` | https://main.ycsu.cc | Current production homepage; temporary pre-release self-preview | 1425 × 891 | 62.0 |
| `workflow-hub.webp` | https://hub.ycsu.cc | Current all-modules landing view | 1425 × 891 | 99.2 |
| `ycsu-tracker.webp` | https://tracker.ycsu.cc | Cloud-synced public Card view; email input empty | 1425 × 891 | 103.3 |
| `rachels-animal-kingdom.webp` | https://game.ycsu.cc/RaAnimalChess | Current cover with ENTER THE KINGDOM | 1440 × 900 | 230.6 |
| `fire-pump-test-pit-simulator.webp` | https://tools.ycsu.cc/fire-pump-test-pit/#model | 3D model; default 1,500 GPM study | 1425 × 891 | 89.2 |
| `plumbing-calculation-chart.webp` | https://tools.ycsu.cc/plumbing-chart/ | Initialized CPC 2025 landing interface; no schedule selected | 1440 × 900 | 42.8 |
| `ysu-mind-map.webp` | https://mind.ycsu.cc | Public graph with 137 ideas / 505 relationships; Synthetic data only | 1440 × 900 | 97.4 |
| `adcc.webp` | Authorized local development interface | Real M1 Foundation Galaxy with development mission nodes; no agent dispatch | 1440 × 900 | 17.8 |

The Plumbing URL must retain its trailing slash. Mind Map was verified in the browser, including working search over the public synthetic graph; this verifies reachability, not a new maturity or version. ADCC remains Local Only with a DEVELOPMENT PREVIEW label and no launch link.

**MAIN self-preview release requirement:** the current `ycsu-platform.webp` represents the production page before the new preview-card release. After the new UI is deployed, capture that actual production UI again, replace this one asset, commit, and redeploy the same existing MAIN site. Do not substitute a local QA screenshot for the required post-deploy capture.

These captures do not change Registry metadata. Registry corrections must use `registry-ops`; refresh the bundled snapshot only after the writes succeed. Until then, Not Deployed entries continue to use their designed placeholder even if a preview asset is already present. Fresh captures can be byte-identical to the previous asset when the selected live interface has not changed (Rachel and Tracker in this batch).
