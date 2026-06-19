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
      <div className="flex-1 flex items-center justify-center bg-[#ededed]">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all font-body"
    + " text-neutral-800 placeholder-neutral-400"
    + " focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800"
    + " border border-neutral-200 bg-white";
  const labelCls = "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block";

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-md mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
            Profile <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>settings</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your account and clinical preferences</p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#f5f2ee", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-2xl font-bold" style={{ color: "#0b0f1a" }}>
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#0b0f1a" }}>
                {userRole === "admin" ? "Administrator" : userRole === "viewer" ? "Viewer Account" : "Doctor Account"}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
                <Envelope weight="regular" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Verified badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-full"
                  style={{ border: "1px solid rgba(0,128,0,0.15)" }}>
                  <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified
                </span>
                {/* Role badge */}
                {userRole === "admin" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded-full"
                    style={{ border: "1px solid rgba(147,51,234,0.2)" }}>
                    <Crown weight="fill" className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
                {userRole === "doctor" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{ color: "#0b0f1a", backgroundColor: "rgba(11,15,26,0.06)", border: "1px solid rgba(11,15,26,0.12)" }}>
                    <Stethoscope weight="fill" className="w-3.5 h-3.5" /> Doctor
                  </span>
                )}
                {userRole === "viewer" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full"
                    style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
                    <Eye weight="fill" className="w-3.5 h-3.5" /> Viewer
                  </span>
                )}
              </div>
              {/* Permissions hint */}
              <p className="text-xs text-neutral-400 mt-2">
                {userRole === "admin" && "Full access: generate, history, chat & user management"}
                {userRole === "doctor" && "Access: generate consents, view history & chat"}
                {userRole === "viewer" && "Read-only access: chat assistant only"}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Details Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
              <Stethoscope weight="duotone" className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>Clinical Details</h3>
              <p className="text-xs text-neutral-500">Auto-fills your consent forms</p>
            </div>
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
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white transition-all pl-5 pr-3 py-2 hover:opacity-90"
                style={{ backgroundColor: "#0b0f1a" }}
              >
                {isSaved
                  ? <><Check weight="bold" className="w-4 h-4" /> Saved Successfully</>
                  : <><FloppyDisk weight="bold" className="w-4 h-4" /> Save Details</>}
              </button>
            </div>
          </div>
        </div>

        {/* Payment & Billing History Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Coins weight="duotone" className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>Payment & Billing</h3>
                <p className="text-xs text-neutral-500">Manage your packages and transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-neutral-50 border border-neutral-200">
              <span>{credits !== null ? credits : 0} Credits Available</span>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Recent Transactions</h4>
              {txs.length === 0 ? (
                <p className="text-xs text-neutral-400">No payment transaction records found.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {txs.map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold text-neutral-800">{tx.order_id}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {tx.payment_id ? `ID: ${tx.payment_id}` : 'Pending'} • {new Date(tx.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold">₹{(tx.amount / 100).toFixed(0)}</p>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            tx.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>{tx.status}</span>
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

            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Credit History</h4>
              {logs.length === 0 ? (
                <p className="text-xs text-neutral-400">No credit usage logs found.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-neutral-800 capitalize">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(log.created_at).toLocaleDateString("en-IN", {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${log.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                          {log.amount > 0 ? `+${log.amount}` : log.amount}
                        </p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">Bal: {log.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
              <Gear weight="duotone" className="w-4 h-4 text-neutral-600" />
            </div>
            <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>Account Actions</h3>
          </div>
          <div className="px-6 sm:px-8 py-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              style={{ border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <SignOut weight="bold" className="w-4 h-4" /> Sign Out Securely
            </button>
            <p className="text-xs text-neutral-400 mt-3 max-w-xs leading-relaxed">
              Signing out ends your current session. You'll need to log back in to generate or view consent forms.
            </p>
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
                <span className="text-neutral-400">Credits Credited</span>
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
