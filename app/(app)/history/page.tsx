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
      <div className="flex-1 flex items-center justify-center bg-[#ededed]">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Records</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
              Consent <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>history</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {entries.length} saved consent{entries.length !== 1 ? "s" : ""}
            </p>
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

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            <Warning weight="fill" className="w-4 h-4 text-red-500 shrink-0" /> {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, procedure, hospital..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }}
            />
          </div>
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all text-neutral-800 sm:w-48 appearance-none cursor-pointer bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}
          >
            <option value="all">All Types</option>
            {consentTypes.map((type) => (
              <option key={type || "unknown"} value={type || ""}>{(type ?? "").replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl text-center py-16" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <FileText weight="duotone" className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 mb-1">
              {entries.length === 0 ? "No consents yet" : "No results found"}
            </h3>
            <p className="text-sm text-neutral-500 mb-5 max-w-xs mx-auto">
              {entries.length === 0 ? "Generate your first consent form and it will appear here." : "Try adjusting your search or filter."}
            </p>
            {entries.length === 0 && (
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
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              {filtered.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100">
                        <Stethoscope weight="duotone" className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1 group-hover:text-neutral-900 transition-colors" style={{ color: "#0b0f1a" }}>
                          {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-neutral-100 text-neutral-600">
                            {(entry.consent_type || "unknown").replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                            <CalendarBlank weight="regular" className="w-3 h-3" /> {entry.procedure_date || "No date"}
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
                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <span className="text-xs text-neutral-400 hidden sm:block whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="flex-1 sm:flex-none text-center px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0b0f1a" }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDeleteId(entry.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash weight="regular" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedEntry(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl"
              style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>
                    {selectedEntry.patient_name} — {selectedEntry.procedure_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500">{selectedEntry.hospital_name}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    <span className="text-xs font-mono text-neutral-400">{selectedEntry.consent_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 transition-all"
                >
                  <X weight="bold" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 sm:p-10 bg-white">
                {selectedEntry.form_data?.clinical?.counselingLanguage &&
                  selectedEntry.form_data.clinical.counselingLanguage !== "English" && (
                    <div className="flex border-b mb-6" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                      <button type="button" onClick={() => setActiveTab("english")}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "english" ? "border-neutral-800 text-neutral-800" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>
                        English Form
                      </button>
                      <button type="button"
                        onClick={() => { if (selectedEntry.markdown?.includes("__LANG_SEPARATOR__")) setActiveTab("other"); }}
                        disabled={!selectedEntry.markdown?.includes("__LANG_SEPARATOR__")}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${!selectedEntry.markdown?.includes("__LANG_SEPARATOR__") ? "opacity-50 cursor-not-allowed border-transparent text-neutral-400" : activeTab === "other" ? "border-neutral-800 text-neutral-800" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>
                        {selectedEntry.form_data.clinical.counselingLanguage} Form
                      </button>
                    </div>
                  )}
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-p:text-neutral-600 prose-p:leading-relaxed prose-li:text-neutral-600">
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
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-white max-w-sm w-full p-8 rounded-2xl sm:rounded-3xl text-center"
              style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
                <Trash weight="duotone" className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0b0f1a" }}>Delete Consent?</h3>
              <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                This action cannot be undone. The consent form will be permanently removed.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                  style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#ededed" }}>
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
