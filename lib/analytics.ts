/**
 * Browser tracker for first-party usage events and error reports. See telemetry-shared.ts for the privacy rules.
 *
 *  - respects Do Not Track and Global Privacy Control
 *  - a random id that lives only in this tab (sessionStorage), no cookies, no cross-site identifiers
 *  - never sends form content: callers pass only short allow-listed properties
 *  - never throws and never blocks the page
 */
import type { ClientEvent } from "./telemetry-shared";

const SID_KEY = "cg_sid";
const CTX_KEY = "cg_ctx";
const ERR_KEY = "cg_err_seen";

export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const dnt = nav.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1" || nav.msDoNotTrack === "1";
  return !dnt && nav.globalPrivacyControl !== true;
}

function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).slice(0, 64);
      sessionStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Where this visit came from, captured once per tab: referrer site and campaign tags. */
function visitContext(): { referrer?: string; utm?: Record<string, string> } {
  try {
    const cached = sessionStorage.getItem(CTX_KEY);
    if (cached) return JSON.parse(cached);
    const ctx: { referrer?: string; utm?: Record<string, string> } = {};
    if (document.referrer) ctx.referrer = document.referrer;
    const q = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = q.get(k);
      if (v) utm[k] = v.slice(0, 80);
    }
    if (Object.keys(utm).length) ctx.utm = utm;
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
    return ctx;
  } catch {
    return {};
  }
}

function send(url: string, body: unknown) {
  try {
    const payload = JSON.stringify(body);
    // sendBeacon survives page navigation (e.g. right after sign-in); fall back to a keep-alive fetch
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url, new Blob([payload], { type: "text/plain" }))) return;
    void fetch(url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  } catch {
    /* telemetry must never affect the page */
  }
}

export function track(event: ClientEvent, props?: Record<string, string | number | boolean>) {
  if (!trackingAllowed()) return;
  const ctx = visitContext();
  send("/api/telemetry/event", {
    event,
    path: window.location.pathname,
    sessionId: sessionId(),
    referrer: ctx.referrer,
    utm: ctx.utm,
    props,
  });
}

/** Report a browser-side error. De-duplicated per tab and capped so a loop cannot flood the endpoint. */
export function reportClientError(message: string, stack?: string, props?: Record<string, string | number | boolean>) {
  try {
    if (!message) return;
    const seen: string[] = JSON.parse(sessionStorage.getItem(ERR_KEY) || "[]");
    const key = message.slice(0, 120);
    if (seen.includes(key) || seen.length >= 5) return;
    seen.push(key);
    sessionStorage.setItem(ERR_KEY, JSON.stringify(seen));
  } catch {
    /* storage unavailable: send anyway */
  }
  send("/api/telemetry/error", {
    message: message.slice(0, 1000),
    stack: stack?.slice(0, 6000),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    sessionId: sessionId(),
    props,
  });
}
