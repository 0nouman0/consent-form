"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Shield } from "lucide-react";
import { consentFormSchema, ConsentFormSchema } from "@/lib/schema";
import { REQUIRED_CLAUSES } from "@/lib/clauses";
import { GenerationStatus } from "@/lib/types";
import ConsentForm from "@/components/ConsentForm";
import ConsentDocument from "@/components/ConsentDocument";
import ClauseChecklist from "@/components/ClauseChecklist";
import LoadingState from "@/components/LoadingState";

export default function Home() {
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-none">
                ConsentGen
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Medico-Legal Consent Form Generator for Doctors
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {["INDIA COMPLIANT", "IMC 2002", "NARAYAN REDDY"].map((label) => (
              <span
                key={label}
                className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main layout */}
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
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
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
                  className="border-2 border-dashed border-slate-200 rounded-xl h-96 flex flex-col items-center justify-center text-slate-400"
                >
                  <div className="text-4xl mb-3">📄</div>
                  <p className="font-medium">Your consent form will appear here</p>
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
                          ? "bg-teal-500 animate-pulse"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="text-sm text-slate-500">
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
    </div>
  );
}