-- Stores receipt files in Supabase Storage and links them to expense records.
alter table public.expenses
  add column if not exists receipt_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-receipts',
  'expense-receipts',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow receipt image reads" on storage.objects;
drop policy if exists "Allow receipt image uploads" on storage.objects;
drop policy if exists "Allow receipt image updates" on storage.objects;
drop policy if exists "Allow receipt image deletes" on storage.objects;

create policy "Allow receipt image reads"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'expense-receipts');

create policy "Allow receipt image uploads"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'expense-receipts');

create policy "Allow receipt image updates"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'expense-receipts')
  with check (bucket_id = 'expense-receipts');

create policy "Allow receipt image deletes"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'expense-receipts');
