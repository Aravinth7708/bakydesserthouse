-- Run this in the Supabase SQL Editor to enable cloud-synced staff attendance.
create table if not exists public.staff_attendance (
  id text primary key,
  staff_id text not null,
  staff_name text not null,
  attendance_date date not null,
  attendance_status text not null default 'Present' check (attendance_status in ('Present', 'Absent', 'Late')),
  check_in time,
  check_out time,
  daily_salary numeric(10, 2) not null default 150,
  created_at timestamptz not null default now(),
  unique (staff_id, attendance_date)
);

-- Upgrade the table safely if the earlier clock-in/clock-out migration was already applied.
alter table public.staff_attendance add column if not exists attendance_status text;
alter table public.staff_attendance alter column check_in drop not null;
update public.staff_attendance
set attendance_status = case
  when (check_in is not null and check_in > time '18:30')
    or (check_out is not null and check_out < time '22:00') then 'Late'
  else 'Present'
end
where attendance_status is null;
alter table public.staff_attendance alter column attendance_status set default 'Present';
alter table public.staff_attendance alter column attendance_status set not null;
alter table public.staff_attendance drop constraint if exists staff_attendance_attendance_status_check;
alter table public.staff_attendance
  add constraint staff_attendance_attendance_status_check
  check (attendance_status in ('Present', 'Absent', 'Late'));

alter table public.staff_attendance enable row level security;

drop policy if exists "Allow all operations on staff_attendance" on public.staff_attendance;
create policy "Allow all operations on staff_attendance"
  on public.staff_attendance for all using (true) with check (true);
