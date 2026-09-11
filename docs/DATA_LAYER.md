# Registry data layer — v1.3

## Architecture and scope

The canonical table remains public.product_registry in the existing ysu-tool-tracker Supabase project, fzydsnxxcdllkjxwdiwn. It is structurally isolated from tracker_items. MAIN reuses that project's existing owner Auth identity; Tracker login, Auth providers, Site URL and other apps are unchanged. DEC-018 is the current read-security decision.

Guest → registry-ops read-public → fixed public projection → generic cards.
Owner → existing Supabase session → server getUser + exact UUID → read-owner → same cards with links and reorder.
Management clients → existing REGISTRY_API_KEY → existing CRUD and reorder.

## Database boundary

RLS is enabled. PUBLIC, anon and authenticated have no table or column privileges on product_registry and no SELECT policy. Direct PostgREST queries for either safe or protected columns fail. The only existing table-related RPC is reorder_product_registry: SECURITY INVOKER, empty search_path, executable only by service_role. No public view or security-definer read bypass exists. The Edge Function's service_role key stays in Supabase secrets.

The exact owner UUID is 38531f7e-e05e-473a-a587-500b1d3aebe5. It is an identifier, not a credential. registry-ops validates the token using getUser, checks this UUID, and rejects unconfirmed/anonymous identities. Email strings, user_metadata and client flags never authorize access. Every non-owner authenticated identity is denied read-owner and reorder. No unsafe test user is required to validate this: database role tests and handler identity tests cover it.

## Public contract

The response has ok, schemaVersion, updated and products. Public products contain exactly: id, slug, name, shortName, description, category, platformLayer, maturity, deployment, visibility, operationalStatus, version, versionSource, featured, archived, certification, lastUpdated, statusNote, sortOrder.

mainUrl, plannedUrl, githubUrl, trackerUrl, docsUrl and roadmapUrl are absent, including null placeholders. The same six snake_case source columns are protected. New columns are denied by default because the response is an allowlist. All public string values undergo server-side URL redaction, including bare domains and known protected paths embedded in status notes. Original stored metadata is not modified.

## Frontend, sessions and fallback

A public-safe read is always available without Auth. The existing Supabase SDK restores its standard session; server-authorized owner reads replace public records in memory. The frontend keeps only a safe public fallback cache. Owner records are not written to localStorage, sessionStorage, static files or service-worker caches. Auth session persistence remains the standard SDK behavior.

All Registry responses and browser requests use no-store. Logout synchronously clears owner records/links and drag controls before waiting for the Auth SDK. Abort + revision guards reject delayed owner responses. Cross-tab SIGNED_OUT uses the same path. A failed owner read leaves public cards available without links. Existing reorder still uses the original expected-state transaction and restores prior visual order on failure.

The only bundled runtime fallback is data/registry.public.snapshot.json. scripts/snapshot-registry.mjs reads read-public with the publishable key and validates the public contract before writing it. It never creates a full export. scripts/build-site.mjs publishes only index.html, approved runtime assets and this public snapshot to dist. Docs, migrations, manifests, tests and previous full snapshots are not deployed.

## Limits and recovery

This protects MAIN's current Registry API, DOM and static runtime files. It does not make downstream tools private, revoke URLs already learned by an authorized owner, or erase intentionally public architectural documentation, historical Git commits, old deployment URLs or third-party caches. The public MAIN preview is manually refreshed during this explicit task to remove old link-bearing card content.

Keep base-table denial and public-safe artifacts during recovery; a public-only UI is the safe fallback. Do not roll back by restoring the old open SELECT or full static snapshot.

The Supabase security advisor previously reported only project-wide leaked-password protection disabled. This task does not change passwords or Tracker Auth settings. Run the advisor again after deployment and record its current result in DEPLOYMENT.md.
