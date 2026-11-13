import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

/**
 * Credit handling for form generation.
 *
 *  - "reserved": the credit is taken BEFORE the model is called (deduct_credit, row-locked and atomic),
 *    so parallel requests cannot all pass a stale balance check. If generation then fails, the credit is
 *    given back with refund_credit (idempotent per reference).
 *  - "deferred": fallback used only until migration 20261113000100_refund_credit has been applied.
 *    The credit is taken after a successful generation, as before.
 *
 * Everything here uses the service-role client; the credit functions are not callable by end users.
 */

export type Reservation = {
  mode: "reserved" | "deferred";
  userId: string;
  reference: string;
};

export type ReserveResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; status: 402 | 500 | 503; error: string };

const GHOST_USER = "00000000-0000-0000-0000-000000000001";

let refundSupported: { value: boolean; checkedAt: number } | null = null;

/** Is refund_credit installed? Cached; re-checked every 30s while missing so applying the migration takes effect without a restart. */
async function supportsRefund(): Promise<boolean> {
  const now = Date.now();
  if (refundSupported && (refundSupported.value || now - refundSupported.checkedAt < 30_000)) {
    return refundSupported.value;
  }
  const { error } = await createAdminClient().rpc("refund_credit", {
    p_user_id: GHOST_USER,
    p_reference_id: "capability-probe",
  });
  // PGRST202 = function not found. Any other outcome (including null result for the ghost user) means it exists.
  const value = error?.code !== "PGRST202";
  refundSupported = { value, checkedAt: now };
  return value;
}

export async function reserveCredit(userId: string, reference: string): Promise<ReserveResult> {
  if (!hasServiceRole()) {
    // Fail closed: without the service key we cannot charge, and must not hand out free generations.
    console.error("billing: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return { ok: false, status: 503, error: "Billing is temporarily unavailable. Please try again shortly." };
  }

  if (!(await supportsRefund())) {
    console.warn("billing: refund_credit not installed — using deferred charging (apply supabase/migrations)");
    return { ok: true, reservation: { mode: "deferred", userId, reference } };
  }

  const { error } = await createAdminClient().rpc("deduct_credit", {
    p_user_id: userId,
    p_reference_id: reference,
  });

  if (error) {
    if (/insufficient credits/i.test(error.message)) {
      return {
        ok: false,
        status: 402,
        error: "Insufficient credits. Please buy credits to generate consent forms.",
      };
    }
    console.error("billing: reserve failed", error);
    return { ok: false, status: 500, error: "Could not reserve a credit. Please try again." };
  }

  return { ok: true, reservation: { mode: "reserved", userId, reference } };
}

/** Called after a successful generation. Deferred mode charges now; reserved mode has nothing left to do. */
export async function settleSuccess(r: Reservation): Promise<{ charged: boolean; error?: string }> {
  if (r.mode === "reserved") return { charged: true };

  const { error } = await createAdminClient().rpc("deduct_credit", {
    p_user_id: r.userId,
    p_reference_id: r.reference,
  });
  if (error) {
    console.error("billing: deferred charge failed", error);
    return { charged: false, error: error.message };
  }
  return { charged: true };
}

/** Called when generation fails. Reserved mode refunds; deferred mode never charged, so nothing to undo. */
export async function settleFailure(r: Reservation): Promise<{ refunded: boolean }> {
  if (r.mode !== "reserved") return { refunded: false };

  const { error } = await createAdminClient().rpc("refund_credit", {
    p_user_id: r.userId,
    p_reference_id: r.reference,
  });
  if (error) {
    // The user was charged and the refund failed — this needs a human. Make it loud.
    console.error(`billing: CRITICAL refund failed for user ${r.userId} ref ${r.reference}`, error);
    return { refunded: false };
  }
  return { refunded: true };
}

/** Test helper. */
export function _resetBillingCache() {
  refundSupported = null;
}
