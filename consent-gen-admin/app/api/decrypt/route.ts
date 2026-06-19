import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Enforce session / admin authorization
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { patient_name_enc } = await req.json();
    if (!patient_name_enc) {
      return NextResponse.json({ error: "Missing encrypted name" }, { status: 400 });
    }

    const key = process.env.PATIENT_NAME_ENCRYPTION_KEY || "luffy-default-super-secret-key-123";

    const { data: decrypted, error } = await supabase.rpc("decrypt_patient_name", {
      p_enc: patient_name_enc,
      p_key: key
    });

    if (error) {
      console.error("Decryption RPC error:", error);
      return NextResponse.json({ error: "Failed to decrypt name" }, { status: 500 });
    }

    return NextResponse.json({ decrypted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
