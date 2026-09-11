# Product Preview Images

Preview screenshots are intentionally manual. Update them together with meaningful MAIN product-status updates; Supabase `product_registry` remains the only source of product metadata.

## File convention

Store each image at `/assets/previews/{slug}.webp`. The filename must match the Registry slug exactly, including lowercase and hyphens (for example `workflow-hub.webp`). The renderer derives the path; do not add image URLs or paths to Supabase, manifests, or the snapshot.

## Manual maintenance

1. After a meaningful product change, manually capture/select the best current homepage or interface state.
2. Recommend a **1440 × 900** source viewport and approximately **16:10** aspect ratio. The card crops consistently with `object-fit: cover` and favors the top of the image. Keep the important content near the top; do not upscale a low-resolution screenshot.
3. Export as **WebP**, with readable interface text and a modest file size (aim for 100–250 KB when practical). Review for private information before publishing: all files here are public, including previews of local/internal products.
4. Replace `{slug}.webp`, review the card at desktop/tablet/mobile sizes and in light/dark mode, then commit and publish through the existing frontend deployment workflow. Unlike Registry metadata, an image file change needs a frontend deployment. If an old image persists, reload without cache and verify the deployed asset.
5. Update Registry metadata separately through the existing authorized Registry operations when needed. Do not change metadata merely to match or test an image.

## Display rules

- **Public + Live:** load the static image and link the preview to a valid `mainUrl`; a missing or undecodable image shows “Preview unavailable,” never a broken-image icon.
- **Local / Internal:** load an optional manual image with a DEVELOPMENT PREVIEW label; otherwise show a neutral development placeholder. Keep LOCAL ONLY / INTERNAL visible. Development previews are not launch links.
- **Not Deployed:** always show IN PROGRESS, product name, and any planned domain as text. Never request an image or make the planned domain clickable.
- **Other operational states:** show “Preview unavailable” without requesting a screenshot. Public Pending/Offline/Unknown entries retain their actual status, not a Live label.

Do not implement automatic page capture, Playwright screenshot jobs, scheduled screenshots, remote screenshot services, iframe previews, or synthetic application screenshots. New Registry products use the same renderer automatically; the image is the only optional manual visual asset. No initial product images are bundled until owner-selected screenshots are supplied.
