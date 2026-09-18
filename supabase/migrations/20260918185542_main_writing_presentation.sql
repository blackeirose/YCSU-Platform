-- Writing is presentation/content, never a Product Registry row.
create table public.main_presentation (
 id smallint primary key default 1 check (id = 1),
 revision integer not null default 0 check (revision >= 0),
 settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
 home_order jsonb not null default '[]'::jsonb check (jsonb_typeof(home_order) = 'array')
);
insert into public.main_presentation(id) values (1);
alter table public.main_presentation enable row level security;
revoke all on public.main_presentation from public, anon, authenticated;
grant select, update on public.main_presentation to service_role;
-- Atomic compare-and-swap; service_role is the only permitted invoker.
create function public.update_main_presentation(expected_revision integer, settings_patch jsonb, next_home_order jsonb)
returns setof public.main_presentation language sql security invoker set search_path = '' as $$
 update public.main_presentation
 set settings = settings || coalesce(settings_patch, '{}'::jsonb),
 home_order = coalesce(next_home_order, home_order), revision = revision + 1
 where id = 1 and revision = expected_revision returning *;
$$;
revoke all on function public.update_main_presentation(integer,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.update_main_presentation(integer,jsonb,jsonb) to service_role;
