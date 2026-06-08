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
    <div className="min-h-screen font-body" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="font-sans font-black text-4xl sm:text-5xl text-foreground tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-2">Track your generated medico-legal consent forms</p>
          </div>
          <Link href="/generate" className="btn-primary py-2.5 px-6 text-sm">
            <Plus weight="bold" className="w-4 h-4" /> New Consent Form
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-5 shadow-card">
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shrink-0">
              <Files weight="duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Consents</p>
              <p className="font-sans font-black text-4xl text-foreground tracking-tight">{totalEntries}</p>
            </div>
          </div>

          <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-5 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <TrendUp weight="duotone" className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Most Common</p>
              <p className="font-sans font-black text-xl text-foreground capitalize leading-tight">
                {mostCommonType === "—" ? "—" : mostCommonType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-5 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Timer weight="duotone" className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Generated</p>
              <p className="font-sans font-black text-xl text-foreground leading-tight">
                {entries[0] ? new Date(entries[0].created_at).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sans font-black text-2xl text-foreground tracking-tight">Recent Consents</h2>
            <Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="bg-background border border-border rounded-2xl text-center py-16 shadow-card">
              <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5 border border-border">
                <MagnifyingGlass weight="duotone" className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-sans font-bold text-xl text-foreground mb-2">No consents yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Generate your first consent form and it will appear here.
              </p>
              <Link href="/generate" className="btn-primary py-2.5 px-6 text-sm mx-auto">
                <Plus weight="bold" className="w-4 h-4" /> Generate Consent
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {entries.map((entry) => (
                <div key={entry.id}
                  className="bg-background border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-card hover:border-primary/30 hover:shadow-card-hover transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--primary) / 0.1)" }}>
                      <Stethoscope weight="duotone" className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg text-primary"
                          style={{ background: "hsl(var(--primary) / 0.08)" }}>
                          {(entry.consent_type || "unknown").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-lg border border-border">
                          <CalendarBlank weight="regular" className="w-3 h-3" />
                          {entry.procedure_date || "No date"}
                        </span>
                        <span className="text-xs text-muted-foreground/60 font-mono">#{entry.consent_id?.slice(0, 8)}</span>
                      </div>
                      {entry.hospital_name && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-border" /> {entry.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-border w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link href={`/history?id=${entry.id}`}
                      className="w-full sm:w-auto text-center px-4 py-2 bg-background border border-border text-foreground text-xs font-semibold rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm">
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
