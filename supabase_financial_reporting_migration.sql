-- Financial reporting migration for Baky Dessert House.
-- Paste into Supabase SQL Editor and run. Safe to run more than once.
--
-- Existing orders store item lines in `lines`, the order date in `created_at`,
-- and a text payment method/details. Old paid timestamps can only be estimated
-- from `created_at`; historical GST was not stored and is intentionally not guessed.

begin;

alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists subtotal numeric(12, 2),
  add column if not exists cash_amount numeric(12, 2),
  add column if not exists gpay_amount numeric(12, 2),
  add column if not exists online_amount numeric(12, 2),
  add column if not exists cgst_rate numeric(5, 2),
  add column if not exists cgst_amount numeric(12, 2),
  add column if not exists sgst_rate numeric(5, 2),
  add column if not exists sgst_amount numeric(12, 2),
  add column if not exists igst_rate numeric(5, 2),
  add column if not exists igst_amount numeric(12, 2);

-- The current application stores item subtotal in `total` and does not save GST.
update public.orders
set subtotal = coalesce(total, 0)
where subtotal is null;

-- Preserve recorded payment amounts; fill legacy rows from payment_method/details.
update public.orders
set cash_amount = case
  when payment_method = 'Cash' then coalesce(total, 0)
  when payment_method = 'Split Payment' then
    coalesce(regexp_replace(coalesce(substring(payment_details from 'Cash:[[:space:]]*₹?([0-9,.]+)'), '0'), ',', '', 'g')::numeric, 0)
  else 0
end
where cash_amount is null;

update public.orders
set gpay_amount = case
  when payment_method = 'GPay' then coalesce(total, 0)
  when payment_method = 'Split Payment' then
    coalesce(regexp_replace(coalesce(substring(payment_details from 'GPay:[[:space:]]*₹?([0-9,.]+)'), '0'), ',', '', 'g')::numeric, 0)
  else 0
end
where gpay_amount is null;

update public.orders
set online_amount = case
  when payment_method = 'Online Orders' then coalesce(total, 0)
  else 0
end
where online_amount is null;

-- Approximate historical paid date with order creation time.
-- Future app writes should set paid_at to the actual payment/close time.
update public.orders
set paid_at = created_at
where paid_at is null
  and status = 'Past Orders'
  and coalesce(payment_method, '') not in ('', 'Nil');

-- No GST values are backfilled because they were not recorded on historical orders.
update public.orders set cgst_rate = 0 where cgst_rate is null;
update public.orders set cgst_amount = 0 where cgst_amount is null;
update public.orders set sgst_rate = 0 where sgst_rate is null;
update public.orders set sgst_amount = 0 where sgst_amount is null;
update public.orders set igst_rate = 0 where igst_rate is null;
update public.orders set igst_amount = 0 where igst_amount is null;

alter table public.orders
  alter column subtotal set default 0,
  alter column subtotal set not null,
  alter column cash_amount set default 0,
  alter column cash_amount set not null,
  alter column gpay_amount set default 0,
  alter column gpay_amount set not null,
  alter column online_amount set default 0,
  alter column online_amount set not null,
  alter column cgst_rate set default 0,
  alter column cgst_rate set not null,
  alter column cgst_amount set default 0,
  alter column cgst_amount set not null,
  alter column sgst_rate set default 0,
  alter column sgst_rate set not null,
  alter column sgst_amount set default 0,
  alter column sgst_amount set not null,
  alter column igst_rate set default 0,
  alter column igst_rate set not null,
  alter column igst_amount set default 0,
  alter column igst_amount set not null;

create index if not exists orders_paid_at_idx on public.orders (paid_at);
create index if not exists orders_created_at_idx on public.orders (created_at);

commit;
