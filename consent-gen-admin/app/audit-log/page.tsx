"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { MagnifyingGlass, Gear, ShieldCheck } from "@phosphor-icons/react";

export default function AuditLogsList() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchAdminLogs() {
      try {
        const { data } = await supabase
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
    return (
      (log.action || "").toLowerCase().includes(term) ||
      (log.target_id || "").toLowerCase().includes(term) ||
      (log.note || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title="Admin Logs" subtitle="Security & Administrative Governance Trail" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Top Page Banner */}
          <div
            className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                Governance
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Admin <span style={{ color: "var(--red)" }}>action trail</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
                Tamper-evident log of administrator interventions, user status toggles, and manual credit allocations.
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div
            className="rounded-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              <input
                type="text"
                placeholder="Search action, target ID, explanation note..."
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
          </div>

          {/* Table Card */}
          <div
            className="rounded-md overflow-hidden"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Action UUID</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Admin Operator</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Action Type</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Target</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Explanation Note</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Executed At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div
                          className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                          style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isDanger = log.action.includes("deactivate") || log.action.includes("block");
                      const isSuccess = log.action.includes("activate");

                      return (
                        <tr
                          key={log.id}
                          className="transition-colors"
                          style={{ borderBottom: "1px solid var(--rule-soft)" }}
                        >
                          <td className="py-4 px-6 font-mono font-medium select-all" style={{ color: "var(--ink)" }}>
                            {log.id.slice(0, 8)}...
                          </td>
                          <td className="py-4 px-6 font-mono" style={{ color: "var(--ink-soft)" }}>
                            {log.admin_user_id.slice(0, 8)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                              style={{
                                backgroundColor: isDanger
                                  ? "var(--status-fail-bg)"
                                  : isSuccess
                                  ? "var(--status-success-bg)"
                                  : "var(--badge-light-bg)",
                                color: isDanger
                                  ? "var(--status-fail-text)"
                                  : isSuccess
                                  ? "var(--status-success-text)"
                                  : "var(--badge-light-text)",
                                border: `1px solid ${
                                  isDanger
                                    ? "var(--status-fail-border)"
                                    : isSuccess
                                    ? "var(--status-success-border)"
                                    : "var(--rule)"
                                }`,
                              }}
                            >
                              <Gear weight="fill" className="w-3 h-3" />
                              <span>{log.action.replace(/_/g, " ")}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium capitalize" style={{ color: "var(--ink)" }}>
                            {log.target_type}
                            {log.target_id && (
                              <span className="font-mono text-[10px] block opacity-70 mt-0.5">
                                {log.target_id.slice(0, 10)}...
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 max-w-xs" style={{ color: "var(--ink-soft)" }}>
                            {log.note || <span className="italic opacity-60">No audit justification recorded</span>}
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                            {new Date(log.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {!loading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                        No administrative audit logs found.
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
