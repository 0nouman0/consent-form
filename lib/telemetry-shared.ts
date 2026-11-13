/**
 * Shared rules for first-party analytics and error reports (browser + server).
 *
 * Privacy by construction:
 *   - only allow-listed event names, and only allow-listed property keys with short primitive values
 *   - client-supplied events can never claim to be server-only events (payments, generations)
 *   - page paths lose their query string and any identifier-looking segment
 *   - error text is scrubbed of email addresses, long digit runs and tokens before it is stored
 */
import { z } from "zod";

/** Events a browser may report. */
export const CLIENT_EVENTS = [
  "page_view",
  "signup_completed",
  "login_success",
  "onboarding_completed",
  "export_pdf",
  "export_docx",
  "print",
] as const;

/** Events only the server may record (a browser cannot forge a payment). */
export const SERVER_EVENTS = ["form_generated", "form_failed", "payment_started", "payment_succeeded"] as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type ServerEvent = (typeof SERVER_EVENTS)[number];
export type AnyEvent = ClientEvent | ServerEvent;

/** The only property keys ever stored. Everything else is dropped. */
export const ALLOWED_PROP_KEYS = [
  "kind", "language", "type", "status", "amount", "credits", "billing", "translation", "source", "reason", "count",
] as const;

export type PropValue = string | number | boolean;

export function cleanProps(input: unknown): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  if (!input || typeof input !== "object") return out;
  for (const key of ALLOWED_PROP_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
    else if (typeof v === "string" && v.length > 0) out[key] = scrubText(v, 40);
  }
  return out;
}

/* ───────────────────────────── scrubbing ───────────────────────────── */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LONG_DIGITS = /\d{6,}/g;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/gi;

/** Mask anything that could identify a person or leak a credential, then cap the length. */
export function scrubText(value: unknown, max = 500): string {
  const s = String(value ?? "")
    .replace(JWT, "[token]")
    .replace(BEARER, "Bearer [token]")
    .replace(EMAIL, "[email]")
    .replace(LONG_DIGITS, "[digits]")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

const UUID_SEG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONSENT_ID_SEG = /^[A-Za-z0-9]{2,8}-\d{8}-[A-Za-z0-9]{4,}$/;

/** "/history?id=abc" -> "/history";  "/users/9e41…" -> "/users/:id";  consent ids -> ":id". */
export function sanitizePath(raw: unknown): string {
  const p = String(raw ?? "").split(/[?#]/)[0].slice(0, 200) || "/";
  const segs = p.split("/").map((seg) => {
    if (!seg) return seg;
    if (UUID_SEG.test(seg) || CONSENT_ID_SEG.test(seg) || /^\d{5,}$/.test(seg) || seg.length > 40) return ":id";
    return seg;
  });
  const out = segs.join("/");
  return out.startsWith("/") ? out : "/" + out;
}

/** Referrer reduced to its host. */
export function referrerHost(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    return new URL(s).host.slice(0, 100) || null;
  } catch {
    return null;
  }
}

/** Short stable id so repeats of one problem group together (numbers and ids in the message are ignored). */
export function fingerprint(source: string, message: string): string {
  const norm = `${source}|${message.replace(/\[digits\]|\d+/g, "#").replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/gi, "#").slice(0, 160)}`;
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}

/* ───────────────────────────── request validation ───────────────────────────── */

const sessionId = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);

export const clientEventSchema = z.object({
  event: z.enum(CLIENT_EVENTS),
  path: z.string().max(300).optional(),
  sessionId: sessionId.optional(),
  referrer: z.string().max(300).optional(),
  utm: z.record(z.string(), z.string().max(80)).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const clientErrorSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().max(6000).optional(),
  path: z.string().max(300).optional(),
  sessionId: sessionId.optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

/** Only well-known campaign tags survive. */
export function cleanUtm(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object") return null;
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === "string" && v) out[k] = scrubText(v, 60);
  }
  return Object.keys(out).length ? out : null;
}
