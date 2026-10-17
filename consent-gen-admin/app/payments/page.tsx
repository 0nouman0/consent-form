"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/fetchWithTimeout";
import {
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  CreditCard,
  Printer,
  X,
} from "@phosphor-icons/react";

export default function PaymentsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceTx, setInvoiceTx] = useState<any>(null);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await withTimeout(
        supabase
          .from("transactions")
          .select("*, profiles(doctor_name, hospital_name, doctor_registration_no, billing_address, hospital_address)")
          .order("created_at", { ascending: false })
      );
      if (data) setTxs(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading payments list:", err);
      setError(err?.message || "Failed to connect to the database.");
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filters
  const filteredTxs = txs.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (tx.order_id || "").toLowerCase().includes(term) ||
      (tx.payment_id || "").toLowerCase().includes(term) ||
      (tx.profiles?.doctor_name || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPaidRevenue = filteredTxs
    .filter((tx) => tx.status === "paid")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0) / 100;

  if (loading || error) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Billing & Payments" />
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
              />
              <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                Loading Transactions...
              </p>
            </div>
          ) : (
            <NetworkErrorBanner message={error!} onRetry={fetchPayments} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body transition-colors duration-150" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title="Billing & Payments" subtitle="Gateway Reconciliations & Revenue Invoices" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Top Page Banner */}
          <div
            className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                Accounting
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Billing & <span style={{ color: "var(--red)" }}>payments</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
                Audit gateway orders, payment webhooks, and issue printable tax invoices.
              </p>
            </div>
          </div>

          {/* Revenue Highlight Card */}
          <div
            className="rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-dark-bg)" }}
              >
                <CreditCard weight="duotone" className="w-5 h-5" style={{ color: "var(--badge-dark-text)" }} />
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Filtered Revenue Sum
                </p>
                <h2 className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  ₹{totalPaidRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Total Orders</p>
                <p className="font-bold text-sm mt-0.5" style={{ color: "var(--ink)" }}>{filteredTxs.length}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Paid Status</p>
                <p className="font-bold text-sm mt-0.5 text-emerald-500">
                  {filteredTxs.filter((t) => t.status === "paid").length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            className="rounded-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              <input
                type="text"
                placeholder="Search Order ID, Payment ID, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-md text-xs outline-none transition-all"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
              />
            </div>

            {/* Select filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
              >
                <Funnel className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--input-text)" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="created">Created / Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div
            className="rounded-md overflow-hidden transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Doctor / Account</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Order ID</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Payment ID</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Amount</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Credits Added</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Date</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Status</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--rule-soft)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--row-hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td className="py-4 px-6 font-medium">
                        <Link
                          href={`/users/${tx.user_id}`}
                          className="font-serif font-bold text-sm transition-colors hover:opacity-75"
                          style={{ color: "var(--ink)" }}
                        >
                          {tx.profiles?.doctor_name || "Doctor Account"}
                        </Link>
                        <span className="text-[10px] font-mono block mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          {tx.user_id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono font-medium select-all" style={{ color: "var(--ink)" }}>
                        {tx.order_id}
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-mono select-all font-medium" style={{ color: "var(--ink)" }}>
                          {tx.payment_id || "Pending"}
                        </p>
                        {tx.metadata?.method && (
                          <p className="text-[10px] font-mono uppercase tracking-[0.08em] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                            {tx.metadata.method} {tx.metadata.vpa ? `(${tx.metadata.vpa})` : tx.metadata.bank ? `(${tx.metadata.bank})` : ""}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-right text-sm" style={{ color: "var(--ink)" }}>
                        ₹{(tx.amount / 100).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-center text-emerald-500">
                        +{tx.credits}
                      </td>

                      <td className="py-4 px-6 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        {new Date(tx.created_at).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                          style={{
                            backgroundColor:
                              tx.status === "paid"
                                ? "var(--status-success-bg)"
                                : tx.status === "created"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "var(--status-fail-bg)",
                            color:
                              tx.status === "paid"
                                ? "var(--status-success-text)"
                                : tx.status === "created"
                                ? "#3b82f6"
                                : "var(--status-fail-text)",
                            border: `1px solid ${
                              tx.status === "paid"
                                ? "var(--status-success-border)"
                                : tx.status === "created"
                                ? "rgba(59, 130, 246, 0.3)"
                                : "var(--status-fail-border)"
                            }`,
                          }}
                        >
                          {tx.status === "paid" && <CheckCircle weight="fill" className="w-3 h-3" />}
                          {tx.status === "created" && <Clock weight="fill" className="w-3 h-3" />}
                          {tx.status === "failed" && <XCircle weight="fill" className="w-3 h-3" />}
                          <span className="capitalize">{tx.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {tx.status === "paid" && (
                          <button
                            onClick={() => setInvoiceTx(tx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85 cursor-pointer"
                            style={{
                              backgroundColor: "var(--badge-light-bg)",
                              border: "1px solid var(--rule)",
                              color: "var(--ink)",
                            }}
                            title="Print Invoice"
                          >
                            <Receipt weight="bold" className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredTxs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                        No billing transactions matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Invoice Modal */}
      {invoiceTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white font-body">
          <style
            dangerouslySetInnerHTML={{
              __html: `
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
          `,
            }}
          />
          <div
            id="printable-invoice-modal"
            className="w-full max-w-[500px] rounded-md p-6 sm:p-8 shadow-2xl relative transition-colors"
            style={{
              backgroundColor: "var(--sheet)",
              border: "1px solid var(--rule)",
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-5" style={{ borderBottom: "1px solid var(--rule)" }}>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Tax Invoice & Receipt
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  ConsentGen Medico-Legal Platform
                </p>
              </div>
              <button
                onClick={() => setInvoiceTx(null)}
                className="p-1 rounded-md transition-colors hover:bg-black/5 cursor-pointer no-print"
                style={{ color: "var(--ink-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs mb-6">
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Doctor Payer</span>
                <span className="font-bold font-serif" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_doctor_name || invoiceTx.profiles?.doctor_name || "Doctor"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Registration No.</span>
                <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_doctor_registration_no || invoiceTx.profiles?.doctor_registration_no || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Hospital</span>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {invoiceTx.metadata?.billing_hospital_name || invoiceTx.profiles?.hospital_name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Order ID</span>
                <span className="font-mono" style={{ color: "var(--ink)" }}>{invoiceTx.order_id}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payment ID</span>
                <span className="font-mono" style={{ color: "var(--ink)" }}>{invoiceTx.payment_id}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Payment Date</span>
                <span className="font-mono" style={{ color: "var(--ink)" }}>
                  {new Date(invoiceTx.created_at).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Credits Purchased</span>
                <span className="font-mono font-bold text-emerald-500">
                  +{invoiceTx.credits} Credits
                </span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: "2px solid var(--ink)" }}>
                <span className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>
                  Total Paid
                </span>
                <span className="font-serif font-bold text-lg" style={{ color: "var(--ink)" }}>
                  ₹{(invoiceTx.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-85 cursor-pointer flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: "var(--badge-light-bg)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink)",
                }}
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
