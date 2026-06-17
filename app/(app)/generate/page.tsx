"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { consentFormSchema, ConsentFormSchema, researchConsentFormSchema, ResearchConsentFormSchema } from "@/lib/schema";
import { REQUIRED_CLAUSES } from "@/lib/clauses";
import { GenerationStatus } from "@/lib/types";
import { PREBUILT_TEMPLATES, RESEARCH_TEMPLATES } from "@/lib/templates";
import ConsentForm from "@/components/ConsentForm";
import ResearchConsentForm from "@/components/ResearchConsentForm";
import ConsentDocument from "@/components/ConsentDocument";
import ClauseChecklist from "@/components/ClauseChecklist";
import LoadingState from "@/components/LoadingState";
import { BookOpen, FileText, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

function GenerateContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const urlFormType = searchParams.get("formType");

  const [formType, setFormType] = useState<"select" | "surgical" | "research">(
    urlFormType === "research" || urlFormType === "surgical"
      ? urlFormType
      : templateId
      ? "surgical"
      : "select"
  );
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [markdown, setMarkdown] = useState("");
  const [consentId, setConsentId] = useState("");
  const [detectedClauses, setDetectedClauses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [consentType, setConsentType] = useState("surgical");

  // Surgical/Clinical Form
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

  // Research Form
  const researchForm = useForm<ResearchConsentFormSchema>({
    resolver: zodResolver(researchConsentFormSchema),
    defaultValues: {
      study: {
        studyTitle: "",
        principalInvestigator: "",
        department: "",
        institutionName: "",
        institutionAddress: "",
        contactMobile: "",
        studyPurpose: "",
        dataToCollect: "",
        timeRequired: "10-15 minutes",
        risks: "There are no physical, mental, or emotional risks involved in this study.",
        benefits: "No direct benefit to the participant. However, feedback may help improve future practices.",
        monetaryBenefits: "No monetary benefits are provided for participating.",
        counselingLanguage: "English",
      },
      participant: {
        participantName: "",
        participantId: "",
        age: "",
        sex: "Male",
        isCompetent: true,
        guardianName: "",
        guardianRelationship: "",
      },
      includeWitnessBlock: true,
      includeResearcherDeclaration: true,
    }
  });

  // Pre-fill form if templateId is provided
  useEffect(() => {
    if (templateId) {
      if (formType === "research") {
        const template = RESEARCH_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          researchForm.setValue("study.studyTitle", template.studyTitle, { shouldValidate: true });
          researchForm.setValue("study.principalInvestigator", template.principalInvestigator, { shouldValidate: true });
          researchForm.setValue("study.department", template.department, { shouldValidate: true });
          researchForm.setValue("study.institutionName", template.institutionName, { shouldValidate: true });
          researchForm.setValue("study.institutionAddress", template.institutionAddress, { shouldValidate: true });
          researchForm.setValue("study.contactMobile", template.contactMobile, { shouldValidate: true });
          researchForm.setValue("study.studyPurpose", template.studyPurpose, { shouldValidate: true });
          researchForm.setValue("study.dataToCollect", template.dataToCollect, { shouldValidate: true });
          researchForm.setValue("study.timeRequired", template.timeRequired, { shouldValidate: true });
          researchForm.setValue("study.risks", template.risks, { shouldValidate: true });
          researchForm.setValue("study.benefits", template.benefits, { shouldValidate: true });
          researchForm.setValue("study.monetaryBenefits", template.monetaryBenefits, { shouldValidate: true });
        }
      } else {
        const template = PREBUILT_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          form.setValue("clinical.procedureName", template.procedureName, { shouldValidate: true });
          form.setValue("clinical.consentType", template.consentType as any, { shouldValidate: true });
          form.setValue("clinical.specificRisks", template.specificRisks, { shouldValidate: true });
          form.setValue("clinical.alternatives", template.alternatives, { shouldValidate: true });
          
          // Ensure consentType state matches
          setConsentType(template.consentType);
        }
      }
    }
  }, [templateId, formType, form, researchForm]);

  // Detect which clauses appear in streamed text (only for surgical/clinical forms)
  function detectClauses(text: string): string[] {
    const lower = text.toLowerCase();
    return REQUIRED_CLAUSES.filter((c) => {
      const keyword = c.title.toLowerCase().split(" ")[0];
      return lower.includes(keyword);
    }).map((c) => c.id);
  }

  // Handle standard clinical submit
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

  // Handle research consent submit
  const onResearchSubmit = useCallback(async (data: ResearchConsentFormSchema) => {
    setStatus("loading");
    setMarkdown("");
    setConsentId("");
    setDetectedClauses([]);
    setError(null);
    setConsentType("research");

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
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" style={{ backgroundColor: "#ededed" }}>
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-4"
        style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        {formType !== "select" && status === "idle" && (
          <button
            onClick={() => setFormType("select")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all shrink-0"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Forms</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
            {formType === "surgical" ? (
              <>
                Surgical <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>consent</span>
              </>
            ) : formType === "research" ? (
              <>
                Research <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>consent</span>
              </>
            ) : (
              <>
                Consent <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>generator</span>
              </>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {formType === "surgical"
              ? "Generate a new clinical or surgical informed consent form"
              : formType === "research"
              ? "Generate a new voluntary participant research consent form"
              : "Select the type of consent form you want to generate"}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && formType === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto"
          >
            <button
              onClick={() => setFormType("surgical")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white text-center transition-all group hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7 text-neutral-700" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0b0f1a" }}>Surgical Consent Form</h3>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                Standard clinical informed consent templates for surgical procedures, diagnostics, and medical treatments.
              </p>
            </button>

            <button
              onClick={() => setFormType("research")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white text-center transition-all group hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <BookOpen className="w-7 h-7 text-neutral-700" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0b0f1a" }}>Research Consent Form</h3>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                Informed consent templates for voluntary participation in research studies, clinical trials, and surveys.
              </p>
            </button>
          </motion.div>
        ) : (status === "idle" || status === "error") ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto"
          >
            {status === "error" && error && (
              <div className="mb-4 p-4 rounded-xl text-red-700 text-sm font-medium" style={{ background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
            {templateId && (
              <div className="mb-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "#f5f2ee", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold" style={{ color: "#0b0f1a", border: "1px solid rgba(0,0,0,0.1)" }}>✓</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0b0f1a" }}>Template Applied</p>
                  <p className="text-xs text-neutral-500">Fields have been pre-filled for {PREBUILT_TEMPLATES.find(t => t.id === templateId)?.title}</p>
                </div>
              </div>
            )}
            {formType === "research" ? (
              <ResearchConsentForm form={researchForm} onSubmit={onResearchSubmit} status={status} />
            ) : (
              <ConsentForm form={form} onSubmit={onSubmit} status={status} />
            )}
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
              hospitalName={formType === "research" ? researchForm.getValues("study.institutionName") : form.getValues("clinical.hospitalName")}
              isComplete={status === "complete"}
              onReset={reset}
              formData={formType === "research" ? researchForm.getValues() : form.getValues()}
            />

            {formType === "surgical" && (
              <ClauseChecklist
                detectedClauses={detectedClauses}
                consentType={consentType}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#ededed]">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
