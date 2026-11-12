import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

const PACKAGES: Record<number, { credits: number; amount: number }> = {
  200: { credits: 1, amount: 200 },
  1000: { credits: 5, amount: 1000 },
  2000: { credits: 10, amount: 2000 },
  5000: { credits: 25, amount: 5000 },
};

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export async function POST(req: NextRequest) {
  const user = await getUserWithRole();
  if (!user || !hasPermission(user.role, "generate")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    return NextResponse.json(
      { error: "Cashfree integration is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const { amount } = await req.json();

    const selectedPackage = PACKAGES[amount];
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package amount selected" },
        { status: 400 }
      );
    }

    const orderId = `cg_${user.id.slice(0, 8)}_${Date.now()}`;

    const cashfreeRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: selectedPackage.amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_email: user.email ?? "",
          customer_phone: "9999999999", // placeholder — Cashfree requires a phone number
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/credits?order_id=${orderId}`,
        },
      }),
    });

    if (!cashfreeRes.ok) {
      const err = await cashfreeRes.json();
      console.error("Cashfree order creation failed:", err);
      return NextResponse.json(
        { error: err.message ?? "Failed to create Cashfree order" },
        { status: 500 }
      );
    }

    const cashfreeOrder = await cashfreeRes.json();

    // Persist pending transaction
    const supabase = createClient();
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: orderId,
      amount: selectedPackage.amount * 100, // store in paise for consistency
      credits: selectedPackage.credits,
      status: "created",
    });

    if (txError) {
      console.error("Failed to log transaction:", txError);
      return NextResponse.json(
        { error: "Failed to initialize checkout transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: orderId,
      payment_session_id: cashfreeOrder.payment_session_id,
      amount: selectedPackage.amount,
      currency: "INR",
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
