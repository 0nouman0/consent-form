import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getCashfreeOrder, getCashfreeOrderPayments, getCashfreeConfig } from "@/lib/cashfree";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getUserWithRole();
  if (!user || !hasPermission(user.role, "generate")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const authResult = user;

  try {
    const body = await req.json();
    const orderId = body.order_id || body.orderId || body.cf_order_id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required order_id for payment verification" },
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

    // 1. Fetch order details from Cashfree directly
    const cfOrder = await getCashfreeOrder(orderId);

    // 2. Fetch payment attempts for this order
    let cfPayments: any[] = [];
    try {
      cfPayments = await getCashfreeOrderPayments(orderId);
    } catch (paymentFetchErr) {
      console.warn("Could not fetch detailed Cashfree payments list:", paymentFetchErr);
    }

    const successfulPayment = cfPayments.find((p) => p.payment_status === "SUCCESS");
    const isOrderPaid = cfOrder.order_status === "PAID" || Boolean(successfulPayment);

    if (!isOrderPaid) {
      return NextResponse.json(
        {
          error: `Payment verification failed: Order status is ${cfOrder.order_status || "UNKNOWN"}`,
          order_status: cfOrder.order_status,
        },
        { status: 400 }
      );
    }

    // 3. Extract payment metadata
    const paymentId = successfulPayment?.cf_payment_id
      ? String(successfulPayment.cf_payment_id)
      : `cf_pay_${orderId}`;

    const paymentGroup = successfulPayment?.payment_group || "cashfree";
    const paymentMethodName = successfulPayment?.payment_group
      ? `Cashfree (${successfulPayment.payment_group.toUpperCase()})`
      : "Cashfree";

    // Connect to Supabase
    const supabase = createClient();

    // 4. Get the pending transaction from our DB
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("credits, amount, status")
      .eq("order_id", orderId)
      .single();

    if (txError || !tx) {
      console.error("Transaction not found for verification:", txError);
      return NextResponse.json(
        { error: "Transaction record not found in system database" },
        { status: 404 }
      );
    }

    // Retrieve user profile for invoicing & metadata snapshot
    let profile: any = null;
    try {
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("doctor_name, doctor_registration_no, hospital_name, billing_address, hospital_address")
        .eq("id", authResult.id)
        .single();
      if (!pErr) {
        profile = data;
      }
    } catch (profileErr) {
      console.error("Failed to load user profile for snapshot:", profileErr);
    }

    const paymentDetails = {
      provider: "cashfree",
      method: paymentGroup,
      cf_order_id: cfOrder.cf_order_id,
      cf_payment_id: paymentId,
      order_id: orderId,
      bank_reference: successfulPayment?.bank_reference || "",
      payment_time: successfulPayment?.payment_time || cfOrder.created_at,
      billing_doctor_name: profile?.doctor_name || "",
      billing_doctor_registration_no: profile?.doctor_registration_no || "",
      billing_hospital_name: profile?.hospital_name || "",
      billing_address: profile?.billing_address || profile?.hospital_address || "",
    };

    // 5. Call verify_and_add_credits RPC function
    const { data: newBalance, error: rpcError } = await supabase.rpc(
      "verify_and_add_credits",
      {
        p_user_id: authResult.id,
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_signature: `cashfree_verified_${Date.now()}`,
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

    const userEmail = authResult.email || "doctor@consentgen.in";

    // 6. Send invoice email asynchronously
    sendInvoiceEmail(userEmail, profile?.doctor_name || "Doctor", {
      orderId: orderId,
      paymentId: paymentId,
      amount: tx.amount / 100,
      credits: tx.credits,
      date: new Date().toLocaleDateString("en-IN"),
      paymentMethod: paymentMethodName,
      billingAddress: paymentDetails.billing_address,
    }).catch((emailErr) => {
      console.error("Failed to trigger email delivery:", emailErr);
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and credits added successfully",
      balance: newBalance,
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error("Cashfree verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal verification error" },
      { status: 500 }
    );
  }
}
