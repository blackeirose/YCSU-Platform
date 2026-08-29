-- YCSU Platform v1.1 — Product Registry table
-- Project: ysu-tool-tracker (fzydsnxxcdllkjxwdiwn), separate table from tracker_items.

create table if not exists public.product_registry (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  description text not null,
  category text,

  platform_layer text not null default 'Product'
    check (platform_layer in ('Platform', 'Management', 'Product')),
  maturity text not null
    check (maturity in ('Idea', 'Planning', 'Prototype', 'Internal Alpha', 'Beta', 'Production')),
  deployment text not null
    check (deployment in ('Not Deployed', 'Local', 'Internal', 'Public', 'Archived')),
  visibility text not null default 'Private'
    check (visibility in ('Private', 'Internal', 'Public')),
  operational_status text not null default 'Unknown'
    check (operational_status in ('Live', 'Pending', 'Offline', 'Unknown')),

  version text,
  version_source text not null default 'none'
    check (version_source in ('github-release', 'git-tag', 'package', 'manual', 'none')),

  main_url text,
  planned_url text,
  github_url text,
  tracker_url text,
  docs_url text,
  roadmap_url text,

  featured boolean not null default false,
  archived boolean not null default false,

  certification text not null default 'Not Certified'
    check (certification in ('Not Certified', 'YCSU Certified')),
  last_updated date not null default current_date,
  status_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- version / versionSource must agree: "none" iff version is null
  constraint version_source_consistency check (
    (version_source = 'none' and version is null) or
    (version_source <> 'none' and version is not null)
  ),

  -- Registry represents verified reality only: a product is either live
  -- (mainUrl) or planned (plannedUrl), never both at once.
  constraint main_or_planned_not_both check (
    main_url is null or planned_url is null
  ),

  -- mainUrl implies the product is actually deployed somewhere.
  constraint main_url_requires_deployment check (
    main_url is null or deployment <> 'Not Deployed'
  ),

  -- mechanical part of the "YCSU Certified" checklist (docs/PLATFORM_MODEL.md §6):
  -- certification alone is still a human/agent judgment call for the rest of the checklist.
  constraint certified_requires_minimum_facts check (
    certification <> 'YCSU Certified' or
    (main_url is not null and github_url is not null and version_source <> 'none')
  )
);

comment on table public.product_registry is
  'YCSU Platform v1.1 Product Registry — single source of truth for main.ycsu.cc. Writes go only through the registry-ops Edge Function; no direct anon/authenticated write policies exist on this table by design.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_registry_set_updated_at on public.product_registry;
create trigger product_registry_set_updated_at
  before update on public.product_registry
  for each row
  execute function public.set_updated_at();

alter table public.product_registry enable row level security;

-- Public read: this is public product-directory data, same as tracker_items'
-- existing public-read pattern. Includes archived rows so the read API stays
-- generic; the frontend itself filters archived=false for the default view.
drop policy if exists product_registry_public_read on public.product_registry;
create policy product_registry_public_read
  on public.product_registry
  for select
  to anon, authenticated
  using (true);

-- Deliberately NO insert/update/delete policy for anon or authenticated.
-- RLS default-denies all writes. The only write path is the registry-ops
-- Edge Function, which authenticates callers via a custom secret (not a
-- Supabase Auth session) and writes using the service_role key server-side,
-- bypassing RLS as the trusted gatekeeper. See docs/DATA_LAYER.md.
