/**
 * Web-level regression tests against a RUNNING copy of the app (default http://localhost:3000).
 * Locally:  npm run build && npm start   then   npm run test:http
 * In CI the workflow builds and starts both apps first. Tests skip (not fail) when nothing is listening.
 *
 * Covers the protections that were once broken and must stay fixed.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { cfg } from "../support/env";

let up = false;
let adminUp = false;

async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url + "/login", { redirect: "manual", signal: AbortSignal.timeout(8000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

before(async () => {
  up = await reachable(cfg.baseUrl);
  adminUp = cfg.adminUrl ? await reachable(cfg.adminUrl) : false;
  // In CI a missing app must FAIL the run: an all-skipped suite would otherwise look green.
  if (process.env.REQUIRE_APP === "1") {
    if (!up) throw new Error(`REQUIRE_APP=1 but nothing is listening on ${cfg.baseUrl}`);
    if (cfg.adminUrl && !adminUp) throw new Error(`REQUIRE_APP=1 but the admin app is not reachable on ${cfg.adminUrl}`);
  }
});

/**
 * Telemetry tests post real events. Everything they create is tagged "citest" and removed afterwards when a
 * service key for a real project is available (locally); in CI the placeholder environment stores nothing.
 */
after(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || /placeholder/.test(url)) return;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    await fetch(`${url}/rest/v1/app_events?session_id=like.citest-*`, { method: "DELETE", headers });
    await fetch(`${url}/rest/v1/app_errors?message=like.citest*`, { method: "DELETE", headers });
  } catch {
    /* best effort */
  }
});

/** Skip is decided when the test runs, after the reachability check in before(). */
const appTest = (name: string, fn: () => Promise<void>) =>
  test(name, async (t) => {
    if (!up) return t.skip(`no app listening on ${cfg.baseUrl}`);
    await fn();
  });
const adminTest = (name: string, fn: () => Promise<void>) =>
  test(name, async (t) => {
    if (!adminUp) return t.skip("ADMIN_URL not set or admin app not reachable");
    await fn();
  });
