"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Bug, ChartLineUp, Funnel, Translate, CurrencyInr, UsersThree, FilePdf } from "@phosphor-icons/react";

type EventRow = {
  event: string;
  session_id: string | null;
  user_id: string | null;
  path: string | null;
  props: Record<string, string | number | boolean> | null;
  created_at: string;
};
type ErrorRow = {
  id: number;
  created_at: string;
  source: string;
  message: string;
  fingerprint: string;
  path: string | null;
  user_id: string | null;
};

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const card = { backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" } as const;

function distinct<T>(values: Array<T | null | undefined>): number {
  return new Set(values.filter((v): v is T => v !== null && v !== undefined)).size;
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

export default function InsightsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [days, setDays] = useState(30);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0); // time of the last fetch; keeps the render itself pure
  const [problem, setProblem] = useState<{ kind: "missing" | "other"; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setProblem(null);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const [ev, er] = await Promise.all([
      supabase.from("app_events").select("event,session_id,user_id,path,props,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(10000),
      supabase.from("app_errors").select("id,created_at,source,message,fingerprint,path,user_id").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
    ]);
    const err = ev.error || er.error;
    if (err) {
      // 42P01 / PGRST205: the observability tables do not exist yet
      const missing = err.code === "42P01" || err.code === "PGRST205" || /does not exist|schema cache/i.test(err.message);
      setProblem({ kind: missing ? "missing" : "other", message: err.message });
      setEvents([]);
      setErrors([]);
    } else {
      setEvents((ev.data ?? []) as EventRow[]);
      setErrors((er.data ?? []) as ErrorRow[]);
    }
    setLoadedAt(Date.now());
    setLoading(false);
  }, [supabase, days]);

  useEffect(() => {
    load();
  }, [load]);

  const m = useMemo(() => {
    const of = (name: string) => events.filter((e) => e.event === name);
    const views = of("page_view");
    const generated = of("form_generated");
    const nonEnglish = generated.filter((e) => e.props?.language && e.props.language !== "English");
    const fallback = nonEnglish.filter((e) => e.props?.translation === "client_fallback");
    const paid = of("payment_succeeded");
    const exportsBy = {
      pdf: of("export_pdf").length,
      docx: of("export_docx").length,
      print: of("print").length,
    };

    // forms per day for a small trend
    const perDay = new Map<string, number>();
    generated.forEach((e) => {
      const d = e.created_at.slice(0, 10);
      perDay.set(d, (perDay.get(d) ?? 0) + 1);
    });
    const trend = Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const d = new Date(loadedAt - (Math.min(days, 14) - 1 - i) * 86_400_000).toISOString().slice(0, 10);
      return { day: d.slice(5), n: perDay.get(d) ?? 0 };
    });

    return {
      visitors: distinct(views.map((e) => e.session_id)),
      landingVisitors: distinct(views.filter((e) => e.path === "/").map((e) => e.session_id)),
      signups: of("signup_completed").length,
      logins: of("login_success").length,
      onboarded: of("onboarding_completed").length,
      formsGenerated: generated.length,
      formUsers: distinct(generated.map((e) => e.user_id)),
      formsFailed: of("form_failed").length,
      checkoutUsers: distinct(of("payment_started").map((e) => e.user_id)),
      payers: distinct(paid.map((e) => e.user_id)),
      revenue: paid.reduce((s, e) => s + (Number(e.props?.amount) || 0), 0),
      nonEnglish: nonEnglish.length,
      fallback: fallback.length,
      exportsBy,
      trend,
    };
  }, [events, days, loadedAt]);

  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; last: string; source: string; message: string; path: string | null }>();
    errors.forEach((e) => {
      const g = map.get(e.fingerprint);
      if (g) g.count += 1;
      else map.set(e.fingerprint, { count: 1, last: e.created_at, source: e.source, message: e.message, path: e.path });
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 25);
  }, [errors]);

  const funnel = [
    { label: "Visitors (landing page)", value: m.landingVisitors, base: m.landingVisitors },
    { label: "Sign-ups completed", value: m.signups, base: m.landingVisitors },
    { label: "Profile set up", value: m.onboarded, base: m.signups },
    { label: "Generated a form", value: m.formUsers, base: m.onboarded },
    { label: "Started a payment", value: m.checkoutUsers, base: m.formUsers },
    { label: "Paid", value: m.payers, base: m.checkoutUsers },
  ];
  const top = Math.max(1, ...funnel.map((f) => f.value));
  const trendMax = Math.max(1, ...m.trend.map((t) => t.n));

  return (
    <AppShell title="Insights" subtitle="Funnel, Health & Error Reports">
      <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
        <div className="rounded-xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={card}>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Product insight</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Funnel <span style={{ color: "var(--red)" }}>&amp; health</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
              First-party usage events and error reports. Nothing is sent to a third party and no form content is recorded.
            </p>
          </div>
          <div className="flex rounded-lg overflow-hidden self-start sm:self-auto" style={{ border: "1px solid var(--rule)" }}>
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className="px-3.5 py-2 text-xs font-mono uppercase tracking-[0.08em] font-semibold cursor-pointer"
                style={{
                  backgroundColor: days === r.days ? "var(--ink)" : "var(--sheet)",
                  color: days === r.days ? "var(--sheet)" : "var(--ink-muted)",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {problem?.kind === "missing" && (
          <div className="rounded-xl p-6" style={{ ...card, borderColor: "var(--status-warn-border)" }}>
            <p className="font-serif font-bold text-base mb-1" style={{ color: "var(--ink)" }}>Tracking tables not set up yet</p>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              Run <code className="font-mono break-all">supabase/migrations/20261113000200_observability.sql</code> in the Supabase SQL editor. Events and errors are collected as soon as it has run.
            </p>
          </div>
        )}
        {problem?.kind === "other" && (
          <div className="rounded-xl p-6" style={card}>
            <p className="font-serif font-bold text-base mb-1" style={{ color: "var(--red)" }}>Could not load insights</p>
            <p className="text-sm font-mono" style={{ color: "var(--ink-muted)" }}>{problem.message}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
            <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>Loading insights…</p>
          </div>
        ) : (
          !problem && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: UsersThree, label: "Visitors", value: m.visitors },
                  { icon: ChartLineUp, label: "Forms generated", value: m.formsGenerated },
                  { icon: CurrencyInr, label: "Revenue", value: `₹${m.revenue.toLocaleString("en-IN")}` },
                  { icon: Bug, label: "Error reports", value: errors.length },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4" style={card}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--badge-dark-bg)" }}>
                      <k.icon weight="duotone" className="w-5 h-5" style={{ color: "var(--badge-dark-text)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>{k.label}</p>
                      <p className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl p-5 space-y-3" style={card}>
                  <div className="flex items-center gap-2">
                    <Funnel weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <h2 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Acquisition funnel</h2>
                  </div>
                  {funnel.map((f) => (
                    <div key={f.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--ink)" }}>{f.label}</span>
                        <span className="font-mono" style={{ color: "var(--ink-muted)" }}>
                          {f.value} · {pct(f.value, f.base)} of previous
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--badge-light-bg)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(f.value / top) * 100}%`, backgroundColor: "var(--ink)" }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    Visitors and sign-ups are anonymous event counts; later steps count distinct accounts. Sign-ins: {m.logins}.
                  </p>
                </div>

                <div className="rounded-xl p-5 space-y-4" style={card}>
                  <div className="flex items-center gap-2">
                    <Translate weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <h2 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Generation health</h2>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span style={{ color: "var(--ink-muted)" }}>Failed generations</span><span className="font-mono font-bold">{m.formsFailed}</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--ink-muted)" }}>Non-English forms</span><span className="font-mono font-bold">{m.nonEnglish}</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--ink-muted)" }}>Translation fell back</span><span className="font-mono font-bold">{m.fallback} ({pct(m.fallback, m.nonEnglish)})</span></div>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.08em] mb-2" style={{ color: "var(--ink-muted)" }}>Forms per day</p>
                    <div className="flex items-end gap-1 h-16">
                      {m.trend.map((t) => (
                        <div key={t.day} className="flex-1 rounded-sm" title={`${t.day}: ${t.n}`} style={{ height: `${Math.max(4, (t.n / trendMax) * 100)}%`, backgroundColor: t.n ? "var(--ink)" : "var(--badge-light-bg)" }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                    <FilePdf className="w-3.5 h-3.5" />
                    Exports: {m.exportsBy.pdf} PDF · {m.exportsBy.docx} Word · {m.exportsBy.print} print
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={card}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--rule)" }}>
                  <h2 className="font-serif text-base font-bold" style={{ color: "var(--ink)" }}>Errors, grouped by problem</h2>
                  <p className="font-mono text-xs uppercase tracking-[0.08em] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    Messages are scrubbed of emails and long numbers
                  </p>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                      {["Count", "Source", "Message", "Page", "Last seen"].map((h) => (
                        <th key={h} className="py-3 px-5 font-mono uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--ink-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center font-mono" style={{ color: "var(--ink-muted)" }}>
                          No errors reported in this period.
                        </td>
                      </tr>
                    ) : (
                      grouped.map(([fp, g]) => (
                        <tr key={fp} style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                          <td className="py-3 px-5 font-mono font-bold">{g.count}</td>
                          <td className="py-3 px-5 font-mono">{g.source}</td>
                          <td className="py-3 px-5" style={{ color: "var(--ink)" }}>{g.message}</td>
                          <td className="py-3 px-5 font-mono" style={{ color: "var(--ink-muted)" }}>{g.path ?? "—"}</td>
                          <td className="py-3 px-5 font-mono whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                            {new Date(g.last).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </main>
    </AppShell>
  );
}
