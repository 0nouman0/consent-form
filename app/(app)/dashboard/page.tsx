import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Files, TrendUp, Timer, ArrowRight,
  CalendarBlank, Stethoscope, MagnifyingGlass, Plus,
} from "@phosphor-icons/react/dist/ssr";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const supabase = createClient();
  const { data: history, error } = await supabase
    .from("consent_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) console.error("Error fetching history:", error);

  const entries = history ?? [];
  const totalEntries = entries.length;

  const typeCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    const type = entry.consent_type || "unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const mostCommonType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Overview</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
              Consent <span className="font-serif italic font-normal text-neutral-600" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>overview</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Track your generated medico-legal consent forms</p>
          </div>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white transition-all pl-5 pr-2 py-2 hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: "#0b0f1a" }}
          >
            New Consent
            <span className="flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <Plus className="w-3 h-3 text-white" weight="bold" />
            </span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total */}
          <div className="bg-white rounded-2xl p-6 flex items-center gap-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#0b0f1a" }}>
              <Files weight="duotone" className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Consents</p>
              <p className="text-3xl font-bold tracking-tight mt-0.5" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>{totalEntries}</p>
            </div>
          </div>

          {/* Most Common */}
          <div className="bg-white rounded-2xl p-6 flex items-center gap-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-neutral-100">
              <TrendUp weight="duotone" className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Most Common</p>
              <p className="text-lg font-bold tracking-tight mt-0.5 capitalize leading-tight" style={{ color: "#0b0f1a" }}>
                {mostCommonType === "—" ? "—" : mostCommonType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Last Generated */}
          <div className="bg-white rounded-2xl p-6 flex items-center gap-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-neutral-100">
              <Timer weight="duotone" className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Last Generated</p>
              <p className="text-lg font-bold tracking-tight mt-0.5 leading-tight" style={{ color: "#0b0f1a" }}>
                {entries[0] ? new Date(entries[0].created_at).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Consents */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {/* Section header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "#0b0f1a" }}>Recent Consents</h2>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              View all <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass weight="duotone" className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800 mb-1">No consents yet</h3>
              <p className="text-sm text-neutral-500 mb-5 max-w-xs mx-auto">
                Generate your first consent form and it will appear here.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white transition-all pl-5 pr-2 py-2 hover:opacity-90"
                style={{ backgroundColor: "#0b0f1a" }}
              >
                Generate Consent
                <span className="flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Plus className="w-3 h-3" weight="bold" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100">
                      <Stethoscope weight="duotone" className="w-4 h-4 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: "#0b0f1a" }}>
                        {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-neutral-100 text-neutral-600">
                          {(entry.consent_type || "unknown").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <CalendarBlank weight="regular" className="w-3 h-3" />
                          {entry.procedure_date || "No date"}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">#{entry.consent_id?.slice(0, 8)}</span>
                      </div>
                      {entry.hospital_name && (
                        <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /> {entry.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <span className="text-xs text-neutral-400 hidden sm:block whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link
                      href={`/history?id=${entry.id}`}
                      className="w-full sm:w-auto text-center px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0b0f1a" }}
                    >
                      View
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
