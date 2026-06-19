"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Coins,
  FileText,
  TrendUp,
  Receipt,
  CheckCircle,
  XCircle,
  Clock
} from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
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

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch profiles metrics
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, credits, is_active");

        const totalUsers = profiles?.length || 0;
        const totalCredits = profiles?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;

        // Fetch audit logs
        const { data: audits, error: aErr } = await supabase
          .from("generation_audit")
          .select("*")
          .order("created_at", { ascending: false });

        const totalGenerations = audits?.length || 0;
        const successGenerations = audits?.filter(a => a.status === "success").length || 0;
        const failedGenerations = audits?.filter(a => a.status === "failed" || a.status === "credit_failed").length || 0;

        // Fetch transactions
        const { data: txs, error: tErr } = await supabase
          .from("transactions")
          .select("amount, status");

        const paidTxs = txs?.filter(t => t.status === "paid") || [];
        const paidTransactions = paidTxs.length;
        const totalRevenue = paidTxs.reduce((sum, t) => sum + (t.amount || 0), 0) / 100; // in INR

        setStats({
          totalUsers,
          totalCredits,
          totalGenerations,
          successGenerations,
          failedGenerations,
          totalRevenue,
          paidTransactions,
        });

        // Set recent audits (limit 5)
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

        const formattedChartData = last7Days.map(date => {
          const dayName = days[date.getDay()];
          const dateStr = date.toDateString();

          const dayAudits = audits?.filter(a => new Date(a.created_at).toDateString() === dateStr) || [];
          const success = dayAudits.filter(a => a.status === "success").length;
          const failed = dayAudits.filter(a => a.status === "failed" || a.status === "credit_failed").length;

          return {
            name: dayName,
            Success: success,
            Failed: failed,
          };
        });

        setChartData(formattedChartData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Operations Dashboard" />
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
        <Header title="Operations Dashboard" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Stat grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1 */}
            <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Users className="w-6 h-6 text-amber-500" weight="fill" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Registered Doctors</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{stats.totalUsers}</h3>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Coins className="w-6 h-6 text-amber-500" weight="fill" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">System Credits Pool</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{stats.totalCredits}</h3>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <FileText className="w-6 h-6 text-amber-500" weight="fill" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Total Forms Generated</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{stats.totalGenerations}</h3>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <TrendUp className="w-6 h-6 text-amber-500" weight="fill" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Total Revenue Collected</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
              </div>
            </div>
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Trends */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Consent Generation Activity</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted text-[10px]" />
                    <YAxis stroke="currentColor" className="text-muted text-[10px]" />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                    <Legend />
                    <Area type="monotone" dataKey="Success" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance metrics */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Quality & Success Rate</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><CheckCircle className="text-emerald-500" /> Successful</span>
                    <span className="text-xs font-bold">{stats.successGenerations} ({stats.totalGenerations > 0 ? ((stats.successGenerations / stats.totalGenerations) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><XCircle className="text-red-500" /> Failures</span>
                    <span className="text-xs font-bold">{stats.failedGenerations} ({stats.totalGenerations > 0 ? ((stats.failedGenerations / stats.totalGenerations) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><Receipt className="text-amber-500" /> Paid Orders</span>
                    <span className="text-xs font-bold">{stats.paidTransactions}</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-card-border mt-6">
                <p className="text-[10px] text-muted leading-relaxed">
                  Activity is measured based on the system's real-time audit database. Any generation failure is logged to preserve diagnostic data.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Audits Table */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Recent Consent Generation Logs</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="py-3 font-semibold">Consent UUID</th>
                    <th className="py-3 font-semibold">Consent Type</th>
                    <th className="py-3 font-semibold">Hospital Name</th>
                    <th className="py-3 font-semibold">Created At</th>
                    <th className="py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50">
                  {recentAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-amber-500 truncate max-w-[150px]">{audit.id}</td>
                      <td className="py-3 capitalize">{audit.consent_type} ({audit.sub_type})</td>
                      <td className="py-3">{audit.hospital_name || "N/A"}</td>
                      <td className="py-3 text-muted">{new Date(audit.created_at).toLocaleString("en-IN")}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          audit.status === "success"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : audit.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {audit.status === "success" && <CheckCircle weight="fill" />}
                          {audit.status === "in_progress" && <Clock weight="fill" />}
                          {(audit.status === "failed" || audit.status === "credit_failed") && <XCircle weight="fill" />}
                          <span className="capitalize">{audit.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentAudits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted">
                        No generation audits available. Run a form generation in ConsentGen to view logs.
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
