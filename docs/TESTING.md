# Testing and CI

| Command | What it checks | Needs |
|---|---|---|
| `npm test` | 71 fast unit tests: clause text, layout engine, translation quality gate, rate limiter, privacy rules of analytics | nothing (offline) |
| `npm run test:http` | web protections against a running app: login redirects, Next.js middleware-bypass regression, unauthenticated API routes, removed reset route, security headers, telemetry endpoints, admin dotted-path bypass | `npm run build && npm start` (and the admin app on port 3001 with `ADMIN_URL=http://localhost:3001`) |
| `npm run test:access` | access control on the **real database**: anonymous and signed-in users cannot read other people's data, cannot call credit functions, a doctor cannot raise their own credits or role | Supabase URL + public key; optional test accounts |
| `npm run test:all` | all of the above | everything |

Tests skip (they do not fail) when something they need is missing, and say why.

## What the access-control tests protect against

They exist because each of these was a real finding that had to be fixed:

- `consent_history` (patient names, forms) readable by anyone with the public key
- a doctor editing their own `role` / `credits`
- credit functions (`deduct_credit`, `refund_credit`, `verify_and_add_credits`) callable by end users
- the unauthenticated `reset_password_direct` function
- telemetry tables readable or writable by non-admins

The function probes pass an argument that cannot execute (an invalid uuid). PostgreSQL checks the EXECUTE permission before running anything, so a locked function answers `42501` and an exposed one answers a type error; **the probes can never change data.**

The single write attempt (a doctor trying to raise their own credits and role) is refused by the database trigger, and the test undoes it if it were ever to succeed.

## Setting up CI (GitHub Actions)

`.github/workflows/ci.yml` runs three jobs on every push to `main` and every pull request:

1. **unit** — typecheck + `npm test`
2. **app** — builds both apps, starts them, runs `npm run test:http`
3. **access** — runs `npm run test:access` against your database

Jobs 1 and 2 need nothing. For job 3 add these under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the public (anon / publishable) key |
| `TEST_DOCTOR_EMAIL`, `TEST_DOCTOR_PASSWORD` | a **dedicated non-admin** test account |
| `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` | a **dedicated admin** test account |

Recommendations:

- Use accounts created only for testing, each with its own unique password. Do not reuse a real doctor's or your own login.
- Prefer a separate staging Supabase project. The tests are read-only apart from the refused write above, but staging keeps production out of CI entirely.
- Never put the service-role key into CI secrets; these tests do not need it.
- Until the secrets exist the `access` job shows a warning and the tests skip. Mark the job as a required check in branch protection once they are configured.

## Running locally

```bash
npm test                                   # unit
npm run build && npm start                 # then, in another terminal:
npm run test:http
TEST_DOCTOR_EMAIL=... TEST_DOCTOR_PASSWORD=... TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... npm run test:access
```

`.env.local` is read automatically for the Supabase values.

## Analytics and error monitoring

Usage events and error reports are first-party (tables `app_events`, `app_errors`; migration
`supabase/migrations/20261113000200_observability.sql`). Nothing is sent to a third party and no form content is recorded.
Admins read them in the admin panel under **Insights**. Records are deleted after 12 months (see `lib/monitor.ts`).
To plug in Sentry or PostHog later, add the SDK next to `lib/analytics.ts`; the call sites already go through `track()`
and `reportError()`.
