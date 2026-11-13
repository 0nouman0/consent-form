import { cfg } from "./env";

export interface Reply {
  status: number;
  body: any;
}

/** One PostgREST / auth call. `token` = a signed-in user's access token; omitted = anonymous. */
export async function call(method: string, path: string, opts: { token?: string; body?: unknown; prefer?: string } = {}): Promise<Reply> {
  const headers: Record<string, string> = { apikey: cfg.anonKey, "content-type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(cfg.supabaseUrl + path, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

export async function login(email: string, password: string): Promise<{ token: string; id: string }> {
  const r = await call("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  if (r.status !== 200 || !r.body?.access_token) throw new Error(`login failed for test account (${r.status})`);
  return { token: r.body.access_token, id: r.body.user.id };
}

/** True when the reply is a refusal (permission denied / not authorised / RLS), not data. */
export const isRefusal = (r: Reply): boolean =>
  r.status === 401 || r.status === 403 || (r.body && typeof r.body === "object" && r.body.code === "42501");

/** A read that returns rows is a leak; an empty list or a refusal is fine. */
export const rowsReturned = (r: Reply): number => (r.status === 200 && Array.isArray(r.body) ? r.body.length : 0);

/** The tables that must never be readable by the public. */
export const PRIVATE_TABLES = ["consent_history", "profiles", "transactions", "credit_history", "generation_audit", "luffy_admin_logs"];
/** Added by the observability migration; a missing table (404) is not a leak. */
export const TELEMETRY_TABLES = ["app_events", "app_errors"];
/** A VALID row for each telemetry table. A wrong column would be rejected with 400 before permissions are even checked. */
export const TELEMETRY_PROBE: Record<string, Record<string, unknown>> = {
  app_events: { event: "page_view", session_id: "access-probe" },
  app_errors: { source: "access-probe", message: "access-probe", fingerprint: "probe0000" },
};

/**
 * Privileged functions with an argument list that CANNOT execute (an invalid uuid / interval). PostgreSQL checks
 * EXECUTE permission before evaluating the arguments, so a locked function answers 42501, while an exposed one
 * answers 22P02 / 22007 without having done anything. These probes can never mutate data.
 */
export const LOCKED_FUNCTIONS: Array<{ name: string; args: Record<string, unknown>; mayBeAbsent?: boolean }> = [
  { name: "deduct_credit", args: { p_user_id: "not-a-uuid", p_reference_id: "probe" } },
  { name: "refund_credit", args: { p_user_id: "not-a-uuid", p_reference_id: "probe" } },
  {
    name: "verify_and_add_credits",
    args: { p_user_id: "not-a-uuid", p_order_id: "probe", p_payment_id: "probe", p_signature: "probe", p_amount: 0, p_credits: 0, p_metadata: {} },
  },
  { name: "purge_telemetry", args: { retain: "not-an-interval" }, mayBeAbsent: true },
];
