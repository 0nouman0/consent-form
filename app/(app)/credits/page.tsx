"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Coins,
  CheckCircle,
  XCircle,
  ClockCounterClockwise,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarBlank,
  Receipt,
  Sparkle
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";

const PACKAGES = [
  { amount: 200, credits: 1, label: "Starter", popular: false, description: "Perfect for trying out the generator." },
  { amount: 1000, credits: 5, label: "Standard", popular: true, description: "Great for regular practice needs." },
  { amount: 2000, credits: 10, label: "Professional", popular: false, description: "Best value for active clinics." },
  { amount: 5000, credits: 25, label: "Enterprise", popular: false, description: "Ideal for hospitals and research teams." }
];

interface CreditLog {
  id: string;
  amount: number;
  action: string;
  balance_after: number;
  created_at: string;
  reference_id: string | null;
}

interface TxLog {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  metadata?: any;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingAmount, setBuyingAmount] = useState<number | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [txs, setTxs] = useState<TxLog[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileData, setProfileData] = useState({
    doctorName: "",
    doctorRegistrationNo: "",
    hospitalName: "",
    hospitalAddress: "",
    billingAddress: "",
  });
  const [invoiceTx, setInvoiceTx] = useState<TxLog | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch credits and profile details
      const { data: p } = await supabase
        .from("profiles")
        .select("credits, doctor_name, doctor_registration_no, hospital_name, hospital_address, billing_address")
        .eq("id", user.id)
        .single();
      if (p) {
        setCredits(p.credits);
        setProfileData({
          doctorName: p.doctor_name || "",
          doctorRegistrationNo: p.doctor_registration_no || "",
          hospitalName: p.hospital_name || "",
          hospitalAddress: p.hospital_address || "",
          billingAddress: p.billing_address || "",
        });
      }

      // Fetch usage history
      const { data: logData } = await supabase
        .from("credit_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (logData) setLogs(logData);

      // Fetch transaction logs
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (txData) setTxs(txData);

    } catch (e) {
      console.error("Error loading credit details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (amount: number) => {
    setBuyingAmount(amount);
    setMessage(null);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your connection.");
      }

      // 2. Call backend to create order
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error ?? "Failed to initialize order");
      }

      const orderData = await orderRes.json();
      const { order_id, amount: orderAmount, currency, key_id } = orderData;

      const { data: { user } } = await supabase.auth.getUser();

      // 3. Configure Razorpay checkout options
      const options = {
        key: key_id,
        amount: orderAmount,
        currency,
        name: "ConsentGen",
        description: `Purchase ${PACKAGES.find(p => p.amount === amount)?.credits} credits`,
        order_id,
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#171410",
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            // Verify payment on the server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error ?? "Payment verification failed");
            }

            setMessage({
              type: "success",
              text: `Payment successful! ${PACKAGES.find(p => p.amount === amount)?.credits} credits have been added.`
            });

            // Dispatch global event for components (e.g. AppHeader) to reload credits
            window.dispatchEvent(new Event("credits-updated"));

            // Reload user data to update credit balance
            await loadData();
            setBuyingAmount(null);
          } catch (verifyErr: any) {
            setMessage({
              type: "error",
              text: verifyErr.message || "Failed to verify transaction signature."
            });
            setLoading(false);
            setBuyingAmount(null);
          }
        },
        modal: {
          ondismiss: function () {
            setBuyingAmount(null);
          }
        }
      };

      // 4. Open Razorpay payment modal
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "An unexpected error occurred during checkout setup."
      });
      setBuyingAmount(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" style={{ backgroundColor: "var(--paper)" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Header Card */}
        <div className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Billing</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Credit <span style={{ color: "var(--red)" }}>balance</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>Top up your balance to generate new consent forms</p>
          </div>

          <div className="rounded-md px-6 py-4 flex items-center gap-4 shrink-0" style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--ink)" }}>
              <Coins className="w-5 h-5" weight="duotone" style={{ color: "var(--sheet)" }} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold" style={{ color: "var(--ink-muted)" }}>Available Credits</p>
              <p className="font-serif text-2xl font-bold leading-tight" style={{ color: "var(--ink)" }}>
                {credits !== null ? credits : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-md flex items-start gap-3"
              style={
                message.type === "success"
                  ? { backgroundColor: "rgba(63,122,78,0.08)", border: "1px solid rgba(63,122,78,0.2)", color: "#3f7a4e" }
                  : { backgroundColor: "rgba(190,61,42,0.06)", border: "1px solid rgba(190,61,42,0.25)", color: "var(--red)" }
              }
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" weight="fill" style={{ color: "#3f7a4e" }} />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" weight="fill" style={{ color: "var(--red)" }} />
              )}
              <div className="text-sm font-medium">{message.text}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.amount}
              className="rounded-md p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: "var(--sheet)",
                border: pkg.popular ? "1.5px solid var(--ink)" : "1px solid var(--rule)",
              }}
            >
              {pkg.popular && (
                <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ backgroundColor: "var(--red)", color: "var(--sheet)" }}>
                  <Sparkle weight="fill" className="w-2.5 h-2.5" /> Best Deal
                </div>
              )}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold" style={{ color: "var(--ink-muted)" }}>{pkg.label}</p>
                <div className="flex items-baseline gap-1 mt-2 mb-2">
                  <span className="font-serif text-4xl font-bold" style={{ color: "var(--ink)" }}>₹{pkg.amount}</span>
                </div>
                <p className="text-sm font-semibold mb-4" style={{ color: "var(--ink-soft)" }}>{pkg.credits} Credit{pkg.credits > 1 ? "s" : ""}</p>
                <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--ink-muted)" }}>{pkg.description}</p>
              </div>

              <button
                onClick={() => handlePurchase(pkg.amount)}
                disabled={buyingAmount !== null || loading}
                className="w-full py-2.5 rounded-md text-xs font-bold transition-all text-center flex items-center justify-center hover:opacity-90"
                style={{
                  backgroundColor: pkg.popular ? "var(--ink)" : "var(--sheet)",
                  color: pkg.popular ? "var(--sheet)" : "var(--ink)",
                  border: pkg.popular ? "none" : "1px solid var(--rule)",
                }}
              >
                {buyingAmount === pkg.amount ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Buy Package`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* History Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Credit Usage History */}
          <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid var(--rule)" }}>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
                <ClockCounterClockwise weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              </div>
              <h2 className="font-serif text-sm font-bold" style={{ color: "var(--ink)" }}>Usage & Balance Log</h2>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-xs" style={{ color: "var(--ink-muted)" }}>No credits used or added yet.</div>
            ) : (
              <div className="divide-y divide-[var(--rule-soft)] max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={
                          log.amount < 0
                            ? { color: "var(--red)", backgroundColor: "rgba(190,61,42,0.08)" }
                            : { color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)" }
                        }
                      >
                        {log.amount < 0 ? (
                          <ArrowDownLeft weight="bold" className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight weight="bold" className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold capitalize" style={{ color: "var(--ink)" }}>
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          <CalendarBlank className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: log.amount < 0 ? "var(--red)" : "#3f7a4e" }}>
                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>Bal: {log.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Transactions */}
          <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid var(--rule)" }}>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
                <CreditCard weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              </div>
              <h2 className="font-serif text-sm font-bold" style={{ color: "var(--ink)" }}>Payment Transactions</h2>
            </div>

            {txs.length === 0 ? (
              <div className="text-center py-12 text-xs" style={{ color: "var(--ink-muted)" }}>No payment transaction records found.</div>
            ) : (
              <div className="divide-y divide-[var(--rule-soft)] max-h-96 overflow-y-auto">
                {txs.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}>
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                          {tx.order_id}
                        </p>
                        <p className="text-[9px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          ID: {tx.payment_id || "Pending"}
                        </p>
                        <p className="text-[10px] flex items-center gap-1 mt-1" style={{ color: "var(--ink-muted)" }}>
                          <CalendarBlank className="w-3 h-3" />
                          {new Date(tx.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "var(--ink)" }}>₹{(tx.amount / 100).toFixed(0)}</p>
                        <span
                          className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1"
                          style={
                            tx.status === "paid"
                              ? { color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)" }
                              : tx.status === "failed"
                              ? { color: "var(--red)", backgroundColor: "rgba(190,61,42,0.08)" }
                              : { color: "#92400e", backgroundColor: "rgba(146,64,14,0.08)" }
                          }
                        >
                          {tx.status}
                        </span>
                      </div>
                      {tx.status === "paid" && (
                        <button
                          onClick={() => setInvoiceTx(tx)}
                          className="p-2 rounded-md transition-all cursor-pointer hover:bg-[rgba(23,20,16,0.06)]"
                          style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)", border: "1px solid var(--rule)" }}
                          title="View Invoice"
                        >
                          <Receipt weight="bold" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Invoice Modal */}
      {invoiceTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 print:p-0 print:bg-white" style={{ backgroundColor: "rgba(23,20,16,0.5)" }}>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-invoice-modal, #printable-invoice-modal * {
                visibility: visible;
              }
              #printable-invoice-modal {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />
          <div id="printable-invoice-modal" className="w-full max-w-[500px] rounded-md p-6 sm:p-8 relative" style={{ backgroundColor: "var(--sheet)", color: "var(--ink-soft)", border: "1px solid var(--rule)" }}>
            {/* Header */}
            <div className="text-center pb-5 mb-5" style={{ borderBottom: "1px solid var(--rule)" }}>
              <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>Payment Invoice</h2>
              <p className="font-mono text-[11px] mt-1 uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--ink-muted)" }}>Consent Form Generator</p>
            </div>

            {/* Info details */}
            <div className="space-y-4 text-xs mb-6">
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payer</span>
                <span className="font-bold text-right" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_doctor_name || profileData.doctorName || "Dr. User"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Registration No.</span>
                <span className="font-bold text-right font-mono" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_doctor_registration_no || profileData.doctorRegistrationNo || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Hospital</span>
                <span className="font-bold text-right" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_hospital_name || profileData.hospitalName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Billing Address</span>
                <span className="font-bold text-right" style={{ color: "var(--ink)", whiteSpace: "pre-line" }}>
                  {invoiceTx.metadata?.billing_address || profileData.billingAddress || profileData.hospitalAddress || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Order ID</span>
                <span className="font-mono text-right" style={{ color: "var(--ink)" }}>{invoiceTx.order_id}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payment ID</span>
                <span className="font-mono text-right" style={{ color: "var(--ink)" }}>{invoiceTx.payment_id}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payment Date</span>
                <span className="font-bold text-right" style={{ color: "var(--ink)" }}>
                  {new Date(invoiceTx.created_at).toLocaleDateString("en-IN")} {new Date(invoiceTx.created_at).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payment Method</span>
                <span className="font-bold capitalize text-right" style={{ color: "var(--ink)" }}>{invoiceTx.metadata?.method || "Razorpay"}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Credits Purchased</span>
                <span className="font-bold text-right" style={{ color: "#3f7a4e" }}>+{invoiceTx.credits} Credits</span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: "2px solid var(--ink)" }}>
                <span className="font-bold text-sm" style={{ color: "var(--ink)" }}>Total Paid Amount</span>
                <span className="font-extrabold text-base" style={{ color: "var(--ink)" }}>₹{(invoiceTx.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions (Not printed) */}
            <div className="flex gap-3 mt-6 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 font-bold rounded-md text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                Print Invoice
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="px-4 py-2.5 font-bold rounded-md text-xs transition-all cursor-pointer hover:bg-[rgba(23,20,16,0.06)]"
                style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)", border: "1px solid var(--rule)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
