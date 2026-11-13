-- 20261113000100_refund_credit
-- Credits are now RESERVED before generation (deduct_credit) and REFUNDED if generation fails.
-- refund_credit is idempotent per reference_id: one refund per spend, however many times it is called.

create or replace function public.refund_credit(p_user_id uuid, p_reference_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spent    integer;
  v_refunded integer;
  v_new      integer;
begin
  -- serialise per user so concurrent refunds cannot double-pay
  perform 1 from public.profiles where id = p_user_id for update;

  select count(*) into v_spent
    from public.credit_history
   where user_id = p_user_id and reference_id = p_reference_id and action = 'generation_spend';

  select count(*) into v_refunded
    from public.credit_history
   where user_id = p_user_id and reference_id = p_reference_id and action = 'generation_refund';

  if v_spent = 0 or v_refunded >= v_spent then
    select credits into v_new from public.profiles where id = p_user_id;
    return v_new;   -- nothing to refund (never charged, or already refunded)
  end if;

  update public.profiles
     set credits = credits + 1, updated_at = now()
   where id = p_user_id
   returning credits into v_new;

  begin
    insert into public.credit_history (user_id, amount, action, balance_after, reference_id)
    values (p_user_id, 1, 'generation_refund', v_new, p_reference_id);
  exception when others then
    -- e.g. a CHECK constraint on credit_history.action: the refund itself must still stand
    raise warning 'refund_credit: could not write credit_history row (%): %', sqlstate, sqlerrm;
  end;

  return v_new;
end;
$$;

revoke execute on function public.refund_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_credit(uuid, text) to service_role;
