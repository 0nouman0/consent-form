"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence mode="wait">
        {(status === "idle" || status === "error") ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto"
          >
            {status === "error" && error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {templateId && (
              <div className="mb-4 p-4 rounded-xl flex items-center gap-3 border" style={{ background: 'hsl(var(--primary) / 0.06)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary" style={{ background: 'hsl(var(--primary) / 0.12)' }}>✓</div>
                <div>
                  <p className="text-sm font-semibold text-foreground font-body">Template Applied</p>
                  <p className="text-xs text-muted-foreground font-body">Fields have been pre-filled for {PREBUILT_TEMPLATES.find(t => t.id === templateId)?.title}</p>
                </div>
              </div>
            )}
            <ConsentForm form={form} onSubmit={onSubmit} status={status} />
          </motion.div>
        ) : status === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto"
          >
            <LoadingState />
          </motion.div>
        ) : (
          <motion.div
            key="document"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                  status === "streaming" ? "bg-primary animate-pulse" : "bg-green-500"
                }`} />
              <span className="text-sm font-medium text-muted-foreground font-body">
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
    </main>
  );
}

export default function GeneratePage() {
  return (
    <div className="min-h-screen font-body" style={{ background: 'hsl(var(--muted))' }}>
      <Suspense fallback={
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      }>
        <GenerateContent />
      </Suspense>
    </div>
  );
}
