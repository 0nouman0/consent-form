-- ConsentGen DB hardening — REVIEW BEFORE RUNNING (Supabase SQL editor).
-- Found during test pass; NOT applied automatically. Test on a staging copy first.

-- 1) UNVERIFIED: the test account used was an ADMIN, so seeing all profiles was expected.
--    Verify with a real *doctor* account that profiles/transactions/generation_audit only return own rows.
--    If a doctor can see other profiles (name, registration no, address, credits), restrict to own row + admins.
--    (Check existing policies first: select policyname, qual from pg_policies where tablename='profiles';)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- drop the over-broad policy (name it from the pg_policies query above), then:
-- create policy profiles_select_own_or_admin on public.profiles
--   for select using (id = auth.uid() or public.is_admin());

-- 2) Users must not be able to edit their own role/credits/is_active.
--    Verify: as a doctor, PATCH /rest/v1/profiles?id=eq.<me> {"role":"admin"} must FAIL.
revoke update on public.profiles from authenticated;
grant update (doctor_name, doctor_registration_no, hospital_name, hospital_address,
              billing_address, default_consent_type, default_language_level)
  on public.profiles to authenticated;

-- 3) Money/credit RPCs are SECURITY DEFINER and take p_user_id from the caller.
--    By default EXECUTE is granted to PUBLIC, so any logged-in user could call them directly.
--    Lock them to the server (service role) — then call them from the API with a service-role client,
--    or have the function use auth.uid() instead of p_user_id.
revoke execute on function public.verify_and_add_credits(uuid, text, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.deduct_credit(uuid, text) from public, anon, authenticated;
-- (adjust the verify_and_add_credits signature to match your live DB — repo ddl.sql is out of date:
--  it has 6 args, code passes p_metadata as a 7th.)

-- 4) REQUIRED — run this first. The /api/auth/direct-reset route was removed from the app, but the
--    database function behind it is still callable by ANYONE with the public anon key straight through
--    Supabase's REST API (verified: POST /rest/v1/rpc/reset_password_direct returns a normal response).
--    It resets a password from an email + registration number, so it is an account-takeover primitive.
--    Password reset now uses only Supabase's email link flow (/forgot-password -> /auth/reset-password).
drop function if exists public.reset_password_direct(text, text, text);
