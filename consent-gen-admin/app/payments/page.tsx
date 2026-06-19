"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { MagnifyingGlass, Funnel, CheckCircle, XCircle, Clock, Receipt, Eye } from "@phosphor-icons/react";

export default function PaymentsList() {
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceTx, setInvoiceTx] = useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*, profiles(doctor_name, hospital_name, doctor_registration_no, billing_address, hospital_address)")
          .order("created_at", { ascending: false });

        if (data) {
          setTxs(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading payments list:", err);
        setLoading(false);
      }
    }

    fetchPayments();
  }, [supabase]);

  // Filters
  const filteredTxs = txs.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (tx.order_id || "").toLowerCase().includes(term) ||
                          (tx.payment_id || "").toLowerCase().includes(term) ||
                          (tx.profiles?.doctor_name || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPaidRevenue = filteredTxs
    .filter(tx => tx.status === "paid")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0) / 100;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title="Billing & Payments Audit" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Revenue Highlight Card */}
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Filtered Revenue sum</p>
              <h2 className="text-3xl font-bold tracking-tight mt-1 text-amber-500">₹{totalPaidRevenue.toLocaleString("en-IN")}</h2>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Total Orders Count: <span className="font-bold text-foreground">{filteredTxs.length}</span></p>
              <p className="mt-1">Paid Status Count: <span className="font-bold text-emerald-500">{filteredTxs.filter(t => t.status === "paid").length}</span></p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search Order ID, Payment ID, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 transition-all text-foreground"
              />
            </div>

            {/* Select filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Funnel className="w-4 h-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 px-4 rounded-xl text-xs bg-white/5 border border-card-border outline-none text-foreground focus:border-amber-500"
              >
                <option value="all" className="bg-background">All Statuses</option>
                <option value="paid" className="bg-background">Paid</option>
                <option value="created" className="bg-background">Created / Pending</option>
                <option value="failed" className="bg-background">Failed</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="py-3 font-semibold">Doctor / Account</th>
                    <th className="py-3 font-semibold">Order ID</th>
                    <th className="py-3 font-semibold">Payment ID</th>
                    <th className="py-3 font-semibold text-right">Amount</th>
                    <th className="py-3 font-semibold text-center">Credits Added</th>
                    <th className="py-3 font-semibold text-center">Created Date</th>
                    <th className="py-3 font-semibold text-center">Status</th>
                    <th className="py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted">
                        <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="py-4 font-semibold text-foreground">
                        <div>
                          <p className="font-semibold">{tx.profiles?.doctor_name || "N/A"}</p>
                          <span className="text-[9px] text-muted font-mono">{tx.user_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono select-all text-muted">{tx.order_id}</td>
                      <td className="py-4">
                        <p className="font-mono select-all text-muted">{tx.payment_id || "Pending"}</p>
                        {tx.metadata?.method && (
                          <p className="text-[10px] text-amber-500 font-semibold capitalize mt-0.5">
                            {tx.metadata.method} {tx.metadata.vpa ? `(${tx.metadata.vpa})` : tx.metadata.bank ? `(${tx.metadata.bank})` : tx.metadata.wallet ? `(${tx.metadata.wallet})` : ""}
                            {tx.metadata.email ? ` • ${tx.metadata.email}` : ""}
                          </p>
                        )}
                      </td>
                      <td className="py-4 font-mono font-bold text-right text-foreground">₹{(tx.amount / 100).toFixed(2)}</td>
                      <td className="py-4 font-mono font-bold text-center text-amber-500">+{tx.credits}</td>
                      <td className="py-4 text-center">
                        <p className="text-muted">{new Date(tx.created_at).toLocaleDateString("en-IN")}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(tx.created_at).toLocaleTimeString("en-IN")}</p>
                      </td>
                      <td className="py-4 text-center">
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
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/payments/${tx.id}`)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted border border-card-border transition-all cursor-pointer"
                            title="View Metadata Details"
                          >
                            <Eye weight="bold" className="w-3.5 h-3.5" />
                          </button>
                          {tx.status === "paid" && (
                            <button
                              onClick={() => setInvoiceTx(tx)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-500 border border-card-border transition-all cursor-pointer"
                              title="Print Invoice"
                            >
                              <Receipt weight="bold" className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredTxs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted">
                        No transactions matched filters.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white text-neutral-800">
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
          <div id="printable-invoice-modal" className="w-full max-w-[500px] bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-2xl relative">
            <div className="text-center border-b border-neutral-100 pb-5 mb-5">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Payment Invoice</h2>
              <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Consent Form Generator</p>
            </div>

            <div className="space-y-4 text-xs mb-6">
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Doctor Payer</span>
                <span className="font-bold text-neutral-800 text-right">
                  {invoiceTx.metadata?.billing_doctor_name || invoiceTx.profiles?.doctor_name || "Doctor"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Registration No.</span>
                <span className="font-bold text-neutral-800 text-right font-mono">
                  {invoiceTx.metadata?.billing_doctor_registration_no || invoiceTx.profiles?.doctor_registration_no || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Hospital</span>
                <span className="font-bold text-neutral-800 text-right">
                  {invoiceTx.metadata?.billing_hospital_name || invoiceTx.profiles?.hospital_name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Billing Address</span>
                <span className="font-bold text-neutral-800 text-right" style={{ whiteSpace: "pre-line" }}>
                  {invoiceTx.metadata?.billing_address || invoiceTx.profiles?.billing_address || invoiceTx.profiles?.hospital_address || "N/A"}
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
