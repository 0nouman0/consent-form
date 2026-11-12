-- ConsentGen DB hardening — run in the Supabase SQL editor.
-- Items marked VERIFIED were tested against the live project with the anon key and a non-admin doctor account.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0) CRITICAL — VERIFIED: public.consent_history is readable by ANYONE holding the public anon key
--    (no login): patient_name, patient_dob, form_data, full consent text, signature/pdf links.
--    A signed-in doctor can also read rows that are not theirs. Run this block first.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.consent_history enable row level security;
revoke all on public.consent_history from anon;

-- drop whatever permissive policies exist today (to review them first:
--   select policyname, cmd, qual from pg_policies where tablename = 'consent_history';)
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) VERIFIED OK — with a doctor account, profiles / transactions / generation_audit /
--    credit_history return only the caller's own rows, and anon sees none of them. No change needed.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Users must not be able to edit their own role/credits/is_active.
--    NOTE: Do NOT revoke table-level UPDATE from authenticated, because Supabase client .upsert()
--    requires table-level UPDATE privilege (Postgres error 42501).
--    Role/credits protection is enforced via RLS policy WITH CHECK clause:
--    ((auth.uid() = id) AND (role = (SELECT role FROM profiles WHERE id = auth.uid())))
-- ═══════════════════════════════════════════════════════════════════════════
grant update on public.profiles to authenticated;

-- GAP: the WITH CHECK above only pins `role`. `credits` (and is_active / subscription_*) are still
-- writable by the row owner — a doctor could give themselves credits. A trigger closes this for
-- every client; the server (service role), SECURITY DEFINER credit functions and admins still work.
-- NOTE: deliberately NOT security definer — it must run as the caller so current_user reflects who
-- is updating (inside a definer function current_user would always be the owner and never block).
create or replace function public.protect_profile_privileged_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  -- the credit functions run as the function owner (postgres), so they pass the check above;
  -- end users editing their own row cannot change these:
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) Money/credit RPCs are SECURITY DEFINER and take p_user_id from the caller.
--    By default EXECUTE is granted to PUBLIC, so any logged-in user could call them directly.
--    Lock them to the server (service role) — then call them from the API with a service-role client,
--    or have the function use auth.uid() instead of p_user_id.
--    VERIFIED: deduct_credit is now denied to signed-in users ("permission denied for function").
--    The app therefore needs SUPABASE_SERVICE_ROLE_KEY on the server (see lib/supabase/admin.ts).
-- ═══════════════════════════════════════════════════════════════════════════
revoke execute on function public.verify_and_add_credits(uuid, text, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.deduct_credit(uuid, text) from public, anon, authenticated;
-- (adjust the verify_and_add_credits signature to match your live DB — repo ddl.sql is out of date:
--  it has 6 args, code passes p_metadata as a 7th.)
-- Status check — expect anon=false, authenticated=false, service_role=true for both:
--   select p.oid::regprocedure, has_function_privilege('anon', p.oid, 'execute') anon,
--          has_function_privilege('authenticated', p.oid, 'execute') authenticated,
--          has_function_privilege('service_role', p.oid, 'execute') service_role
--   from pg_proc p where proname in ('deduct_credit', 'verify_and_add_credits');

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) DONE — reset_password_direct was dropped (verified: PostgREST now returns PGRST202).
-- ═══════════════════════════════════════════════════════════════════════════
drop function if exists public.reset_password_direct(text, text, text);
