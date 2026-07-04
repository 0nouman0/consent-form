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

    // Instant clinician auto-fill from the locally cached profile
    try {
      const cached = localStorage.getItem("consentgen_doctor_profile");
      if (cached) {
        const p = JSON.parse(cached);
        if (p.doctorName) form.setValue("clinical.doctorName", p.doctorName);
        if (p.doctorRegistrationNo) form.setValue("clinical.doctorRegistrationNo", p.doctorRegistrationNo);
        if (p.hospitalName) form.setValue("clinical.hospitalName", p.hospitalName);
        if (p.hospitalAddress) form.setValue("clinical.hospitalAddress", p.hospitalAddress);
      }
    } catch {
      // ignore corrupt cache
    }

    const fetchCredits = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("credits, doctor_name, doctor_registration_no, hospital_name, hospital_address")
            .eq("id", user.id)
            .single();
          if (data) {
            setCredits(data.credits);
            // Authoritative clinician auto-fill from the server profile
            if (data.doctor_name) form.setValue("clinical.doctorName", data.doctor_name);
            if (data.doctor_registration_no) form.setValue("clinical.doctorRegistrationNo", data.doctor_registration_no);
            if (data.hospital_name) form.setValue("clinical.hospitalName", data.hospital_name);
            if (data.hospital_address) form.setValue("clinical.hospitalAddress", data.hospital_address);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main role="main" aria-label="Consent Form Generator" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" style={{ backgroundColor: "var(--paper)" }}>
      {/* Page Header Card */}
      <div
        className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-4"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
      >
        {formType !== "select" && status === "idle" && (
          <button
            onClick={() => setFormType("select")}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-all shrink-0 hover:bg-[var(--paper)]"
            style={{ border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            aria-label="Go back to form type selection"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
            Forms
          </p>
          <h1
            className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            {formType === "surgical" ? (
              <>
                Surgical <span style={{ color: "var(--red)" }}>consent</span>
              </>
            ) : formType === "research" ? (
              <>
                Research <span style={{ color: "var(--red)" }}>consent</span>
              </>
            ) : (
              <>
                Consent <span style={{ color: "var(--red)" }}>generator</span>
              </>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
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
            className="flex items-center justify-center p-12 rounded-md max-w-md mx-auto"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
          </motion.div>
        ) : credits === 0 ? (
          <motion.div
            key="no-credits"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center p-10 rounded-md text-center max-w-md mx-auto"
            style={{
              backgroundColor: "var(--sheet)",
              border: "1px solid var(--rule)",
            }}
          >
            <div className="w-14 h-14 rounded-md flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(190,61,42,0.08)" }}>
              <Coins className="w-7 h-7" weight="duotone" style={{ color: "var(--red)" }} />
            </div>
            <h3 className="font-serif text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
              No Credits Available
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-muted)" }}>
              You need credits to generate a consent form (1 credit = 1 form). Your current balance
              is 0.
            </p>
            <Link
              href="/credits"
              className="inline-flex items-center gap-2 rounded-md text-xs font-bold transition-all px-5 py-3 hover:opacity-90"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
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
              className="relative flex flex-col p-10 rounded-md text-left transition-all group hover:-translate-y-1 min-h-[380px]"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              {/* Accent band */}
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-md" style={{ backgroundColor: "var(--ink)" }} />

              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="w-14 h-14 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}>
                  <FileText className="w-7 h-7" weight="duotone" style={{ color: "var(--ink)" }} />
                </div>
                <ArrowRight className="w-5 h-5 transition-all mt-1 group-hover:translate-x-0.5" style={{ color: "var(--ink-muted)" }} />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
                Surgical Consent
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
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
                  <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" weight="fill" style={{ color: "var(--ink)" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: "var(--paper)", color: "var(--ink)", border: "1px solid var(--rule)" }}>
                  10 consent types
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}>
                  <Clock className="w-3 h-3" /> ~5 min
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium px-3 py-1.5 rounded-md" style={{ color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)", border: "1px solid rgba(63,122,78,0.2)" }}>
                  IMC 2002
                </span>
              </div>
            </button>

            {/* Research card */}
            <button
              onClick={() => setFormType("research")}
              className="relative flex flex-col p-10 rounded-md text-left transition-all group hover:-translate-y-1 min-h-[380px]"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              {/* Accent band */}
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-md" style={{ backgroundColor: "var(--red)" }} />

              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="w-14 h-14 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(190,61,42,0.08)", border: "1px solid rgba(190,61,42,0.2)" }}>
                  <BookOpen className="w-7 h-7" weight="duotone" style={{ color: "var(--red)" }} />
                </div>
                <ArrowRight className="w-5 h-5 transition-all mt-1 group-hover:translate-x-0.5" style={{ color: "var(--ink-muted)" }} />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
                Research Consent
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
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
                  <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" weight="fill" style={{ color: "var(--red)" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: "rgba(190,61,42,0.08)", color: "var(--red)", border: "1px solid rgba(190,61,42,0.2)" }}>
                  ICMR compliant
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)" }}>
                  <Clock className="w-3 h-3" /> ~5 min
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium px-3 py-1.5 rounded-md" style={{ backgroundColor: "var(--paper)", color: "var(--ink-muted)", border: "1px solid var(--rule)" }}>
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
                className="p-4 rounded-md text-sm font-medium"
                style={{ backgroundColor: "rgba(190,61,42,0.06)", border: "1px solid rgba(190,61,42,0.25)", color: "var(--red)" }}
              >
                {error}
              </div>
            )}
            {templateId && (
              <div
                className="p-4 rounded-md flex items-center gap-3"
                style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: "var(--sheet)", color: "var(--ink)", border: "1px solid var(--rule)" }}
                >
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    Template Applied
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
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
                className={`w-2 h-2 rounded-full ${status === "streaming" ? "animate-pulse" : ""}`}
                style={{ backgroundColor: status === "streaming" ? "var(--red)" : "#3f7a4e" }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
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
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
          <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }} />
        </div>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}
