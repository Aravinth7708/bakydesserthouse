-- ==============================================================================
-- Baky Dessert House — Supabase Database Schema
-- Run this script in your Supabase project's SQL Editor (SQL Editor -> New query)
-- Safely re-runnable at any time without errors.
-- ==============================================================================

-- 1. Categories Table
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Menu Items Table
create table if not exists public.menu_items (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric not null default 0,
  category_id text references public.categories(id) on delete cascade,
  variants text[] not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Inventory Table
create table if not exists public.inventory (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  current integer not null default 0,
  max integer not null default 10,
  created_at timestamptz not null default now()
);

-- 4. Orders Table
create table if not exists public.orders (
  id text primary key,
  lines jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  status text not null default 'New' check (status in ('New', 'Preparing', 'Served', 'Past Orders')),
  payment_method text,
  payment_details text,
  created_at timestamptz not null default now()
);

-- Ensure existing orders table has columns & constraint updated if pre-existing
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_details text;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('New', 'Preparing', 'Served', 'Past Orders'));

-- 5. Staff Table
create table if not exists public.staff (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  phone text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

-- 6. Expenses Table
create table if not exists public.expenses (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null check (category in ('Fuel', 'Stock / Ingredients', 'Water & Utilities', 'Maintenance & Repair', 'Salary', 'Other')),
  amount numeric not null default 0,
  payment_method text default 'Cash',
  notes text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.staff enable row level security;
alter table public.expenses enable row level security;

-- Drop existing policies if they exist before recreating (prevents 42710 error)
drop policy if exists "Allow all operations on categories" on public.categories;
drop policy if exists "Allow all operations on menu_items" on public.menu_items;
drop policy if exists "Allow all operations on inventory" on public.inventory;
drop policy if exists "Allow all operations on orders" on public.orders;
drop policy if exists "Allow all operations on staff" on public.staff;
drop policy if exists "Allow all operations on expenses" on public.expenses;

-- Create Open Access Policies for Baky Internal Management
create policy "Allow all operations on categories" on public.categories for all using (true) with check (true);
create policy "Allow all operations on menu_items" on public.menu_items for all using (true) with check (true);
create policy "Allow all operations on inventory" on public.inventory for all using (true) with check (true);
create policy "Allow all operations on orders" on public.orders for all using (true) with check (true);
create policy "Allow all operations on staff" on public.staff for all using (true) with check (true);
create policy "Allow all operations on expenses" on public.expenses for all using (true) with check (true);

-- Safely add tables to Supabase Realtime publication if not already added
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items') then
    alter publication supabase_realtime add table public.menu_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory') then
    alter publication supabase_realtime add table public.inventory;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff') then
    alter publication supabase_realtime add table public.staff;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
end $$;

-- Seed initial data if tables are empty
insert into public.categories (id, name, enabled)
values
  ('c1', 'Waffle', true),
  ('c2', 'Shakes', true),
  ('c3', 'Signature', true),
  ('c4', 'Brownie', true)
on conflict (id) do nothing;

insert into public.menu_items (id, name, price, category_id, variants, enabled)
values
  ('i1', 'Hazelnut Waffle', 100, 'c1', array['Belgian', 'Brownie', 'Redvelvet'], true),
  ('i2', 'Classic Waffle', 100, 'c1', array['Belgian', 'Brownie', 'Redvelvet'], true),
  ('i4', 'Black Currant', 80, 'c2', array[]::text[], true),
  ('i5', 'Blue Berry', 80, 'c2', array[]::text[], true),
  ('i6', 'Chocolate', 80, 'c2', array[]::text[], true),
  ('i3', 'Choco Shake', 120, 'c2', array[]::text[], true)
on conflict (id) do nothing;

insert into public.inventory (id, name, current, max)
values
  ('n1', 'Waffle Flour (kg)', 2, 10),
  ('n2', 'Brownie Plates (Pack)', 7, 10),
  ('n3', 'Dark Compound (Pack)', 1, 10)
on conflict (id) do nothing;

insert into public.staff (id, name, phone, password)
values
  ('s1', 'Staff 1', '9876543210', '1234')
on conflict (id) do nothing;
