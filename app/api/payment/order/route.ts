import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { createCashfreeOrder, getCashfreeConfig } from "@/lib/cashfree";

const PACKAGES: Record<number, { credits: number; amount: number }> = {
  150:  { credits: 1,  amount: 150  }, // Starter: 1 credit
  750:  { credits: 6,  amount: 750  }, // Standard: buy 5 get 1 free = 6 credits
  1500: { credits: 12, amount: 1500 }, // Professional: buy 10 get 2 free = 12 credits
  3000: { credits: 24, amount: 3000 }, // Enterprise: buy 20 get 4 free = 24 credits
};

export async function POST(req: NextRequest) {
  // Require doctor role
  const user = await getUserWithRole();
  if (!user || !hasPermission(user.role, "generate")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const authResult = user;

  try {
    const { amount } = await req.json();

    const selectedPackage = PACKAGES[amount];
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package amount selected" },
        { status: 400 }
      );
    }

    const config = getCashfreeConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        { error: "Cashfree payment gateway is not configured on the server" },
        { status: 500 }
      );
    }

    const supabase = createClient();

    // Retrieve doctor profile to populate customer details
    let doctorName = "Doctor";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("doctor_name")
        .eq("id", authResult.id)
        .single();
      if (profile?.doctor_name) {
        doctorName = profile.doctor_name;
      }
    } catch {
      // Non-critical, fallback to default
    }

    // Cashfree order_id: alphanumeric, underscores, hyphens, max 45 chars
    const cleanUserId = authResult.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const orderId = `cf_${cleanUserId}_${Date.now()}`;
    const amountInPaise = selectedPackage.amount * 100;

    // Detect return URL for fallback redirect
    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    const returnUrl = `${origin}/credits?order_id={order_id}`;

    // Create Cashfree Order
    const cfOrder = await createCashfreeOrder({
      order_id: orderId,
      order_amount: selectedPackage.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: cleanUserId || "doctor_user",
        customer_name: doctorName,
        customer_email: authResult.email || "doctor@consentgen.in",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: `ConsentGen: ${selectedPackage.credits} Credits Package (₹${selectedPackage.amount})`,
    });

    // Save pending transaction in database (stored in paise for compatibility)
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: authResult.id,
        order_id: cfOrder.order_id,
        amount: amountInPaise,
        credits: selectedPackage.credits,
        status: "created",
      });

    if (txError) {
      console.error("Failed to log transaction in database:", txError);
      return NextResponse.json(
        { error: "Failed to initialize checkout transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: cfOrder.order_id,
      payment_session_id: cfOrder.payment_session_id,
      amount: selectedPackage.amount,
      currency: "INR",
      environment: config.env,
    });
  } catch (error: any) {
    console.error("Cashfree order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
