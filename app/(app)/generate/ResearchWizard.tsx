"use client";

import { useRef, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ResearchConsentFormSchema } from "@/lib/schema";
import { GenerationStatus } from "@/lib/types";
import { ResearchConsentPreview } from "./PreviewDocument";

interface ResearchWizardProps {
  form: UseFormReturn<ResearchConsentFormSchema>;
  onSubmit: (data: ResearchConsentFormSchema) => Promise<void>;
  status: GenerationStatus;
}

const COUNSELING_LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia", "Urdu",
];

const TOTAL_STEPS = 6;

const STEP_FIELDS: Array<Array<string>> = [
  ["study.studyTitle", "study.principalInvestigator", "study.department"],
  ["study.institutionName", "study.institutionAddress", "study.contactMobile"],
  ["study.studyPurpose", "study.dataToCollect", "study.timeRequired"],
  ["study.risks", "study.benefits", "study.counselingLanguage"],
  ["participant.participantName", "participant.participantId", "participant.age", "participant.sex"],
  [],
];

const STEP_TITLES = [
  "Study Identity",
  "Institution",
  "Study Details",
  "Risks & Benefits",
  "Participant",
  "Preview & Generate",
];

const STEP_SUBTITLES = [
  "Enter the study title and principal investigator details.",
  "Enter the institution hosting the research study.",
  "Describe the study purpose and data collection.",
  "Summarise risks, benefits, and counseling language.",
  "Enter participant details and document settings.",
  "Review the research consent form before generating.",
];

const inputCls = "app-input";
const labelCls = "block text-sm font-medium mb-1.5";
const errorCls = "text-xs mt-1.5";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={errorCls} style={{ color: "var(--red)" }}>
      {message}
    </p>
  );
}

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ id, checked, onChange, label, description }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-4 cursor-pointer select-none">
      <div className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className="w-12 h-6 rounded-md transition-colors"
          style={{ backgroundColor: checked ? "var(--ink)" : "var(--rule)" }}
        />
        <div
          className="absolute top-1 left-1 w-4 h-4 rounded-md shadow transition-transform"
          style={{ backgroundColor: "var(--sheet)", transform: checked ? "translateX(1.5rem)" : "translateX(0)" }}
        />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{description}</p>}
      </div>
    </label>
  );
}

