import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let next = searchParams.get("next");

  // Determine appropriate fallback destination based on auth event
  if (!next) {
    if (type === "recovery") {
      next = "/auth/reset-password";
    } else {
      next = "/onboarding";
    }
  }

  const supabase = createClient();

  // 1. Handle PKCE code flow (default in browser Supabase client)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error("PKCE exchange error:", error.message);
    const failureUrl = next.includes("reset-password")
      ? `/forgot-password?error=${encodeURIComponent(error.message)}`
      : `/login?error=verification_failed`;
    return NextResponse.redirect(new URL(failureUrl, request.url));
  }

  // 2. Handle token_hash flow (traditional Supabase OTP/Email link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error("OTP verification error:", error.message);
    const failureUrl = type === "recovery" || next.includes("reset-password")
      ? `/forgot-password?error=${encodeURIComponent(error.message)}`
      : `/login?error=verification_failed`;
    return NextResponse.redirect(new URL(failureUrl, request.url));
  }

  // Fallback if neither code nor token_hash was provided
  const fallbackUrl = next.includes("reset-password")
    ? `/forgot-password?error=invalid_link`
    : `/login?error=verification_failed`;
  return NextResponse.redirect(new URL(fallbackUrl, request.url));
}
