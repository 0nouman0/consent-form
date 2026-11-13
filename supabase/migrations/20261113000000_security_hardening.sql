-- 20261113000000_security_hardening
-- Idempotent: safe to run more than once, and safe if parts were already applied by hand.

-- ───────────────────────────────────────────────────────────────────────────
-- is_admin(): used by policies; SECURITY DEFINER so it can read profiles regardless of caller RLS.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- consent_history: was readable by anyone with the public anon key (patient names, DOB, form data).
-- ───────────────────────────────────────────────────────────────────────────
alter table public.consent_history enable row level security;
revoke all on public.consent_history from anon;

do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'consent_history'
  loop execute format('drop policy %I on public.consent_history', r.policyname); end loop;
end $$;

create policy ch_select on public.consent_history for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy ch_insert on public.consent_history for insert to authenticated
  with check (user_id = auth.uid());
create policy ch_update on public.consent_history for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ch_delete on public.consent_history for delete to authenticated
  using (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- profiles: users must not change role / credits / is_active / subscription_* on their own row.
-- NOTE: do NOT revoke table-level UPDATE from authenticated — client .upsert() needs it.
-- Deliberately NOT security definer: current_user must reflect the caller (inside a definer function
-- it would always be the owner and the check would never block). The credit functions are SECURITY
-- DEFINER (run as the owner), so they still pass.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.protect_profile_privileged_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.credits is distinct from old.credits
     or new.is_active is distinct from old.is_active
     or new.subscription_status is distinct from old.subscription_status
     or new.subscription_tier is distinct from old.subscription_tier then
    raise exception 'Not allowed to modify privileged profile columns' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_profile_privileged_columns on public.profiles;
create trigger trg_protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- ───────────────────────────────────────────────────────────────────────────
-- Money/credit functions: callable only by the server (service role).
-- Handles every overload, so it does not depend on the exact argument list.
-- ───────────────────────────────────────────────────────────────────────────
do $$ declare r record; begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('deduct_credit', 'verify_and_add_credits', 'refund_credit')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Account-takeover primitive removed earlier (verified gone via PostgREST PGRST202).
-- ───────────────────────────────────────────────────────────────────────────
drop function if exists public.reset_password_direct(text, text, text);
