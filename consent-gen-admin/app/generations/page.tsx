"use client";

import { useEffect, useState, useCallback } from "react";
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
  ArrowRight,
  FileText,
} from "@phosphor-icons/react";

export default function GenerationsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const supabase = createClient();

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await withTimeout(
        supabase
          .from("generation_audit")
          .select("*, profiles(doctor_name)")
          .order("created_at", { ascending: false })
      );
      if (data) setAudits(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading generations list:", err);
      setError(err?.message || "Failed to connect to the database.");
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Filters
  const filteredAudits = audits.filter((audit) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (audit.id || "").toLowerCase().includes(term) ||
      (audit.consent_id || "").toLowerCase().includes(term) ||
      (audit.user_id || "").toLowerCase().includes(term) ||
      (audit.hospital_name || "").toLowerCase().includes(term) ||
      (audit.profiles?.doctor_name || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    const matchesType = typeFilter === "all" || audit.consent_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading || error) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Generations Audit" />
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
              />
              <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                Loading Generation Audits...
              </p>
            </div>
          ) : (
            <NetworkErrorBanner message={error!} onRetry={fetchAudits} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title="Generations Audit" subtitle="Diagnostic Logs & Medico-legal Tracing" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Top Page Banner */}
          <div
            className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                Diagnostic Trail
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Generations <span style={{ color: "var(--red)" }}>audit</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
                Inspect AI LLM tokens, generation latencies, encrypted patient name hashes, and error codes.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            className="rounded-md p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center justify-between"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              <input
                type="text"
                placeholder="Search UUID, Consent ID, Hospital, Doctor..."
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
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--ink)" }}
              >
                <Funnel className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--ink)" }}
                >
                  <option value="all" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>All Statuses</option>
                  <option value="success" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>Success</option>
                  <option value="failed" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>Failed</option>
                  <option value="credit_failed" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>Credit Failed</option>
                  <option value="in_progress" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>In Progress</option>
                </select>
              </div>

              {/* Type */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--ink)" }}
              >
                <FileText className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--ink)" }}
                >
                  <option value="all" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>All Types</option>
                  <option value="clinical" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>Clinical</option>
                  <option value="research" style={{ backgroundColor: "var(--sheet)", color: "var(--ink)" }}>Research</option>
                </select>
              </div>
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
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Audit UUID / ID</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Doctor Name</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Consent Type</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Latency</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Tokens</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Status</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((audit) => {
                    const isSuccess = audit.status === "success";
                    const isPending = audit.status === "in_progress";

                    return (
                      <tr
                        key={audit.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--rule-soft)" }}
                      >
                        <td className="py-4 px-6 truncate max-w-[180px]">
                          <p className="font-mono font-bold select-all" style={{ color: "var(--ink)" }}>
                            {audit.id}
                          </p>
                          <span className="text-[10px] font-mono block mt-0.5" style={{ color: "var(--ink-muted)" }}>
                            {audit.consent_id || "N/A"}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-medium">
                          <Link
                            href={`/users/${audit.user_id}`}
                            className="font-serif font-bold text-sm transition-colors hover:opacity-75"
                            style={{ color: "var(--ink)" }}
                          >
                            {audit.profiles?.doctor_name || "Doctor Account"}
                          </Link>
                          <span className="text-[10px] font-mono block mt-0.5" style={{ color: "var(--ink-muted)" }}>
                            {audit.user_id.slice(0, 8)}
                          </span>
                        </td>

                        <td className="py-4 px-6 capitalize">
                          <p className="font-medium" style={{ color: "var(--ink)" }}>
                            {audit.consent_type ? audit.consent_type.replace(/_/g, " ") : "Consent"}
                          </p>
                          {audit.sub_type && (
                            <span className="text-[10px] font-mono block mt-0.5" style={{ color: "var(--ink-muted)" }}>
                              {audit.sub_type}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 font-mono text-center" style={{ color: "var(--ink-muted)" }}>
                          {audit.generation_duration_ms ? `${(audit.generation_duration_ms / 1000).toFixed(2)}s` : "—"}
                        </td>

                        <td className="py-4 px-6 font-mono text-center" style={{ color: "var(--ink-muted)" }}>
                          {audit.prompt_tokens ? `${audit.prompt_tokens} / ${audit.completion_tokens}` : "—"}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                            style={{
                              backgroundColor: isSuccess
                                ? "var(--status-success-bg)"
                                : isPending
                                ? "var(--status-warn-bg)"
                                : "var(--status-fail-bg)",
                              color: isSuccess
                                ? "var(--status-success-text)"
                                : isPending
                                ? "var(--status-warn-text)"
                                : "var(--status-fail-text)",
                              border: `1px solid ${
                                isSuccess
                                  ? "var(--status-success-border)"
                                  : isPending
                                  ? "var(--status-warn-border)"
                                  : "var(--status-fail-border)"
                              }`,
                            }}
                          >
                            {isSuccess && <CheckCircle weight="fill" className="w-3 h-3" />}
                            {isPending && <Clock weight="fill" className="w-3 h-3" />}
                            {!isSuccess && !isPending && <XCircle weight="fill" className="w-3 h-3" />}
                            <span className="capitalize">{audit.status}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/generations/${audit.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85"
                            style={{
                              backgroundColor: "var(--paper)",
                              border: "1px solid var(--rule)",
                              color: "var(--ink)",
                            }}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" weight="bold" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAudits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                        No generation audits matched the specified criteria.
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
