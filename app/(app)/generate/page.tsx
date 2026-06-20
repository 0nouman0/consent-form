"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  consentFormSchema,
  ConsentFormSchema,
  researchConsentFormSchema,
  ResearchConsentFormSchema,
} from "@/lib/schema";
import { REQUIRED_CLAUSES } from "@/lib/clauses";
import { GenerationStatus } from "@/lib/types";
import { PREBUILT_TEMPLATES, RESEARCH_TEMPLATES } from "@/lib/templates";
import ConsentDocument from "@/components/ConsentDocument";
import ClauseChecklist from "@/components/ClauseChecklist";
import LoadingState from "@/components/LoadingState";
import ConsentWizard from "./ConsentWizard";
import ResearchWizard from "./ResearchWizard";
import {
  FileText,
  BookOpen,
  ArrowLeft,
  Coins,
  CheckCircle,
  ArrowRight,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

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
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    // Bail out after 6 s so a hung Supabase connection never blocks the UI
    const fallbackTimer = setTimeout(() => setLoadingCredits(false), 6000);

    const fetchCredits = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();
          if (data) setCredits(data.credits);
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      } finally {
        clearTimeout(fallbackTimer);
        setLoadingCredits(false);
      }
    };

    fetchCredits();
    return () => clearTimeout(fallbackTimer);
  }, []);

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
        benefits:
          "No direct benefit to the participant. However, feedback may help improve future practices.",
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
    },
  });

  useEffect(() => {
    if (templateId) {
      if (formType === "research") {
        const template = RESEARCH_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          researchForm.setValue("study.studyTitle", template.studyTitle, { shouldValidate: true });
          researchForm.setValue("study.principalInvestigator", template.principalInvestigator, {
            shouldValidate: true,
          });
          researchForm.setValue("study.department", template.department, { shouldValidate: true });
          researchForm.setValue("study.institutionName", template.institutionName, {
            shouldValidate: true,
          });
          researchForm.setValue("study.institutionAddress", template.institutionAddress, {
            shouldValidate: true,
          });
          researchForm.setValue("study.contactMobile", template.contactMobile, {
            shouldValidate: true,
          });
          researchForm.setValue("study.studyPurpose", template.studyPurpose, {
            shouldValidate: true,
          });
          researchForm.setValue("study.dataToCollect", template.dataToCollect, {
            shouldValidate: true,
          });
          researchForm.setValue("study.timeRequired", template.timeRequired, {
            shouldValidate: true,
          });
          researchForm.setValue("study.risks", template.risks, { shouldValidate: true });
          researchForm.setValue("study.benefits", template.benefits, { shouldValidate: true });
          researchForm.setValue("study.monetaryBenefits", template.monetaryBenefits, {
            shouldValidate: true,
          });
        }
      } else {
        const template = PREBUILT_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          form.setValue("clinical.procedureName", template.procedureName, { shouldValidate: true });
          form.setValue("clinical.consentType", template.consentType as ConsentFormSchema["clinical"]["consentType"], {
            shouldValidate: true,
          });
          form.setValue("clinical.specificRisks", template.specificRisks, { shouldValidate: true });
          form.setValue("clinical.alternatives", template.alternatives, { shouldValidate: true });
          setConsentType(template.consentType);
        }
      }
    }
  }, [templateId, formType, form, researchForm]);

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
      setCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
    }
  }, []);

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
      setCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      window.dispatchEvent(new Event("credits-updated"));
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
    <main role="main" aria-label="Consent Form Generator" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" style={{ backgroundColor: "#ededed" }}>
      {/* Page Header Card */}
      <div
        className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-4"
        style={{ border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {formType !== "select" && status === "idle" && (
          <button
            onClick={() => setFormType("select")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all shrink-0"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}
            aria-label="Go back to form type selection"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            Forms
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}
          >
            {formType === "surgical" ? (
              <>
                Surgical{" "}
                <span
                  className="font-serif italic font-normal text-neutral-600"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  consent
                </span>
              </>
            ) : formType === "research" ? (
              <>
                Research{" "}
                <span
                  className="font-serif italic font-normal text-neutral-600"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  consent
                </span>
              </>
            ) : (
              <>
                Consent{" "}
                <span
                  className="font-serif italic font-normal text-neutral-600"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  generator
                </span>
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
        {loadingCredits ? (
          <motion.div
            key="loading-credits"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center p-12 bg-white rounded-2xl max-w-md mx-auto"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          </motion.div>
        ) : credits === 0 ? (
          <motion.div
            key="no-credits"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center p-10 rounded-2xl bg-white text-center max-w-md mx-auto"
            style={{
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
              <Coins className="w-7 h-7 text-amber-600" weight="duotone" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#0b0f1a" }}>
              No Credits Available
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              You need credits to generate a consent form (1 credit = 1 form). Your current balance
              is 0.
            </p>
            <Link
              href="/credits"
              className="inline-flex items-center gap-2 rounded-xl text-xs font-bold text-white transition-all px-5 py-3 hover:opacity-90"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              Purchase Credits
            </Link>
          </motion.div>
        ) : status === "idle" && formType === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Surgical card */}
            <button
              onClick={() => setFormType("surgical")}
              className="relative flex flex-col p-10 rounded-2xl bg-white text-left transition-all group hover:shadow-xl hover:-translate-y-1 min-h-[380px]"
              style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Accent band */}
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-sky-400 to-cyan-400" />

              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-sky-600" weight="duotone" />
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0b0f1a" }}>
                Surgical Consent
              </h3>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                IMC 2002-compliant informed consent for surgical procedures, diagnostics, anaesthesia, and all clinical treatments. Supports 10 procedure types.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  "Patient identity & competency assessment",
                  "Specific risk & alternatives disclosure",
                  "Anaesthesia, tissue & clause toggles",
                  "Witness & guardian signature blocks",
                  "Bilingual generation (12 Indian languages)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <CheckCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" weight="fill" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="text-xs bg-sky-50 text-sky-700 font-semibold px-3 py-1.5 rounded-full border border-sky-100">
                  10 consent types
                </span>
                <span className="text-xs bg-neutral-100 text-neutral-600 font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> ~5 min
                </span>
                <span className="text-xs bg-green-50 text-green-700 font-medium px-3 py-1.5 rounded-full border border-green-100">
                  IMC 2002
                </span>
              </div>
            </button>

            {/* Research card */}
            <button
              onClick={() => setFormType("research")}
              className="relative flex flex-col p-10 rounded-2xl bg-white text-left transition-all group hover:shadow-xl hover:-translate-y-1 min-h-[380px]"
              style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Accent band */}
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-violet-500 to-purple-400" />

              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-violet-600" weight="duotone" />
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0b0f1a" }}>
                Research Consent
              </h3>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                ICMR National Ethical Guidelines-compliant consent for clinical trials, research studies, and voluntary participant surveys.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  "Study identity & institution details",
                  "Risk, benefit & data collection disclosure",
                  "Participant competency & guardian fields",
                  "Researcher declaration block",
                  "Bilingual generation (12 Indian languages)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" weight="fill" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-3 py-1.5 rounded-full border border-violet-100">
                  ICMR compliant
                </span>
                <span className="text-xs bg-neutral-100 text-neutral-600 font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> ~5 min
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 font-medium px-3 py-1.5 rounded-full border border-purple-100">
                  GCP aligned
                </span>
              </div>
            </button>
          </motion.div>
        ) : status === "idle" || status === "error" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full space-y-4"
          >
            {status === "error" && error && (
              <div
                role="alert"
                className="p-4 rounded-xl text-red-700 text-sm font-medium"
                style={{ background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}
            {templateId && (
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: "#f5f2ee", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <div
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold"
                  style={{ color: "#0b0f1a", border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0b0f1a" }}>
                    Template Applied
                  </p>
                  <p className="text-xs text-neutral-500">
                    Fields have been pre-filled for{" "}
                    {PREBUILT_TEMPLATES.find((t) => t.id === templateId)?.title}
                  </p>
                </div>
              </div>
            )}
            {formType === "research" ? (
              <ResearchWizard form={researchForm} onSubmit={onResearchSubmit} status={status} />
            ) : (
              <ConsentWizard form={form} onSubmit={onSubmit} status={status} />
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
            className="space-y-4"
          >
            <div aria-live="polite" className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "streaming" ? "bg-primary animate-pulse" : "bg-green-500"
                }`}
              />
              <span className="text-sm font-medium text-muted-foreground font-body">
                {status === "streaming"
                  ? "Generating your consent form..."
                  : "Consent form ready"}
              </span>
            </div>

            <div className="flex gap-5 items-start">
              <div className="flex-1 min-w-0">
                <ConsentDocument
                  markdown={markdown}
                  consentId={consentId}
                  hospitalName={
                    formType === "research"
                      ? researchForm.getValues("study.institutionName")
                      : form.getValues("clinical.hospitalName")
                  }
                  isComplete={status === "complete"}
                  onReset={reset}
                  formData={formType === "research" ? researchForm.getValues() : form.getValues()}
                />
              </div>

              {formType === "surgical" && (
                <div className="w-72 shrink-0 sticky top-4">
                  <ClauseChecklist
                    detectedClauses={detectedClauses}
                    consentType={consentType}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#ededed]">
          <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}
