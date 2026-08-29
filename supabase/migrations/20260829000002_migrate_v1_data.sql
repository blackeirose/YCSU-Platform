-- Migrate the verified v1.0.0 registry.json entries into product_registry.
-- Values copied exactly as verified in the v1.0.0 release — no re-guessing.

insert into public.product_registry
  (slug, name, short_name, description, category, platform_layer, maturity, deployment,
   visibility, operational_status, version, version_source, main_url, planned_url,
   github_url, tracker_url, docs_url, roadmap_url, featured, archived, certification,
   last_updated, status_note)
values
  ('ycsu-platform', 'YCSU Platform', 'Platform',
   'Central registry and entry point for the YCSU product ecosystem.',
   'Platform Infrastructure', 'Platform', 'Production', 'Public', 'Public', 'Live',
   'v1.0.0', 'github-release', 'https://main.ycsu.cc', null,
   'https://github.com/blackeirose/YCSU-Platform', null,
   'https://github.com/blackeirose/YCSU-Platform/blob/main/PROJECT_CONTEXT.md', null,
   true, false, 'YCSU Certified', current_date, null),

  ('ycsu-tracker', 'YCSU Tracker', 'Tracker',
   'Tool development tracker — table and kanban views over YSU''s tool ideas, priorities, and progress.',
   'Development Tracking', 'Product', 'Beta', 'Public', 'Public', 'Live',
   null, 'none', 'https://tracker.ycsu.cc', null,
   'https://github.com/blackeirose/YSU-Tool-Development-Tracker', null,
   'https://github.com/blackeirose/YSU-Tool-Development-Tracker/blob/main/PROJECT_CONTEXT.md', null,
   false, false, 'Not Certified', current_date,
   'Supabase cloud-sync migration in progress; no canonical version tagged yet.'),

  ('workflow-hub', 'Workflow Hub', 'Hub',
   'Single-entry architecture workflow/tool library for discovering and launching workflows.',
   'Workflow / Tool Discovery', 'Product', 'Prototype', 'Not Deployed', 'Private', 'Unknown',
   null, 'none', null, 'https://hub.ycsu.cc',
   'https://github.com/blackeirose/YSU-Architecture-Workflow-Hub', null,
   'https://github.com/blackeirose/YSU-Architecture-Workflow-Hub/blob/main/PROJECT_CONTEXT.md', null,
   false, false, 'Not Certified', current_date,
   'Moving from research/prototype toward a Minimum Production Hub v1; hub.ycsu.cc does not resolve yet.'),

  ('adcc', 'AI Development Control Center', 'ADCC',
   'Spatial AI development orchestration control center for managing AI-assisted development missions and agents.',
   'AI Development Orchestration', 'Product', 'Prototype', 'Local', 'Private', 'Unknown',
   '0.1.0', 'package', null, 'https://adcc.ycsu.cc',
   'https://github.com/blackeirose/AI-Development-Control-Center', null,
   'https://github.com/blackeirose/AI-Development-Control-Center/blob/main/PROJECT_CONTEXT.md', null,
   false, false, 'Not Certified', current_date,
   'M1 Foundation complete locally (functional prototype); runs local-only, not yet deployed. adcc.ycsu.cc does not resolve.'),

  ('rachels-animal-kingdom', 'Rachel''s Animal Kingdom', 'RaChess',
   'Animal Chess (RaChess) — referenced as part of the YCSU ecosystem.',
   'Game / Entertainment', 'Product', 'Idea', 'Not Deployed', 'Private', 'Unknown',
   null, 'none', null, 'https://game.ycsu.cc/RaChess',
   null, null, null, null,
   false, false, 'Not Certified', current_date,
   'No GitHub repository or deployment found yet. Listed for ecosystem completeness only; not yet a registered Product per docs/PLATFORM_MODEL.md''s Product vs Utility rule.')
on conflict (slug) do nothing;
