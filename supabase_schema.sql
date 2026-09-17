-- ==============================================================================
-- Baky Dessert House — Supabase Database Schema
-- Run this script in your Supabase project's SQL Editor (SQL Editor -> New query)
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
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;

-- Create Open Access Policies for Baky Internal Management
create policy "Allow all operations on categories" on public.categories for all using (true) with check (true);
create policy "Allow all operations on menu_items" on public.menu_items for all using (true) with check (true);
create policy "Allow all operations on inventory" on public.inventory for all using (true) with check (true);
create policy "Allow all operations on orders" on public.orders for all using (true) with check (true);

-- Optional: Enable Realtime for live order and inventory updates
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.orders;

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
  ('i3', 'Choco Shake', 120, 'c2', array[]::text[], true)
on conflict (id) do nothing;

insert into public.inventory (id, name, current, max)
values
  ('n1', 'Waffle Flour (kg)', 2, 10),
  ('n2', 'Brownie Plates (Pack)', 7, 10),
  ('n3', 'Dark Compound (Pack)', 1, 10)
on conflict (id) do nothing;
