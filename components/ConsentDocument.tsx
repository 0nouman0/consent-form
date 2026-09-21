"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  DownloadSimple,
  Copy,
  ArrowCounterClockwise,
  FloppyDisk,
  CheckCircle,
  FileDoc,
  Printer,
} from "@phosphor-icons/react/dist/ssr";
import { nowIST } from "@/lib/utils";
import { ConsentFormSchema, ResearchConsentFormSchema } from "@/lib/schema";
import { saveConsentToHistory } from "@/lib/history";
import { downloadConsentPDF } from "@/lib/pdf";
import { downloadConsentDOCX } from "@/lib/docx-gen";

const CONSENT_TYPE_LABELS: Record<string, string> = {
  surgical: "SURGICAL",
  anaesthesia: "ANAESTHESIA",
  diagnostic: "DIAGNOSTIC",
  blood_transfusion: "BLOOD TRANSFUSION",
  research: "RESEARCH",
  telemedicine: "TELEMEDICINE",
  minor_procedure: "MINOR PROCEDURE",
  obstetric: "OBSTETRIC",
  psychiatric: "PSYCHIATRIC",
  road_accident_emergency: "ROAD ACCIDENT / EMERGENCY",
};

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
  const [englishMarkdown, setEnglishMarkdown] = useState("");
  const [otherMarkdown, setOtherMarkdown] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isResearch = formData && "study" in formData;
  const counselingLanguage = isResearch
    ? (formData as ResearchConsentFormSchema).study.counselingLanguage
    : (formData as ConsentFormSchema)?.clinical.counselingLanguage;

  const stripFooterDisclaimer = (md: string): string => {
    if (!md) return "";
    const lines = md.split("\n");
    const filtered = lines.filter((line) => {
      const lower = line.toLowerCase().trim();
      if (lower.includes("this form is legally binding per imc")) return false;
      if (lower.includes("aadhaar data is masked per the aadhaar act")) return false;
      if (lower.includes("blanket consent is void in india")) return false;
      if (lower.includes("generation timestamp:")) return false;
      if (lower.includes("icmr national ethical guidelines")) return false;
      if (lower.startsWith("consent id:") && (lower.includes("srpx") || lower.includes("auto-generated"))) return false;
      return true;
    });
    return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  useEffect(() => {
    if (!markdown) return;
    const parts = markdown.split("__LANG_SEPARATOR__");
    setEnglishMarkdown(stripFooterDisclaimer(parts[0] || ""));
    setOtherMarkdown(stripFooterDisclaimer(parts[1] || ""));
  }, [markdown]);

  const activeMarkdown =
    activeTab === "english" || !otherMarkdown
      ? englishMarkdown.trim()
      : otherMarkdown.trim();

  const timestamp = nowIST();

  const syncTranslation = async (englishText: string, targetLang?: string) => {
    const lang = targetLang || counselingLanguage;
    if (!lang || lang === "English" || !englishText.trim()) return;

    setIsSyncing(true);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: englishText, targetLanguage: lang }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          setOtherMarkdown(stripFooterDisclaimer(data.translatedText));
        }
      }
    } catch (e) {
      console.error("Translation sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const extractMarkdownFromContainer = (): string => {
    const container = document.getElementById("consent-markdown-body-text");
    if (!container) return activeMarkdown;

    const lines: string[] = [];
    container.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const text = el.innerText.trim();
        if (!text) return;

        if (tag === "h1") lines.push(`# ${text}`);
        else if (tag === "h2") lines.push(`## ${text}`);
        else if (tag === "h3") lines.push(`### ${text}`);
        else if (tag === "p") lines.push(text);
        else if (tag === "ul") {
          el.querySelectorAll("li").forEach((li) => {
            lines.push(`- ${li.innerText.trim()}`);
          });
        } else if (tag === "ol") {
          let idx = 1;
          el.querySelectorAll("li").forEach((li) => {
            lines.push(`${idx++}. ${li.innerText.trim()}`);
          });
        } else {
          lines.push(text);
        }
      }
    });

    return lines.join("\n\n");
  };

  const handleInput = () => {
    const updatedMd = extractMarkdownFromContainer();
    if (!updatedMd) return;

    if (activeTab === "english") {
      setEnglishMarkdown(updatedMd);

      if (counselingLanguage && counselingLanguage !== "English") {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        setIsSyncing(true);

        syncTimerRef.current = setTimeout(() => {
          syncTranslation(updatedMd, counselingLanguage);
        }, 250);
      }
    } else {
      setOtherMarkdown(updatedMd);
    }
  };

  const handleBlur = () => {
    const updatedMd = extractMarkdownFromContainer();
    if (!updatedMd) return;

    if (activeTab === "english") {
      setEnglishMarkdown(updatedMd);
      if (counselingLanguage && counselingLanguage !== "English") {
        syncTranslation(updatedMd, counselingLanguage);
      }
    } else {
      setOtherMarkdown(updatedMd);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById("consent-document-body");
    if (!element) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((s) => s.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consent Form - ${consentId}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 9.5pt !important;
              line-height: 1.45 !important;
            }
            #consent-document-body {
              background: #ffffff !important;
              color: #000000 !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }
            h1 { font-size: 13pt !important; margin: 6pt 0 3pt !important; padding-bottom: 2pt !important; }
            h2 { font-size: 11pt !important; margin: 5pt 0 2pt !important; }
            h3 { font-size: 10pt !important; margin: 4pt 0 2pt !important; }
            p  { font-size: 9.5pt !important; line-height: 1.4 !important; margin: 0 0 4pt !important; }
            ul, ol { font-size: 9.5pt !important; margin: 0 0 4pt 14pt !important; padding: 0 !important; }
            li { margin: 0 0 2pt !important; line-height: 1.4 !important; }
            hr { margin: 6pt 0 !important; border-color: #e5e7eb !important; }
            table { font-size: 9pt !important; width: 100% !important; border-collapse: collapse !important; margin-bottom: 6pt !important; }
            td, th { padding: 3pt 5pt !important; border: 1px solid #e5e7eb !important; }
            .print-hide { display: none !important; }
            [contenteditable] { outline: none !important; }
          </style>
        </head>
        <body>
          <div id="consent-document-body">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 300);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await downloadConsentPDF({
        markdown: activeMarkdown,
        consentId,
        hospitalName,
        timestamp,
        isResearch: !!isResearch,
        formData,
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
        formData,
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

      const combinedMarkdown = otherMarkdown
        ? `${englishMarkdown}\n\n__LANG_SEPARATOR__\n\n${otherMarkdown}`
        : englishMarkdown;

      await saveConsentToHistory({
        consent_id: consentId,
        hospital_name: h_name || null,
        patient_name: p_name || null,
        procedure_name: proc_name || null,
        consent_type: c_type || null,
        procedure_date: proc_date || null,
        markdown: combinedMarkdown,
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
      <h1
        contentEditable={isComplete}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        className="font-serif text-2xl font-bold mt-8 mb-6 pb-3 text-center tracking-tight border-b border-[var(--rule)] focus:outline focus:outline-2 rounded transition-all"
        style={{ color: "var(--ink)", outlineColor: "rgba(190,61,42,0.4)" }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        contentEditable={isComplete}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        className="font-sans text-base font-bold uppercase tracking-wider mt-8 mb-4 pb-1.5 border-l-4 border-amber-600 pl-3 focus:outline focus:outline-2 rounded transition-all flex items-center gap-2"
        style={{ color: "var(--ink)", outlineColor: "rgba(190,61,42,0.4)" }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        contentEditable={isComplete}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        className="font-sans text-sm font-semibold tracking-wide mt-5 mb-2 focus:outline focus:outline-2 rounded transition-all"
        style={{ color: "var(--ink)", outlineColor: "rgba(190,61,42,0.4)" }}
      >
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p
        contentEditable={isComplete}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        className="leading-[1.75] mb-4 text-justify sm:text-left focus:outline focus:outline-2 rounded transition-all text-sm font-normal"
        style={{ color: "var(--ink)", outlineColor: "rgba(190,61,42,0.4)" }}
      >
        {children}
      </p>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li
        contentEditable={isComplete}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        className="leading-[1.65] text-sm mb-1.5 focus:outline focus:outline-2 rounded transition-all"
        style={{ outlineColor: "rgba(190,61,42,0.4)" }}
      >
        {children}
      </li>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="ml-6 list-disc mb-4 space-y-1 text-sm font-normal" style={{ color: "var(--ink)" }}>{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="ml-6 list-decimal mb-4 space-y-1 text-sm font-normal" style={{ color: "var(--ink)" }}>{children}</ol>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-[var(--ink)]">{children}</strong>
    ),
    hr: () => <hr className="my-6 border-t border-[var(--rule)]" />,
  };

  return (
    <div>
      {/* Print: show only the consent document body */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 9.5pt !important;
          }
          .print-hide, nav, header, sidebar {
            display: none !important;
          }
          #consent-document-body {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          #consent-document-body h1 { font-size: 13pt !important; margin: 4pt 0 3pt !important; padding-bottom: 2pt !important; }
          #consent-document-body h2 { font-size: 11pt !important; margin: 4pt 0 2pt !important; }
          #consent-document-body h3 { font-size: 10pt !important; margin: 3pt 0 1pt !important; }
          #consent-document-body p  { font-size: 9.5pt !important; line-height: 1.4 !important; margin: 0 0 3pt !important; }
          #consent-document-body ul,
          #consent-document-body ol  { font-size: 9.5pt !important; margin: 0 0 3pt 14pt !important; padding: 0 !important; }
          #consent-document-body li  { margin: 0 0 1pt !important; line-height: 1.4 !important; }
          #consent-document-body hr  { margin: 4pt 0 !important; }
          #consent-document-body table { font-size: 9pt !important; width: 100% !important; border-collapse: collapse !important; }
          #consent-document-body td, #consent-document-body th { padding: 2pt 4pt !important; }
          #consent-document-body [contenteditable]:focus { outline: none !important; }
        }
      ` }} />


      {saveError && (
        <div
          className="mb-3 px-4 py-3 rounded-md text-sm font-medium"
          style={{
            backgroundColor: "rgba(190,61,42,0.06)",
            border: "1px solid rgba(190,61,42,0.25)",
            color: "var(--red)",
          }}
        >
          {saveError}
        </div>
      )}

      {/* Compact top toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
        >
          <ArrowCounterClockwise className="w-3.5 h-3.5" />
          New Form
        </button>

        {isComplete && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all hover:border-[var(--red)] hover:text-[var(--red)]"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handlePrint}
              title="Print consent form"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all hover:border-[var(--red)] hover:text-[var(--red)]"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadDOCX}
              disabled={downloadingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all hover:border-[var(--red)] hover:text-[var(--red)] disabled:opacity-50"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            >
              <FileDoc className="w-3.5 h-3.5" />
              {downloadingDocx ? "..." : "DOCX"}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all hover:border-[var(--red)] hover:text-[var(--red)] disabled:opacity-50"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            >
              <DownloadSimple className="w-3.5 h-3.5" />
              {downloadingPdf ? "..." : "PDF"}
            </button>
            {formData && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all disabled:opacity-50 ${
                  saved ? "" : "nq-btn-primary"
                }`}
                style={
                  saved
                    ? {
                        backgroundColor: "rgba(63,122,78,0.08)",
                        color: "#3f7a4e",
                        border: "1px solid rgba(63,122,78,0.2)",
                      }
                    : undefined
                }
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

      {/* Language Tabs & Sync Status */}
      {counselingLanguage && counselingLanguage !== "English" && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4" style={{ borderBottom: "1px solid var(--rule)" }}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("english")}
              className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all"
              style={
                activeTab === "english"
                  ? { borderColor: "var(--ink)", color: "var(--ink)" }
                  : { borderColor: "transparent", color: "var(--ink-muted)" }
              }
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
                !otherMarkdown.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={
                otherMarkdown.trim() && activeTab === "other"
                  ? { borderColor: "var(--ink)", color: "var(--ink)" }
                  : { borderColor: "transparent", color: "var(--ink-muted)" }
              }
            >
              {counselingLanguage} Form
              {isSyncing && (
                <span
                  className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--ink-muted)", borderTopColor: "transparent" }}
                />
              )}
            </button>
          </div>
        </div>
      )}

      <motion.div
        id="consent-document-body"
        className="consent-document p-8 sm:p-12 rounded-md"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", boxShadow: "var(--shadow-dashboard)", color: "var(--ink)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {formData ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-5" style={{ borderBottom: "1px solid var(--rule)" }}>
              <div>
                <p className="font-serif text-lg font-semibold leading-tight text-left" style={{ color: "var(--ink)" }}>
                  {isResearch
                    ? (formData as ResearchConsentFormSchema).study?.institutionName || hospitalName
                    : (formData as ConsentFormSchema).clinical?.hospitalName || hospitalName}
                </p>
                <p className="text-xs mt-1 leading-relaxed max-w-xs text-left" style={{ color: "var(--ink-muted)" }}>
                  {isResearch
                    ? (formData as ResearchConsentFormSchema).study?.institutionAddress
                    : (formData as ConsentFormSchema).clinical?.hospitalAddress}
                </p>
              </div>
              <div className="text-right text-xs space-y-0.5" style={{ color: "var(--ink-muted)" }}>
                <p className="text-left sm:text-right">Consent ID: <span className="font-semibold font-mono" style={{ color: "var(--ink-soft)" }}>{consentId}</span></p>
                <p className="text-left sm:text-right">Date: <span className="font-semibold" style={{ color: "var(--ink-soft)" }}>{timestamp}</span></p>
              </div>
            </div>

            {/* Title bar */}
            <div className="rounded-md py-2.5 px-4 mb-6 text-center" style={{ backgroundColor: "var(--paper)" }}>
              <p className="font-serif text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--ink)" }}>
                {isResearch
                  ? "INFORMED CONSENT FOR RESEARCH PARTICIPATION"
                  : `INFORMED CONSENT FORM — ${(CONSENT_TYPE_LABELS[(formData as ConsentFormSchema).clinical?.consentType ?? "surgical"] ?? "SURGICAL")} PROCEDURE`}
              </p>
            </div>

            {/* Tables for Clinical/Surgical */}
            {!isResearch ? (
              <>
                {/* Patient info table */}
                <div className="mb-6">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold mb-2 text-left" style={{ color: "var(--ink-muted)" }}>
                    Patient Information
                  </h3>
                  <table className="w-full text-sm rounded-md overflow-hidden" style={{ border: "1px solid var(--rule)" }}>
                    <tbody>
                      {[
                        ["Patient Name", (formData as ConsentFormSchema).patient?.patientName || "—"],
                        ["Age / Sex", `${(formData as ConsentFormSchema).patient?.age || "—"} / ${(formData as ConsentFormSchema).patient?.sex || "—"}`],
                        ["Hospital OPD/IPD No.", (formData as ConsentFormSchema).patient?.hospitalOpdIpdNo || "—"],
                        ["Aadhaar (last 4)", (formData as ConsentFormSchema).patient?.aadhaarLast4 ? `****\u00A0****\u00A0****\u00A0${(formData as ConsentFormSchema).patient.aadhaarLast4}` : "—"],
                        ...((formData as ConsentFormSchema).patient?.insuranceProvider
                          ? [
                              ["Insurance Provider", (formData as ConsentFormSchema).patient.insuranceProvider],
                              ["Insurance Policy No.", (formData as ConsentFormSchema).patient.insurancePolicyNo || "—"],
                            ]
                          : []),
                        ...(!(formData as ConsentFormSchema).patient?.patientCompetent && (formData as ConsentFormSchema).patient?.guardianName
                          ? [
                              ["Guardian Name", (formData as ConsentFormSchema).patient.guardianName],
                              ["Guardian Relationship", (formData as ConsentFormSchema).patient.guardianRelationship || "—"],
                            ]
                          : []),
                      ].map(([label, value], i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--sheet)" : "var(--paper)" }}>
                          <td
                            className="py-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold w-44 text-left"
                            style={{ color: "var(--ink-muted)", borderRight: "1px solid var(--rule)" }}
                          >
                            {label}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-left" style={{ color: "var(--ink)" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Clinical info table */}
                <div className="mb-6">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold mb-2 text-left" style={{ color: "var(--ink-muted)" }}>
                    Clinical Details
                  </h3>
                  <table className="w-full text-sm rounded-md overflow-hidden" style={{ border: "1px solid var(--rule)" }}>
                    <tbody>
                      {[
                        ["Physician", `${(formData as ConsentFormSchema).clinical?.doctorName || "—"} (Reg. ${(formData as ConsentFormSchema).clinical?.doctorRegistrationNo || "—"})`],
                        ["Procedure", (formData as ConsentFormSchema).clinical?.procedureName || "—"],
                        ["Scheduled Date", (formData as ConsentFormSchema).clinical?.procedureDate || "—"],
                        ["Counseling Language", (formData as ConsentFormSchema).clinical?.counselingLanguage || "—"],
                      ].map(([label, value], i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--sheet)" : "var(--paper)" }}>
                          <td
                            className="py-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold w-44 text-left"
                            style={{ color: "var(--ink-muted)", borderRight: "1px solid var(--rule)" }}
                          >
                            {label}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-left" style={{ color: "var(--ink)" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                {/* Study info table */}
                <div className="mb-6">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold mb-2 text-left" style={{ color: "var(--ink-muted)" }}>
                    Study Information
                  </h3>
                  <table className="w-full text-sm rounded-md overflow-hidden" style={{ border: "1px solid var(--rule)" }}>
                    <tbody>
                      {[
                        ["Study Title", (formData as ResearchConsentFormSchema).study?.studyTitle || "—"],
                        ["Principal Investigator", (formData as ResearchConsentFormSchema).study?.principalInvestigator || "—"],
                        ["Department", (formData as ResearchConsentFormSchema).study?.department || "—"],
                        ["Contact", (formData as ResearchConsentFormSchema).study?.contactMobile || "—"],
                        ["Counseling Language", (formData as ResearchConsentFormSchema).study?.counselingLanguage || "—"],
                      ].map(([label, value], i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--sheet)" : "var(--paper)" }}>
                          <td
                            className="py-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold w-44 text-left"
                            style={{ color: "var(--ink-muted)", borderRight: "1px solid var(--rule)" }}
                          >
                            {label}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-left" style={{ color: "var(--ink)" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Participant info table */}
                <div className="mb-6">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold mb-2 text-left" style={{ color: "var(--ink-muted)" }}>
                    Participant Information
                  </h3>
                  <table className="w-full text-sm rounded-md overflow-hidden" style={{ border: "1px solid var(--rule)" }}>
                    <tbody>
                      {[
                        ["Participant Name", (formData as ResearchConsentFormSchema).participant?.participantName || "—"],
                        ["Participant ID", (formData as ResearchConsentFormSchema).participant?.participantId || "—"],
                        ["Age / Sex", `${(formData as ResearchConsentFormSchema).participant?.age || "—"} / ${(formData as ResearchConsentFormSchema).participant?.sex || "—"}`],
                        ...(!(formData as ResearchConsentFormSchema).participant?.isCompetent && (formData as ResearchConsentFormSchema).participant?.guardianName
                          ? [
                              ["Guardian Name", (formData as ResearchConsentFormSchema).participant.guardianName],
                              ["Guardian Relationship", (formData as ResearchConsentFormSchema).participant.guardianRelationship || "—"],
                            ]
                          : []),
                      ].map(([label, value], i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--sheet)" : "var(--paper)" }}>
                          <td
                            className="py-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold w-44 text-left"
                            style={{ color: "var(--ink-muted)", borderRight: "1px solid var(--rule)" }}
                          >
                            {label}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-left" style={{ color: "var(--ink)" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center pb-4 mb-6" style={{ borderBottom: "1px solid var(--rule)" }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold mb-2" style={{ color: "var(--red)" }}>
              {isResearch ? "Research Consent Form" : "Standard Informed Consent Form"}
            </p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-left" style={{ color: "var(--ink)" }}>{hospitalName}</h1>
            <div className="mt-3 text-sm font-medium space-y-1" style={{ color: "var(--ink-muted)" }}>
              <p className="text-left">
                Consent ID: <span className="font-mono">{consentId}</span>
              </p>
              <p className="text-left">Generated: {timestamp}</p>
            </div>
          </div>
        )}

        {isComplete && (
          <p className="print-hide text-xs font-semibold mb-4 text-center" style={{ color: "rgba(190,61,42,0.7)" }}>
            Click on any paragraph to edit
          </p>
        )}

        <div id="consent-markdown-body-text" className="prose prose-sm sm:prose-base max-w-none prose-p:font-medium text-left" style={{ color: "var(--ink)" }}>
          <ReactMarkdown components={components}>{activeMarkdown}</ReactMarkdown>
        </div>

        {!isComplete && markdown.length > 0 && (
          <span className="inline-block w-2.5 h-5 animate-pulse ml-1 align-middle rounded-sm" style={{ backgroundColor: "var(--red)" }} />
        )}
      </motion.div>
    </div>
  );
}
