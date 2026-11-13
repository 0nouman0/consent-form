# Database migrations

The live schema was created by hand in the Supabase dashboard, so **`supabase/legacy_ddl.sql` is out of
date and must not be run**. From now on every schema change is a numbered file in `supabase/migrations/`.

## Applying
Run the files in order in the Supabase SQL editor (they are idempotent), or with the CLI:

    supabase link --project-ref <ref>
    supabase db push

## Capture the real baseline (do this once)
The migrations here only describe changes made since the security review. To record everything that
already exists (tables, RLS policies, functions) so a new environment can be rebuilt:

    supabase db dump --schema public -f supabase/migrations/00000000000000_baseline.sql

Review it for secrets before committing.

## Conventions
- File name: `YYYYMMDDHHMMSS_short_description.sql`; never edit an applied migration — add a new one.
- Money/credit functions are SECURITY DEFINER and executable only by `service_role`.
- Any new table holding patient data must `enable row level security` in the same migration.

## Current migrations
| File | Purpose |
|---|---|
| `20261113000000_security_hardening` | RLS on `consent_history`, privileged-column trigger on `profiles`, lock credit functions to service role, drop `reset_password_direct` |
| `20261113000100_refund_credit` | `refund_credit()` so credits can be reserved before generation and refunded on failure |
| `20261113000200_observability` | first-party usage events and error reports (`app_events`, `app_errors`), admin-read-only, plus `purge_telemetry()` for the 12-month retention in the privacy policy |
