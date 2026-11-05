-- Allow the current expense categories while retaining legacy values on older rows.
alter table public.expenses
  drop constraint if exists expenses_category_check;

alter table public.expenses
  add constraint expenses_category_check
  check (
    category in (
      'Fuel',
      'Stock / Ingredients',
      'Water',
      'Maintenance & Repair',
      'Salary',
      'Viveka Agencies',
      'Others',
      'Water & Utilities',
      'Other'
    )
  );
