"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, Clock, XCircle, Receipt, Printer } from "@phosphor-icons/react";

export default function PaymentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<any>(null);

  useEffect(() => {
    async function loadPaymentDetail() {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*, profiles(*)")
          .eq("id", id)
          .single();

        if (error || !data) {
          router.push("/payments");
          return;
        }

        setTx(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading payment detail:", err);
        router.push("/payments");
      }
    }

    if (id) loadPaymentDetail();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen">
          <Header title="Payment Log Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title={`Transaction: ${tx.order_id}`} />

        <main className="p-6 space-y-6 max-w-5xl w-full mx-auto">
          {/* Back Action */}
          <div className="no-print">
            <button
              onClick={() => router.push("/payments")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Payments Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadata Audit Card */}
            <div className="md:col-span-1 space-y-6 no-print">
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Transaction Audit</h3>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-muted">Payment Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : tx.status === "created"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {tx.status === "paid" && <CheckCircle weight="fill" />}
                      {tx.status === "created" && <Clock weight="fill" />}
                      {tx.status === "failed" && <XCircle weight="fill" />}
                      <span className="capitalize">{tx.status}</span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-card-border pt-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted block">Database Record UUID</span>
                    <span className="font-mono text-foreground select-all">{tx.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Credits Added</span>
                    <span className="font-bold text-amber-500">+{tx.credits} Credits</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Paid Amount</span>
                    <span className="font-bold text-foreground">₹{(tx.amount / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Transaction Timestamp</span>
                    <span className="text-foreground">{new Date(tx.created_at).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Razorpay API Metadata Details */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">API Payment Gateway Metadata</h3>
                <div className="space-y-2.5 text-xs border-t border-card-border pt-3">
                  <div>
                    <span className="text-[10px] text-muted block">Payment Method</span>
                    <span className="font-semibold text-foreground capitalize">{tx.metadata?.method || "N/A"}</span>
                  </div>
                  {tx.metadata?.email && (
                    <div>
                      <span className="text-[10px] text-muted block">Gateway Billing Email</span>
                      <span className="text-foreground select-all">{tx.metadata.email}</span>
                    </div>
                  )}
                  {tx.metadata?.contact && (
                    <div>
                      <span className="text-[10px] text-muted block">Gateway Contact No.</span>
                      <span className="text-foreground select-all">{tx.metadata.contact}</span>
                    </div>
                  )}
                  {tx.metadata?.vpa && (
                    <div>
                      <span className="text-[10px] text-muted block">UPI VPA Address</span>
                      <span className="text-foreground font-mono select-all">{tx.metadata.vpa}</span>
                    </div>
                  )}
                  {tx.metadata?.bank && (
                    <div>
                      <span className="text-[10px] text-muted block">Issuing Bank</span>
                      <span className="text-foreground font-semibold">{tx.metadata.bank}</span>
                    </div>
                  )}
                  {tx.metadata?.wallet && (
                    <div>
                      <span className="text-[10px] text-muted block">Mobile Wallet Provider</span>
                      <span className="text-foreground font-semibold capitalize">{tx.metadata.wallet}</span>
                    </div>
                  )}
                  {tx.metadata?.fee !== undefined && (
                    <div>
                      <span className="text-[10px] text-muted block">Gateway Processing Fee (Incl. Tax)</span>
                      <span className="text-foreground">₹{(tx.metadata.fee / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {tx.metadata?.tax !== undefined && (
                    <div>
                      <span className="text-[10px] text-muted block">Gateway Service Tax (GST) portion</span>
                      <span className="text-foreground">₹{(tx.metadata.tax / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center no-print">
                <span className="text-xs text-muted font-bold uppercase tracking-wider">Invoice Render</span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
              </div>

              {/* Invoice Layout */}
              <div id="printable-invoice-modal" className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-2xl text-neutral-800">
                <div className="text-center border-b border-neutral-100 pb-5 mb-6">
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Payment Invoice</h2>
                  <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Consent Form Generator</p>
                </div>

                <div className="space-y-4 text-xs mb-8">
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Doctor Payer</span>
                    <span className="font-bold text-neutral-800 text-right">
                      {tx.metadata?.billing_doctor_name || tx.profiles?.doctor_name || "Doctor"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Registration No.</span>
                    <span className="font-bold text-neutral-800 text-right font-mono">
                      {tx.metadata?.billing_doctor_registration_no || tx.profiles?.doctor_registration_no || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Hospital</span>
                    <span className="font-bold text-neutral-800 text-right">
                      {tx.metadata?.billing_hospital_name || tx.profiles?.hospital_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Billing Address</span>
                    <span className="font-bold text-neutral-800 text-right" style={{ whiteSpace: "pre-line" }}>
                      {tx.metadata?.billing_address || tx.profiles?.billing_address || tx.profiles?.hospital_address || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Order ID</span>
                    <span className="font-mono text-neutral-800 text-right">{tx.order_id}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Payment ID</span>
                    <span className="font-mono text-neutral-800 text-right">{tx.payment_id || "Pending"}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Payment Date</span>
                    <span className="font-bold text-neutral-800 text-right">
                      {new Date(tx.created_at).toLocaleDateString("en-IN")} {new Date(tx.created_at).toLocaleTimeString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Payment Method</span>
                    <span className="font-bold text-neutral-800 capitalize text-right">{tx.metadata?.method || "Razorpay"}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                    <span className="text-neutral-400">Credits Purchased</span>
                    <span className="font-bold text-neutral-800 text-right text-green-600">+{tx.credits} Credits</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
                    <span className="font-bold text-neutral-900 text-sm">Total Paid Amount</span>
                    <span className="font-extrabold text-neutral-900 text-base">₹{(tx.amount / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 text-center border border-neutral-100">
                  <p className="text-[10px] text-neutral-400">This is a system generated print receipt for ConsentGen.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
