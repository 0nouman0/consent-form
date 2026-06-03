"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Printer, Download, Copy, RotateCcw, Save, CheckCircle2 } from "lucide-react";
import { nowIST } from "@/lib/utils";
import { ConsentFormSchema } from "@/lib/schema";
import { saveConsentToHistory } from "@/lib/history";

interface ConsentDocumentProps {
  markdown: string;
  consentId: string;
  hospitalName: string;
  isComplete: boolean;
  onReset: () => void;
  formData?: ConsentFormSchema;
}

export default function ConsentDocument({
  markdown,
  consentId,
  hospitalName,
  isComplete,
  onReset,
  formData,
}: ConsentDocumentProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    // @ts-expect-error html2pdf.js has no types
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("consent-document-body");
    if (!element) return;
    await html2pdf()
      .set({
        margin: 15,
        filename: `consent-${consentId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setSaveError(null);

    try {
      await saveConsentToHistory({
        consent_id: consentId,
        hospital_name: formData.clinical.hospitalName || null,
        patient_name: formData.patient.patientName || null,
        procedure_name: formData.clinical.procedureName || null,
        consent_type: formData.clinical.consentType || null,
        procedure_date: formData.clinical.procedureDate || null,
        markdown,
        form_data: formData,
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
    <div className="max-w-3xl mx-auto">
      {saveError && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium shadow-sm">
          {saveError}
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
            Standard Informed Consent Form
          </p>
          <h1 className="text-2xl font-black text-nq-text tracking-tight">{hospitalName}</h1>
          <div className="mt-3 text-sm font-medium text-nq-text-muted space-y-1">
            <p>Consent ID: <span className="font-mono">{consentId}</span></p>
            <p>Generated: {nowIST()}</p>
          </div>
        </div>

        {/* Edit hint when complete */}
        {isComplete && (
          <p className="text-xs font-semibold text-nq-purple/70 mb-4 text-center">
            Click on any paragraph to edit
          </p>
        )}

        {/* Markdown Content */}
        <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-nq-text prose-p:font-medium">
          <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
        </div>

        {/* Streaming cursor */}
        {!isComplete && markdown.length > 0 && (
          <span className="inline-block w-2.5 h-5 bg-nq-purple animate-pulse ml-1 align-middle rounded-sm" />
        )}
      </motion.div>

      {/* Action Toolbar - only when complete */}
      {isComplete && (
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-nq-border text-nq-text text-sm font-bold rounded-xl shadow-sm hover:border-nq-purple hover:text-nq-purple transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-nq-border text-nq-text text-sm font-bold rounded-xl shadow-sm hover:border-nq-purple hover:text-nq-purple transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-nq-border text-nq-text text-sm font-bold rounded-xl shadow-sm hover:border-nq-purple hover:text-nq-purple transition-all"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy"}
          </button>
          {formData && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${
                saved
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "nq-btn-primary"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save to History"}
                </>
              )}
            </button>
          )}
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-nq-border text-nq-text text-sm font-bold rounded-xl shadow-sm hover:border-nq-purple hover:text-nq-purple transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            New Form
          </button>
        </motion.div>
      )}
    </div>
  );
}
