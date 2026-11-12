import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { sendInvoiceEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * Cashfree Webhook Handler
 *
 * Register this URL in Cashfree Dashboard → Developers → Webhooks:
 *   https://your-domain.com/api/payment/webhook
 *
 * Events to subscribe: PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK
 *
 * Cashfree signs each webhook with:
 *   HMAC-SHA256( timestamp + rawBody, secretKey )
 * sent in headers: x-webhook-signature, x-webhook-timestamp
 */

function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secretKey: string
): boolean {
  const payload = timestamp + rawBody;
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey || !hasServiceRole()) {
    // The webhook has no user session, so it needs the service-role key to read the transaction
    // and credit the account.
    console.error("Cashfree webhook not configured (CASHFREE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY)");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";

  // Verify signature
  if (!verifyWebhookSignature(rawBody, timestamp, signature, secretKey)) {
    console.error("Cashfree webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType: string = event?.type ?? "";
  const paymentData = event?.data?.payment ?? {};
  const orderData = event?.data?.order ?? {};

  // Only handle successful payments
  if (eventType !== "PAYMENT_SUCCESS_WEBHOOK") {
    return NextResponse.json({ received: true, skipped: eventType });
  }

  const orderId: string = orderData.order_id ?? paymentData.order_id ?? "";
  const cfPaymentId: string = String(paymentData.cf_payment_id ?? "");
  const paymentGroup: string = paymentData.payment_group ?? "cashfree";

  if (!orderId) {
    console.error("Cashfree webhook: missing order_id", event);
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up our pending transaction
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("user_id, credits, amount, status")
    .eq("order_id", orderId)
    .single();

  if (txError || !tx) {
    console.error("Cashfree webhook: transaction not found for order", orderId, txError);
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Idempotency — skip if already credited
  if (tx.status === "paid") {
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Load user profile for billing snapshot
  let profile: any = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("doctor_name, doctor_registration_no, hospital_name, billing_address, hospital_address, email")
      .eq("id", tx.user_id)
      .single();
    profile = data;
  } catch {
    // Non-critical
  }

  const paymentDetails = {
    provider: "cashfree",
    method: paymentGroup,
    cf_payment_id: cfPaymentId,
    order_id: orderId,
    bank_reference: paymentData.bank_reference ?? "",
    payment_time: paymentData.payment_time ?? new Date().toISOString(),
    billing_doctor_name: profile?.doctor_name ?? "",
    billing_doctor_registration_no: profile?.doctor_registration_no ?? "",
    billing_hospital_name: profile?.hospital_name ?? "",
    billing_address: profile?.billing_address ?? profile?.hospital_address ?? "",
  };

  // Credit the account via RPC
  const { error: rpcError } = await supabase.rpc("verify_and_add_credits", {
    p_user_id: tx.user_id,
    p_order_id: orderId,
    p_payment_id: cfPaymentId,
    p_signature: `webhook_verified_${cfPaymentId}`,
    p_amount: tx.amount,
    p_credits: tx.credits,
    p_metadata: paymentDetails,
  });

  if (rpcError) {
    console.error("Cashfree webhook: RPC failed for order", orderId, rpcError);
    // Return 500 so Cashfree retries the webhook
    return NextResponse.json({ error: "Failed to credit account" }, { status: 500 });
  }

  // Send invoice email (fire and forget)
  const userEmail = profile?.email ?? paymentData.customer_details?.customer_email ?? "";
  if (userEmail) {
    sendInvoiceEmail(userEmail, profile?.doctor_name ?? "Doctor", {
      orderId,
      paymentId: cfPaymentId,
      amount: tx.amount / 100,
      credits: tx.credits,
      date: new Date().toLocaleDateString("en-IN"),
      paymentMethod: paymentGroup,
      billingAddress: paymentDetails.billing_address,
    }).catch((e) => console.error("Webhook invoice email failed:", e));
  }

  console.log(`Cashfree webhook: credited ${tx.credits} credits for order ${orderId}`);
  return NextResponse.json({ received: true, credited: tx.credits });
}
