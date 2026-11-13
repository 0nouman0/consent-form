import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/monitor";
import { clientEventSchema } from "@/lib/telemetry-shared";

/**
 * Receives usage events from the browser (sendBeacon). Always answers quickly with no body:
 *   204 = accepted or deliberately ignored, 400 = malformed, 413 = too large, 429 = too many.
 * Only allow-listed client events are accepted; server-only events (payments, generations) cannot be forged here.
 */
export async function POST(req: NextRequest) {
  // The visitor asked not to be tracked: accept silently, store nothing.
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") {
    return new Response(null, { status: 204 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
  const limited = rateLimit(`telemetry-event:${ip}`, 120, 60_000);
  if (!limited.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });

  const text = await req.text();
  if (text.length > 4000) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = clientEventSchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });

  // IP addresses are used only for the rate limit above and are never stored.
  await recordEvent({
    event: parsed.data.event,
    path: parsed.data.path,
    sessionId: parsed.data.sessionId,
    referrer: parsed.data.referrer,
    utm: parsed.data.utm,
    props: parsed.data.props,
  });
  return new Response(null, { status: 204 });
}
