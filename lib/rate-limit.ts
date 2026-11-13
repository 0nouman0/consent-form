/**
 * Small in-memory sliding-window rate limiter.
 *
 * Best-effort: state lives in one server instance, so on serverless hosting each instance counts
 * separately. It stops bursts and cheap abuse of the AI routes with zero infrastructure. The
 * generation route additionally enforces limits from the database (see /api/generate), which holds
 * across instances. If you outgrow this, swap `rateLimit` for Upstash/Redis behind the same signature.
 */

type Bucket = number[]; // request timestamps (ms)

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry (0 when ok). */
  retryAfter: number;
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  sweep(now, windowMs);

  const bucket = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (bucket.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket[0] + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfter, remaining: 0 };
  }

  bucket.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0, remaining: limit - bucket.length };
}

/** Standard 429 response with Retry-After. */
export function tooManyRequests(retryAfter: number, message = "Too many requests. Please slow down."): Response {
  return Response.json(
    { error: message, retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** Drop empty/expired buckets now and then so the map cannot grow without bound. */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((bucket, key) => {
    if (bucket.length === 0 || now - bucket[bucket.length - 1] > Math.max(windowMs, 60_000)) {
      buckets.delete(key);
    }
  });
}

/** Test helper. */
export function _resetRateLimits() {
  buckets.clear();
  lastSweep = 0;
}
