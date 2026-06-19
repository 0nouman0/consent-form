import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import Razorpay from "razorpay";
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay integration is not configured on the server" },
        { status: 500 }
      );
    }

    // Verify Razorpay Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // Connect to Supabase
    const supabase = createClient();

    // Get the pending transaction to know how many credits/amount to add
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("credits, amount")
      .eq("order_id", razorpay_order_id)
      .single();

    if (txError || !tx) {
      console.error("Transaction not found for verification:", txError);
      return NextResponse.json(
        { error: "Transaction record not found" },
        { status: 404 }
      );
    }

    // Fetch payment details from Razorpay to capture mode and other metadata
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: keySecret,
    });

    let paymentMethod = "razorpay";
    let paymentDetails: any = {};

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

    try {
      const payment: any = await razorpay.payments.fetch(razorpay_payment_id);
      paymentMethod = payment.method || "razorpay";
      paymentDetails = {
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        fee: payment.fee,
        tax: payment.tax,
        card_id: payment.card_id,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa, // UPI
        acquirer_data: payment.acquirer_data,
        created_at_timestamp: payment.created_at
      };
    } catch (fetchErr) {
      console.error("Failed to fetch Razorpay details:", fetchErr);
    }

    // Mix in billing details snapshot
    paymentDetails = {
      ...paymentDetails,
      billing_doctor_name: profile?.doctor_name || "",
      billing_doctor_registration_no: profile?.doctor_registration_no || "",
      billing_hospital_name: profile?.hospital_name || "",
      billing_address: profile?.billing_address || profile?.hospital_address || "",
    };

    // Call verify_and_add_credits RPC function
    const { data: newBalance, error: rpcError } = await supabase.rpc(
      "verify_and_add_credits",
      {
        p_user_id: authResult.id,
        p_order_id: razorpay_order_id,
        p_payment_id: razorpay_payment_id,
        p_signature: razorpay_signature,
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

    const userEmail = authResult.email || paymentDetails.email || "mohammednouman604@gmail.com";

    // Send invoice email asynchronously (do not block the response)
    sendInvoiceEmail(userEmail, profile?.doctor_name || "Doctor", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: tx.amount / 100,
      credits: tx.credits,
      date: new Date().toLocaleDateString("en-IN"),
      paymentMethod: paymentMethod,
      billingAddress: paymentDetails.billing_address
    }).catch((emailErr) => {
      console.error("Failed to trigger email delivery:", emailErr);
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and credits added successfully",
      balance: newBalance,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal verification error" },
      { status: 500 }
    );
  }
}
