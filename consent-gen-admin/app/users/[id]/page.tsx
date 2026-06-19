"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Shield,
  Coins,
  Receipt,
  FileText,
  ClockCounterClockwise,
  CheckCircle,
  XCircle,
  Gear,
  ArrowLeft
} from "@phosphor-icons/react";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [generations, setGenerations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditLogs, setCreditLogs] = useState<any[]>([]);
  
  // Actions states
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceTx, setInvoiceTx] = useState<any>(null);

  useEffect(() => {
    async function loadUserDetail() {
      try {
        // 1. Fetch Profile
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (pErr || !profile) {
          router.push("/users");
          return;
        }
        setUserProfile(profile);

        // 2. Fetch Generations Audits
        const { data: audits } = await supabase
          .from("generation_audit")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        if (audits) setGenerations(audits);

        // 3. Fetch Transactions
        const { data: txs } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        if (txs) setTransactions(txs);

        // 4. Fetch Credit History
        const { data: credits } = await supabase
          .from("credit_history")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        if (credits) setCreditLogs(credits);

        setLoading(false);
      } catch (err) {
        console.error("Error loading user profile detail:", err);
        setLoading(false);
      }
    }

    if (id) loadUserDetail();
  }, [id, supabase, router]);

  // Activate / Deactivate Toggle
  const handleToggleStatus = async () => {
    if (!userProfile) return;
    setActionLoading(true);
    const nextStatus = userProfile.is_active === false; // true if currently deactivated

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("No admin session");

      await supabase.rpc("luffy_toggle_user_status", {
        p_user_id: userProfile.id,
        p_active: nextStatus,
        p_admin_id: adminUser.id,
        p_note: adminNote || `Manual status update to ${nextStatus ? "active" : "deactivated"}`
      });

      setUserProfile({ ...userProfile, is_active: nextStatus });
      setAdminNote("");
      alert(`User account status updated successfully to: ${nextStatus ? "Active" : "Deactivated"}`);
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Adjust User Credits Manually
  const handleAdjustCredits = async () => {
    if (!userProfile || creditAdjustment === 0) return;
    setActionLoading(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("No admin session");

      const newCredits = (userProfile.credits || 0) + creditAdjustment;
      if (newCredits < 0) {
        alert("Credits balance cannot go below 0.");
        setActionLoading(false);
        return;
      }

      // Update profiles
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userProfile.id);

      if (profileErr) throw profileErr;

      // Log credit history
      const { error: logErr } = await supabase
        .from("credit_history")
        .insert({
          user_id: userProfile.id,
          amount: creditAdjustment,
          action: "admin_adjustment",
          balance_after: newCredits,
          reference_id: `admin_${adminUser.id.slice(0, 8)}`
        });

      if (logErr) throw logErr;

      // Log luffy admin action
      await supabase.rpc("luffy_log_action", {
        p_admin_id: adminUser.id,
        p_action: "adjust_credits",
        p_target_type: "user",
        p_target_id: userProfile.id,
        p_note: adminNote || `Adjusted credits by ${creditAdjustment}`,
        p_metadata: { adjustment: creditAdjustment, previous_credits: userProfile.credits }
      });

      setUserProfile({ ...userProfile, credits: newCredits });
      setCreditAdjustment(0);
      setAdminNote("");
      alert(`Credits successfully adjusted by ${creditAdjustment}. New balance: ${newCredits}`);

      // Refresh credit logs table
      const { data: updatedLogs } = await supabase
        .from("credit_history")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      if (updatedLogs) setCreditLogs(updatedLogs);
    } catch (err: any) {
      alert(`Failed to adjust credits: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="User Administration" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title={`Manage: ${userProfile.doctor_name || "Doctor Account"}`} />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Back Button */}
          <div>
            <button
              onClick={() => router.push("/users")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-all bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft weight="bold" />
              <span>Back to users list</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Profile Info */}
            <div className="glass-card rounded-2xl p-6 space-y-6 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-3xl font-bold text-amber-500">
                  {userProfile.doctor_name?.charAt(0).toUpperCase() || "D"}
                </div>
                <h2 className="text-xl font-bold">{userProfile.doctor_name || "Doctor Name N/A"}</h2>
                <span className="text-xs text-muted font-mono mt-1 select-all">{userProfile.id}</span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-4 ${
                  userProfile.is_active !== false
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {userProfile.is_active !== false ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}
                  <span>{userProfile.is_active !== false ? "Active Account" : "Deactivated"}</span>
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-card-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Hospital Name</p>
                  <p className="text-sm font-semibold mt-0.5">{userProfile.hospital_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Registration Number</p>
                  <p className="text-sm font-semibold font-mono mt-0.5">{userProfile.doctor_registration_no || "N/A"}</p>
                </div>
                {userProfile.hospital_address && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Hospital Address</p>
                    <p className="text-xs text-muted mt-0.5 leading-normal">{userProfile.hospital_address}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted tracking-wider">System Role</p>
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/15 text-blue-400 rounded-full mt-1 border border-blue-500/20 capitalize">{userProfile.role || "doctor"}</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Operations & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Controls */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Operations Console</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Adjustment credits form */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-foreground">Adjust User Credits</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 5 or -2"
                        value={creditAdjustment || ""}
                        onChange={(e) => setCreditAdjustment(parseInt(e.target.value) || 0)}
                        className="w-32 px-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 text-foreground"
                      />
                      <button
                        onClick={handleAdjustCredits}
                        disabled={actionLoading || creditAdjustment === 0}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Adjust Credits
                      </button>
                    </div>
                  </div>

                  {/* Account lock/unlock */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-foreground">Access Restriction</p>
                    <button
                      onClick={handleToggleStatus}
                      disabled={actionLoading}
                      className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all cursor-pointer border ${
                        userProfile.is_active !== false
                          ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                    >
                      {userProfile.is_active !== false ? "Deactivate Account" : "Activate Account"}
                    </button>
                  </div>
                </div>

                {/* Optional note for adjustment logs */}
                <div className="mt-5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Audit Action Note</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the reason for this adjustment..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 text-foreground"
                  />
                </div>
              </div>

              {/* History / Tables tabs */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">User Credit History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-card-border text-muted">
                        <th className="py-2.5 font-semibold">Action</th>
                        <th className="py-2.5 font-semibold">Reference ID</th>
                        <th className="py-2.5 font-semibold">Created At</th>
                        <th className="py-2.5 font-semibold text-right">Adjustment</th>
                        <th className="py-2.5 font-semibold text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                      {creditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted-bg/30 transition-colors">
                          <td className="py-3 font-semibold capitalize">{log.action.replace(/_/g, " ")}</td>
                          <td className="py-3 font-mono text-muted">{log.reference_id || "N/A"}</td>
                          <td className="py-3 text-muted">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                          <td className={`py-3 text-right font-bold ${log.amount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {log.amount > 0 ? `+${log.amount}` : log.amount}
                          </td>
                          <td className="py-3 text-right font-bold font-mono">{log.balance_after}</td>
                        </tr>
                      ))}
                      {creditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted">
                            No credit history records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Billing & Payments Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-card-border text-muted">
                        <th className="py-2.5 font-semibold">Order ID</th>
                        <th className="py-2.5 font-semibold">Payment ID</th>
                        <th className="py-2.5 font-semibold text-right">Amount</th>
                        <th className="py-2.5 font-semibold text-center">Credits</th>
                        <th className="py-2.5 font-semibold text-center">Status</th>
                        <th className="py-2.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted-bg/30 transition-colors">
                          <td className="py-3 font-mono text-muted">{tx.order_id}</td>
                          <td className="py-3">
                            <p className="font-mono text-muted">{tx.payment_id || "Pending"}</p>
                            {tx.metadata?.method && (
                              <p className="text-[9px] text-amber-500 font-semibold capitalize mt-0.5">
                                {tx.metadata.method} {tx.metadata.bank ? `(${tx.metadata.bank})` : tx.metadata.vpa ? `(${tx.metadata.vpa})` : ""}
                              </p>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-foreground">₹{(tx.amount / 100).toFixed(2)}</td>
                          <td className="py-3 text-center font-mono font-bold text-amber-500">+{tx.credits}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              tx.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            }`}>{tx.status}</span>
                          </td>
                          <td className="py-3 text-right">
                            {tx.status === "paid" && (
                              <button
                                onClick={() => setInvoiceTx(tx)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-500 border border-card-border transition-all cursor-pointer"
                                title="View/Print Invoice"
                              >
                                <Receipt weight="bold" className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted">
                            No billing transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Printable Invoice Modal */}
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
                <span className="font-bold text-neutral-800 text-right">{userProfile.doctor_name || "Doctor"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Registration No.</span>
                <span className="font-bold text-neutral-800 text-right font-mono">{userProfile.doctor_registration_no || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100/50 pb-2">
                <span className="text-neutral-400">Hospital</span>
                <span className="font-bold text-neutral-800 text-right">{userProfile.hospital_name || "N/A"}</span>
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
                <span className="font-bold text-neutral-800 text-right">{new Date(invoiceTx.created_at).toLocaleDateString("en-IN")}</span>
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
