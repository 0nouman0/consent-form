"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User, Envelope, ShieldCheck, SignOut,
  Gear, FloppyDisk, Check, Stethoscope, Crown, Eye,
  Coins, CreditCard, ClockCounterClockwise, ArrowUpRight, ArrowDownLeft, Receipt, CalendarBlank
} from "@phosphor-icons/react/dist/ssr";
import type { UserRole } from "@/lib/rbac";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("doctor");
  const [profileData, setProfileData] = useState({
    doctorName: "",
    doctorRegistrationNo: "",
    hospitalName: "",
    hospitalAddress: "",
    billingAddress: "",
  });
  const [isSaved, setIsSaved] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [invoiceTx, setInvoiceTx] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user as any);
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          const pd = {
            doctorName: profile.doctor_name || "",
            doctorRegistrationNo: profile.doctor_registration_no || "",
            hospitalName: profile.hospital_name || "",
            hospitalAddress: profile.hospital_address || "",
            billingAddress: profile.billing_address || "",
          };
          setProfileData(pd);
          setUserRole((profile.role as UserRole) ?? "doctor");
          setCredits(profile.credits);
          localStorage.setItem("consentgen_doctor_profile", JSON.stringify(pd));
        } else {
          const savedProfile = localStorage.getItem("consentgen_doctor_profile");
          if (savedProfile) { try { setProfileData(JSON.parse(savedProfile)); } catch (e) {} }
        }

        // Fetch recent transactions
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (txData) setTxs(txData);

        // Fetch recent credit usage logs
        const { data: logData } = await supabase
          .from("credit_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (logData) setLogs(logData);
      } else {
        router.push("/login?redirect=/profile");
      }
      setLoading(false);
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    localStorage.setItem("consentgen_doctor_profile", JSON.stringify(profileData));
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        doctor_name: profileData.doctorName,
        doctor_registration_no: profileData.doctorRegistrationNo,
        hospital_name: profileData.hospitalName,
        hospital_address: profileData.hospitalAddress,
        billing_address: profileData.billingAddress,
        updated_at: new Date().toISOString(),
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
        <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-md text-sm outline-none transition-all font-body"
    + " text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
    + " focus:ring-2 focus:ring-[rgba(23,20,16,0.08)] focus:border-[var(--ink)]"
    + " border border-[var(--rule)] bg-[var(--sheet)]";
  const labelCls = "font-mono text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-[0.06em] mb-2 block";

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div className="max-w-screen-md mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="rounded-md px-6 sm:px-8 py-6 sm:py-7"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Account</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
            Profile <span style={{ color: "var(--red)" }}>settings</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>Manage your account and clinical preferences</p>
        </div>

        {/* Account Info Card */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-start gap-5">
            <div className="w-16 h-16 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}>
              <span className="font-serif text-2xl font-bold" style={{ color: "var(--ink)" }}>
                {(profileData.doctorName?.replace(/^Dr\.?\s*/i, "").charAt(0) || user?.email?.charAt(0) || "?").toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-base font-bold mb-0.5" style={{ color: "var(--ink)" }}>
                {profileData.doctorName ||
                  (userRole === "admin" ? "Administrator" : userRole === "viewer" ? "Viewer Account" : "Doctor Account")}
              </h2>
              <div className="flex items-center gap-1.5 text-sm mb-3" style={{ color: "var(--ink-muted)" }}>
                <Envelope weight="regular" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Verified badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                  style={{ color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)", border: "1px solid rgba(63,122,78,0.2)" }}>
                  <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified
                </span>
                {/* Role badge */}
                {userRole === "admin" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                    style={{ color: "var(--red)", backgroundColor: "rgba(190,61,42,0.08)", border: "1px solid rgba(190,61,42,0.2)" }}>
                    <Crown weight="fill" className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
                {userRole === "doctor" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                    style={{ color: "var(--ink)", backgroundColor: "rgba(23,20,16,0.06)", border: "1px solid rgba(23,20,16,0.12)" }}>
                    <Stethoscope weight="fill" className="w-3.5 h-3.5" /> Doctor
                  </span>
                )}
                {userRole === "viewer" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                    style={{ color: "var(--ink-muted)", backgroundColor: "rgba(122,116,102,0.1)", border: "1px solid rgba(122,116,102,0.25)" }}>
                    <Eye weight="fill" className="w-3.5 h-3.5" /> Viewer
                  </span>
                )}
              </div>
              {/* Permissions hint */}
              <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
                {userRole === "admin" && "Full access: generate, history, chat & user management"}
                {userRole === "doctor" && "Access: generate consents, view history & chat"}
                {userRole === "viewer" && "Read-only access: chat assistant only"}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Details Card */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
                <Stethoscope weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Clinical Details</h3>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Required — auto-fills every consent form you generate</p>
              </div>
            </div>
            {(() => {
              const filled = [
                profileData.doctorName,
                profileData.doctorRegistrationNo,
                profileData.hospitalName,
                profileData.hospitalAddress,
              ].filter(Boolean).length;
              const complete = filled === 4;
              return (
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                  style={
                    complete
                      ? { color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)", border: "1px solid rgba(63,122,78,0.2)" }
                      : { color: "#b45309", backgroundColor: "rgba(180,131,9,0.08)", border: "1px solid rgba(180,131,9,0.2)" }
                  }
                >
                  {complete ? <><Check weight="bold" className="w-3 h-3" /> Complete</> : `${filled}/4 completed`}
                </span>
              );
            })()}
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-5">
            <div>
              <label htmlFor="doctorName" className={labelCls}>Doctor / Surgeon Full Name</label>
              <input id="doctorName" name="doctorName" value={profileData.doctorName}
                onChange={handleInputChange} type="text" placeholder="Dr. John Doe" className={inputCls} />
            </div>
            <div>
              <label htmlFor="doctorRegistrationNo" className={labelCls}>Medical Council Registration No.</label>
              <input id="doctorRegistrationNo" name="doctorRegistrationNo" value={profileData.doctorRegistrationNo}
                onChange={handleInputChange} type="text" placeholder="e.g. KMC 12345" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hospitalName" className={labelCls}>Hospital / Clinic Name</label>
              <input id="hospitalName" name="hospitalName" value={profileData.hospitalName}
                onChange={handleInputChange} type="text" placeholder="City General Hospital" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hospitalAddress" className={labelCls}>Hospital Address</label>
              <textarea id="hospitalAddress" name="hospitalAddress" value={profileData.hospitalAddress}
                onChange={handleInputChange} rows={2} placeholder="123 Hospital Way, City" className={inputCls} />
            </div>
            <div>
              <label htmlFor="billingAddress" className={labelCls}>Billing Address (for Invoices)</label>
              <textarea id="billingAddress" name="billingAddress" value={profileData.billingAddress}
                onChange={handleInputChange} rows={2} placeholder="e.g. 123 Clinic Road, Suite A, Bangalore" className={inputCls} />
            </div>
            <div className="pt-1">
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all pl-5 pr-3 py-2 hover:opacity-90"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                {isSaved
                  ? <><Check weight="bold" className="w-4 h-4" /> Saved Successfully</>
                  : <><FloppyDisk weight="bold" className="w-4 h-4" /> Save Details</>}
              </button>
            </div>
          </div>
        </div>

        {/* Payment & Billing History Card */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
                <Coins weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Payment & Billing</h3>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Manage your packages and transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md font-mono text-xs font-bold"
              style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink)" }}>
              <span>{credits !== null ? credits : 0} Credits Available</span>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-6">
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] mb-3" style={{ color: "var(--ink-muted)" }}>Recent Transactions</h4>
              {txs.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>No payment transaction records found.</p>
              ) : (
                <div className="divide-y divide-[var(--rule-soft)]">
                  {txs.map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold" style={{ color: "var(--ink)" }}>{tx.order_id}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          {tx.payment_id ? `ID: ${tx.payment_id}` : 'Pending'} • {new Date(tx.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold" style={{ color: "var(--ink)" }}>₹{(tx.amount / 100).toFixed(0)}</p>
                          <span
                            className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-0.5"
                            style={
                              tx.status === "paid"
                                ? { color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)" }
                                : { color: "#b45309", backgroundColor: "rgba(180,131,9,0.08)" }
                            }
                          >{tx.status}</span>
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

            <div className="pt-4 border-t border-[var(--rule-soft)]">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] mb-3" style={{ color: "var(--ink-muted)" }}>Credit History</h4>
              {logs.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>No credit usage logs found.</p>
              ) : (
                <div className="divide-y divide-[var(--rule-soft)]">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold capitalize" style={{ color: "var(--ink)" }}>{log.action.replace(/_/g, " ")}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          {new Date(log.created_at).toLocaleDateString("en-IN", {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: log.amount < 0 ? "var(--red)" : "#3f7a4e" }}>
                          {log.amount > 0 ? `+${log.amount}` : log.amount}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: "var(--ink-muted)" }}>Bal: {log.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
              <Gear weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
            </div>
            <h3 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Account Actions</h3>
          </div>
          <div className="px-6 sm:px-8 py-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors hover:bg-[rgba(190,61,42,0.08)]"
              style={{ color: "var(--red)", border: "1px solid rgba(190,61,42,0.25)" }}
            >
              <SignOut weight="bold" className="w-4 h-4" /> Sign Out Securely
            </button>
            <p className="text-xs mt-3 max-w-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Signing out ends your current session. You'll need to log back in to generate or view consent forms.
            </p>
          </div>
        </div>

      </div>

      {/* Invoice Modal */}
      {invoiceTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 print:p-0 print:bg-white" style={{ backgroundColor: "rgba(23,20,16,0.6)" }}>
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
          <div id="printable-invoice-modal" className="w-full max-w-[500px] rounded-md p-6 sm:p-8 relative"
            style={{ backgroundColor: "var(--sheet)", color: "var(--ink)", border: "1px solid var(--rule)", boxShadow: "0 16px 48px rgba(23,20,16,0.14)" }}>
            {/* Header */}
            <div className="text-center pb-5 mb-5" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
              <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>Payment Invoice</h2>
              <p className="font-mono text-[11px] mt-1 uppercase tracking-[0.06em] font-semibold" style={{ color: "var(--ink-muted)" }}>Consent Form Generator</p>
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
                <span className="font-bold text-right" style={{ whiteSpace: "pre-line", color: "var(--ink)" }}>
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
                <span className="font-bold capitalize text-right" style={{ color: "var(--ink)" }}>{invoiceTx.metadata?.method || "Cashfree"}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Credits Credited</span>
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
                className="flex-1 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                Print Invoice
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer hover:bg-[rgba(23,20,16,0.06)]"
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
