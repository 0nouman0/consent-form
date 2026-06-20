"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  DownloadSimple,
  Copy,
  ArrowCounterClockwise,
  FloppyDisk,
  CheckCircle,
  FileDoc,
} from "@phosphor-icons/react/dist/ssr";
import { nowIST } from "@/lib/utils";
import { ConsentFormSchema, ResearchConsentFormSchema } from "@/lib/schema";
import { saveConsentToHistory } from "@/lib/history";
import { downloadConsentPDF } from "@/lib/pdf";
import { downloadConsentDOCX } from "@/lib/docx-gen";

interface ConsentDocumentProps {
  markdown: string;
  consentId: string;
  hospitalName: string;
  isComplete: boolean;
  onReset: () => void;
  formData?: ConsentFormSchema | ResearchConsentFormSchema;
}

export default function ConsentDocument({
  markdown,
  consentId,
  hospitalName,
  isComplete,
  onReset,
  formData,
}: ConsentDocumentProps) {
  const [activeTab, setActiveTab] = useState<"english" | "other">("english");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const isResearch = formData && "study" in formData;
  const counselingLanguage = isResearch
    ? (formData as ResearchConsentFormSchema).study.counselingLanguage
    : (formData as ConsentFormSchema)?.clinical.counselingLanguage;

  const hasMultipleLanguages = markdown.includes("__LANG_SEPARATOR__");
  const parts = markdown.split("__LANG_SEPARATOR__");
  const englishMarkdown = parts[0] || "";
  const otherMarkdown = parts[1] || "";

  const activeMarkdown =
    activeTab === "english" || !hasMultipleLanguages
      ? englishMarkdown.trim()
      : otherMarkdown.trim();

  const timestamp = nowIST();

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await downloadConsentPDF({
        markdown: activeMarkdown,
        consentId,
        hospitalName,
        timestamp,
        isResearch: !!isResearch,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setDownloadingDocx(true);
    try {
      await downloadConsentDOCX({
        markdown: activeMarkdown,
        consentId,
        hospitalName,
        timestamp,
        isResearch: !!isResearch,
      });
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setSaveError(null);

    try {
      const h_name = isResearch
        ? (formData as ResearchConsentFormSchema).study.institutionName
        : (formData as ConsentFormSchema).clinical.hospitalName;
      const p_name = isResearch
        ? (formData as ResearchConsentFormSchema).participant.participantName
        : (formData as ConsentFormSchema).patient.patientName;
      const proc_name = isResearch
        ? (formData as ResearchConsentFormSchema).study.studyTitle
        : (formData as ConsentFormSchema).clinical.procedureName;
      const c_type = isResearch
        ? "research"
        : (formData as ConsentFormSchema).clinical.consentType;
      const proc_date = isResearch
        ? new Date().toISOString().split("T")[0]
        : (formData as ConsentFormSchema).clinical.procedureDate;

      await saveConsentToHistory({
        consent_id: consentId,
        hospital_name: h_name || null,
        patient_name: p_name || null,
        procedure_name: proc_name || null,
        consent_type: c_type || null,
        procedure_date: proc_date || null,
        markdown,
        form_data: formData as ConsentFormSchema,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const components = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-black border-b border-nq-border mt-8 mb-4 pb-2 text-nq-text tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-bold mt-6 mb-3 text-nq-text tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-bold mt-4 mb-2 text-nq-text tracking-tight">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) =>
      isComplete ? (
        <p
          contentEditable
          suppressContentEditableWarning
          className="leading-[1.8] mb-3 text-nq-text focus:outline focus:outline-2 focus:outline-nq-purple/40 rounded transition-all"
        >
          {children}
        </p>
      ) : (
        <p className="leading-[1.8] mb-3 text-nq-text">{children}</p>
      ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="ml-5 list-disc mb-3 text-nq-text font-medium">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="ml-5 list-decimal mb-3 text-nq-text font-medium">{children}</ol>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-nq-text">{children}</strong>
    ),
    hr: () => <hr className="border-nq-border my-6" />,
  };

  return (
    <div>
      {saveError && (
        <div className="mb-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
          {saveError}
        </div>
      )}

      {/* Compact top toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-600 text-sm font-semibold rounded-xl hover:border-neutral-400 hover:text-neutral-900 transition-all"
        >
          <ArrowCounterClockwise className="w-3.5 h-3.5" />
          New Form
        </button>

        {isComplete && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-600 text-sm font-semibold rounded-xl hover:border-nq-purple hover:text-nq-purple transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownloadDOCX}
              disabled={downloadingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-600 text-sm font-semibold rounded-xl hover:border-nq-purple hover:text-nq-purple transition-all disabled:opacity-50"
            >
              <FileDoc className="w-3.5 h-3.5" />
              {downloadingDocx ? "..." : "DOCX"}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-600 text-sm font-semibold rounded-xl hover:border-nq-purple hover:text-nq-purple transition-all disabled:opacity-50"
            >
              <DownloadSimple className="w-3.5 h-3.5" />
              {downloadingPdf ? "..." : "PDF"}
            </button>
            {formData && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                  saved
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "nq-btn-primary"
                } disabled:opacity-50`}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                    Saved
                  </>
                ) : (
                  <>
                    <FloppyDisk className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save"}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Language Tabs */}
      {counselingLanguage && counselingLanguage !== "English" && (
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("english")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
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
              if (otherMarkdown.trim()) setActiveTab("other");
            }}
            disabled={!otherMarkdown.trim()}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              !otherMarkdown.trim()
                ? "opacity-50 cursor-not-allowed border-transparent text-muted-foreground"
                : activeTab === "other"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {counselingLanguage} Form
            {!otherMarkdown.trim() && (
              <span className="w-3.5 h-3.5 border-2 border-t-transparent border-muted-foreground rounded-full animate-spin" />
            )}
          </button>
        </div>
      )}

      <motion.div
        id="consent-document-body"
        className="consent-document nq-card p-8 sm:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Document Header */}
        <div className="text-center border-b border-nq-border pb-4 mb-6">
          <p className="text-sm font-bold uppercase tracking-widest mb-2 text-nq-purple">
            {isResearch ? "Research Consent Form" : "Standard Informed Consent Form"}
          </p>
          <h1 className="text-2xl font-black text-nq-text tracking-tight">{hospitalName}</h1>
          <div className="mt-3 text-sm font-medium text-nq-text-muted space-y-1">
            <p>
              Consent ID: <span className="font-mono">{consentId}</span>
            </p>
            <p>Generated: {timestamp}</p>
          </div>
        </div>

        {isComplete && (
          <p className="text-xs font-semibold text-nq-purple/70 mb-4 text-center">
            Click on any paragraph to edit
          </p>
        )}

        <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-nq-text prose-p:font-medium">
          <ReactMarkdown components={components}>{activeMarkdown}</ReactMarkdown>
        </div>

        {!isComplete && markdown.length > 0 && (
          <span className="inline-block w-2.5 h-5 bg-nq-purple animate-pulse ml-1 align-middle rounded-sm" />
        )}
      </motion.div>
    </div>
  );
}
