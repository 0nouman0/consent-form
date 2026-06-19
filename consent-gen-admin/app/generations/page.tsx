"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { MagnifyingGlass, Funnel, CheckCircle, XCircle, Clock, ArrowSquareOut } from "@phosphor-icons/react";

export default function GenerationsList() {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    async function fetchAudits() {
      try {
        // Fetch all generation audits with doctors profiles
        const { data, error } = await supabase
          .from("generation_audit")
          .select("*, profiles(doctor_name)")
          .order("created_at", { ascending: false });

        if (data) {
          setAudits(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading generations list:", err);
        setLoading(false);
      }
    }

    fetchAudits();
  }, [supabase]);

  // Filters
  const filteredAudits = audits.filter((audit) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (audit.id || "").toLowerCase().includes(term) ||
                          (audit.consent_id || "").toLowerCase().includes(term) ||
                          (audit.user_id || "").toLowerCase().includes(term) ||
                          (audit.hospital_name || "").toLowerCase().includes(term) ||
                          (audit.profiles?.doctor_name || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    const matchesType = typeFilter === "all" || audit.consent_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title="Consent Generations Audit" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search UUID, Consent ID, Hospital, User..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 transition-all text-foreground"
              />
            </div>

            {/* Select filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Funnel className="w-4 h-4 text-muted" />
              
              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 px-4 rounded-xl text-xs bg-white/5 border border-card-border outline-none text-foreground focus:border-amber-500"
              >
                <option value="all" className="bg-background">All Statuses</option>
                <option value="success" className="bg-background">Success</option>
                <option value="failed" className="bg-background">Failed</option>
                <option value="credit_failed" className="bg-background">Credit Failed</option>
                <option value="in_progress" className="bg-background">In Progress</option>
              </select>

              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-2.5 px-4 rounded-xl text-xs bg-white/5 border border-card-border outline-none text-foreground focus:border-amber-500"
              >
                <option value="all" className="bg-background">All Types</option>
                <option value="clinical" className="bg-background">Clinical</option>
                <option value="research" className="bg-background">Research</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="py-3 font-semibold">ID / Reference</th>
                    <th className="py-3 font-semibold">Doctor / Account</th>
                    <th className="py-3 font-semibold">Consent Type</th>
                    <th className="py-3 font-semibold text-center">Duration</th>
                    <th className="py-3 font-semibold text-center">Tokens (P/C)</th>
                    <th className="py-3 font-semibold text-center">IP Address</th>
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
                  ) : filteredAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="py-4 truncate max-w-[180px]">
                        <div>
                          <p className="font-mono font-bold text-amber-500 select-all" title="Generation UUID">{audit.id}</p>
                          <span className="text-[10px] text-muted font-semibold break-all" title="Consent Form ID">{audit.consent_id || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-foreground">
                        <div>
                          <p className="font-semibold">{audit.profiles?.doctor_name || "N/A"}</p>
                          <span className="text-[9px] text-muted font-mono">{audit.user_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-4 capitalize">
                        <div>
                          <p>{audit.consent_type}</p>
                          <span className="text-[9px] text-muted">{audit.sub_type}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-center text-muted">
                        {audit.generation_duration_ms ? `${(audit.generation_duration_ms / 1000).toFixed(2)}s` : "N/A"}
                      </td>
                      <td className="py-4 font-mono text-center text-muted">
                        {audit.prompt_tokens ? `${audit.prompt_tokens} / ${audit.completion_tokens}` : "N/A"}
                      </td>
                      <td className="py-4 font-mono text-center text-muted">{audit.ip_address || "N/A"}</td>
                      <td className="py-4 text-center">
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
                      <td className="py-4 text-right">
                        <Link
                          href={`/generations/${audit.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold transition-all border border-amber-500/15 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowSquareOut className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredAudits.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted">
                        No generation audits matched filters.
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
