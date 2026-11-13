"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getHistory, deleteHistoryEntry, HistoryEntry } from "@/lib/history";
import {
  Stethoscope, CalendarBlank, MagnifyingGlass, Trash,
  FileText, Warning, X, Plus, Copy, Check,
  DownloadSimple, FileDoc, Printer,
} from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { downloadConsentPDF, printConsent } from "@/lib/pdf";
import { downloadConsentDOCX } from "@/lib/docx-gen";

function HistoryContent() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"english" | "other">("english");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [modalDownloading, setModalDownloading] = useState<"pdf" | "docx" | null>(null);

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

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/history?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getAgeBadge = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
    if (days < 30) return { label: days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`, color: "#3f7a4e", bg: "rgba(63,122,78,0.08)", border: "rgba(63,122,78,0.2)" };
    if (days < 90) return { label: `${Math.floor(days / 7)}w ago`, color: "#92400e", bg: "rgba(146,64,14,0.08)", border: "rgba(146,64,14,0.2)" };
    return { label: `${Math.floor(days / 30)}mo ago`, color: "var(--red)", bg: "rgba(190,61,42,0.08)", border: "rgba(190,61,42,0.25)" };
  };

  const getActiveMarkdown = (entry: HistoryEntry) => {
    const hasMultiple = entry.markdown?.includes("__LANG_SEPARATOR__");
    let text = "";
    if (!hasMultiple) text = entry.markdown ?? "";
    else {
      const parts = (entry.markdown ?? "").split("__LANG_SEPARATOR__");
      text = (activeTab === "english" ? parts[0] : parts[1])?.trim() ?? "";
    }
    return text
      .replace(/\|\s*\|\s*(:?---[:\s|]+)\|\s*\|\s*/g, "|\n| $1 |\n| ")
      .replace(/\|\s*\|\s*(:?---[:\s|]+)/g, "|\n| $1\n")
      .replace(/\|\s*\|\s*/g, "|\n| ");
  };

  const handleModalCopy = (entry: HistoryEntry) => {
    navigator.clipboard.writeText(getActiveMarkdown(entry)).then(() => {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 1500);
    });
  };

  // Same layout engine and the same inputs as the generate page, rebuilt from the saved form data.
  const buildExportParams = (entry: HistoryEntry) => {
    const fd: any = entry.form_data;
    const isResearch = entry.consent_type === "research";
    const lang: string = (isResearch ? fd?.study?.counselingLanguage : fd?.clinical?.counselingLanguage) || "English";
    return {
      markdown: getActiveMarkdown(entry),
      consentId: entry.consent_id ?? "",
      hospitalName: entry.hospital_name ?? "",
      timestamp: new Date(entry.created_at).toLocaleString("en-IN"),
      isResearch,
      formData: fd ?? undefined,
      language: activeTab === "other" ? lang : "English",
    };
  };

  const handleModalPrint = async (entry: HistoryEntry) => {
    try {
      await printConsent(buildExportParams(entry));
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  const handleModalDownload = async (entry: HistoryEntry, kind: "pdf" | "docx") => {
    setModalDownloading(kind);
    try {
      const opts = buildExportParams(entry);
      if (kind === "pdf") await downloadConsentPDF(opts);
      else await downloadConsentDOCX(opts);
    } catch (err) {
      console.error(`${kind.toUpperCase()} export failed`, err);
    } finally {
      setModalDownloading(null);
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
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
        <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="rounded-xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Records</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Consent <span style={{ color: "var(--red)" }}>history</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
              {entries.length} saved consent{entries.length !== 1 ? "s" : ""}
            </p>
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

        {error && (
          <div className="px-4 py-3 rounded-md text-sm flex items-center gap-2"
            style={{ backgroundColor: "rgba(190,61,42,0.06)", border: "1px solid rgba(190,61,42,0.25)", color: "var(--red)" }}>
            <Warning weight="fill" className="w-4 h-4 shrink-0" style={{ color: "var(--red)" }} /> {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, procedure, hospital..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm outline-none transition-all placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)]"
              style={{ border: "1px solid var(--rule)", color: "var(--ink)", backgroundColor: "var(--sheet)" }}
            />
          </div>
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-md text-sm outline-none transition-all sm:w-48 appearance-none cursor-pointer focus:border-[var(--ink)]"
            style={{ border: "1px solid var(--rule)", color: "var(--ink)", backgroundColor: "var(--sheet)" }}
          >
            <option value="all">All Types</option>
            {consentTypes.map((type) => (
              <option key={type || "unknown"} value={type || ""}>{(type ?? "").replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="rounded-md text-center py-16" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--paper)" }}>
              <FileText weight="duotone" className="w-6 h-6" style={{ color: "var(--ink-muted)" }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>
              {entries.length === 0 ? "No consents yet" : "No results found"}
            </h3>
            <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: "var(--ink-muted)" }}>
              {entries.length === 0 ? "Generate your first consent form and it will appear here." : "Try adjusting your search or filter."}
            </p>
            {entries.length === 0 && (
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all pl-5 pr-2 py-2 hover:opacity-90"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                Generate Consent
                <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "rgba(252,251,247,0.15)" }}>
                  <Plus className="w-3 h-3" weight="bold" style={{ color: "var(--sheet)" }} />
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
            <div className="divide-y divide-[var(--rule)]">
              {filtered.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group hover:bg-[var(--paper)]">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--paper)" }}>
                        <Stethoscope weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1 transition-colors" style={{ color: "var(--ink)" }}>
                          {entry.patient_name || "Unknown Patient"} — {entry.procedure_name || "Unknown Procedure"}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] rounded-md" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}>
                            {(entry.consent_type || "unknown").replace(/_/g, " ")}
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
                            <CalendarBlank weight="regular" className="w-3 h-3" /> {entry.procedure_date || "No date"}
                          </span>
                          <span className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>#{entry.consent_id?.slice(0, 8)}</span>
                          {(() => {
                            const badge = getAgeBadge(entry.created_at);
                            return (
                              <span
                                className="px-2 py-0.5 text-xs font-semibold rounded-md"
                                style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        {entry.hospital_name && (
                          <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--rule)" }} /> {entry.hospital_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto" style={{ borderColor: "var(--rule)" }}>
                      <span className="text-xs hidden sm:block whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                        {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="flex-1 sm:flex-none text-center px-4 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[var(--paper)]"
                        style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => copyLink(entry.id)}
                        title="Copy link"
                        className="p-2 rounded-md transition-all hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {copiedId === entry.id
                          ? <Check weight="bold" className="w-4 h-4" style={{ color: "#3f7a4e" }} />
                          : <Copy weight="regular" className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteId(entry.id)}
                        className="p-2 rounded-md transition-all hover:text-[var(--red)] hover:bg-[rgba(190,61,42,0.08)]"
                        style={{ color: "var(--ink-muted)" }}
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
            className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: "rgba(23,20,16,0.4)" }}
            onClick={() => setSelectedEntry(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-md"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", boxShadow: "0 8px 24px rgba(23,20,16,0.10)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid var(--rule)" }}>
                <div>
                  <h3 className="font-serif text-base font-semibold" style={{ color: "var(--ink)" }}>
                    {selectedEntry.patient_name} — {selectedEntry.procedure_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{selectedEntry.hospital_name}</span>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--rule)" }} />
                    <span className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>{selectedEntry.consent_id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleModalCopy(selectedEntry)}
                    title="Copy markdown"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[var(--paper)]"
                    style={{ border: "1px solid var(--rule)", color: "var(--ink-soft)" }}
                  >
                    {modalCopied ? <Check weight="bold" className="w-3.5 h-3.5" style={{ color: "#3f7a4e" }} /> : <Copy weight="regular" className="w-3.5 h-3.5" />}
                    {modalCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleModalPrint(selectedEntry)}
                    title="Print"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[var(--paper)]"
                    style={{ border: "1px solid var(--rule)", color: "var(--ink-soft)" }}
                  >
                    <Printer weight="regular" className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => handleModalDownload(selectedEntry, "docx")}
                    disabled={modalDownloading !== null}
                    title="Download DOCX"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[var(--paper)] disabled:opacity-50"
                    style={{ border: "1px solid var(--rule)", color: "var(--ink-soft)" }}
                  >
                    <FileDoc weight="regular" className="w-3.5 h-3.5" />
                    {modalDownloading === "docx" ? "…" : "DOCX"}
                  </button>
                  <button
                    onClick={() => handleModalDownload(selectedEntry, "pdf")}
                    disabled={modalDownloading !== null}
                    title="Download PDF"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
                  >
                    <DownloadSimple weight="regular" className="w-3.5 h-3.5" />
                    {modalDownloading === "pdf" ? "…" : "PDF"}
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all ml-1 hover:bg-[rgba(23,20,16,0.1)] hover:text-[var(--ink)]"
                    style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}
                  >
                    <X weight="bold" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 sm:p-8" style={{ backgroundColor: "var(--paper)" }}>
                {(() => {
                  const fd: any = selectedEntry.form_data;
                  const isResearch = selectedEntry.consent_type === "research" || Boolean(fd?.study);
                  const lang = isResearch
                    ? fd?.study?.counselingLanguage
                    : fd?.clinical?.counselingLanguage;

                  return (
                    lang &&
                    lang !== "English" && (
                      <div className="flex border-b mb-5 max-w-3xl mx-auto" style={{ borderColor: "var(--rule)" }}>
                        <button
                          type="button"
                          onClick={() => setActiveTab("english")}
                          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === "english"
                              ? "border-[var(--ink)] text-[var(--ink)]"
                              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]"
                          }`}
                        >
                          English Form
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedEntry.markdown?.includes("__LANG_SEPARATOR__")) setActiveTab("other");
                          }}
                          disabled={!selectedEntry.markdown?.includes("__LANG_SEPARATOR__")}
                          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                            !selectedEntry.markdown?.includes("__LANG_SEPARATOR__")
                              ? "opacity-50 cursor-not-allowed border-transparent text-[var(--ink-muted)]"
                              : activeTab === "other"
                              ? "border-[var(--ink)] text-[var(--ink)]"
                              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]"
                          }`}
                        >
                          {lang} Form
                        </button>
                      </div>
                    )
                  );
                })()}
                {/* Print: show only the history document body */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body * { visibility: hidden; }
                    #history-doc-body, #history-doc-body * { visibility: visible; }
                    #history-doc-body {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      margin: 0 !important;
                      padding: 16px !important;
                      border: none !important;
                      box-shadow: none !important;
                      background: #fff !important;
                    }
                  }
                ` }} />
                {(() => {
                  const fd: any = selectedEntry.form_data;
                  const isResearch = selectedEntry.consent_type === "research" || Boolean(fd?.study);
                  const lang = isResearch
                    ? fd?.study?.counselingLanguage
                    : fd?.clinical?.counselingLanguage;
                  const isRtl = activeTab === "other" && lang === "Urdu";
                  const generatedAt = new Date(selectedEntry.created_at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      id="history-doc-body"
                      className="rounded-xl p-6 sm:p-8 max-w-3xl mx-auto"
                      style={{
                        backgroundColor: "var(--sheet)",
                        border: "1px solid var(--rule)",
                        boxShadow: "0 1px 2px rgba(23,20,16,0.06)",
                        color: "var(--ink)",
                      }}
                    >
                      {/* Masthead Header (matches ConsentDocument.tsx) */}
                      <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-[var(--rule)]">
                        <div>
                          <p className="font-serif text-base sm:text-lg font-bold leading-tight text-left" style={{ color: "var(--ink)" }}>
                            {(isResearch ? fd?.study?.institutionName : fd?.clinical?.hospitalName) || selectedEntry.hospital_name || "Hospital"}
                          </p>
                          {(isResearch ? fd?.study?.institutionAddress : fd?.clinical?.hospitalAddress) && (
                            <p className="text-xs leading-tight text-left mt-0.5" style={{ color: "var(--ink-muted)" }}>
                              {isResearch ? fd.study.institutionAddress : fd.clinical.hospitalAddress}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs space-y-0.5 shrink-0" style={{ color: "var(--ink-muted)" }}>
                          <p>Consent ID: <span className="font-semibold font-mono" style={{ color: "var(--ink)" }}>{selectedEntry.consent_id}</span></p>
                          <p>Date &amp; Time: <span className="font-medium" style={{ color: "var(--ink)" }}>{generatedAt}</span></p>
                        </div>
                      </div>

                      {/* Dark Title Banner (matches ConsentDocument.tsx) */}
                      <div
                        className="rounded py-1.5 px-3 mb-2.5 text-center"
                        style={{ backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #0f172a" }}
                      >
                        <p className="font-sans text-xs sm:text-sm font-bold tracking-wider uppercase text-white">
                          {isResearch
                            ? `INFORMED CONSENT FOR RESEARCH: ${(fd?.study?.studyTitle || selectedEntry.procedure_name || "VOLUNTARY PARTICIPATION").toUpperCase()}`
                            : `INFORMED CONSENT FORM — ${(fd?.clinical?.procedureName || selectedEntry.procedure_name || selectedEntry.consent_type || "PROCEDURE").toUpperCase()}`}
                        </p>
                      </div>

                      {/* Compact 4-Column Identification Grid (matches ConsentDocument.tsx) */}
                      {fd && !isResearch && (
                        <div className="rounded border border-[var(--rule)] text-xs mb-3 overflow-hidden" style={{ backgroundColor: "var(--sheet)" }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[var(--rule)]">
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Patient Name</span>
                              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.patient?.patientName || selectedEntry.patient_name || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Age / Sex</span>
                              <span className="text-xs" style={{ color: "var(--ink)" }}>{fd.patient?.age || "—"} Yrs / {fd.patient?.sex || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>OPD/IPD No.</span>
                              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{fd.patient?.hospitalOpdIpdNo || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Aadhaar (Last 4)</span>
                              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{fd.patient?.aadhaarLast4 ? `XXXX-XXXX-${fd.patient.aadhaarLast4}` : "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Treating Clinician</span>
                              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>
                                Dr. {fd.clinical?.doctorName || "—"}
                                {fd.clinical?.doctorRegistrationNo && (
                                  <span className="font-normal text-xs" style={{ color: "var(--ink-muted)" }}> (Reg: {fd.clinical.doctorRegistrationNo})</span>
                                )}
                              </span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Proposed Procedure</span>
                              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.clinical?.procedureName || selectedEntry.procedure_name || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Scheduled Date</span>
                              <span className="text-xs" style={{ color: "var(--ink)" }}>{fd.clinical?.procedureDate || selectedEntry.procedure_date || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Counseling Language</span>
                              <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{fd.clinical?.counselingLanguage || "English"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {fd && isResearch && (
                        <div className="rounded border border-[var(--rule)] text-xs mb-3 overflow-hidden" style={{ backgroundColor: "var(--sheet)" }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[var(--rule)]">
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Participant Name</span>
                              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.participant?.participantName || selectedEntry.patient_name || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Participant ID</span>
                              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{fd.participant?.participantId || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Age / Sex</span>
                              <span className="text-xs" style={{ color: "var(--ink)" }}>{fd.participant?.age || "—"} Yrs / {fd.participant?.sex || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Counseling Language</span>
                              <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{fd.study?.counselingLanguage || "English"}</span>
                            </div>
                            <div className="p-1.5 col-span-2">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Study Title</span>
                              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.study?.studyTitle || selectedEntry.procedure_name || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Principal Investigator</span>
                              <span className="text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.study?.principalInvestigator || "—"}</span>
                            </div>
                            <div className="p-1.5">
                              <span className="block font-mono text-xs uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Department</span>
                              <span className="text-xs truncate block" style={{ color: "var(--ink)" }}>{fd.study?.department || "—"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Markdown Body (matches ConsentDocument.tsx section styling) */}
                      <div dir={isRtl ? "rtl" : "ltr"} style={{ textAlign: isRtl ? "right" : "left" }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="font-serif text-sm sm:text-base font-bold mt-3 mb-2 pb-1.5 text-center tracking-tight border-b border-[var(--rule)] uppercase" style={{ color: "var(--ink)" }}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xs font-bold uppercase tracking-wider mt-3 mb-1.5 px-2 py-0.5 border-l-[3px] border-[#1e293b] bg-[#f8fafc] text-[#0f172a]">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xs font-bold mt-2 mb-1" style={{ color: "var(--ink)" }}>
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-xs leading-[1.45] mb-1.5" style={{ color: "var(--ink-soft)" }}>
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 space-y-0.5 mb-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 space-y-0.5 mb-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className="leading-[1.4]">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold" style={{ color: "var(--ink)" }}>{children}</strong>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-2 rounded border border-[var(--rule)]">
                                <table className="w-full text-left border-collapse text-xs">{children}</table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="px-2 py-1.5 font-semibold bg-[var(--paper)] border-b border-[var(--rule)] text-xs uppercase" style={{ color: "var(--ink)" }}>
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-2 py-1.5 border-b border-[var(--rule)] align-top" style={{ color: "var(--ink-soft)" }}>
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {getActiveMarkdown(selectedEntry)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] backdrop-blur-sm flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(23,20,16,0.4)" }}
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}
              className="max-w-sm w-full p-8 rounded-xl text-center"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", boxShadow: "0 8px 24px rgba(23,20,16,0.10)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "rgba(190,61,42,0.08)", border: "1px solid rgba(190,61,42,0.25)" }}>
                <Trash weight="duotone" className="w-6 h-6" style={{ color: "var(--red)" }} />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>Delete Consent?</h3>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                This action cannot be undone. The consent form will be permanently removed.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors hover:bg-[var(--paper)]"
                  style={{ border: "1px solid var(--rule)", color: "var(--ink-soft)" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors hover:opacity-90"
                  style={{ backgroundColor: "var(--red)", color: "var(--sheet)" }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
        <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
