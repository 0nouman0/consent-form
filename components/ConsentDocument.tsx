"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Printer, Download, Copy, RotateCcw } from "lucide-react";
import { nowIST } from "@/lib/utils";

interface ConsentDocumentProps {
  markdown: string;
  consentId: string;
  hospitalName: string;
  isComplete: boolean;
  onReset: () => void;
}

export default function ConsentDocument({
  markdown,
  consentId,
  hospitalName,
  isComplete,
  onReset,
}: ConsentDocumentProps) {
  const [copied, setCopied] = useState(false);

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

  // Build components object with access to isComplete via closure
  const components = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-bold border-b border-slate-200 mt-8 mb-4 pb-2 text-slate-900">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-800">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) =>
      isComplete ? (
        <p
          contentEditable
          suppressContentEditableWarning
          className="leading-[1.8] mb-3 text-slate-700 focus:outline focus:outline-2 focus:outline-blue-400 rounded"
        >
          {children}
        </p>
      ) : (
        <p className="leading-[1.8] mb-3 text-slate-700">{children}</p>
      ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="ml-5 list-disc mb-3 text-slate-700">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="ml-5 list-decimal mb-3 text-slate-700">{children}</ol>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-slate-900">{children}</strong>
    ),
    hr: () => <hr className="border-slate-200 my-6" />,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        id="consent-document-body"
        className="consent-document bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Document Header */}
        <div className="text-center border-b border-slate-200 pb-4 mb-6">
          <p className="text-sm uppercase tracking-widest mb-2">
            Standard Informed Consent Form
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{hospitalName}</h1>
          <div className="mt-3 text-sm text-slate-500 space-y-1">
            <p>Consent ID: {consentId}</p>
            <p>Generated: {nowIST()}</p>
          </div>
        </div>

        {/* Edit hint when complete */}
        {isComplete && (
          <p className="text-xs text-slate-400 mb-4 text-center">
            Click on any paragraph to edit
          </p>
        )}

        {/* Markdown Content */}
        <ReactMarkdown components={components}>{markdown}</ReactMarkdown>

        {/* Streaming cursor */}
        {!isComplete && markdown.length > 0 && (
          <span className="streaming-cursor" />
        )}
      </motion.div>

      {/* Action Toolbar - only when complete */}
      {isComplete && (
        <motion.div
          className="mt-6 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleCopy}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onReset}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Form
          </button>
        </motion.div>
      )}
    </div>
  );
}