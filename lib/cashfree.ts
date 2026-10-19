/**
 * Cashfree Payment Gateway Client & Helper Functions
 * Supports Cashfree API v2023-08-01 (Order creation, Order fetch, Payment status)
 */

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone: string;
}

export interface CashfreeOrderParams {
  order_id: string;
  order_amount: number; // in INR (e.g. 150.00)
  order_currency?: string;
  customer_details: CashfreeCustomerDetails;
  order_meta?: {
    return_url?: string;
    notify_url?: string;
    payment_methods?: string;
  };
  order_note?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | string;
  order_amount: number;
  order_currency: string;
  payment_session_id: string;
  entity: string;
  created_at: string;
  order_expiry_time?: string;
  customer_details?: CashfreeCustomerDetails;
}

export interface CashfreePaymentItem {
  cf_payment_id: string;
  order_id: string;
  entity: string;
  payment_currency: string;
  payment_amount: number;
  payment_time: string;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED" | string;
  payment_group?: string; // "upi", "card", "netbanking", "wallet"
  payment_method?: Record<string, any>;
  bank_reference?: string;
  auth_id?: string;
}

export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
  const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase();

  const baseUrl = env === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

  return {
    appId,
    secretKey,
    apiVersion,
    env,
    baseUrl,
    isConfigured: Boolean(appId && secretKey),
  };
}

/**
 * Create a new Payment Order on Cashfree
 */
export async function createCashfreeOrder(params: CashfreeOrderParams): Promise<CashfreeOrderResponse> {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    throw new Error("Cashfree Payment Gateway is not configured on the server (missing credentials).");
  }

  const response = await fetch(`${config.baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.appId!,
      "x-client-secret": config.secretKey!,
      "x-api-version": config.apiVersion,
    },
    body: JSON.stringify({
      order_id: params.order_id,
      order_amount: params.order_amount,
      order_currency: params.order_currency || "INR",
      customer_details: {
        customer_id: params.customer_details.customer_id,
        customer_name: params.customer_details.customer_name || "Doctor",
        customer_email: params.customer_details.customer_email || "doctor@consentgen.in",
        customer_phone: params.customer_details.customer_phone || "9999999999",
      },
      order_meta: params.order_meta,
      order_note: params.order_note,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Cashfree Order API returned status ${response.status}`;
    console.error("Cashfree Order Creation Error:", data);
    throw new Error(errorMsg);
  }

  return data as CashfreeOrderResponse;
}

/**
 * Fetch Order details from Cashfree
 */
export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrderResponse> {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    throw new Error("Cashfree Payment Gateway is not configured on the server.");
  }

  const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "x-client-id": config.appId!,
      "x-client-secret": config.secretKey!,
      "x-api-version": config.apiVersion,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Cashfree Fetch Order API returned status ${response.status}`;
    console.error("Cashfree Fetch Order Error:", data);
    throw new Error(errorMsg);
  }

  return data as CashfreeOrderResponse;
}

/**
 * Fetch Payment attempts for an Order from Cashfree
 */
export async function getCashfreeOrderPayments(orderId: string): Promise<CashfreePaymentItem[]> {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    throw new Error("Cashfree Payment Gateway is not configured on the server.");
  }

  const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: {
      "x-client-id": config.appId!,
      "x-client-secret": config.secretKey!,
      "x-api-version": config.apiVersion,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Cashfree Fetch Payments API returned status ${response.status}`;
    console.error("Cashfree Fetch Payments Error:", data);
    throw new Error(errorMsg);
  }

  return Array.isArray(data) ? (data as CashfreePaymentItem[]) : [];
}
