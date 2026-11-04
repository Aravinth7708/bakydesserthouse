-- Customer loyalty profiles, online order requests, points ledger, and brownie claims.
create table if not exists public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  points_balance integer not null default 0 check (points_balance >= 0),
  spend_remainder numeric(12,2) not null default 0 check (spend_remainder >= 0 and spend_remainder < 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  fulfillment_type text not null default 'Dine In',
  takeaway_fee numeric(12,2) not null default 0 check (takeaway_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'New' check (status in ('New', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
  points_earned integer not null default 0 check (points_earned >= 0),
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add the order type and fee safely for projects that already ran an earlier version.
alter table public.loyalty_orders
  add column if not exists fulfillment_type text not null default 'Dine In',
  add column if not exists takeaway_fee numeric(12,2) not null default 0,
  add column if not exists shop_order_id text;

alter table public.orders
  add column if not exists order_source text not null default 'Shop',
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists fulfillment_type text,
  add column if not exists takeaway_fee numeric(12,2) not null default 0;

create unique index if not exists loyalty_orders_shop_order_id_unique
  on public.loyalty_orders(shop_order_id)
  where shop_order_id is not null;

create table if not exists public.loyalty_points_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete cascade,
  order_id uuid references public.loyalty_orders(id) on delete set null,
  points_delta integer not null,
  entry_type text not null check (entry_type in ('Earned', 'Redeemed')),
  description text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists loyalty_points_one_award_per_order
  on public.loyalty_points_ledger(order_id)
  where order_id is not null and entry_type = 'Earned';

create table if not exists public.loyalty_reward_claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete cascade,
  reward_name text not null default 'Free Brownie',
  points_spent integer not null default 10 check (points_spent = 10),
  status text not null default 'Pending' check (status in ('Pending', 'Redeemed', 'Cancelled')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by text
);

create index if not exists loyalty_orders_status_created_idx
  on public.loyalty_orders(status, created_at desc);
create index if not exists loyalty_orders_customer_created_idx
  on public.loyalty_orders(customer_id, created_at desc);
create index if not exists loyalty_ledger_customer_created_idx
  on public.loyalty_points_ledger(customer_id, created_at desc);
create index if not exists loyalty_claims_status_created_idx
  on public.loyalty_reward_claims(status, created_at desc);

alter table public.loyalty_customers enable row level security;
alter table public.loyalty_orders enable row level security;
alter table public.loyalty_points_ledger enable row level security;
alter table public.loyalty_reward_claims enable row level security;

drop policy if exists "Loyalty customer app access" on public.loyalty_customers;
drop policy if exists "Loyalty order app access" on public.loyalty_orders;
drop policy if exists "Loyalty ledger app access" on public.loyalty_points_ledger;
drop policy if exists "Loyalty claim app access" on public.loyalty_reward_claims;

create policy "Loyalty customer app access" on public.loyalty_customers
  for all to anon, authenticated using (true) with check (true);
create policy "Loyalty order app access" on public.loyalty_orders
  for all to anon, authenticated using (true) with check (true);
create policy "Loyalty ledger app access" on public.loyalty_points_ledger
  for all to anon, authenticated using (true) with check (true);
create policy "Loyalty claim app access" on public.loyalty_reward_claims
  for all to anon, authenticated using (true) with check (true);

drop function if exists public.place_loyalty_order(text, text, jsonb);

create or replace function public.place_loyalty_order(
  p_name text,
  p_phone text,
  p_items jsonb,
  p_fulfillment_type text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_customer_id uuid;
  v_order_id uuid;
  v_entry jsonb;
  v_item_id text;
  v_item_name text;
  v_price numeric;
  v_qty integer;
  v_variant text;
  v_variants text[];
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_takeaway_fee numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
begin
  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Enter a valid customer name.';
  end if;
  if length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'Enter a valid mobile number.';
  end if;
  if coalesce(p_fulfillment_type, '') not in ('Dine In', 'Takeaway') then
    raise exception 'Choose dine in or takeaway.';
  end if;
  if p_fulfillment_type = 'Takeaway' then
    v_takeaway_fee := 10;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Choose at least one menu item.';
  end if;

  for v_entry in select value from jsonb_array_elements(p_items)
  loop
    v_item_id := v_entry->>'itemId';
    v_qty := coalesce((v_entry->>'qty')::integer, 0);
    v_variant := nullif(btrim(v_entry->>'variant'), '');
    if v_qty < 1 or v_qty > 20 then
      raise exception 'Item quantities must be between 1 and 20.';
    end if;
    select m.id, m.name, m.price, m.variants into v_item_id, v_item_name, v_price, v_variants
      from public.menu_items as m
      where m.id = v_entry->>'itemId' and m.enabled = true;
    if not found then
      raise exception 'A selected item is no longer available.';
    end if;
    if cardinality(coalesce(v_variants, '{}'::text[])) > 0
      and (v_variant is null or not (v_variant = any(v_variants))) then
      raise exception 'Choose a valid variant for %.', v_item_name;
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'itemId', v_item_id,
      'name', v_item_name,
      'price', v_price,
      'qty', v_qty,
      'variant', v_variant
    ));
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;
  v_total := v_subtotal + v_takeaway_fee;

  insert into public.loyalty_customers (name, phone)
    values (v_name, v_phone)
    on conflict (phone) do update set name = excluded.name, updated_at = now()
    returning id into v_customer_id;

  insert into public.loyalty_orders (
    customer_id, customer_name, customer_phone, items, fulfillment_type, takeaway_fee, total
  ) values (
    v_customer_id, v_name, v_phone, v_items, p_fulfillment_type, v_takeaway_fee, v_total
  )
    returning id into v_order_id;
  return v_order_id;
end;
$$;

create or replace function public.complete_loyalty_order(
  p_order_id uuid,
  p_staff_name text
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.loyalty_orders%rowtype;
  v_customer public.loyalty_customers%rowtype;
  v_points integer;
  v_new_remainder numeric(12,2);
begin
  select * into v_order from public.loyalty_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status <> 'Ready' then raise exception 'Mark the order ready before completing it.'; end if;

  select * into v_customer from public.loyalty_customers where id = v_order.customer_id for update;
  v_points := floor((v_customer.spend_remainder + v_order.total - v_order.takeaway_fee) / 100)::integer;
  v_new_remainder := mod(v_customer.spend_remainder + v_order.total - v_order.takeaway_fee, 100);
  update public.loyalty_orders
    set status = 'Completed', points_earned = v_points,
        verified_by = coalesce(nullif(btrim(p_staff_name), ''), verified_by), updated_at = now()
    where id = p_order_id;
  if v_points > 0 then
    insert into public.loyalty_points_ledger (customer_id, order_id, points_delta, entry_type, description)
      values (v_order.customer_id, v_order.id, v_points, 'Earned', 'Points from loyalty order');
    update public.loyalty_customers
      set points_balance = points_balance + v_points,
          spend_remainder = v_new_remainder,
          updated_at = now()
      where id = v_order.customer_id;
  else
    update public.loyalty_customers
      set spend_remainder = v_new_remainder, updated_at = now()
      where id = v_order.customer_id;
  end if;
  return v_points;
end;
$$;

create or replace function public.claim_loyalty_brownie(
  p_phone text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_customer public.loyalty_customers%rowtype;
  v_claim_id uuid;
begin
  select * into v_customer from public.loyalty_customers where phone = v_phone for update;
  if not found then raise exception 'Customer profile not found.'; end if;
  if v_customer.points_balance < 10 then raise exception 'You need 10 points to claim a brownie.'; end if;

  update public.loyalty_customers
    set points_balance = points_balance - 10, updated_at = now()
    where id = v_customer.id;
  insert into public.loyalty_points_ledger (customer_id, points_delta, entry_type, description)
    values (v_customer.id, -10, 'Redeemed', 'Redeemed for one free brownie');
  insert into public.loyalty_reward_claims (customer_id)
    values (v_customer.id) returning id into v_claim_id;
  return v_claim_id;
end;
$$;

grant execute on function public.place_loyalty_order(text, text, jsonb, text) to anon, authenticated;
grant execute on function public.complete_loyalty_order(uuid, text) to anon, authenticated;
grant execute on function public.claim_loyalty_brownie(text) to anon, authenticated;

-- Allocate a single shop order number for both POS orders and confirmed QR orders.
create or replace function public.create_shop_order(
  p_lines jsonb,
  p_total numeric
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next_number bigint;
  v_order_id text;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'An order must contain at least one item.';
  end if;
  if p_total is null or p_total < 0 then
    raise exception 'The order total is invalid.';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.orders.order_number'));
  select coalesce(max(order_number), 0) + 1
    into v_next_number
    from (
      select nullif(regexp_replace(id, '[^0-9]', '', 'g'), '')::bigint as order_number
        from public.orders
      union all
      select nullif(regexp_replace(shop_order_id, '[^0-9]', '', 'g'), '')::bigint
        from public.loyalty_orders
        where shop_order_id is not null
    ) as used_order_numbers;
  v_order_id := '#' || lpad(v_next_number::text, greatest(4, length(v_next_number::text)), '0');

  insert into public.orders (id, lines, total, status, order_source)
    values (v_order_id, p_lines, p_total, 'New', 'Shop');
  return v_order_id;
end;
$$;

create or replace function public.confirm_loyalty_order(
  p_order_id uuid,
  p_staff_name text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.loyalty_orders%rowtype;
  v_next_number bigint;
  v_shop_order_id text;
  v_lines jsonb;
begin
  select * into v_order from public.loyalty_orders where id = p_order_id for update;
  if not found then raise exception 'Loyalty order not found.'; end if;
  if v_order.shop_order_id is not null then return v_order.shop_order_id; end if;
  if v_order.status <> 'New' then raise exception 'This customer order can no longer be confirmed.'; end if;

  perform pg_advisory_xact_lock(hashtext('public.orders.order_number'));
  select coalesce(max(order_number), 0) + 1
    into v_next_number
    from (
      select nullif(regexp_replace(id, '[^0-9]', '', 'g'), '')::bigint as order_number
        from public.orders
      union all
      select nullif(regexp_replace(shop_order_id, '[^0-9]', '', 'g'), '')::bigint
        from public.loyalty_orders
        where shop_order_id is not null
    ) as used_order_numbers;
  v_shop_order_id := '#' || lpad(v_next_number::text, greatest(4, length(v_next_number::text)), '0');

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', item->>'name',
    'price', (item->>'price')::numeric,
    'qty', (item->>'qty')::integer,
    'variant', item->>'variant'
  )), '[]'::jsonb)
    into v_lines
    from jsonb_array_elements(v_order.items) as entries(item);

  insert into public.orders (
    id, lines, total, status, order_source, customer_name, customer_phone,
    fulfillment_type, takeaway_fee
  ) values (
    v_shop_order_id, v_lines, v_order.total, 'Preparing', 'Loyalty',
    v_order.customer_name, v_order.customer_phone,
    v_order.fulfillment_type, v_order.takeaway_fee
  );

  update public.loyalty_orders
    set status = 'Preparing', shop_order_id = v_shop_order_id,
        verified_by = nullif(btrim(p_staff_name), ''), verified_at = now(), updated_at = now()
    where id = p_order_id;
  return v_shop_order_id;
end;
$$;

create or replace function public.sync_loyalty_order_from_shop_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_loyalty_order_id uuid;
  v_loyalty_status text;
begin
  if new.status = 'Served' and old.status is distinct from new.status then
    update public.loyalty_orders
      set status = 'Ready', updated_at = now()
      where shop_order_id = new.id and status = 'Preparing';
  elsif new.status = 'Past Orders' and old.status is distinct from new.status then
    select id, status into v_loyalty_order_id, v_loyalty_status
      from public.loyalty_orders where shop_order_id = new.id for update;
    if found then
      if v_loyalty_status = 'Ready' and coalesce(new.payment_method, '') <> 'Nil' then
        perform public.complete_loyalty_order(v_loyalty_order_id, 'Shop staff');
      else
        update public.loyalty_orders
          set status = 'Completed', points_earned = 0, updated_at = now()
          where id = v_loyalty_order_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_loyalty_order_from_shop_order on public.orders;
create trigger sync_loyalty_order_from_shop_order
  after update of status on public.orders
  for each row execute function public.sync_loyalty_order_from_shop_order();

create or replace function public.cancel_loyalty_order_when_shop_order_deleted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.loyalty_orders
    set status = 'Cancelled', updated_at = now()
    where shop_order_id = old.id and status in ('Preparing', 'Ready');
  return old;
end;
$$;

drop trigger if exists cancel_loyalty_order_on_shop_order_delete on public.orders;
create trigger cancel_loyalty_order_on_shop_order_delete
  before delete on public.orders
  for each row execute function public.cancel_loyalty_order_when_shop_order_deleted();

grant execute on function public.create_shop_order(jsonb, numeric) to anon, authenticated;
grant execute on function public.confirm_loyalty_order(uuid, text) to anon, authenticated;
