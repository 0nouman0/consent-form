"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/fetchWithTimeout";
import {
  Users,
  Coins,
  Files,
  TrendUp,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowClockwise,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCredits: 0,
    totalGenerations: 0,
    successGenerations: 0,
    failedGenerations: 0,
    totalRevenue: 0,
    paidTransactions: 0,
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Fetch profiles metrics
      const { data: profiles } = await withTimeout(
        supabase.from("profiles").select("id, credits, is_active")
      );

      const totalUsers = profiles?.length || 0;
      const totalCredits = profiles?.reduce((sum: number, p: any) => sum + (p.credits || 0), 0) || 0;

      // Fetch audit logs
      const { data: audits } = await withTimeout(
        supabase.from("generation_audit").select("*").order("created_at", { ascending: false })
      );

      const totalGenerations = audits?.length || 0;
      const successGenerations = audits?.filter((a: any) => a.status === "success").length || 0;
      const failedGenerations = audits?.filter((a: any) => a.status === "failed" || a.status === "credit_failed").length || 0;

      // Fetch transactions
      const { data: txs } = await withTimeout(
        supabase.from("transactions").select("amount, status")
      );

      const paidTxs = txs?.filter((t: any) => t.status === "paid") || [];
      const paidTransactions = paidTxs.length;
      const totalRevenue = paidTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) / 100; // in INR

      setStats({
        totalUsers,
        totalCredits,
        totalGenerations,
        successGenerations,
        failedGenerations,
        totalRevenue,
        paidTransactions,
      });

      if (audits) {
        setRecentAudits(audits.slice(0, 5));
      }

      // Generate chart data for last 7 days
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
      }).reverse();

      const formattedChartData = last7Days.map((date) => {
        const dayName = days[date.getDay()];
        const dateStr = date.toDateString();

        const dayAudits = audits?.filter((a: any) => new Date(a.created_at).toDateString() === dateStr) || [];
        const success = dayAudits.filter((a: any) => a.status === "success").length;
        const failed = dayAudits.filter((a: any) => a.status === "failed" || a.status === "credit_failed").length;

        return {
          name: dayName,
          Success: success,
          Failed: failed,
        };
      });

      setChartData(formattedChartData);
      setLoading(false);
      setRefreshing(false);
    } catch (err: any) {
      console.error("Error loading dashboard stats:", err);
      setError(err?.message || "Failed to connect to the database.");
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading || error) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Operations Dashboard" />
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
              />
              <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                Loading Telemetry...
              </p>
            </div>
          ) : (
            <NetworkErrorBanner message={error!} onRetry={() => fetchDashboardData()} />
          )}
        </div>
      </div>
    );
  }

  const successRate = stats.totalGenerations > 0
    ? ((stats.successGenerations / stats.totalGenerations) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex min-h-screen font-body transition-colors duration-150" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title="Operations Dashboard" subtitle="ConsentGen System Telemetry & Insights" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Page Header Card */}
          <div
            className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                System Telemetry
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Operations <span style={{ color: "var(--red)" }}>overview</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
                Real-time monitor of doctor registrations, circulating credits, and consent generation throughput.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: "var(--badge-light-bg)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink)",
                }}
              >
                <ArrowClockwise className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} weight="bold" />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Stat 1 */}
            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-dark-bg)" }}
              >
                <Users weight="duotone" className="w-5 h-5" style={{ color: "var(--badge-dark-text)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Registered Doctors
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  {stats.totalUsers}
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <Coins weight="duotone" className="w-5 h-5" style={{ color: "var(--ink)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  System Credits Pool
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  {stats.totalCredits}
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <Files weight="duotone" className="w-5 h-5" style={{ color: "var(--ink)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Forms Generated
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  {stats.totalGenerations}
                </p>
              </div>
            </div>

            {/* Stat 4 */}
            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <TrendUp weight="duotone" className="w-5 h-5" style={{ color: "var(--red)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Revenue Collected
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  ₹{stats.totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Charts & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Generation Activity Chart */}
            <div
              className="rounded-md p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between transition-colors"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                    Consent Generation Activity
                  </h2>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                    Success vs Failures (Last 7 Days)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.08em]">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--chart-success)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-success)" }} /> Success
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "var(--chart-fail)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-fail)" }} /> Failure
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-success)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--chart-success)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-fail)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--chart-fail)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="var(--ink-muted)"
                      tickLine={false}
                      className="text-[11px] font-mono"
                    />
                    <YAxis
                      stroke="var(--ink-muted)"
                      tickLine={false}
                      className="text-[11px] font-mono"
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--sheet)",
                        border: "1px solid var(--rule)",
                        borderRadius: "0.375rem",
                        color: "var(--ink)",
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      }}
                      itemStyle={{ color: "var(--ink)" }}
                      labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Success"
                      stroke="var(--chart-success)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Failed"
                      stroke="var(--chart-fail)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality & Performance Metrics */}
            <div
              className="rounded-md p-5 sm:p-6 flex flex-col justify-between transition-colors"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight mb-1" style={{ color: "var(--ink)" }}>
                  Operational Reliability
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] mb-5" style={{ color: "var(--ink-muted)" }}>
                  Pipeline Success Metric
                </p>

                <div className="space-y-4">
                  {/* Success Rate */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                        <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                        Successful Generations
                      </span>
                      <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                        {stats.successGenerations} ({successRate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--badge-light-bg)" }}>
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(successRate) || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Failure count */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                        <XCircle className="w-4 h-4 text-red-500" weight="fill" />
                        Generation Failures
                      </span>
                      <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                        {stats.failedGenerations}
                      </span>
                    </div>
                  </div>

                  {/* Paid transactions */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                        <Receipt className="w-4 h-4" weight="fill" style={{ color: "var(--ink)" }} />
                        Paid Orders Logged
                      </span>
                      <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                        {stats.paidTransactions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6" style={{ borderTop: "1px solid var(--rule)" }}>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                  Telemetry streams from Supabase <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--ink)" }}>generation_audit</code> and Cashfree payment records.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Generation Logs */}
          <div
            className="rounded-md overflow-hidden transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--rule)" }}
            >
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Recent Consent Generations
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Real-time audit log
                </p>
              </div>
              <Link
                href="/generations"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-colors hover:opacity-75"
                style={{ color: "var(--ink)" }}
              >
                View all <ArrowRight weight="bold" className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                    <th className="py-3 px-6 font-mono uppercase tracking-[0.08em]">Audit UUID</th>
                    <th className="py-3 px-6 font-mono uppercase tracking-[0.08em]">Consent Type</th>
                    <th className="py-3 px-6 font-mono uppercase tracking-[0.08em]">Hospital / Center</th>
                    <th className="py-3 px-6 font-mono uppercase tracking-[0.08em]">Created At</th>
                    <th className="py-3 px-6 font-mono uppercase tracking-[0.08em] text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((audit) => {
                    const isSuccess = audit.status === "success";
                    const isPending = audit.status === "in_progress";

                    return (
                      <tr
                        key={audit.id}
                        className="transition-colors"
                        style={{
                          borderBottom: "1px solid var(--rule-soft)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--row-hover-bg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td className="py-3.5 px-6 font-mono font-semibold truncate max-w-[150px]" style={{ color: "var(--ink)" }}>
                          {audit.id}
                        </td>
                        <td className="py-3.5 px-6 capitalize font-medium" style={{ color: "var(--ink)" }}>
                          {audit.consent_type ? audit.consent_type.replace(/_/g, " ") : "Consent"}
                          {audit.sub_type && (
                            <span className="font-mono text-[10px] ml-1.5 opacity-70">
                              ({audit.sub_type})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 truncate max-w-[180px]" style={{ color: "var(--ink-soft)" }}>
                          {audit.hospital_name || "—"}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                          {new Date(audit.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                            style={{
                              backgroundColor: isSuccess
                                ? "var(--status-success-bg)"
                                : isPending
                                ? "rgba(59, 130, 246, 0.15)"
                                : "var(--status-fail-bg)",
                              color: isSuccess
                                ? "var(--status-success-text)"
                                : isPending
                                ? "#3b82f6"
                                : "var(--status-fail-text)",
                              border: `1px solid ${
                                isSuccess
                                  ? "var(--status-success-border)"
                                  : isPending
                                  ? "rgba(59, 130, 246, 0.3)"
                                  : "var(--status-fail-border)"
                              }`,
                            }}
                          >
                            {isSuccess && <CheckCircle className="w-3 h-3" weight="fill" />}
                            {isPending && <Clock className="w-3 h-3" weight="fill" />}
                            {!isSuccess && !isPending && <XCircle className="w-3 h-3" weight="fill" />}
                            <span>{audit.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {recentAudits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                        No consent generation audits recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
