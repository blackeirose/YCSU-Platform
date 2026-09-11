-- Additive migration: preserves all product metadata and the existing read-only RLS.
begin;
alter table public.product_registry add column sort_order integer;
comment on column public.product_registry.sort_order is
  'Manual MAIN display order, ascending, nulls last. Changed only through registry-ops.';

-- Start with the verified existing visual order. Leave archived products untouched.
with ordered as (
  select id, (row_number() over (order by featured desc, name asc, id asc) * 10)::integer as position
  from public.product_registry where not archived
)
update public.product_registry p set sort_order = o.position
from ordered o where p.id = o.id;

-- One transaction, serialized against concurrent writes. Only service_role may call it.
-- An expected order snapshot prevents one browser overwriting another owner's changes.
create function public.reorder_product_registry(expected jsonb, ordered_ids uuid[])
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  active_count integer;
  changed_count integer;
  current_state jsonb;
  result jsonb;
begin
  lock table public.product_registry in share row exclusive mode;
  select count(*) into active_count from public.product_registry where not archived;
  if expected is null or jsonb_typeof(expected) <> 'array' or ordered_ids is null then
    raise exception 'Invalid reorder payload' using errcode = '22023';
  end if;
  if cardinality(ordered_ids) <> active_count or jsonb_array_length(expected) <> active_count
     or (select count(distinct id) from unnest(ordered_ids) as t(id)) <> active_count
     or exists (select 1 from unnest(ordered_ids) as t(id)
                where id is null or not exists (select 1 from public.product_registry p where p.id=t.id and not p.archived)) then
    raise exception 'Active product set changed; reload before reordering' using errcode = '40001';
  end if;
  select jsonb_agg(jsonb_build_object('id',id,'sortOrder',sort_order) order by id)
    into current_state from public.product_registry where not archived;
  if current_state is distinct from (
    select jsonb_agg(jsonb_build_object('id',x.id,'sortOrder',x."sortOrder") order by x.id)
    from jsonb_to_recordset(expected) as x(id uuid,"sortOrder" integer)
  ) then
    raise exception 'Order changed; reload before reordering' using errcode = '40001';
  end if;
  -- Eight current products: deterministic spacing is simpler than fractional ranks.
  -- UPDATE only records whose actual rank changes; never touch last_updated.
  with desired as (
    select id, (position * 10)::integer as rank from unnest(ordered_ids) with ordinality as t(id,position)
  )
  update public.product_registry p set sort_order=d.rank
    from desired d where p.id=d.id and p.sort_order is distinct from d.rank;
  get diagnostics changed_count = row_count;
  select jsonb_agg(jsonb_build_object('id',id,'sortOrder',sort_order) order by sort_order,id)
    into result from public.product_registry where not archived;
  return jsonb_build_object('order',coalesce(result,'[]'::jsonb),'changed',changed_count);
end;
$$;
revoke all on function public.reorder_product_registry(jsonb,uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_product_registry(jsonb,uuid[]) to service_role;
commit;
