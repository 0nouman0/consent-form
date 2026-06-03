"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getHistory, deleteHistoryEntry, HistoryEntry } from "@/lib/history";
import {
  Shield,
  Stethoscope,
  Calendar,
  Search,
  Trash2,
  FileText,
  AlertTriangle,
  X,
  Plus
} from "lucide-react";
import ReactMarkdown from "react-markdown";

function HistoryContent() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);

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
      const msg = err instanceof Error ? err.message : "Failed to load history";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/history");
        return;
      }
      setUser(user);
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
      const msg = err instanceof Error ? err.message : "Failed to delete";
      setError(msg);
    }
  };

  const consentTypes = Array.from(
    new Set(entries.map((e) => e.consent_type).filter(Boolean))
  );

  const filtered = entries.filter((entry) => {
    const matchesSearch =
      !search ||
      (entry.patient_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.procedure_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.hospital_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (entry.consent_id?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesType =
      filterType === "all" || entry.consent_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-nq-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nq-bg font-inter">
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10">
        
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-nq-border mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-nq-text tracking-tight">
              Consent History
            </h1>
            <p className="text-sm text-nq-text-muted mt-2 font-medium">
              {entries.length} saved consent{entries.length !== 1 ? "s" : ""}
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

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nq-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, procedure, hospital..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium sm:w-48 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {consentTypes.map((type) => (
              <option key={type || "unknown"} value={type || ""}>
                {(type ?? "").replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="nq-card nq-noise text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5 border border-nq-border">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-nq-text mb-2">
              {entries.length === 0 ? "No consents yet" : "No results found"}
            </h3>
            <p className="text-sm text-nq-text-muted mb-6 max-w-sm mx-auto">
              {entries.length === 0
                ? "Generate your first consent form and it will appear here."
                : "Try adjusting your search or filter."}
            </p>
            {entries.length === 0 && (
              <Link
                href="/generate"
                className="nq-btn-primary py-2.5 px-6 text-sm mx-auto"
              >
                <Plus className="w-4 h-4" />
                Generate Consent
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="nq-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-nq-purple/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-nq-purple-soft flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-nq-purple" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-nq-text mb-1 tracking-tight group-hover:text-nq-purple transition-colors">
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
                  <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-nq-border w-full sm:w-auto">
                    <span className="text-xs font-semibold text-nq-text-muted hidden sm:block whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 bg-white border border-nq-border text-nq-text text-xs font-bold rounded-xl hover:border-nq-purple hover:text-nq-purple transition-all shadow-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="p-2 border border-transparent text-nq-text-light hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-nq-text/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="nq-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-nq-border bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-nq-text tracking-tight">
                    {selectedEntry.patient_name} — {selectedEntry.procedure_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-nq-text-muted">{selectedEntry.hospital_name}</span>
                    <span className="w-1 h-1 rounded-full bg-nq-border" />
                    <span className="text-xs font-mono font-medium text-nq-text-light">{selectedEntry.consent_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-full bg-white border border-nq-border flex items-center justify-center text-nq-text-muted hover:text-nq-text hover:border-nq-text-light transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 sm:p-10 bg-white">
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none 
                  prose-headings:font-bold prose-headings:text-nq-text
                  prose-p:text-nq-text-muted prose-p:leading-relaxed
                  prose-li:text-nq-text-muted">
                  <ReactMarkdown>{selectedEntry.markdown}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-nq-text/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="nq-card max-w-sm w-full p-8 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-nq-text mb-2 tracking-tight">
                Delete Consent?
              </h3>
              <p className="text-sm font-medium text-nq-text-muted mb-8 leading-relaxed">
                This action cannot be undone. The consent form will be permanently removed from your history.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-3 bg-white border border-nq-border text-nq-text text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-3 bg-red-600 border border-transparent text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
                >
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
      <div className="min-h-screen bg-nq-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
