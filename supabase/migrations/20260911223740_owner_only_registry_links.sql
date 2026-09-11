-- All browser reads use the existing Edge Function boundary.
begin;
revoke all privileges on table public.product_registry from public, anon, authenticated;
do $$
declare col text;
begin
 for col in select column_name from information_schema.columns where table_schema='public' and table_name='product_registry' loop
  execute format('revoke select (%I), insert (%I), update (%I), references (%I) on public.product_registry from public, anon, authenticated',col,col,col,col);
 end loop;
end $$;
drop policy if exists product_registry_public_read on public.product_registry;
alter table public.product_registry enable row level security;
comment on table public.product_registry is 'Canonical Registry. Client access passes through registry-ops. Public reads are allowlisted and URL-redacted; full reads require the verified owner or management key.';
commit;
