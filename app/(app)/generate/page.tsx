"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { consentFormSchema, ConsentFormSchema } from "@/lib/schema";
import { REQUIRED_CLAUSES } from "@/lib/clauses";
import { GenerationStatus } from "@/lib/types";
import { PREBUILT_TEMPLATES } from "@/lib/templates";
import ConsentForm from "@/components/ConsentForm";
import ConsentDocument from "@/components/ConsentDocument";
import ClauseChecklist from "@/components/ClauseChecklist";
import LoadingState from "@/components/LoadingState";

function GenerateContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [markdown, setMarkdown] = useState("");
  const [consentId, setConsentId] = useState("");
  const [detectedClauses, setDetectedClauses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [consentType, setConsentType] = useState("surgical");

  const form = useForm<ConsentFormSchema>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      patient: {
        patientName: "",
        age: "",
        sex: "Male",
        hospitalOpdIpdNo: "",
        aadhaarLast4: "",
        insuranceProvider: "",
        insurancePolicyNo: "",
        patientCompetent: true,
        guardianName: "",
        guardianRelationship: "",
      },
      clinical: {
        doctorName: "",
        doctorRegistrationNo: "",
        hospitalName: "",
        hospitalAddress: "",
        procedureName: "",
        procedureDate: "",
        consentType: "surgical",
        counselingLanguage: "English",
        specificRisks: "",
        alternatives: "",
        additionalNotes: "",
        edarVictimId: "",
        tmsPatientId: "",
      },
      clauses: {
        anaesthesia: true,
        bloodTransfusion: false,
        tissueDisposal: false,
        photographyAcademicUse: false,
      },
      languageLevel: "standard",
      includeWitnessBlock: true,
      includeGuardianBlock: false,
    },
  });

  // Pre-fill form if templateId is provided
  useEffect(() => {
    if (templateId) {
      const template = PREBUILT_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        form.setValue("clinical.procedureName", template.procedureName);
        form.setValue("clinical.consentType", template.consentType as any);
        form.setValue("clinical.specificRisks", template.specificRisks);
        form.setValue("clinical.alternatives", template.alternatives);
        
        // Ensure consentType state matches
        setConsentType(template.consentType);
      }
    }
  }, [templateId, form]);

  // Detect which clauses appear in streamed text
  function detectClauses(text: string): string[] {
    const lower = text.toLowerCase();
    return REQUIRED_CLAUSES.filter((c) => {
      const keyword = c.title.toLowerCase().split(" ")[0];
      return lower.includes(keyword);
    }).map((c) => c.id);
  }

  const onSubmit = useCallback(async (data: ConsentFormSchema) => {
    setStatus("loading");
    setMarkdown("");
    setConsentId("");
    setDetectedClauses([]);
    setError(null);
    setConsentType(data.clinical.consentType);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      setStatus("streaming");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Extract consent ID from sentinel pattern
        if (chunk.includes("__CONSENT_ID__")) {
          const match = chunk.match(/__CONSENT_ID__(.+?)__END_ID__/);
          if (match) setConsentId(match[1]);
          accumulated += chunk.replace(/__CONSENT_ID__.+?__END_ID__\n/, "");
        } else {
          accumulated += chunk;
        }

        setMarkdown(accumulated);
        setDetectedClauses(detectClauses(accumulated));
      }

      setStatus("complete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setMarkdown("");
    setConsentId("");
    setDetectedClauses([]);
    setError(null);
  }, []);

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left panel — form (always visible when idle/error) */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {(status === "idle" || status === "error") && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {status === "error" && error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                    {error}
                  </div>
                )}
                {templateId && (
                  <div className="mb-4 p-4 bg-nq-purple-soft border border-nq-purple/30 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-nq-purple/20 flex items-center justify-center text-nq-purple">✓</div>
                    <div>
                      <p className="text-sm font-bold text-nq-text">Template Applied</p>
                      <p className="text-xs text-nq-text-muted">Fields have been pre-filled for {PREBUILT_TEMPLATES.find(t => t.id === templateId)?.title}</p>
                    </div>
                  </div>
                )}
                <ConsentForm form={form} onSubmit={onSubmit} status={status} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — document + checklist */}
        <div className="w-full lg:w-[700px] shrink-0">
          <AnimatePresence mode="wait">
            {status === "idle" || status === "error" ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-2 border-dashed border-nq-border rounded-2xl h-96 flex flex-col items-center justify-center text-nq-text-light bg-white"
              >
                <div className="text-4xl mb-3 opacity-50">📄</div>
                <p className="font-semibold text-nq-text-muted">Your consent form will appear here</p>
                <p className="text-sm mt-1">Fill in the form and click Generate</p>
              </motion.div>
            ) : status === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingState />
              </motion.div>
            ) : (
              <motion.div
                key="document"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "streaming"
                        ? "bg-nq-purple animate-pulse"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm font-semibold text-nq-text-muted">
                    {status === "streaming"
                      ? "Generating your consent form..."
                      : "Consent form ready"}
                  </span>
                </div>

                <ConsentDocument
                  markdown={markdown}
                  consentId={consentId}
                  hospitalName={form.getValues("clinical.hospitalName")}
                  isComplete={status === "complete"}
                  onReset={reset}
                  formData={form.getValues()}
                />

                <ClauseChecklist
                  detectedClauses={detectedClauses}
                  consentType={consentType}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-nq-bg font-inter">
      <Suspense fallback={
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
        </div>
      }>
        <GenerateContent />
      </Suspense>
    </div>
  );
}
