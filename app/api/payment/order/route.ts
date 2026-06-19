import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
// We can import Razorpay. Since we installed it, we can import it.
// If typescript complains, we can declare or typecast it.
import Razorpay from "razorpay";

const PACKAGES: Record<number, { credits: number; amount: number }> = {
  200: { credits: 1, amount: 200 },
  1000: { credits: 5, amount: 1000 },
  2000: { credits: 10, amount: 2000 },
  5000: { credits: 25, amount: 5000 },
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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay integration is not configured on the server" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amountInPaise = selectedPackage.amount * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${authResult.id.slice(0, 8)}_${Date.now()}`,
    });

    // Save pending transaction in database
    const supabase = createClient();
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: authResult.id,
        order_id: order.id,
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
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
