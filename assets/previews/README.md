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
