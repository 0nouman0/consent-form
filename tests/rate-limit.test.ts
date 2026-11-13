import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, _resetRateLimits } from "../lib/rate-limit";

beforeEach(() => _resetRateLimits());

test("allows up to the limit, then blocks with a retry time", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) assert.ok(rateLimit("u1", 3, 60_000, t0 + i).ok);
  const blocked = rateLimit("u1", 3, 60_000, t0 + 10);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
});

test("the window slides: requests are allowed again once old ones expire", () => {
  const t0 = 2_000_000;
  for (let i = 0; i < 2; i++) rateLimit("u2", 2, 10_000, t0);
  assert.equal(rateLimit("u2", 2, 10_000, t0 + 5_000).ok, false);
  assert.equal(rateLimit("u2", 2, 10_000, t0 + 10_001).ok, true);
});

test("keys are independent", () => {
  const t0 = 3_000_000;
  rateLimit("a", 1, 60_000, t0);
  assert.equal(rateLimit("a", 1, 60_000, t0 + 1).ok, false);
  assert.equal(rateLimit("b", 1, 60_000, t0 + 1).ok, true);
});

test("blocked requests do not extend the lockout", () => {
  const t0 = 4_000_000;
  rateLimit("c", 1, 10_000, t0);
  for (let i = 1; i < 50; i++) rateLimit("c", 1, 10_000, t0 + i * 100);
  assert.equal(rateLimit("c", 1, 10_000, t0 + 10_001).ok, true);
});