const get = (path: string, init: RequestInit = {}, base = cfg.baseUrl) => fetch(base + path, { redirect: "manual", ...init });
const post = (path: string, body: unknown = {}, base = cfg.baseUrl, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: "POST", redirect: "manual", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const redirectsToLogin = (res: Response) => [301, 302, 303, 307, 308].includes(res.status) && (res.headers.get("location") ?? "").includes("/login");

/* ───────────── pages ───────────── */

for (const path of ["/dashboard", "/generate", "/history", "/templates", "/credits", "/chat", "/profile"]) {
  appTest(`${path} requires sign-in`, async () => {
    assert.ok(redirectsToLogin(await get(path)), `${path} did not redirect to /login`);
  });
}

appTest("Next.js middleware-bypass header (CVE-2025-29927) does not open protected pages", async () => {
  const res = await get("/generate", { headers: { "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware" } });
  assert.ok(redirectsToLogin(res), `bypass header returned ${res.status}: the upgrade to a patched Next.js has regressed`);
});

appTest("public pages load", async () => {
  for (const path of ["/", "/login", "/privacy", "/terms", "/regulations", "/robots.txt", "/sitemap.xml"]) {
    const res = await get(path);
    assert.equal(res.status, 200, `${path} -> ${res.status}`);
  }
});

appTest("the privacy policy names the AI provider and does not overclaim encryption", async () => {
  const html = await (await get("/privacy")).text();
  assert.match(html, /Groq/, "privacy policy must disclose the AI provider");
  assert.ok(!/AES-256/.test(html), "privacy policy must not claim application-level AES-256 for saved forms");
  assert.match(html, /not individually encrypted/i);
});

/* ───────────── API ───────────── */

for (const path of ["/api/generate", "/api/chat", "/api/translate", "/api/payment/order", "/api/payment/verify"]) {
  appTest(`${path} refuses unauthenticated requests`, async () => {
    const res = await post(path);
    assert.equal(res.status, 401, `${path} -> ${res.status}`);
  });
}

appTest("the unauthenticated password-reset route is gone", async () => {
  const res = await post("/api/auth/direct-reset", { email: "a@b.co", newPassword: "Testing12345" });
  assert.equal(res.status, 404);
});

appTest("payment webhook rejects an unsigned call", async () => {
  const res = await post("/api/payment/webhook", "{}");
  assert.equal(res.status, 401, `webhook -> ${res.status} (500 means CASHFREE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY are not configured)`);
});

appTest("payment webhook rejects a wrong signature", async () => {
  const res = await post("/api/payment/webhook", '{"type":"PAYMENT_SUCCESS_WEBHOOK"}', cfg.baseUrl, {
    "x-webhook-signature": "AAAA", "x-webhook-timestamp": String(Date.now()),
  });
  assert.equal(res.status, 401);
});

/* ───────────── security headers ───────────── */

appTest("security headers are present", async () => {
  const h = (await get("/")).headers;
  assert.equal(h.get("x-frame-options"), "DENY");
  assert.equal(h.get("x-content-type-options"), "nosniff");
  assert.match(h.get("strict-transport-security") ?? "", /max-age=\d+/);
  assert.match(h.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(h.get("content-security-policy") ?? "", /object-src 'none'/);
});

/* ───────────── telemetry ───────────── */

const ev = (body: unknown, headers: Record<string, string> = {}) => post("/api/telemetry/event", body, cfg.baseUrl, headers);

appTest("telemetry accepts a valid page view and never breaks the page", async () => {
  assert.equal((await ev({ event: "page_view", path: "/", sessionId: "citest-pageview-01" })).status, 204);
});

appTest("telemetry refuses server-only events, so payments cannot be forged from a browser", async () => {
  for (const event of ["payment_succeeded", "form_generated", "form_failed", "payment_started"]) {
    assert.equal((await ev({ event })).status, 400, `${event} must be rejected`);
  }
});

appTest("telemetry rejects malformed, unknown and oversized input", async () => {
  assert.equal((await ev("not json")).status, 400);
  assert.equal((await ev({ event: "made_up_event" })).status, 400);
  assert.equal((await ev({ event: "page_view", path: "x".repeat(5000) })).status, 413);
});

appTest("telemetry honours Do Not Track and Global Privacy Control", async () => {
  // accepted silently (204) even for input that would otherwise be rejected, because nothing is processed
  assert.equal((await ev({ event: "made_up_event" }, { DNT: "1" })).status, 204);
  assert.equal((await ev({ event: "made_up_event" }, { "Sec-GPC": "1" })).status, 204);
});

appTest("the error endpoint accepts a report and rejects junk", async () => {
  assert.equal((await post("/api/telemetry/error", { message: "citest error from CI", path: "/x" })).status, 204);
  assert.equal((await post("/api/telemetry/error", { message: "" })).status, 400);
  assert.equal((await post("/api/telemetry/error", "{{")).status, 400);
});

/* ───────────── admin panel ───────────── */

for (const path of ["/", "/users", "/generations", "/payments", "/audit-log", "/insights"]) {
  adminTest(`admin ${path} requires sign-in`, async () => {
    assert.ok(redirectsToLogin(await get(path, {}, cfg.adminUrl)), `admin ${path} did not redirect to /login`);
  });
}

adminTest("admin pages cannot be opened by adding a dot to the path", async () => {
  for (const path of ["/users/x.y", "/payments/a.b", "/generations/1.2"]) {
    assert.ok(redirectsToLogin(await get(path, {}, cfg.adminUrl)), `admin ${path} was served without signing in`);
  }
});

adminTest("admin decrypt endpoint refuses unauthenticated calls", async () => {
  const res = await post("/api/decrypt", { patient_name_enc: "x" }, cfg.adminUrl);
  assert.equal(res.status, 401);
});
