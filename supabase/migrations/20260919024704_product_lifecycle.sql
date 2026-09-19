begin;
-- Explicit state; archived remains a constrained compatibility projection for old readers.
alter table public.product_registry
 add column lifecycle_state text not null default 'visible',
 add column restore_state text,
 add column deleted_at timestamptz,
 add column lifecycle_revision integer not null default 0;
update public.product_registry set lifecycle_state='archived',restore_state='visible' where archived;
alter table public.product_registry add constraint product_lifecycle_consistency check (
 lifecycle_state in ('visible','hidden','archived','deleted') and lifecycle_revision >= 0
 and archived = (lifecycle_state in ('archived','deleted'))
 and ((lifecycle_state in ('visible','hidden') and restore_state is null)
   or (lifecycle_state in ('archived','deleted') and restore_state in ('visible','hidden') and restore_state is not null))
 and ((lifecycle_state='deleted') = (deleted_at is not null))
);
-- Fill canonical mixed slots once, including inactive rows, without changing existing positions.
update public.main_presentation m set home_order=(
 select coalesce(jsonb_agg(id order by pos),'[]'::jsonb) from (
  select id,min(pos) pos from (
   select value id,ordinality pos from jsonb_array_elements_text(m.home_order) with ordinality
   union all select 'writing',10000
   union all select id::text,10000+row_number() over(order by sort_order nulls last,name,id) from public.product_registry
  ) slots group by id
 ) unique_slots
), revision=revision+1 where id=1;

create function public.change_product_lifecycle(product_id uuid, expected_revision integer, action text)
returns setof public.product_registry language plpgsql security invoker set search_path='' as $$
declare p public.product_registry; next_state text; previous_active text;
begin
 -- Same lock order as mixed ordering: product set first, presentation second.
 lock table public.product_registry in share row exclusive mode;
 select * into p from public.product_registry where id=product_id;
 if not found then raise exception 'Product missing' using errcode='P0002'; end if;
 if expected_revision is null or p.lifecycle_revision <> expected_revision then
  raise exception 'Product changed; reload' using errcode='40001'; end if;
 next_state := case
  when action='hide' and p.lifecycle_state='visible' then 'hidden'
  when action='show' and p.lifecycle_state='hidden' then 'visible'
  when action='archive' and p.lifecycle_state in ('visible','hidden') then 'archived'
  when action='delete' and p.lifecycle_state in ('visible','hidden','archived') then 'deleted'
  when action='restore' and p.lifecycle_state in ('archived','deleted') then p.restore_state
  else null end;
 if next_state is null then raise exception 'Invalid lifecycle transition' using errcode='22023'; end if;
 previous_active := case when p.lifecycle_state in ('visible','hidden') then p.lifecycle_state else p.restore_state end;
 update public.product_registry set lifecycle_state=next_state,
  archived=next_state in ('archived','deleted'),
  restore_state=case when next_state in ('archived','deleted') then previous_active else null end,
  deleted_at=case when next_state='deleted' then now() else null end,
  lifecycle_revision=lifecycle_revision+1 where id=product_id;
 -- Invalidates stale Arrange saves; slots and article settings remain unchanged.
 update public.main_presentation set revision=revision+1 where id=1;
 return query select * from public.product_registry where id=product_id;
end;
$$;
revoke all on function public.change_product_lifecycle(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.change_product_lifecycle(uuid,integer,text) to service_role;

-- Swap only active IDs through their canonical slots. Inactive slots never disappear.
create or replace function public.update_main_presentation(expected_revision integer, settings_patch jsonb, next_home_order jsonb)
returns setof public.main_presentation language plpgsql security invoker set search_path='' as $$
declare current_row public.main_presentation; full_order jsonb; active_ids text[]; supplied_ids text[]; value text; result jsonb='[]'::jsonb; n integer=1;
begin
 lock table public.product_registry in share row exclusive mode;
 select * into current_row from public.main_presentation where id=1 for update;
 if current_row.revision <> expected_revision then return; end if;
 full_order=current_row.home_order;
 if next_home_order is not null then
  if jsonb_typeof(next_home_order) <> 'array' then raise exception 'Invalid home order' using errcode='22023'; end if;
  select array_agg(id order by id) into active_ids from (select id::text from public.product_registry where not archived union all select 'writing') a;
  select array_agg(v order by v) into supplied_ids from jsonb_array_elements_text(next_home_order) t(v);
  if active_ids is distinct from supplied_ids then raise exception 'Active product set changed; reload' using errcode='40001'; end if;
  -- Include newly registered products without discarding existing/inactive order slots.
  for value in select id::text from public.product_registry order by sort_order nulls last,name,id loop
   if not full_order ? value then full_order=full_order||jsonb_build_array(value); end if;
  end loop;
  if not full_order ? 'writing' then full_order=full_order||'"writing"'::jsonb; end if;
  for value in select jsonb_array_elements_text(full_order) loop
   if value=any(active_ids) then result=result||jsonb_build_array(next_home_order->>(n-1)); n=n+1;
   else result=result||jsonb_build_array(value); end if;
  end loop;
  full_order=result;
 end if;
 return query update public.main_presentation set settings=settings||coalesce(settings_patch,'{}'::jsonb),home_order=full_order,revision=revision+1 where id=1 returning *;
end;
$$;
revoke all on function public.update_main_presentation(integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.update_main_presentation(integer,jsonb,jsonb) to service_role;
drop function public.reorder_product_registry(jsonb,uuid[]);
create function public.reorder_product_registry(expected jsonb, ordered_ids uuid[], expected_presentation_revision integer)
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
  home jsonb; merged jsonb='[]'::jsonb; slot text; n integer=1;
begin
  lock table public.product_registry in share row exclusive mode;
  if expected_presentation_revision is null or not exists (select 1 from public.main_presentation where id=1 and revision=expected_presentation_revision) then
    raise exception 'Mixed order changed; reload before reordering' using errcode='40001';
  end if;
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
  with slots as (
    select id,archived,row_number() over(order by sort_order nulls last,name,id) pos,
      sum(case when not archived then 1 else 0 end) over(order by sort_order nulls last,name,id) active_pos
    from public.product_registry
  ), desired as (
    select case when archived then id else ordered_ids[active_pos::integer] end id,(pos*10)::integer rank from slots
  )
  update public.product_registry p set sort_order=d.rank from desired d where p.id=d.id and p.sort_order is distinct from d.rank;
  get diagnostics changed_count = row_count;
  select jsonb_agg(jsonb_build_object('id',id,'sortOrder',sort_order) order by sort_order,id)
    into result from public.product_registry where not archived;
  select home_order into home from public.main_presentation where id=1 for update;
  for slot in select id::text from public.product_registry order by sort_order nulls last,name,id loop
    if not home ? slot then home=home||jsonb_build_array(slot); end if;
  end loop;
  for slot in select jsonb_array_elements_text(home) loop
    if slot=any(ordered_ids::text[]) then merged=merged||jsonb_build_array(ordered_ids[n]::text); n=n+1;
    else merged=merged||jsonb_build_array(slot); end if;
  end loop;
  update public.main_presentation set home_order=merged,revision=revision+1 where id=1;
  return jsonb_build_object('order',coalesce(result,'[]'::jsonb),'changed',changed_count);
end;
$$;
revoke all on function public.reorder_product_registry(jsonb,uuid[],integer) from public, anon, authenticated;
grant execute on function public.reorder_product_registry(jsonb,uuid[],integer) to service_role;

commit;
