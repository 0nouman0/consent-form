"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/fetchWithTimeout";
import {
  User,
  Shield,
  Coins,
  Receipt,
  FileText,
  ClockCounterClockwise,
  Clock,
  CheckCircle,
  XCircle,
  Gear,
  ArrowLeft,
  MagnifyingGlass,
  Funnel,
  Eye,
  Printer,
  Copy,
  ArrowRight,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

type ActiveTab = "consents" | "subscriptions" | "credits" | "profile";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [generations, setGenerations] = useState<any[]>([]);
  const [consentHistory, setConsentHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditLogs, setCreditLogs] = useState<any[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("consents");

  // Filtering for consent forms
  const [consentSearch, setConsentSearch] = useState("");
  const [consentStatusFilter, setConsentStatusFilter] = useState("all");

  // Document preview modal state
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Operations actions state
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceTx, setInvoiceTx] = useState<any>(null);

  // Initial load
  useEffect(() => {
    async function loadUserDetail() {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch Profile
        const { data: profile, error: pErr } = await withTimeout(
          supabase.from("profiles").select("*").eq("id", id).single()
        );

        if (pErr || !profile) {
          router.push("/users");
          return;
        }
        setUserProfile(profile);

        // 2. Fetch Generation Audits
        const { data: audits } = await withTimeout(
          supabase
            .from("generation_audit")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
        );
        if (audits) setGenerations(audits);

        // 3. Fetch Consent History
        const { data: history } = await withTimeout(
          supabase
            .from("consent_history")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
        );
        if (history) setConsentHistory(history);

        // 4. Fetch Transactions (Subscriptions & Purchases)
        const { data: txs } = await withTimeout(
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
        );
        if (txs) setTransactions(txs);

        // 5. Fetch Credit History
        const { data: credits } = await withTimeout(
          supabase
            .from("credit_history")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
        );
        if (credits) setCreditLogs(credits);

        setLoading(false);
      } catch (err) {
        console.error("Error loading user profile detail:", err);
        setLoading(false);
      }
    }

    loadUserDetail();
  }, [id, supabase, router]);

  // Merge generations & consent history for rich unified list
  const unifiedConsents = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    generations.forEach((audit) => {
      seenIds.add(audit.id);
      if (audit.consent_history_id) seenIds.add(audit.consent_history_id);

      const matchingHist = consentHistory.find(
        (h) => h.id === audit.consent_history_id || h.consent_id === audit.consent_id
      );

      list.push({
        id: audit.id,
        auditId: audit.id,
        historyId: audit.consent_history_id || matchingHist?.id,
        procedure_name:
          audit.procedure_name ||
          matchingHist?.procedure_name ||
          audit.metadata?.procedureName ||
          (audit.sub_type ? `${audit.sub_type.replace(/_/g, " ")} procedure` : null) ||
          "Clinical Procedure",
        consent_type:
          audit.sub_type ||
          audit.consent_type ||
          matchingHist?.consent_type ||
          "Informed Consent",
        department: audit.department || matchingHist?.form_data?.department || "Clinical",
        patient_name: matchingHist?.patient_name || null,
        created_at: audit.created_at,
        status: audit.status || "success",
        tokens_used: audit.tokens_used || (audit.prompt_tokens && audit.completion_tokens ? audit.prompt_tokens + audit.completion_tokens : 0),
        model: audit.model_used || audit.model || "groq/llama-3.3-70b",
        markdown: matchingHist?.markdown || audit.prompt || null,
        error_message: audit.error_message,
        source: "audit",
      });
    });

    consentHistory.forEach((hist) => {
      if (!seenIds.has(hist.id)) {
        list.push({
          id: hist.id,
          auditId: null,
          historyId: hist.id,
          procedure_name: hist.procedure_name || "Consent Document",
          consent_type: hist.consent_type || "General Consent",
          department: hist.form_data?.department || "General",
          patient_name: hist.patient_name || null,
          created_at: hist.created_at,
          status: "success",
          tokens_used: 0,
          model: "Saved Document",
          markdown: hist.markdown,
          error_message: null,
          source: "history",
        });
      }
    });

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [generations, consentHistory]);

  // Filtered consents
  const filteredConsents = useMemo(() => {
    return unifiedConsents.filter((item) => {
      const q = consentSearch.toLowerCase();
      const matchesSearch =
        (item.procedure_name || "").toLowerCase().includes(q) ||
        (item.consent_type || "").toLowerCase().includes(q) ||
        (item.patient_name || "").toLowerCase().includes(q) ||
        (item.department || "").toLowerCase().includes(q);

      const matchesStatus =
        consentStatusFilter === "all" ||
        (consentStatusFilter === "success" && item.status === "success") ||
        (consentStatusFilter === "failed" && item.status !== "success");

      return matchesSearch && matchesStatus;
    });
  }, [unifiedConsents, consentSearch, consentStatusFilter]);

  // Format date helper
  const formatDateTime = (isoDate: string) => {
    if (!isoDate) return { datePart: "N/A", timePart: "N/A", full: "N/A" };
    try {
      const d = new Date(isoDate);
      const datePart = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return { datePart, timePart, full: `${datePart} at ${timePart}` };
    } catch {
      return { datePart: "N/A", timePart: "N/A", full: "N/A" };
    }
  };

  const getRelativeTime = (isoDate: string) => {
    if (!isoDate) return "";
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return "";
  };

  // Subscriptions aggregates
  const paidTxs = useMemo(() => transactions.filter((t) => t.status === "paid"), [transactions]);
  const totalPaidRevenue = useMemo(
    () => paidTxs.reduce((sum, t) => sum + (t.amount || 0), 0) / 100,
    [paidTxs]
  );
  const totalCreditsPurchased = useMemo(
    () => paidTxs.reduce((sum, t) => sum + (t.credits || 0), 0),
    [paidTxs]
  );

  // Activate / Deactivate Toggle
  const handleToggleStatus = async () => {
    if (!userProfile) return;
    setActionLoading(true);
    const nextStatus = userProfile.is_active === false;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminUser = authData?.user;
      if (!adminUser) throw new Error("No admin session found");

      await supabase.rpc("luffy_toggle_user_status", {
        p_user_id: userProfile.id,
        p_active: nextStatus,
        p_admin_id: adminUser.id,
        p_note: adminNote || `Manual status update to ${nextStatus ? "active" : "deactivated"}`,
      });

      setUserProfile({ ...userProfile, is_active: nextStatus });
      setAdminNote("");
      alert(`User status successfully updated to: ${nextStatus ? "Active" : "Deactivated"}`);
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
      const { data: authData } = await supabase.auth.getUser();
      const adminUser = authData?.user;
      if (!adminUser) throw new Error("No admin session found");

      const newCredits = (userProfile.credits || 0) + creditAdjustment;
      if (newCredits < 0) {
        alert("Credit balance cannot drop below 0.");
        setActionLoading(false);
        return;
      }

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userProfile.id);

      if (profileErr) throw profileErr;

      const { error: logErr } = await supabase.from("credit_history").insert({
        user_id: userProfile.id,
        amount: creditAdjustment,
        action: "admin_adjustment",
        balance_after: newCredits,
        reference_id: `admin_${adminUser.id.slice(0, 8)}`,
      });

      if (logErr) throw logErr;

      await supabase.rpc("luffy_log_action", {
        p_admin_id: adminUser.id,
        p_action: "adjust_credits",
        p_target_type: "user",
        p_target_id: userProfile.id,
        p_note: adminNote || `Adjusted credits by ${creditAdjustment}`,
        p_metadata: { adjustment: creditAdjustment, previous_credits: userProfile.credits },
      });

      setUserProfile({ ...userProfile, credits: newCredits });
      setCreditAdjustment(0);
      setAdminNote("");
      alert(`Credits adjusted by ${creditAdjustment > 0 ? `+${creditAdjustment}` : creditAdjustment}. New balance: ${newCredits}`);

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

  const handleCopyMarkdown = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="User Administration" />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
              Loading Doctor Dossier...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col p-8 items-center justify-center">
          <p className="text-sm font-serif" style={{ color: "var(--ink-muted)" }}>
            User record not found.
          </p>
          <button
            onClick={() => router.push("/users")}
            className="mt-4 px-4 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header
          title={userProfile.doctor_name || "Doctor Profile"}
          subtitle={`Account Dossier: ${userProfile.id.slice(0, 16)}...`}
        />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/users"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-colors hover:opacity-75"
              style={{ color: "var(--ink)" }}
            >
              <ArrowLeft weight="bold" />
              <span>Back to all doctors</span>
            </Link>

            <span
              className="text-[11px] font-mono px-2.5 py-1 rounded"
              style={{
                backgroundColor: "var(--sheet)",
                border: "1px solid var(--rule)",
                color: "var(--ink-muted)",
              }}
            >
              UUID: {userProfile.id}
            </span>
          </div>

          {/* User Hero Banner */}
          <div
            className="rounded-md p-6 sm:p-7 relative overflow-hidden"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Avatar & Identity */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-md flex items-center justify-center font-serif text-3xl font-bold shrink-0"
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--rule)",
                    color: "var(--ink)",
                  }}
                >
                  {userProfile.doctor_name?.charAt(0).toUpperCase() || "D"}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                      {userProfile.doctor_name || "Doctor Name Not Set"}
                    </h2>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                      style={{
                        backgroundColor: userProfile.is_active !== false ? "var(--status-success-bg)" : "var(--status-fail-bg)",
                        color: userProfile.is_active !== false ? "var(--status-success-text)" : "var(--status-fail-text)",
                        border: `1px solid ${userProfile.is_active !== false ? "var(--status-success-border)" : "var(--status-fail-border)"}`,
                      }}
                    >
                      {userProfile.is_active !== false ? (
                        <>
                          <CheckCircle weight="fill" className="w-3 h-3" /> Active Account
                        </>
                      ) : (
                        <>
                          <XCircle weight="fill" className="w-3 h-3" /> Deactivated
                        </>
                      )}
                    </span>
                    <span
                      className="inline-block px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded"
                      style={{
                        backgroundColor: userProfile.role === "admin" ? "var(--badge-dark-bg)" : "var(--badge-light-bg)",
                        color: userProfile.role === "admin" ? "var(--badge-dark-text)" : "var(--badge-light-text)",
                      }}
                    >
                      {userProfile.role || "doctor"}
                    </span>
                  </div>

                  <p className="text-xs flex items-center gap-2" style={{ color: "var(--ink-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      {userProfile.hospital_name || "Hospital unassigned"}
                    </span>
                    <span>•</span>
                    <span className="font-mono">Reg No: {userProfile.doctor_registration_no || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Right: Key Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="rounded-md p-3 text-center"
                  style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Consents
                  </p>
                  <p className="font-serif text-xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                    {unifiedConsents.length}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "#0f766e" }}>
                    {unifiedConsents.filter((c) => c.status === "success").length} ok
                  </p>
                </div>

                <div
                  className="rounded-md p-3 text-center"
                  style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Credits
                  </p>
                  <p className="font-serif text-xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                    {userProfile.credits ?? 0}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    Balance
                  </p>
                </div>

                <div
                  className="rounded-md p-3 text-center"
                  style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Total Paid
                  </p>
                  <p className="font-serif text-xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                    ₹{totalPaidRevenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {paidTxs.length} orders
                  </p>
                </div>

                <div
                  className="rounded-md p-3 text-center"
                  style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Joined
                  </p>
                  <p className="font-mono text-xs font-bold mt-1.5" style={{ color: "var(--ink)" }}>
                    {userProfile.created_at ? formatDateTime(userProfile.created_at).datePart : "N/A"}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {getRelativeTime(userProfile.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--rule)" }}>
            <button
              onClick={() => setActiveTab("consents")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold rounded-t-md transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "consents" ? "var(--sheet)" : "transparent",
                color: activeTab === "consents" ? "var(--ink)" : "var(--ink-muted)",
                borderBottom: activeTab === "consents" ? "2px solid var(--ink)" : "2px solid transparent",
              }}
            >
              <FileText className="w-4 h-4" weight={activeTab === "consents" ? "fill" : "regular"} />
              <span>Consent Forms</span>
              <span
                className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--badge-light-text)" }}
              >
                {unifiedConsents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("subscriptions")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold rounded-t-md transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "subscriptions" ? "var(--sheet)" : "transparent",
                color: activeTab === "subscriptions" ? "var(--ink)" : "var(--ink-muted)",
                borderBottom: activeTab === "subscriptions" ? "2px solid var(--ink)" : "2px solid transparent",
              }}
            >
              <Receipt className="w-4 h-4" weight={activeTab === "subscriptions" ? "fill" : "regular"} />
              <span>Billing & Orders</span>
              <span
                className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--badge-light-text)" }}
              >
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("credits")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold rounded-t-md transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "credits" ? "var(--sheet)" : "transparent",
                color: activeTab === "credits" ? "var(--ink)" : "var(--ink-muted)",
                borderBottom: activeTab === "credits" ? "2px solid var(--ink)" : "2px solid transparent",
              }}
            >
              <ClockCounterClockwise className="w-4 h-4" weight={activeTab === "credits" ? "fill" : "regular"} />
              <span>Credit Ledger</span>
              <span
                className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--badge-light-text)" }}
              >
                {creditLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold rounded-t-md transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "profile" ? "var(--sheet)" : "transparent",
                color: activeTab === "profile" ? "var(--ink)" : "var(--ink-muted)",
                borderBottom: activeTab === "profile" ? "2px solid var(--ink)" : "2px solid transparent",
              }}
            >
              <Gear className="w-4 h-4" weight={activeTab === "profile" ? "fill" : "regular"} />
              <span>Account & Operations</span>
            </button>
          </div>

          {/* TAB 1: GENERATED CONSENT FORMS */}
          {activeTab === "consents" && (
            <div className="space-y-4">
              <div
                className="rounded-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div className="relative w-full sm:max-w-md">
                  <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                  <input
                    type="text"
                    placeholder={`Search ${userProfile.doctor_name || "doctor"}'s consent forms...`}
                    value={consentSearch}
                    onChange={(e) => setConsentSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md text-xs outline-none transition-all"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                    style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--ink)" }}
                  >
                    <Funnel className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                    <select
                      value={consentStatusFilter}
                      onChange={(e) => setConsentStatusFilter(e.target.value)}
                      className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                      style={{ color: "var(--ink)" }}
                    >
                      <option value="all" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>All Statuses ({unifiedConsents.length})</option>
                      <option value="success" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>
                        Successful Only ({unifiedConsents.filter((c) => c.status === "success").length})
                      </option>
                      <option value="failed" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>
                        Failed Only ({unifiedConsents.filter((c) => c.status !== "success").length})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Consents Table */}
              <div
                className="rounded-md overflow-hidden"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Procedure & Type</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Patient</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Timestamp</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Model</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Status</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConsents.map((item) => {
                        const timeInfo = formatDateTime(item.created_at);
                        const relTime = getRelativeTime(item.created_at);
                        const isSuccess = item.status === "success";

                        return (
                          <tr
                            key={item.id}
                            className="transition-colors"
                            style={{ borderBottom: "1px solid var(--rule-soft)" }}
                          >
                            <td className="py-4 px-6">
                              <p className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>
                                {item.procedure_name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className="inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded"
                                  style={{
                                    backgroundColor: "var(--badge-light-bg)",
                                    color: "var(--badge-light-text)",
                                  }}
                                >
                                  {item.consent_type}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 font-medium" style={{ color: "var(--ink)" }}>
                              {item.patient_name || <span className="italic opacity-60 font-mono text-[11px]">Encrypted / Logged</span>}
                            </td>

                            <td className="py-4 px-6 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                              <div>{timeInfo.datePart}</div>
                              <div className="opacity-70">{timeInfo.timePart} {relTime && `(${relTime})`}</div>
                            </td>

                            <td className="py-4 px-6 font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
                              {item.model}
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                                style={{
                                  backgroundColor: isSuccess ? "var(--status-success-bg)" : "var(--status-fail-bg)",
                                  color: isSuccess ? "var(--status-success-text)" : "var(--status-fail-text)",
                                  border: `1px solid ${isSuccess ? "var(--status-success-border)" : "var(--status-fail-border)"}`,
                                }}
                              >
                                {isSuccess ? <CheckCircle weight="fill" className="w-3 h-3" /> : <XCircle weight="fill" className="w-3 h-3" />}
                                <span className="capitalize">{item.status}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                {item.markdown ? (
                                  <button
                                    onClick={() => setPreviewItem(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85 cursor-pointer"
                                    style={{
                                      backgroundColor: "var(--btn-primary-bg)",
                                      color: "var(--btn-primary-text)",
                                    }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono opacity-50 px-2 py-1">No Doc</span>
                                )}

                                {item.auditId && (
                                  <Link
                                    href={`/generations/${item.auditId}`}
                                    className="p-1.5 rounded-md transition-colors hover:bg-black/5"
                                    style={{
                                      border: "1px solid var(--rule)",
                                      color: "var(--ink)",
                                    }}
                                    title="View Audit Details"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredConsents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                            No consent forms found for this doctor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTIONS & BILLING */}
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Lifetime Value (LTV)
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1" style={{ color: "var(--ink)" }}>
                    ₹{totalPaidRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ink-muted)" }}>
                    Total revenue collected from doctor
                  </p>
                </div>

                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Credits Purchased
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1" style={{ color: "#0f766e" }}>
                    +{totalCreditsPurchased}
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ink-muted)" }}>
                    Cumulative credits via payments
                  </p>
                </div>

                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Total Orders
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1" style={{ color: "var(--ink)" }}>
                    {transactions.length}
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "#0f766e" }}>
                    {paidTxs.length} paid successfully
                  </p>
                </div>
              </div>

              {/* Transactions Ledger Card */}
              <div
                className="rounded-md overflow-hidden"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Order ID</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Payment ID</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Timestamp</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Amount</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Credits</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Status</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const timeInfo = formatDateTime(tx.created_at);

                        return (
                          <tr
                            key={tx.id}
                            className="transition-colors"
                            style={{ borderBottom: "1px solid var(--rule-soft)" }}
                          >
                            <td className="py-4 px-6 font-mono font-medium" style={{ color: "var(--ink)" }}>
                              {tx.order_id}
                            </td>

                            <td className="py-4 px-6">
                              <p className="font-mono" style={{ color: "var(--ink)" }}>{tx.payment_id || "Pending"}</p>
                              {tx.metadata?.method && (
                                <p className="text-[10px] font-mono uppercase tracking-[0.08em] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                                  {tx.metadata.method}
                                </p>
                              )}
                            </td>

                            <td className="py-4 px-6 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                              {timeInfo.datePart}
                            </td>

                            <td className="py-4 px-6 text-right font-mono font-bold text-sm" style={{ color: "var(--ink)" }}>
                              ₹{(tx.amount / 100).toFixed(2)}
                            </td>

                            <td className="py-4 px-6 text-center font-mono font-bold" style={{ color: "#0f766e" }}>
                              +{tx.credits}
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span
                                className="inline-block text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: tx.status === "paid" ? "var(--status-success-bg)" : "var(--status-warn-bg)",
                                  color: tx.status === "paid" ? "var(--status-success-text)" : "var(--status-warn-text)",
                                  border: `1px solid ${tx.status === "paid" ? "var(--status-success-border)" : "var(--status-warn-border)"}`,
                                }}
                              >
                                {tx.status}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              {tx.status === "paid" && (
                                <button
                                  onClick={() => setInvoiceTx(tx)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85 cursor-pointer"
                                  style={{
                                    backgroundColor: "var(--paper)",
                                    border: "1px solid var(--rule)",
                                    color: "var(--ink)",
                                  }}
                                >
                                  <Receipt weight="bold" className="w-3.5 h-3.5" />
                                  <span>Invoice</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                            No billing transactions recorded for this doctor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDIT HISTORY & LEDGER */}
          {activeTab === "credits" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Current Available Balance
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1 flex items-center gap-2" style={{ color: "var(--ink)" }}>
                    <Coins weight="fill" className="w-6 h-6" style={{ color: "var(--ink)" }} />
                    <span>{userProfile.credits ?? 0}</span>
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ink-muted)" }}>
                    Usable for generation queries
                  </p>
                </div>

                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Credits Added
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1" style={{ color: "#0f766e" }}>
                    +{creditLogs.filter((l) => l.amount > 0).reduce((sum, l) => sum + (l.amount || 0), 0)}
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ink-muted)" }}>
                    Purchased or granted
                  </p>
                </div>

                <div
                  className="rounded-md p-5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Credits Consumed
                  </p>
                  <h3 className="font-serif text-3xl font-bold tracking-tight mt-1" style={{ color: "var(--red)" }}>
                    {creditLogs.filter((l) => l.amount < 0).reduce((sum, l) => sum + (l.amount || 0), 0)}
                  </h3>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ink-muted)" }}>
                    Spent on document generation
                  </p>
                </div>
              </div>

              {/* History Table */}
              <div
                className="rounded-md overflow-hidden"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Event Action</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Reference ID</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Timestamp</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Delta</th>
                        <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditLogs.map((log) => {
                        const timeInfo = formatDateTime(log.created_at);

                        return (
                          <tr
                            key={log.id}
                            className="transition-colors"
                            style={{ borderBottom: "1px solid var(--rule-soft)" }}
                          >
                            <td className="py-4 px-6 font-medium capitalize" style={{ color: "var(--ink)" }}>
                              {log.action?.replace(/_/g, " ") || "Credit update"}
                            </td>

                            <td className="py-4 px-6 font-mono" style={{ color: "var(--ink-muted)" }}>
                              {log.reference_id || "N/A"}
                            </td>

                            <td className="py-4 px-6 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                              {timeInfo.datePart} {timeInfo.timePart}
                            </td>

                            <td
                              className="py-4 px-6 text-right font-mono font-bold text-sm"
                              style={{ color: log.amount < 0 ? "var(--red)" : "#0f766e" }}
                            >
                              {log.amount > 0 ? `+${log.amount}` : log.amount}
                            </td>

                            <td className="py-4 px-6 text-right font-mono font-bold" style={{ color: "var(--ink)" }}>
                              {log.balance_after}
                            </td>
                          </tr>
                        );
                      })}

                      {creditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                            No credit history events recorded for this account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & OPERATIONS */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Doctor Profile Info */}
              <div
                className="rounded-md p-6 space-y-4 lg:col-span-1"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <h3 className="font-serif text-base font-bold tracking-tight mb-4" style={{ color: "var(--ink)" }}>
                  Doctor Identity & KYC
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      Full Name
                    </p>
                    <p className="font-serif text-base font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                      {userProfile.doctor_name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      Registration Number
                    </p>
                    <p className="font-mono font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                      {userProfile.doctor_registration_no || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      Hospital / Clinic
                    </p>
                    <p className="font-medium mt-0.5" style={{ color: "var(--ink)" }}>
                      {userProfile.hospital_name || "N/A"}
                    </p>
                  </div>

                  {userProfile.hospital_address && (
                    <div>
                      <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                        Hospital Address
                      </p>
                      <p className="mt-0.5 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                        {userProfile.hospital_address}
                      </p>
                    </div>
                  )}

                  {userProfile.billing_address && (
                    <div>
                      <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                        Billing Address
                      </p>
                      <p className="mt-0.5 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                        {userProfile.billing_address}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      System Role
                    </p>
                    <span
                      className="inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold rounded mt-1"
                      style={{
                        backgroundColor: userProfile.role === "admin" ? "var(--badge-dark-bg)" : "var(--badge-light-bg)",
                        color: userProfile.role === "admin" ? "var(--badge-dark-text)" : "var(--badge-light-text)",
                      }}
                    >
                      {userProfile.role || "doctor"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Operations Console */}
              <div
                className="rounded-md p-6 lg:col-span-2 space-y-6"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div>
                  <h3 className="font-serif text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                    Administrator Controls & Overrides
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                    Manage doctor account access, override credit balances, and log governance justification notes.
                  </p>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-md"
                  style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  {/* Credit adjustment */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>Manual Credit Adjustment</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                      Add (positive) or deduct (negative) credits directly for this doctor account.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 10 or -5"
                        value={creditAdjustment || ""}
                        onChange={(e) => setCreditAdjustment(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-2 rounded-md text-xs font-mono outline-none"
                        style={{
                          backgroundColor: "var(--input-bg)",
                          border: "1px solid var(--input-border)",
                          color: "var(--input-text)",
                        }}
                      />
                      <button
                        onClick={handleAdjustCredits}
                        disabled={actionLoading || creditAdjustment === 0}
                        className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 cursor-pointer"
                        style={{
                          backgroundColor: "var(--btn-primary-bg)",
                          color: "var(--btn-primary-text)",
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Account lock/unlock */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>Access Restriction</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                      Instantly toggle whether this user can log in and generate legal consents.
                    </p>
                    <div>
                      <button
                        onClick={handleToggleStatus}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all cursor-pointer"
                        style={{
                          backgroundColor: userProfile.is_active !== false ? "var(--status-fail-bg)" : "var(--status-success-bg)",
                          color: userProfile.is_active !== false ? "var(--status-fail-text)" : "var(--status-success-text)",
                          border: `1px solid ${userProfile.is_active !== false ? "var(--status-fail-border)" : "var(--status-success-border)"}`,
                        }}
                      >
                        {userProfile.is_active !== false ? "Deactivate Account" : "Reactivate Account"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit action note */}
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold tracking-wider block mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    Audit Log Justification (Permanent Record)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the operational reason for this administrative change..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md text-xs outline-none leading-relaxed"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* QUICK VIEW CONSENT DOCUMENT MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 text-foreground font-body">
          <div
            className="w-full max-w-3xl max-h-[85vh] rounded-md p-6 sm:p-8 flex flex-col shadow-2xl relative"
            style={{
              backgroundColor: "var(--sheet)",
              border: "1px solid var(--rule)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b shrink-0" style={{ borderColor: "var(--rule)" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded"
                    style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--badge-light-text)" }}
                  >
                    {previewItem.consent_type}
                  </span>
                  <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    Generated by <strong style={{ color: "var(--ink)" }}>{userProfile.doctor_name || "Doctor"}</strong>
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  {previewItem.procedure_name}
                </h3>
                <p className="font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
                  Timestamp: {formatDateTime(previewItem.created_at).full}
                  {previewItem.patient_name && ` • Patient: ${previewItem.patient_name}`}
                </p>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: "var(--ink-muted)" }}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content */}
            <div
              className="flex-1 overflow-y-auto my-4 p-5 rounded text-xs leading-relaxed select-text font-sans"
              style={{
                backgroundColor: "var(--paper)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
              }}
            >
              {previewItem.markdown ? (
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed" style={{ color: "var(--ink)" }}>
                  {previewItem.markdown}
                </pre>
              ) : (
                <div className="text-center py-12" style={{ color: "var(--ink-muted)" }}>
                  <WarningCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Document text is not available for this record.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t shrink-0" style={{ borderColor: "var(--rule)" }}>
              <span className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>
                Model: {previewItem.model} {previewItem.tokens_used > 0 && `(${previewItem.tokens_used} tokens)`}
              </span>

              <div className="flex items-center gap-2">
                {previewItem.markdown && (
                  <button
                    onClick={() => handleCopyMarkdown(previewItem.markdown)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85 cursor-pointer"
                    style={{
                      backgroundColor: "var(--paper)",
                      border: "1px solid var(--rule)",
                      color: "var(--ink)",
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                  style={{
                    backgroundColor: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL */}
      {invoiceTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white text-neutral-900 font-body">
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
            className="w-full max-w-[500px] rounded-md p-6 sm:p-8 shadow-2xl relative"
            style={{
              backgroundColor: "var(--sheet)",
              border: "1px solid var(--rule)",
            }}
          >
            <div className="border-b pb-4 mb-5" style={{ borderColor: "var(--rule)" }}>
              <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                Payment Invoice
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                ConsentGen Medico-Legal Platform
              </p>
            </div>

            <div className="space-y-3.5 text-xs mb-6">
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Doctor Payer</span>
                <span className="font-bold font-serif" style={{ color: "var(--ink)" }}>
                  {userProfile.doctor_name || "Doctor"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Registration No.</span>
                <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                  {userProfile.doctor_registration_no || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                <span style={{ color: "var(--ink-muted)" }}>Hospital</span>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {userProfile.hospital_name || "N/A"}
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
                <span style={{ color: "var(--ink-muted)" }}>Credits Purchased</span>
                <span className="font-mono font-bold" style={{ color: "#0f766e" }}>
                  +{invoiceTx.credits} Credits
                </span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: "2px solid var(--ink)" }}>
                <span className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>Total Paid</span>
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
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: "var(--paper)",
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
