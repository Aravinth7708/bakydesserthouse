-- Enable Supabase Realtime events used by admin mobile activity notifications.
do $$
declare
  v_table text;
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    raise notice 'supabase_realtime publication is not available; enable Realtime in Supabase first.';
    return;
  end if;

  foreach v_table in array array[
    'loyalty_orders',
    'loyalty_reward_claims',
    'staff_attendance'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;
