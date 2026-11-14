-- Run in the Supabase SQL Editor to store staff advances and salary settlements.
create table if not exists public.staff_salary_payments (
  id text primary key,
  staff_id text not null,
  staff_name text not null,
  salary_month date not null check (extract(day from salary_month) = 1),
  payment_type text not null check (payment_type in ('Advance', 'Settlement')),
  amount numeric(10, 2) not null check (amount > 0),
  paid_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.staff_salary_payments enable row level security;

drop policy if exists "Allow all operations on staff_salary_payments"
  on public.staff_salary_payments;
create policy "Allow all operations on staff_salary_payments"
  on public.staff_salary_payments for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff_salary_payments'
  ) then
    alter publication supabase_realtime add table public.staff_salary_payments;
  end if;
end $$;
