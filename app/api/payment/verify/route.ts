import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { sendInvoiceEmail } from "@/lib/email";

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
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { error: "Missing order_id parameter" },
        { status: 400 }
      );
    }

    // Fetch payment status from Cashfree
    const paymentsRes = await fetch(
      `${CASHFREE_BASE}/orders/${order_id}/payments`,
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": appId,
          "x-client-secret": secretKey,
        },
      }
    );

    if (!paymentsRes.ok) {
      const err = await paymentsRes.json();
      console.error("Cashfree payment fetch failed:", err);
      return NextResponse.json(
        { error: err.message ?? "Failed to fetch payment status" },
        { status: 500 }
      );
    }

    const payments: any[] = await paymentsRes.json();

    // Find the successful payment
    const successfulPayment = payments.find(
      (p: any) => p.payment_status === "SUCCESS"
    );

    if (!successfulPayment) {
      return NextResponse.json(
        { error: "No successful payment found for this order" },
        { status: 400 }
      );
    }

    const cf_payment_id = String(successfulPayment.cf_payment_id);
    const paymentMethod = successfulPayment.payment_group ?? "cashfree";

    const supabase = createClient();

    // Get pending transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("credits, amount")
      .eq("order_id", order_id)
      .single();

    if (txError || !tx) {
      console.error("Transaction not found:", txError);
      return NextResponse.json(
        { error: "Transaction record not found" },
        { status: 404 }
      );
    }

    // Load user profile for billing snapshot
    let profile: any = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select(
          "doctor_name, doctor_registration_no, hospital_name, billing_address, hospital_address"
        )
        .eq("id", user.id)
        .single();
      profile = data;
    } catch (profileErr) {
      console.error("Failed to load profile:", profileErr);
    }

    const paymentDetails = {
      method: paymentMethod,
      cf_payment_id,
      billing_doctor_name: profile?.doctor_name ?? "",
      billing_doctor_registration_no: profile?.doctor_registration_no ?? "",
      billing_hospital_name: profile?.hospital_name ?? "",
      billing_address:
        profile?.billing_address ?? profile?.hospital_address ?? "",
    };

    // Credit the account via RPC
    const { data: newBalance, error: rpcError } = await supabase.rpc(
      "verify_and_add_credits",
      {
        p_user_id: user.id,
        p_order_id: order_id,
        p_payment_id: cf_payment_id,
        p_signature: cf_payment_id, // Cashfree doesn't use a client-side signature; use payment_id as reference
        p_amount: tx.amount,
        p_credits: tx.credits,
        p_metadata: paymentDetails,
      }
    );

    if (rpcError) {
      console.error("RPC verify_and_add_credits failed:", rpcError);
      return NextResponse.json(
        { error: "Failed to credit account balance" },
        { status: 500 }
      );
    }

    // Send invoice email asynchronously
    sendInvoiceEmail(
      user.email ?? "",
      profile?.doctor_name ?? "Doctor",
      {
        orderId: order_id,
        paymentId: cf_payment_id,
        amount: tx.amount / 100,
        credits: tx.credits,
        date: new Date().toLocaleDateString("en-IN"),
        paymentMethod,
        billingAddress: paymentDetails.billing_address,
      }
    ).catch((e) => console.error("Invoice email failed:", e));

    return NextResponse.json({
      success: true,
      message: "Payment verified and credits added successfully",
      balance: newBalance,
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal verification error" },
      { status: 500 }
    );
  }
}
