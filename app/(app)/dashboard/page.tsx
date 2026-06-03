import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  Stethoscope,
  Search,
  Plus
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const supabase = createClient();
  const { data: history, error } = await supabase
    .from("consent_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching history:", error);
  }

  const entries = history ?? [];
  const totalEntries = entries.length;

  // Count by consent type
  const typeCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    const type = entry.consent_type || "unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const mostCommonType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="min-h-screen bg-nq-bg font-inter">
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10 space-y-10">
        
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-nq-border">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-nq-text tracking-tight">
              Overview
            </h1>
            <p className="text-sm text-nq-text-muted mt-2">
              Track your generated medico-legal consent forms
            </p>
          </div>
          <Link
            href="/generate"
            className="nq-btn-primary py-2.5 px-6 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Consent Form
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="nq-card nq-noise p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nq-text-muted">Total Consents</p>
              <p className="text-3xl font-black text-nq-text tracking-tight">{totalEntries}</p>
            </div>
          </div>

          <div className="nq-card nq-noise p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50 border border-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nq-text-muted">Most Common</p>
              <p className="text-lg font-black text-nq-text capitalize leading-tight">
                {mostCommonType === "—"
                  ? "—"
                  : mostCommonType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div className="nq-card nq-noise p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-100">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nq-text-muted">Last Generated</p>
              <p className="text-lg font-black text-nq-text leading-tight">
                {entries[0]
                  ? new Date(entries[0].created_at).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-nq-text tracking-tight">
              Recent Consents
            </h2>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm font-semibold text-nq-purple hover:text-nq-purple/80 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="nq-card nq-noise text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5 border border-nq-border">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-nq-text mb-2">
                No consents yet
              </h3>
              <p className="text-sm text-nq-text-muted mb-6 max-w-sm mx-auto">
                Generate your first consent form and it will appear here.
              </p>
              <Link
                href="/generate"
                className="nq-btn-primary py-2.5 px-6 text-sm mx-auto"
              >
                <Plus className="w-4 h-4" />
                Generate Consent
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {entries.map((entry) => (
                <div key={entry.id} className="nq-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-nq-purple/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-nq-purple-soft flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-nq-purple" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-nq-text mb-1 tracking-tight">
                        {entry.patient_name || "Unknown Patient"} —{" "}
                        {entry.procedure_name || "Unknown Procedure"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg text-nq-purple bg-nq-purple-soft">
                          {(entry.consent_type || "unknown").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-medium text-nq-text-muted flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-nq-border">
                          <Calendar className="w-3 h-3" />
                          {entry.procedure_date || "No date"}
                        </span>
                        <span className="text-xs font-medium text-nq-text-light font-mono">
                          #{entry.consent_id?.slice(0,8)}
                        </span>
                      </div>
                      {entry.hospital_name && (
                        <p className="text-xs font-medium text-nq-text-muted mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"/>
                          {entry.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-nq-border w-full sm:w-auto">
                    <span className="text-xs font-semibold text-nq-text-muted hidden sm:block">
                      {new Date(entry.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Link
                      href={`/history?id=${entry.id}`}
                      className="w-full sm:w-auto text-center px-4 py-2 bg-white border border-nq-border text-nq-text text-xs font-bold rounded-xl hover:border-nq-purple hover:text-nq-purple transition-all shadow-sm"
                    >
                      View Document
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