export default function ResearchWizard({ form, onSubmit, status }: ResearchWizardProps) {
  const [step, setStep] = useState(0);
  const [sliding, setSliding] = useState<"none" | "left" | "right">("none");
  const titleRef = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, getValues, formState: { errors } } = form;

  const isCompetent = watch("participant.isCompetent");
  const includeWitnessBlock = watch("includeWitnessBlock");
  const includeResearcherDeclaration = watch("includeResearcherDeclaration");

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, [step]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  async function goNext() {
    const fields = STEP_FIELDS[step] as Parameters<typeof form.trigger>[0];
    const valid = fields && fields.length > 0 ? await form.trigger(fields) : true;
    if (!valid) return;

    setSliding("left");
    setTimeout(() => {
      setStep((s) => s + 1);
      setSliding("none");
    }, 180);
  }

  function goBack() {
    setSliding("right");
    setTimeout(() => {
      setStep((s) => s - 1);
      setSliding("none");
    }, 180);
  }

  const slideClass =
    sliding === "left"
      ? "opacity-0 -translate-x-4"
      : sliding === "right"
      ? "opacity-0 translate-x-4"
      : "opacity-100 translate-x-0";

  function getError(path: string) {
    const parts = path.split(".");
    let cur: unknown = errors;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = (cur as Record<string, unknown>)[p];
    }
    if (cur && typeof cur === "object" && "message" in cur) {
      return (cur as { message?: string }).message;
    }
    return undefined;
  }

  const isSubmitting = status === "loading" || status === "streaming";

  return (
    <div className="rounded-md overflow-hidden flex min-h-[600px]" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>

      {/* ── LEFT: Step navigator ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 py-8 px-5" style={{ borderRight: "1px solid var(--rule)", backgroundColor: "var(--paper)" }}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] mb-6 px-1" style={{ color: "var(--ink-muted)" }}>
          Research Consent
        </p>
        <nav aria-label="Form steps">
          <ol className="space-y-1">
            {STEP_TITLES.map((title, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={title}>
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm"
                    style={{
                      backgroundColor: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--sheet)" : done ? "var(--ink-soft)" : "var(--ink-muted)",
                      fontWeight: active ? 600 : done ? 500 : 400,
                      cursor: done ? "pointer" : active ? "default" : "default",
                    }}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: active ? "var(--sheet)" : done ? "var(--ink)" : "transparent",
                        color: active ? "var(--ink)" : done ? "var(--sheet)" : "var(--ink-muted)",
                        border: active || done ? "1px solid transparent" : "1px solid var(--rule)",
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="truncate">{title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-auto pt-6">
          <div className="flex justify-between font-mono text-[10px] mb-2" style={{ color: "var(--ink-muted)" }}>
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
            className="h-1.5 rounded-md overflow-hidden"
            style={{ backgroundColor: "var(--rule)" }}
          >
            <div
              className="h-full rounded-md transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "var(--red)" }}
            />
          </div>
        </div>
      </aside>

      {/* ── RIGHT: Step content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile progress bar */}
        <div className="md:hidden h-1" style={{ backgroundColor: "var(--rule-soft)" }}>
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: "var(--red)" }} />
        </div>

        <div className="md:hidden px-6 pt-4 pb-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
            Step {step + 1} of {TOTAL_STEPS}
          </p>
        </div>

      {/* Step content */}
      <div
        className={`flex-1 px-8 py-8 transition-all duration-[180ms] ease-in-out ${slideClass}`}
      >
        <div
          ref={titleRef}
          tabIndex={-1}
          className="mb-6 focus:outline-none"
          aria-live="polite"
        >
          <h2 className="font-serif text-xl font-bold" style={{ color: "var(--ink)" }}>{STEP_TITLES[step]}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>{STEP_SUBTITLES[step]}</p>
        </div>

        {/* Step 0: Study Identity */}
        {step === 0 && (
          <fieldset>
            <legend className="sr-only">Study identity information</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="study.studyTitle" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Study Title <span aria-hidden="true">*</span>
                </label>
                <input
                  id="study.studyTitle"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.studyTitle")}
                  aria-describedby={getError("study.studyTitle") ? "err-studyTitle" : undefined}
                  placeholder="Full title of the research study"
                  {...register("study.studyTitle")}
                />
                <FieldError id="err-studyTitle" message={getError("study.studyTitle")} />
              </div>
              <div>
                <label htmlFor="study.principalInvestigator" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Principal Investigator <span aria-hidden="true">*</span>
                </label>
                <input
                  id="study.principalInvestigator"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.principalInvestigator")}
                  aria-describedby={getError("study.principalInvestigator") ? "err-pi" : undefined}
                  placeholder="Dr. / Prof. Full Name"
                  {...register("study.principalInvestigator")}
                />
                <FieldError id="err-pi" message={getError("study.principalInvestigator")} />
              </div>
              <div>
                <label htmlFor="study.department" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Department <span aria-hidden="true">*</span>
                </label>
                <input
                  id="study.department"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.department")}
                  aria-describedby={getError("study.department") ? "err-department" : undefined}
                  placeholder="e.g. Department of Cardiology"
                  {...register("study.department")}
                />
                <FieldError id="err-department" message={getError("study.department")} />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 1: Institution */}
        {step === 1 && (
          <fieldset>
            <legend className="sr-only">Institution information</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="study.institutionName" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Institution / Hospital Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="study.institutionName"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.institutionName")}
                  aria-describedby={getError("study.institutionName") ? "err-institutionName" : undefined}
                  placeholder="Full name of the institution"
                  {...register("study.institutionName")}
                />
                <FieldError id="err-institutionName" message={getError("study.institutionName")} />
              </div>
              <div>
                <label htmlFor="study.institutionAddress" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Institution Address <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="study.institutionAddress"
                  rows={3}
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.institutionAddress")}
                  aria-describedby={getError("study.institutionAddress") ? "err-institutionAddress" : undefined}
                  placeholder="Full address including city and PIN"
                  {...register("study.institutionAddress")}
                />
                <FieldError id="err-institutionAddress" message={getError("study.institutionAddress")} />
              </div>
              <div>
                <label htmlFor="study.contactMobile" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Contact Mobile <span aria-hidden="true">*</span>
                </label>
                <input
                  id="study.contactMobile"
                  type="tel"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.contactMobile")}
                  aria-describedby={getError("study.contactMobile") ? "err-contactMobile" : undefined}
                  placeholder="e.g. +91 98765 43210"
                  {...register("study.contactMobile")}
                />
                <FieldError id="err-contactMobile" message={getError("study.contactMobile")} />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 2: Study Details */}
        {step === 2 && (
          <fieldset>
            <legend className="sr-only">Study details</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="study.studyPurpose" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Study Purpose <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="study.studyPurpose"
                  rows={4}
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.studyPurpose")}
                  aria-describedby={getError("study.studyPurpose") ? "err-studyPurpose" : undefined}
                  placeholder="Describe the purpose and objectives of this research study..."
                  {...register("study.studyPurpose")}
                />
                <FieldError id="err-studyPurpose" message={getError("study.studyPurpose")} />
              </div>
              <div>
                <label htmlFor="study.dataToCollect" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Data / Tasks Involved <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="study.dataToCollect"
                  rows={4}
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("study.dataToCollect")}
                  aria-describedby={getError("study.dataToCollect") ? "err-dataToCollect" : undefined}
                  placeholder="What data will be collected? What tasks will participants perform?"
                  {...register("study.dataToCollect")}
                />
                <FieldError id="err-dataToCollect" message={getError("study.dataToCollect")} />
              </div>
              <div>
                <label htmlFor="study.timeRequired" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Time Required
                </label>
                <input
                  id="study.timeRequired"
                  className={inputCls}
                  placeholder="e.g. 10-15 minutes"
                  {...register("study.timeRequired")}
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 3: Risks & Benefits */}
        {step === 3 && (
          <fieldset>
            <legend className="sr-only">Risks, benefits, and language</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="study.risks" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Risks
                </label>
                <textarea
                  id="study.risks"
                  rows={3}
                  className={inputCls}
                  placeholder="Describe any physical, mental, or emotional risks..."
                  {...register("study.risks")}
                />
              </div>
              <div>
                <label htmlFor="study.benefits" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Benefits
                </label>
                <textarea
                  id="study.benefits"
                  rows={3}
                  className={inputCls}
                  placeholder="Describe benefits to the participant or society..."
                  {...register("study.benefits")}
                />
              </div>
              <div>
                <label htmlFor="study.monetaryBenefits" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Monetary Benefits
                </label>
                <textarea
                  id="study.monetaryBenefits"
                  rows={2}
                  className={inputCls}
                  placeholder="Describe any payment or compensation..."
                  {...register("study.monetaryBenefits")}
                />
              </div>
              <div>
                <label htmlFor="study.counselingLanguage" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Counseling Language <span aria-hidden="true">*</span>
                </label>
                <select
                  id="study.counselingLanguage"
                  className={inputCls}
                  aria-required="true"
                  {...register("study.counselingLanguage")}
                >
                  {COUNSELING_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 4: Participant */}
        {step === 4 && (
          <fieldset>
            <legend className="sr-only">Participant details and document settings</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="participant.participantName" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Participant Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="participant.participantName"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("participant.participantName")}
                  aria-describedby={getError("participant.participantName") ? "err-participantName" : undefined}
                  placeholder="Full legal name"
                  {...register("participant.participantName")}
                />
                <FieldError id="err-participantName" message={getError("participant.participantName")} />
              </div>
              <div>
                <label htmlFor="participant.participantId" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                  Participant ID / Roll Number <span aria-hidden="true">*</span>
                </label>
                <input
                  id="participant.participantId"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("participant.participantId")}
                  aria-describedby={getError("participant.participantId") ? "err-participantId" : undefined}
                  placeholder="e.g. PART-001 or Roll No."
                  {...register("participant.participantId")}
                />
                <FieldError id="err-participantId" message={getError("participant.participantId")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="participant.age" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                    Age <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="participant.age"
                    className={inputCls}
                    aria-required="true"
                    aria-invalid={!!getError("participant.age")}
                    aria-describedby={getError("participant.age") ? "err-participantAge" : undefined}
                    placeholder="e.g. 28"
                    {...register("participant.age")}
                  />
                  <FieldError id="err-participantAge" message={getError("participant.age")} />
                </div>
                <div>
                  <label htmlFor="participant.sex" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                    Sex <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="participant.sex"
                    className={inputCls}
                    aria-required="true"
                    {...register("participant.sex")}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 p-4 rounded-md" style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}>
                <Toggle
                  id="participant.isCompetent"
                  checked={isCompetent}
                  onChange={(v) => setValue("participant.isCompetent", v)}
                  label="Participant is competent to consent"
                  description="Toggle off if a guardian or parent will provide consent."
                />
              </div>

              {!isCompetent && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="participant.guardianName" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                      Guardian / Parent Name
                    </label>
                    <input
                      id="participant.guardianName"
                      className={inputCls}
                      placeholder="Full name of guardian"
                      {...register("participant.guardianName")}
                    />
                  </div>
                  <div>
                    <label htmlFor="participant.guardianRelationship" className={labelCls} style={{ color: "var(--ink-soft)" }}>
                      Relationship to Participant
                    </label>
                    <input
                      id="participant.guardianRelationship"
                      className={inputCls}
                      placeholder="e.g. Mother, Father, Spouse"
                      {...register("participant.guardianRelationship")}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--ink-soft)" }}>Document Blocks</p>
                <div className="space-y-3 p-4 rounded-md" style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}>
                  <Toggle
                    id="includeWitnessBlock"
                    checked={includeWitnessBlock}
                    onChange={(v) => setValue("includeWitnessBlock", v)}
                    label="Include Witness Signature Block"
                    description="Adds a witness signature section to the document"
                  />
                  <Toggle
                    id="includeResearcherDeclaration"
                    checked={includeResearcherDeclaration}
                    onChange={(v) => setValue("includeResearcherDeclaration", v)}
                    label="Include Researcher Declaration"
                    description="Adds a researcher/investigator declaration section"
                  />
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 5: Preview */}
        {step === 5 && (
          <div>
            <ResearchConsentPreview data={getValues()} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-8 py-4 flex items-center justify-between gap-3 mt-auto" style={{ borderTop: "1px solid var(--rule)", backgroundColor: "var(--paper)" }}>
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-md px-6 py-2.5 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-[var(--paper)]"
          style={{ border: "1px solid var(--rule)", backgroundColor: "var(--sheet)", color: "var(--ink-soft)" }}
        >
          Back
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-md px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="rounded-md px-6 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(252,251,247,0.3)", borderTopColor: "var(--sheet)" }} />
                Generating…
              </>
            ) : (
              "Generate Consent Form (1 credit)"
            )}
          </button>
        )}
      </div>
      </div>{/* end right column */}
    </div>
  );
}
