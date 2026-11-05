-- Merge loyalty profiles that differ only by India's +91 / 0091 prefix.
-- Existing orders, points history, claims, points, and spend remainder are retained.
do $$
declare
  v_group record;
  v_keeper uuid;
  v_duplicates uuid[];
  v_points integer;
  v_remainder numeric(12,2);
begin
  for v_group in
    select phone_key
    from (
      select case
        when length(phone) = 12 and left(phone, 2) = '91' then right(phone, 10)
        when length(phone) = 14 and left(phone, 4) = '0091' then right(phone, 10)
        else phone
      end as phone_key
      from public.loyalty_customers
    ) normalized
    group by phone_key
    having count(*) > 1
  loop
    select id into v_keeper
    from public.loyalty_customers
    where case
      when length(phone) = 12 and left(phone, 2) = '91' then right(phone, 10)
      when length(phone) = 14 and left(phone, 4) = '0091' then right(phone, 10)
      else phone
    end = v_group.phone_key
    order by (phone = v_group.phone_key) desc, created_at, id
    limit 1;

    select array_agg(id) filter (where id <> v_keeper),
           coalesce(sum(points_balance), 0),
           coalesce(sum(spend_remainder), 0)
      into v_duplicates, v_points, v_remainder
    from public.loyalty_customers
    where case
      when length(phone) = 12 and left(phone, 2) = '91' then right(phone, 10)
      when length(phone) = 14 and left(phone, 4) = '0091' then right(phone, 10)
      else phone
    end = v_group.phone_key;

    update public.loyalty_orders
      set customer_id = v_keeper, customer_phone = v_group.phone_key
      where customer_id = any(v_duplicates);
    update public.loyalty_points_ledger
      set customer_id = v_keeper
      where customer_id = any(v_duplicates);
    update public.loyalty_reward_claims
      set customer_id = v_keeper
      where customer_id = any(v_duplicates);
    update public.loyalty_orders
      set customer_phone = v_group.phone_key
      where customer_id = v_keeper;
    update public.orders
      set customer_phone = v_group.phone_key
      where id in (
        select shop_order_id
        from public.loyalty_orders
        where customer_id = v_keeper and shop_order_id is not null
      );
    update public.loyalty_customers
      set points_balance = v_points + floor(v_remainder / 100)::integer,
          spend_remainder = mod(v_remainder, 100),
          updated_at = now()
      where id = v_keeper;
    delete from public.loyalty_customers where id = any(v_duplicates);
  end loop;

  update public.loyalty_customers
    set phone = case
      when length(phone) = 12 and left(phone, 2) = '91' then right(phone, 10)
      when length(phone) = 14 and left(phone, 4) = '0091' then right(phone, 10)
      else phone
    end
    where (length(phone) = 12 and left(phone, 2) = '91')
       or (length(phone) = 14 and left(phone, 4) = '0091');

  update public.loyalty_orders
    set customer_phone = case
      when length(customer_phone) = 12 and left(customer_phone, 2) = '91' then right(customer_phone, 10)
      when length(customer_phone) = 14 and left(customer_phone, 4) = '0091' then right(customer_phone, 10)
      else customer_phone
    end
    where (length(customer_phone) = 12 and left(customer_phone, 2) = '91')
       or (length(customer_phone) = 14 and left(customer_phone, 4) = '0091');

  update public.orders
    set customer_phone = case
      when length(customer_phone) = 12 and left(customer_phone, 2) = '91' then right(customer_phone, 10)
      when length(customer_phone) = 14 and left(customer_phone, 4) = '0091' then right(customer_phone, 10)
      else customer_phone
    end
    where (length(customer_phone) = 12 and left(customer_phone, 2) = '91')
       or (length(customer_phone) = 14 and left(customer_phone, 4) = '0091');
end;
$$;
