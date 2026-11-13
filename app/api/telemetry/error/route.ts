import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/monitor";
import { clientErrorSchema } from "@/lib/telemetry-shared";

/** Receives error reports from the browser. Same contract as /api/telemetry/event. */
export async function POST(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
  const limited = rateLimit(`telemetry-error:${ip}`, 20, 60_000);
  if (!limited.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });

  const text = await req.text();
  if (text.length > 10_000) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = clientErrorSchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });

  // Attach the account id when the person is signed in, so the problem can be traced and fixed.
  let userId: string | null = null;
  try {
    const { data } = await createClient().auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    /* anonymous */
  }

  await reportError("client", parsed.data.message, {
    userId,
    path: parsed.data.path,
    sessionId: parsed.data.sessionId,
    stack: parsed.data.stack,
    props: parsed.data.props,
  });
  return new Response(null, { status: 204 });
}
