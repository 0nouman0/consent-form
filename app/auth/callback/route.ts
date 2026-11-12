import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let next = searchParams.get("next");

  if (!next) {
    if (type === "recovery") {
      next = "/auth/reset-password";
    } else {
      next = "/dashboard";
    }
  }

  const supabase = createClient();

  // 1. Handle PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error("Callback code exchange error:", error.message);
    const failureUrl = next.includes("reset-password")
      ? `/forgot-password?error=${encodeURIComponent(error.message)}`
      : `/login?error=auth_callback_failed`;
    return NextResponse.redirect(new URL(failureUrl, request.url));
  }

  // 2. Handle token_hash verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error("Callback OTP verification error:", error.message);
    const failureUrl = type === "recovery" || next.includes("reset-password")
      ? `/forgot-password?error=${encodeURIComponent(error.message)}`
      : `/login?error=auth_callback_failed`;
    return NextResponse.redirect(new URL(failureUrl, request.url));
  }

  const fallbackUrl = next.includes("reset-password")
    ? `/forgot-password?error=invalid_link`
    : `/login?error=auth_callback_failed`;
  return NextResponse.redirect(new URL(fallbackUrl, request.url));
}
