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
    <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ backgroundColor: "var(--paper)" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Overview</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Consent <span style={{ color: "var(--red)" }}>overview</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>Track your generated medico-legal consent forms</p>
          </div>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all pl-5 pr-2 py-2 hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
          >
            New Consent
            <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "rgba(252,251,247,0.15)" }}>
              <Plus className="w-3 h-3" weight="bold" style={{ color: "var(--sheet)" }} />
            </span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total */}
          <div className="rounded-md p-6 flex items-center gap-5" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--ink)" }}>
              <Files weight="duotone" className="w-5 h-5" style={{ color: "var(--sheet)" }} />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Total Consents</p>
              <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>{totalEntries}</p>
            </div>
          </div>

          {/* Most Common */}
          <div className="rounded-md p-6 flex items-center gap-5" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--paper)" }}>
              <TrendUp weight="duotone" className="w-5 h-5" style={{ color: "var(--ink-muted)" }} />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Most Common</p>
              <p className="font-serif text-lg font-bold tracking-tight mt-0.5 capitalize leading-tight" style={{ color: "var(--ink)" }}>
                {mostCommonType === "—" ? "—" : mostCommonType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Last Generated */}
          <div className="rounded-md p-6 flex items-center gap-5" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--paper)" }}>
              <Timer weight="duotone" className="w-5 h-5" style={{ color: "var(--ink-muted)" }} />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Last Generated</p>
              <p className="font-serif text-lg font-bold tracking-tight mt-0.5 leading-tight" style={{ color: "var(--ink)" }}>
                {entries[0] ? new Date(entries[0].created_at).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Consents */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          {/* Section header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid var(--rule)" }}>
            <h2 className="font-serif text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>Recent Consents</h2>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "var(--ink-muted)" }}
            >
              View all <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--paper)" }}>
                <MagnifyingGlass weight="duotone" className="w-6 h-6" style={{ color: "var(--ink-muted)" }} />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>No consents yet</h3>
              <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: "var(--ink-muted)" }}>
                Generate your first consent form and it will appear here.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all pl-5 pr-2 py-2 hover:opacity-90"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                Generate Consent
                <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "rgba(252,251,247,0.15)" }}>
                  <Plus className="w-3 h-3" weight="bold" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--rule)" }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--paper)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--paper)" }}>
                      <Stethoscope weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
                        {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] rounded-md" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}>
                          {(entry.consent_type || "unknown").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
                          <CalendarBlank weight="regular" className="w-3 h-3" />
                          {entry.procedure_date || "No date"}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>#{entry.consent_id?.slice(0, 8)}</span>
                      </div>
                      {entry.hospital_name && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--rule)" }} /> {entry.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto" style={{ borderColor: "var(--rule)" }}>
                    <span className="text-xs hidden sm:block whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                      {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link
                      href={`/history?id=${entry.id}`}
                      className="w-full sm:w-auto text-center px-4 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[var(--paper)]"
                      style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
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
