import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLIENT_EVENTS, SERVER_EVENTS, ALLOWED_PROP_KEYS, cleanProps, cleanUtm, clientEventSchema, clientErrorSchema,
  fingerprint, referrerHost, sanitizePath, scrubText,
} from "../lib/telemetry-shared";

test("scrubText masks emails, long digit runs and tokens", () => {
  assert.equal(scrubText("failed for doctor@hospital.org on order"), "failed for [email] on order");
  assert.equal(scrubText("registration 9876543210123 rejected"), "registration [digits] rejected");
  assert.equal(scrubText("Bearer abcdefghijklmnop12345 expired"), "Bearer [token] expired");
  assert.equal(scrubText("jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcDEF_ghi-123 end"), "jwt [token] end");
  assert.equal(scrubText("short 12345 stays"), "short 12345 stays", "short numbers (status codes, counts) are kept");
});

test("scrubText caps length and collapses whitespace", () => {
  const out = scrubText("a   b\n\nc " + "x".repeat(900), 100);
  assert.ok(out.length <= 100);
  assert.ok(out.startsWith("a b c "));
});

test("paths lose their query string and identifier-like segments", () => {
  assert.equal(sanitizePath("/history?id=abc123&q=anita"), "/history");
  assert.equal(sanitizePath("/dashboard#top"), "/dashboard");
  assert.equal(sanitizePath("/users/9e41807b-8510-40b0-a0ca-17e9c6cb59ce"), "/users/:id");
  assert.equal(sanitizePath("/consent/APOL-20261113-7F3A91C2"), "/consent/:id");
  assert.equal(sanitizePath("/orders/1794512913826"), "/orders/:id");
  assert.equal(sanitizePath(""), "/");
  assert.equal(sanitizePath("privacy"), "/privacy");
});

test("referrer is reduced to its host", () => {
  assert.equal(referrerHost("https://www.google.com/search?q=consent+form+hindi"), "www.google.com");
  assert.equal(referrerHost("not a url"), null);
  assert.equal(referrerHost(""), null);
});

test("only allow-listed property keys survive, with short primitive values", () => {
  const out = cleanProps({
    language: "Hindi", amount: 750, billing: "reserved", translation: "verified",
    patientName: "Anita Deshmukh", email: "doc@x.org", aadhaar: "1234", markdown: "## form text", nested: { a: 1 },
    reason: "x".repeat(200), count: Number.NaN,
  });
  assert.deepEqual(Object.keys(out).sort(), ["amount", "billing", "language", "reason", "translation"]);
  assert.ok(String(out.reason).length <= 40);
  for (const key of Object.keys(out)) assert.ok((ALLOWED_PROP_KEYS as readonly string[]).includes(key));
});

test("property values are scrubbed as well", () => {
  assert.equal(cleanProps({ reason: "mail me at a@b.co" }).reason, "mail me at [email]");
});

test("non-object props yield nothing", () => {
  assert.deepEqual(cleanProps(null), {});
  assert.deepEqual(cleanProps("language=Hindi"), {});
});

test("only well-known campaign tags are kept", () => {
  assert.deepEqual(cleanUtm({ utm_source: "ima", utm_medium: "email", patient: "x" }), { utm_source: "ima", utm_medium: "email" });
  assert.equal(cleanUtm({ other: "x" }), null);
  assert.equal(cleanUtm(null), null);
});

test("fingerprint groups the same problem regardless of numbers and ids", () => {
  const a = fingerprint("api/generate", "Request 4821 failed for order 99871234");
  const b = fingerprint("api/generate", "Request 5533 failed for order 11223344");
  assert.equal(a, b);
  assert.notEqual(a, fingerprint("api/generate", "Model returned no content"));
  assert.notEqual(a, fingerprint("api/chat", "Request 4821 failed for order 99871234"));
  assert.match(a, /^[0-9a-f]{8}$/);
});

test("a browser can never report a server-only event (payments cannot be forged)", () => {
  for (const event of SERVER_EVENTS) {
    assert.equal(clientEventSchema.safeParse({ event }).success, false, `${event} must be rejected from clients`);
  }
  for (const event of CLIENT_EVENTS) {
    assert.equal(clientEventSchema.safeParse({ event }).success, true, `${event} must be accepted from clients`);
  }
  assert.equal(clientEventSchema.safeParse({ event: "totally_made_up" }).success, false);
});

test("client and server event lists do not overlap", () => {
  const overlap = (CLIENT_EVENTS as readonly string[]).filter((e) => (SERVER_EVENTS as readonly string[]).includes(e));
  assert.deepEqual(overlap, []);
});

test("event and error payloads are validated", () => {
  assert.equal(clientEventSchema.safeParse({ event: "page_view", sessionId: "bad id with spaces" }).success, false);
  assert.equal(clientEventSchema.safeParse({ event: "page_view", sessionId: "abc12345-def6" }).success, true);
  assert.equal(clientEventSchema.safeParse({ event: "page_view", path: "x".repeat(400) }).success, false);
  assert.equal(clientErrorSchema.safeParse({ message: "" }).success, false);
  assert.equal(clientErrorSchema.safeParse({ message: "boom", stack: "at x" }).success, true);
  assert.equal(clientErrorSchema.safeParse({ message: "y".repeat(2000) }).success, false);
});
