-- 20261113000200_observability
-- First-party usage analytics and error reports. Nothing here is sent to a third party.
-- Writes happen ONLY through the server (service role). Admins can read; nobody else can.
-- Idempotent: safe to run more than once.

create table if not exists public.app_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event       text        not null,
  session_id  text,                 -- random per browser tab, never persisted across tabs
  user_id     uuid,                 -- only set on events recorded by the server for a signed-in user
  path        text,                 -- query string removed, ids replaced with :id
  referrer    text,                 -- host only
  utm         jsonb,
  props       jsonb
);

create table if not exists public.app_errors (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  source       text        not null,      -- 'client' or the API route / feature name
  message      text        not null,      -- scrubbed: emails and long digit runs masked
  stack        text,
  path         text,
  user_id      uuid,
  fingerprint  text        not null,      -- groups repeats of the same problem
  props        jsonb
);

create index if not exists app_events_created_idx     on public.app_events (created_at desc);
create index if not exists app_events_event_idx       on public.app_events (event, created_at desc);
create index if not exists app_errors_created_idx     on public.app_errors (created_at desc);
create index if not exists app_errors_fingerprint_idx on public.app_errors (fingerprint, created_at desc);

alter table public.app_events enable row level security;
alter table public.app_errors enable row level security;

-- no access for anonymous or signed-in users; the only policy lets admins read
revoke all on public.app_events from anon, authenticated;
revoke all on public.app_errors from anon, authenticated;
grant select on public.app_events to authenticated;
grant select on public.app_errors to authenticated;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('app_events', 'app_errors')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

create policy app_events_admin_read on public.app_events for select to authenticated using (public.is_admin());
create policy app_errors_admin_read on public.app_errors for select to authenticated using (public.is_admin());

-- Retention: the privacy policy promises deletion after 12 months. The app calls this opportunistically
-- (see lib/monitor.ts); it can also be scheduled, e.g. with pg_cron.
create or replace function public.purge_telemetry(retain interval default interval '12 months')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n1 integer;
  n2 integer;
begin
  delete from public.app_events where created_at < now() - retain;
  get diagnostics n1 = row_count;
  delete from public.app_errors where created_at < now() - retain;
  get diagnostics n2 = row_count;
  return n1 + n2;
end;
$$;

revoke execute on function public.purge_telemetry(interval) from public, anon, authenticated;
grant execute on function public.purge_telemetry(interval) to service_role;
