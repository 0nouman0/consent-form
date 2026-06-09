"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getHistory, deleteHistoryEntry, HistoryEntry } from "@/lib/history";
import {
  Stethoscope, CalendarBlank, MagnifyingGlass, Trash,
  FileText, Warning, X, Plus,
} from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";

function HistoryContent() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"english" | "other">("english");

  useEffect(() => {
    setActiveTab("english");
  }, [selectedEntry]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getHistory();
      setEntries(data);
      if (paramId) {
        const found = data.find((e) => e.id === paramId);
        if (found) setSelectedEntry(found);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login?redirect=/history"); return; }
      fetchHistory();
    });
  }, [router, fetchHistory, supabase.auth]);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(null);
      setDeleteId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const consentTypes = Array.from(new Set(entries.map((e) => e.consent_type).filter(Boolean)));
  const filtered = entries.filter((entry) => {
    const matchesSearch = !search ||
      (entry.patient_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.procedure_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.hospital_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.consent_id?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesSearch && (filterType === "all" || entry.consent_type === filterType);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
        <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-sans font-black text-4xl sm:text-5xl text-foreground tracking-tight">Consent History</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {entries.length} saved consent{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/generate" className="btn-primary py-2.5 px-6 text-sm">
            <Plus weight="bold" className="w-4 h-4" /> New Consent Form
          </Link>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <Warning weight="fill" className="w-4 h-4 text-red-500" /> {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <MagnifyingGlass weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, procedure, hospital..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all text-sm sm:w-48 appearance-none cursor-pointer">
            <option value="all">All Types</option>
            {consentTypes.map((type) => (
              <option key={type || "unknown"} value={type || ""}>{(type ?? "").replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-background border border-border rounded-2xl text-center py-16 shadow-card">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5 border border-border">
              <FileText weight="duotone" className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-sans font-bold text-xl text-foreground mb-2">
              {entries.length === 0 ? "No consents yet" : "No results found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {entries.length === 0 ? "Generate your first consent form and it will appear here." : "Try adjusting your search or filter."}
            </p>
            {entries.length === 0 && (
              <Link href="/generate" className="btn-primary py-2.5 px-6 text-sm mx-auto">
                <Plus weight="bold" className="w-4 h-4" /> Generate Consent
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="bg-background border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-card hover:border-primary/30 hover:shadow-card-hover transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--primary) / 0.1)" }}>
                      <Stethoscope weight="duotone" className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg text-primary"
                          style={{ background: "hsl(var(--primary) / 0.08)" }}>
                          {(entry.consent_type || "unknown").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-lg border border-border">
                          <CalendarBlank weight="regular" className="w-3 h-3" /> {entry.procedure_date || "No date"}
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
                  <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-border w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button onClick={() => setSelectedEntry(entry)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 bg-background border border-border text-foreground text-xs font-semibold rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm">
                      View
                    </button>
                    <button onClick={() => setDeleteId(entry.id)}
                      className="p-2 border border-transparent text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all">
                      <Trash weight="regular" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedEntry(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-dashboard"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
                <div>
                  <h3 className="font-sans font-black text-xl text-foreground">
                    {selectedEntry.patient_name} — {selectedEntry.procedure_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{selectedEntry.hospital_name}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-xs font-mono text-muted-foreground/60">{selectedEntry.consent_id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shadow-sm">
                  <X weight="bold" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 sm:p-10 bg-background">
                {/* Tabs inside modal */}
                {selectedEntry.form_data?.clinical?.counselingLanguage && selectedEntry.form_data.clinical.counselingLanguage !== "English" && (
                  <div className="flex border-b border-border mb-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab("english")}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "english"
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      English Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedEntry.markdown?.includes("__LANG_SEPARATOR__")) {
                          setActiveTab("other");
                        }
                      }}
                      disabled={!selectedEntry.markdown?.includes("__LANG_SEPARATOR__")}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                        !selectedEntry.markdown?.includes("__LANG_SEPARATOR__")
                          ? "opacity-50 cursor-not-allowed border-transparent text-muted-foreground"
                          : activeTab === "other"
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {selectedEntry.form_data.clinical.counselingLanguage} Form
                    </button>
                  </div>
                )}
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none
                  prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
                  <ReactMarkdown>
                    {(() => {
                      const hasMultiple = selectedEntry.markdown?.includes("__LANG_SEPARATOR__");
                      if (!hasMultiple) return selectedEntry.markdown;
                      const parts = selectedEntry.markdown.split("__LANG_SEPARATOR__");
                      return activeTab === "english" ? (parts[0] || "") : (parts[1] || "");
                    })()}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-2xl max-w-sm w-full p-8 shadow-dashboard text-center"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <Trash weight="duotone" className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-sans font-black text-2xl text-foreground mb-2">Delete Consent?</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                This action cannot be undone. The consent form will be permanently removed from your history.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-3 bg-background border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
        <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
