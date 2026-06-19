"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { MagnifyingGlass, CheckCircle, WarningCircle, Gear } from "@phosphor-icons/react";

export default function AuditLogsList() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchAdminLogs() {
      try {
        // Fetch luffy admin logs with profiles
        const { data, error } = await supabase
          .from("luffy_admin_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (data) {
          setLogs(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading admin logs:", err);
        setLoading(false);
      }
    }

    fetchAdminLogs();
  }, [supabase]);

  // Filters
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (log.action || "").toLowerCase().includes(term) ||
           (log.target_id || "").toLowerCase().includes(term) ||
           (log.note || "").toLowerCase().includes(term);
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title="Luffy Admin Action Trail" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search action, target ID, note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 transition-all text-foreground"
              />
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="py-3 font-semibold">Action UUID</th>
                    <th className="py-3 font-semibold">Admin User</th>
                    <th className="py-3 font-semibold">Action</th>
                    <th className="py-3 font-semibold">Target Type</th>
                    <th className="py-3 font-semibold">Target ID</th>
                    <th className="py-3 font-semibold">Notes / Explanation</th>
                    <th className="py-3 font-semibold text-center">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="py-4 font-mono select-all text-muted">{log.id.slice(0, 8)}...</td>
                      <td className="py-4 font-mono font-semibold text-foreground">{log.admin_user_id.slice(0, 8)}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes("deactivate") || log.action.includes("block")
                            ? "bg-red-500/10 text-red-500"
                            : log.action.includes("activate")
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}>
                          <Gear weight="fill" />
                          <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                        </span>
                      </td>
                      <td className="py-4 capitalize font-semibold text-muted">{log.target_type}</td>
                      <td className="py-4 font-mono select-all text-muted truncate max-w-[120px]">{log.target_id || "N/A"}</td>
                      <td className="py-4 text-foreground leading-normal max-w-xs">{log.note || "No audit explanation provided."}</td>
                      <td className="py-4 text-center text-muted">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {!loading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        No admin audit logs recorded.
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
