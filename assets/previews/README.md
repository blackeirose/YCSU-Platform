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


## Curated capture batch — 2026-09-11

Captured during an explicit MAIN maintenance task, from the public production pages below. Browser viewport requested: 1440 × 900. Native captures are 1425 × 891 except Rachel (1440 × 900), all approximately 16:10; no upscaling or UI reconstruction. WebP quality: 88, reduced to 82 for the detailed Rachel artwork. All five assets decode successfully.

| Asset | Verified production source | Selected state | Size (KiB) |
| --- | --- | --- | ---: |
| `ycsu-platform.webp` | https://main.ycsu.cc | Current production homepage, before the new preview-card deployment | 64.1 |
| `workflow-hub.webp` | https://hub.ycsu.cc | Public, signed-out landing view; default background and all modules | 102.8 |
| `ycsu-tracker.webp` | https://tracker.ycsu.cc | Public Card/kanban view after cloud sync; sign-in email field cleared | 103.3 |
| `rachels-animal-kingdom.webp` | https://game.ycsu.cc/RaAnimalChess | Current public cover and ENTER THE KINGDOM entry | 230.6 |
| `fire-pump-test-pit-simulator.webp` | https://tools.ycsu.cc/fire-pump-test-pit/ | Deliberately selected `#model` section; default 1,500 GPM study and 3D flow view | 90.5 |

**Plumbing not captured:** the Registry still lists `https://tools.ycsu.cc/plumbingchart/`. Both that route and `https://tools.ycsu.cc/plumbing-chart/` returned HTTP 404 and displayed Netlify's Page not found in the browser. No working replacement route was verified; do not treat the hyphenated candidate as confirmed. Keep the missing-preview fallback until the route is resolved in a separate task. No Registry data was changed.

ADCC remains Local with no verified deployed interface and no image. YSU Mind Map remains Not Deployed and intentionally has no screenshot.

The bundled snapshot was refreshed only through `node scripts/snapshot-registry.mjs` (Registry → file) and validated: 8 products. Before refresh it lacked Fire Pump, Plumbing, and Mind Map; Rachel and Workflow Hub had stale deployment/metadata, and Tracker had an older update date/status note. YCSU Platform and ADCC were unchanged. The snapshot faithfully retains the Registry's currently broken Plumbing URL; it is not a manual correction of production data.

Visual review: desktop 3 columns, tablet 2, mobile 1; light and dark themes; top-aligned crops; image loading and missing-image fallbacks; long names/categories; and three-line Status Notes. Fine text in dense MAIN/Tracker screenshots is small at card scale, while the visual structure remains identifiable. MAIN's image intentionally represents the currently deployed homepage, not the unmerged local redesign. These assets do not establish engineering validation of the simulator or uptime of any product.
