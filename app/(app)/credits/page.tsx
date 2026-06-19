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
          color: "#0b0f1a",
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
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Billing</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
              Credit <span className="font-serif italic font-normal text-neutral-600" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>balance</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Top up your balance to generate new consent forms</p>
          </div>

          <div className="bg-neutral-50 rounded-2xl px-6 py-4 flex items-center gap-4 shrink-0 border border-neutral-100">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" weight="duotone" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Available Credits</p>
              <p className="text-2xl font-black text-neutral-900 leading-tight">
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
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                message.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-red-50 border-red-100 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" weight="fill" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-red-600" weight="fill" />
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
              className={`bg-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
                pkg.popular 
                  ? "ring-2 ring-neutral-950 border-neutral-950 scale-[1.01]" 
                  : "border-black/[0.06] hover:border-black/[0.12]"
              }`}
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
            >
              {pkg.popular && (
                <div className="absolute top-3 right-3 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkle weight="fill" className="w-2.5 h-2.5" /> Best Deal
                </div>
              )}
              <div>
                <p className="text-xs uppercase font-bold text-neutral-400">{pkg.label}</p>
                <div className="flex items-baseline gap-1 mt-2 mb-2">
                  <span className="text-4xl font-black text-neutral-950">₹{pkg.amount}</span>
                </div>
                <p className="text-sm font-semibold text-neutral-600 mb-4">{pkg.credits} Credit{pkg.credits > 1 ? "s" : ""}</p>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">{pkg.description}</p>
              </div>

              <button
                onClick={() => handlePurchase(pkg.amount)}
                disabled={buyingAmount !== null || loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center"
                style={{
                  backgroundColor: pkg.popular ? "#0b0f1a" : "#ffffff",
                  color: pkg.popular ? "#ffffff" : "#0b0f1a",
                  border: pkg.popular ? "none" : "1px solid rgba(0,0,0,0.15)",
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
          <div className="bg-white rounded-3xl overflow-hidden border border-black/[0.06]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <ClockCounterClockwise weight="duotone" className="w-4 h-4 text-neutral-600" />
              </div>
              <h2 className="text-sm font-bold text-neutral-950">Usage & Balance Log</h2>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">No credits used or added yet.</div>
            ) : (
              <div className="divide-y divide-black/[0.04] max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        log.amount < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {log.amount < 0 ? (
                          <ArrowDownLeft weight="bold" className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight weight="bold" className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-800 capitalize">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <CalendarBlank className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${log.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                      </p>
                      <p className="text-[10px] text-neutral-400">Bal: {log.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Transactions */}
          <div className="bg-white rounded-3xl overflow-hidden border border-black/[0.06]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <CreditCard weight="duotone" className="w-4 h-4 text-neutral-600" />
              </div>
              <h2 className="text-sm font-bold text-neutral-950">Payment Transactions</h2>
            </div>
            
            {txs.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">No payment transaction records found.</div>
            ) : (
              <div className="divide-y divide-black/[0.04] max-h-96 overflow-y-auto">
                {txs.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-neutral-800">
                          {tx.order_id}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-mono mt-0.5">
                          ID: {tx.payment_id || "Pending"}
                        </p>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1">
                          <CalendarBlank className="w-3 h-3" />
                          {new Date(tx.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-neutral-950">₹{(tx.amount / 100).toFixed(0)}</p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          tx.status === "paid" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : tx.status === "failed" 
                            ? "bg-red-50 text-red-700" 
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      {tx.status === "paid" && (
                        <button
                          onClick={() => setInvoiceTx(tx)}
                          className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
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
          <div id="printable-invoice-modal" className="w-full max-w-[500px] bg-white rounded-3xl p-6 sm:p-8 text-neutral-800 border border-neutral-100 shadow-2xl relative">
            {/* Header */}
            <div className="text-center border-b border-neutral-100 pb-5 mb-5">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Payment Invoice</h2>
              <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Consent Form Generator</p>
            </div>

            {/* Info details */}
            <div className="space-y-4 text-xs mb-6">
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Payer</span>
                <span className="font-bold text-neutral-800 text-right">
                  {invoiceTx.metadata?.billing_doctor_name || profileData.doctorName || "Dr. User"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Registration No.</span>
                <span className="font-bold text-neutral-800 text-right font-mono">
                  {invoiceTx.metadata?.billing_doctor_registration_no || profileData.doctorRegistrationNo || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Hospital</span>
                <span className="font-bold text-neutral-800 text-right">
                  {invoiceTx.metadata?.billing_hospital_name || profileData.hospitalName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Billing Address</span>
                <span className="font-bold text-neutral-800 text-right" style={{ whiteSpace: "pre-line" }}>
                  {invoiceTx.metadata?.billing_address || profileData.billingAddress || profileData.hospitalAddress || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Order ID</span>
                <span className="font-mono text-neutral-800 text-right">{invoiceTx.order_id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Payment ID</span>
                <span className="font-mono text-neutral-800 text-right">{invoiceTx.payment_id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Payment Date</span>
                <span className="font-bold text-neutral-800 text-right">
                  {new Date(invoiceTx.created_at).toLocaleDateString("en-IN")} {new Date(invoiceTx.created_at).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Payment Method</span>
                <span className="font-bold text-neutral-800 capitalize text-right">{invoiceTx.metadata?.method || "Razorpay"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Credits Purchased</span>
                <span className="font-bold text-neutral-800 text-right text-green-600">+{invoiceTx.credits} Credits</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
                <span className="font-bold text-neutral-900 text-sm">Total Paid Amount</span>
                <span className="font-extrabold text-neutral-900 text-base">₹{(invoiceTx.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions (Not printed) */}
            <div className="flex gap-3 mt-6 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 font-bold rounded-xl text-xs border border-neutral-200 transition-all cursor-pointer"
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
