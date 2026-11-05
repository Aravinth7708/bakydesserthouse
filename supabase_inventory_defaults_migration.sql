-- Remove only the three demo inventory rows seeded by the original project setup.
delete from public.inventory
where id in ('n1', 'n2', 'n3')
   or lower(btrim(name)) in (
     'waffle flour (kg)',
     'brownie plates (pack)',
     'dark compound (pack)'
   );
