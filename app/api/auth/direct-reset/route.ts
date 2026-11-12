import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword, verificationCode } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid practitioner email address is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Call the database RPC function to reset password directly with practitioner verification
    const { data, error } = await supabase.rpc("reset_password_direct", {
      p_email: email.trim(),
      p_new_password: newPassword,
      p_verification_code: verificationCode ? String(verificationCode).trim() : null,
    });

    if (error) {
      console.error("Direct password reset RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to reset password in database." },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || "Verification failed. Check your details." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (err: unknown) {
    console.error("Direct reset error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
