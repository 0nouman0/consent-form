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
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Payment Log Details" />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
              Loading Transaction Details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title={`Transaction: ${tx.order_id}`} subtitle="Payment Audit & Receipt Breakdown" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-5xl w-full mx-auto pb-16">
          {/* Back Action */}
          <div className="no-print">
            <button
              onClick={() => router.push("/payments")}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-75 cursor-pointer"
              style={{ color: "var(--ink)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Payments Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metadata Audit Card */}
            <div className="md:col-span-1 space-y-4 no-print">
              <div
                className="rounded-md p-5 space-y-4"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <h3 className="font-serif text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Transaction Audit
                </h3>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Payment Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                      style={{
                        backgroundColor:
                          tx.status === "paid"
                            ? "rgba(13, 148, 136, 0.1)"
                            : tx.status === "created"
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(190, 61, 42, 0.1)",
                        color:
                          tx.status === "paid"
                            ? "#0f766e"
                            : tx.status === "created"
                            ? "#1d4ed8"
                            : "var(--red)",
                        border: `1px solid ${
                          tx.status === "paid"
                            ? "rgba(13, 148, 136, 0.25)"
                            : tx.status === "created"
                            ? "rgba(59, 130, 246, 0.25)"
                            : "rgba(190, 61, 42, 0.25)"
                        }`,
                      }}
                    >
                      {tx.status === "paid" && <CheckCircle weight="fill" className="w-3 h-3" />}
                      {tx.status === "created" && <Clock weight="fill" className="w-3 h-3" />}
                      {tx.status === "failed" && <XCircle weight="fill" className="w-3 h-3" />}
                      <span className="capitalize">{tx.status}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 space-y-2.5 text-xs" style={{ borderTop: "1px solid var(--rule)" }}>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                      Database Record UUID
                    </span>
                    <span className="font-mono select-all text-xs" style={{ color: "var(--ink)" }}>{tx.id}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                      Credits Added
                    </span>
                    <span className="font-mono font-bold" style={{ color: "#0f766e" }}>+{tx.credits} Credits</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                      Paid Amount
                    </span>
                    <span className="font-serif font-bold text-base" style={{ color: "var(--ink)" }}>
                      ₹{(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                      Timestamp
                    </span>
                    <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>
                      {new Date(tx.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway Metadata */}
              <div
                className="rounded-md p-5 space-y-3"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <h3 className="font-serif text-sm font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Gateway Metadata
                </h3>
                <div className="space-y-2 text-xs pt-2" style={{ borderTop: "1px solid var(--rule-soft)" }}>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                      Payment Method
                    </span>
                    <span className="font-medium capitalize" style={{ color: "var(--ink)" }}>{tx.metadata?.method || "N/A"}</span>
                  </div>
                  {tx.metadata?.email && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                        Billing Email
                      </span>
                      <span className="font-mono select-all text-xs" style={{ color: "var(--ink)" }}>{tx.metadata.email}</span>
                    </div>
                  )}
                  {tx.metadata?.vpa && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] block" style={{ color: "var(--ink-muted)" }}>
                        UPI VPA
                      </span>
                      <span className="font-mono select-all text-xs" style={{ color: "var(--ink)" }}>{tx.metadata.vpa}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center no-print">
                <span className="font-mono text-xs uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--ink-muted)" }}>
                  Invoice Document
                </span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                  style={{
                    backgroundColor: "var(--ink)",
                    color: "var(--sheet)",
                  }}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
              </div>

              <div
                className="rounded-md p-6 sm:p-8"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div className="border-b pb-4 mb-5" style={{ borderColor: "var(--rule)" }}>
                  <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                    Tax Invoice & Receipt
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    ConsentGen Medico-Legal Platform
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Doctor Payer</span>
                    <span className="font-bold font-serif" style={{ color: "var(--ink)" }}>
                      {tx.metadata?.billing_doctor_name || tx.profiles?.doctor_name || "Doctor"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Registration No.</span>
                    <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                      {tx.metadata?.billing_doctor_registration_no || tx.profiles?.doctor_registration_no || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Hospital</span>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      {tx.metadata?.billing_hospital_name || tx.profiles?.hospital_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Order ID</span>
                    <span className="font-mono" style={{ color: "var(--ink)" }}>{tx.order_id}</span>
                  </div>
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Payment ID</span>
                    <span className="font-mono" style={{ color: "var(--ink)" }}>{tx.payment_id}</span>
                  </div>
                  <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Credits Purchased</span>
                    <span className="font-mono font-bold" style={{ color: "#0f766e" }}>+{tx.credits} Credits</span>
                  </div>
                  <div className="flex justify-between pt-3" style={{ borderTop: "2px solid var(--ink)" }}>
                    <span className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>Total Paid</span>
                    <span className="font-serif font-bold text-lg" style={{ color: "var(--ink)" }}>
                      ₹{(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
