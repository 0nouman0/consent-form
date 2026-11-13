import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  type AnyEvent, cleanProps, cleanUtm, fingerprint, referrerHost, sanitizePath, scrubText,
} from "@/lib/telemetry-shared";

/**
 * Server-side recorder for usage events and error reports (first-party tables, see
 * supabase/migrations/20261113000200_observability.sql).
 *
 * Everything here is best-effort: it never throws and never delays a response for long, so a problem in
 * monitoring can never become a problem for a doctor generating a form. Until the migration is applied the
 * inserts simply fail quietly (logged once per minute).
 */

let lastWarn = 0;
function warnOnce(what: string, err: unknown) {
  const now = Date.now();
  if (now - lastWarn > 60_000) {
    lastWarn = now;
    console.warn(`monitor: could not record ${what}:`, (err as { message?: string })?.message ?? err);
  }
}

export interface EventInput {
  event: AnyEvent;
  userId?: string | null;
  path?: string;
  sessionId?: string;
  referrer?: string;
  utm?: unknown;
  props?: unknown;
}

export async function recordEvent(e: EventInput): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const { error } = await createAdminClient().from("app_events").insert({
      event: e.event,
      user_id: e.userId ?? null,
      session_id: e.sessionId ?? null,
      path: e.path ? sanitizePath(e.path) : null,
      referrer: referrerHost(e.referrer),
      utm: cleanUtm(e.utm),
      props: cleanProps(e.props),
    });
    if (error) warnOnce("event", error);
    else void maybePurge();
  } catch (err) {
    warnOnce("event", err);
  }
}

/** Report a problem. Never include request bodies or form content in `ctx`; only short technical facts. */
export async function reportError(
  source: string,
  err: unknown,
  ctx: { userId?: string | null; path?: string; sessionId?: string; stack?: string; props?: unknown } = {}
): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const raw = err instanceof Error ? err.message || err.name : typeof err === "string" ? err : "Unknown error";
    const message = scrubText(raw, 500);
    const stack = ctx.stack ?? (err instanceof Error ? err.stack : undefined);
    const { error } = await createAdminClient().from("app_errors").insert({
      source: scrubText(source, 60),
      message,
      stack: stack ? scrubText(stack, 3000) : null,
      path: ctx.path ? sanitizePath(ctx.path) : null,
      user_id: ctx.userId ?? null,
      fingerprint: fingerprint(source, message),
      props: cleanProps(ctx.props),
    });
    if (error) warnOnce("error", error);
  } catch (e) {
    warnOnce("error", e);
  }
}

/* ───────────────────────────── retention ───────────────────────────── */

let lastPurge = 0;

/**
 * The privacy policy promises deletion after 12 months. Rather than depend on a scheduler being configured,
 * ingestion occasionally (at most hourly per server instance, on ~1 in 20 events) runs the purge function.
 */
async function maybePurge(): Promise<void> {
  const now = Date.now();
  if (now - lastPurge < 3_600_000 || Math.random() > 0.05) return;
  lastPurge = now;
  try {
    const { error } = await createAdminClient().rpc("purge_telemetry", { retain: "12 months" });
    if (error) warnOnce("purge", error);
  } catch (err) {
    warnOnce("purge", err);
  }
}
