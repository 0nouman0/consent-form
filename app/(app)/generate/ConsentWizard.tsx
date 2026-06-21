"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { ConsentFormSchema } from "@/lib/schema";
import { GenerationStatus } from "@/lib/types";
import { ConsentPreview } from "./PreviewDocument";
import { searchProcedures, type ProcedureEntry } from "@/lib/procedures";
import { Microphone, StopCircle } from "@phosphor-icons/react/dist/ssr";

interface ConsentWizardProps {
  form: UseFormReturn<ConsentFormSchema>;
  onSubmit: (data: ConsentFormSchema) => Promise<void>;
  status: GenerationStatus;
}

const CONSENT_TYPE_OPTIONS = [
  { value: "surgical", label: "Surgical Procedure" },
  { value: "anaesthesia", label: "Anaesthesia" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "blood_transfusion", label: "Blood Transfusion" },
  { value: "research", label: "Research" },
  { value: "telemedicine", label: "Telemedicine" },
  { value: "minor_procedure", label: "Minor Procedure" },
  { value: "obstetric", label: "Obstetric" },
  { value: "psychiatric", label: "Psychiatric" },
  { value: "road_accident_emergency", label: "Road Accident / Emergency" },
];

const COUNSELING_LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia", "Urdu",
];

const TOTAL_STEPS = 7;

const STEP_FIELDS: Array<Array<string>> = [
  ["patient.patientName", "patient.age", "patient.sex"],
  ["patient.patientCompetent", "patient.guardianName", "patient.guardianRelationship"],
  ["patient.hospitalOpdIpdNo"],
  ["clinical.doctorName", "clinical.doctorRegistrationNo", "clinical.hospitalName", "clinical.hospitalAddress"],
  ["clinical.consentType", "clinical.procedureName", "clinical.procedureDate", "clinical.counselingLanguage", "languageLevel"],
  ["clinical.specificRisks"],
  [],
];

const STEP_TITLES = [
  "Patient Basics",
  "Competency",
  "Hospital & ID",
  "Clinician & Hospital",
  "Procedure",
  "Risks & Clauses",
  "Preview & Generate",
];

const STEP_SUBTITLES = [
  "Enter the patient's basic personal details.",
  "Confirm whether the patient can provide consent independently.",
  "Enter hospital registration and identity details.",
  "Enter the treating doctor and hospital information.",
  "Describe the procedure and consent settings.",
  "Describe risks, alternatives, and optional clauses.",
  "Review the consent form before generating.",
];

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all";
const labelCls = "block text-sm font-medium text-neutral-700 mb-1.5";
const errorCls = "text-xs text-red-600 mt-1.5";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={errorCls}>
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
        <div className="w-12 h-6 rounded-full bg-neutral-200 peer-checked:bg-neutral-900 transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function VoiceMicButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);

  const handleClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={listening ? "Listening…" : "Voice input"}
      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
        listening
          ? "text-red-500 bg-red-50 animate-pulse"
          : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {listening
        ? <StopCircle weight="fill" className="w-4 h-4" />
        : <Microphone weight="duotone" className="w-4 h-4" />}
    </button>
  );
}

export default function ConsentWizard({ form, onSubmit, status }: ConsentWizardProps) {
  const [step, setStep] = useState(0);
  const [sliding, setSliding] = useState<"none" | "left" | "right">("none");
  const titleRef = useRef<HTMLDivElement>(null);
  const [procSuggestions, setProcSuggestions] = useState<ProcedureEntry[]>([]);
  const [showProcSuggestions, setShowProcSuggestions] = useState(false);
  const procDropdownRef = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, getValues, formState: { errors } } = form;

  const handleProcedureInput = useCallback((value: string) => {
    const results = searchProcedures(value);
    setProcSuggestions(results);
    setShowProcSuggestions(results.length > 0);
  }, []);

  const selectProcedure = (entry: ProcedureEntry) => {
    setValue("clinical.procedureName", entry.name);
    setValue("clinical.specificRisks", entry.risks);
    setShowProcSuggestions(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (procDropdownRef.current && !procDropdownRef.current.contains(e.target as Node)) {
        setShowProcSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const patientCompetent = watch("patient.patientCompetent");
  const includeWitnessBlock = watch("includeWitnessBlock");
  const includeGuardianBlock = watch("includeGuardianBlock");
  const clauses = watch("clauses");

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
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex min-h-[600px]">

      {/* ── LEFT: Step navigator ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-100 bg-neutral-50 py-8 px-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-6 px-1">
          Surgical Consent
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                      active
                        ? "bg-neutral-900 text-white font-semibold"
                        : done
                        ? "text-neutral-600 hover:bg-neutral-200 cursor-pointer font-medium"
                        : "text-neutral-400 cursor-default"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border transition-all ${
                      active
                        ? "bg-white text-neutral-900 border-transparent"
                        : done
                        ? "bg-neutral-900 text-white border-transparent"
                        : "border-neutral-300 text-neutral-400"
                    }`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="truncate">{title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Progress bar at bottom of sidebar */}
        <div className="mt-auto pt-6">
          <div className="flex justify-between text-[10px] text-neutral-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
            className="h-1.5 bg-neutral-200 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-neutral-900 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </aside>

      {/* ── RIGHT: Step content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile progress bar */}
        <div className="md:hidden h-1 bg-neutral-100">
          <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Mobile step label */}
        <div className="md:hidden px-6 pt-4 pb-0">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
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
          <h2 className="text-xl font-bold text-neutral-900">{STEP_TITLES[step]}</h2>
          <p className="text-sm text-neutral-500 mt-1">{STEP_SUBTITLES[step]}</p>
        </div>

        {/* Step 0: Patient Basics */}
        {step === 0 && (
          <fieldset>
            <legend className="sr-only">Patient basic information</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="patient.patientName" className={labelCls}>
                  Patient Name <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="patient.patientName"
                    className={`${inputCls} pr-10`}
                    aria-required="true"
                    aria-invalid={!!getError("patient.patientName")}
                    aria-describedby={getError("patient.patientName") ? "err-patientName" : undefined}
                    placeholder="Full legal name"
                    {...register("patient.patientName")}
                  />
                  <VoiceMicButton onResult={(text) => setValue("patient.patientName", text)} />
                </div>
                <FieldError id="err-patientName" message={getError("patient.patientName")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patient.age" className={labelCls}>
                    Age <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="patient.age"
                    className={inputCls}
                    aria-required="true"
                    aria-invalid={!!getError("patient.age")}
                    aria-describedby={getError("patient.age") ? "err-age" : undefined}
                    placeholder="e.g. 42"
                    {...register("patient.age")}
                  />
                  <FieldError id="err-age" message={getError("patient.age")} />
                </div>
                <div>
                  <label htmlFor="patient.sex" className={labelCls}>
                    Sex <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="patient.sex"
                    className={inputCls}
                    aria-required="true"
                    {...register("patient.sex")}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 1: Competency */}
        {step === 1 && (
          <fieldset>
            <legend className="sr-only">Patient competency</legend>
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200">
                <Toggle
                  id="patient.patientCompetent"
                  checked={patientCompetent}
                  onChange={(v) => setValue("patient.patientCompetent", v)}
                  label="Patient is competent to consent"
                  description="Toggle off if the patient cannot provide consent due to age or medical condition."
                />
              </div>
              {!patientCompetent && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="patient.guardianName" className={labelCls}>
                      Guardian / Parent Name
                    </label>
                    <input
                      id="patient.guardianName"
                      className={inputCls}
                      aria-describedby={getError("patient.guardianName") ? "err-guardianName" : undefined}
                      placeholder="Full name of guardian"
                      {...register("patient.guardianName")}
                    />
                    <FieldError id="err-guardianName" message={getError("patient.guardianName")} />
                  </div>
                  <div>
                    <label htmlFor="patient.guardianRelationship" className={labelCls}>
                      Relationship to Patient
                    </label>
                    <input
                      id="patient.guardianRelationship"
                      className={inputCls}
                      placeholder="e.g. Mother, Father, Spouse"
                      {...register("patient.guardianRelationship")}
                    />
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        )}

        {/* Step 2: Hospital & ID */}
        {step === 2 && (
          <fieldset>
            <legend className="sr-only">Hospital and identity details</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="patient.hospitalOpdIpdNo" className={labelCls}>
                  Hospital OPD / IPD Number <span aria-hidden="true">*</span>
                </label>
                <input
                  id="patient.hospitalOpdIpdNo"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("patient.hospitalOpdIpdNo")}
                  aria-describedby={getError("patient.hospitalOpdIpdNo") ? "err-opdipd" : undefined}
                  placeholder="e.g. OPD-2024-001234"
                  {...register("patient.hospitalOpdIpdNo")}
                />
                <FieldError id="err-opdipd" message={getError("patient.hospitalOpdIpdNo")} />
              </div>
              <div>
                <label htmlFor="patient.aadhaarLast4" className={labelCls}>
                  Aadhaar Last 4 Digits <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  id="patient.aadhaarLast4"
                  className={inputCls}
                  aria-describedby={getError("patient.aadhaarLast4") ? "err-aadhaar" : undefined}
                  placeholder="XXXX"
                  maxLength={4}
                  {...register("patient.aadhaarLast4")}
                />
                <FieldError id="err-aadhaar" message={getError("patient.aadhaarLast4")} />
              </div>
              <div>
                <label htmlFor="patient.insuranceProvider" className={labelCls}>
                  Insurance Provider <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  id="patient.insuranceProvider"
                  className={inputCls}
                  placeholder="e.g. Star Health Insurance"
                  {...register("patient.insuranceProvider")}
                />
              </div>
              <div>
                <label htmlFor="patient.insurancePolicyNo" className={labelCls}>
                  Insurance Policy Number <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  id="patient.insurancePolicyNo"
                  className={inputCls}
                  placeholder="Policy number"
                  {...register("patient.insurancePolicyNo")}
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 3: Clinician & Hospital */}
        {step === 3 && (
          <fieldset>
            <legend className="sr-only">Clinician and hospital information</legend>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clinical.doctorName" className={labelCls}>
                    Doctor Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="clinical.doctorName"
                    className={inputCls}
                    aria-required="true"
                    aria-invalid={!!getError("clinical.doctorName")}
                    aria-describedby={getError("clinical.doctorName") ? "err-doctorName" : undefined}
                    placeholder="Dr. Full Name"
                    {...register("clinical.doctorName")}
                  />
                  <FieldError id="err-doctorName" message={getError("clinical.doctorName")} />
                </div>
                <div>
                  <label htmlFor="clinical.doctorRegistrationNo" className={labelCls}>
                    IMC Reg. No. <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="clinical.doctorRegistrationNo"
                    className={inputCls}
                    aria-required="true"
                    aria-invalid={!!getError("clinical.doctorRegistrationNo")}
                    aria-describedby={getError("clinical.doctorRegistrationNo") ? "err-regNo" : undefined}
                    placeholder="e.g. KA-12345"
                    {...register("clinical.doctorRegistrationNo")}
                  />
                  <FieldError id="err-regNo" message={getError("clinical.doctorRegistrationNo")} />
                </div>
              </div>
              <div>
                <label htmlFor="clinical.hospitalName" className={labelCls}>
                  Hospital Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="clinical.hospitalName"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("clinical.hospitalName")}
                  aria-describedby={getError("clinical.hospitalName") ? "err-hospitalName" : undefined}
                  placeholder="Full hospital name"
                  {...register("clinical.hospitalName")}
                />
                <FieldError id="err-hospitalName" message={getError("clinical.hospitalName")} />
              </div>
              <div>
                <label htmlFor="clinical.hospitalAddress" className={labelCls}>
                  Hospital Address <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="clinical.hospitalAddress"
                  rows={3}
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("clinical.hospitalAddress")}
                  aria-describedby={getError("clinical.hospitalAddress") ? "err-hospitalAddress" : undefined}
                  placeholder="Full address including city and PIN"
                  {...register("clinical.hospitalAddress")}
                />
                <FieldError id="err-hospitalAddress" message={getError("clinical.hospitalAddress")} />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 4: Procedure */}
        {step === 4 && (
          <fieldset>
            <legend className="sr-only">Procedure and consent settings</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="clinical.consentType" className={labelCls}>
                  Consent Type <span aria-hidden="true">*</span>
                </label>
                <select
                  id="clinical.consentType"
                  className={inputCls}
                  aria-required="true"
                  {...register("clinical.consentType")}
                >
                  {CONSENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div ref={procDropdownRef}>
                <label htmlFor="clinical.procedureName" className={labelCls}>
                  Procedure Name <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="clinical.procedureName"
                    className={`${inputCls} pr-10`}
                    aria-required="true"
                    aria-invalid={!!getError("clinical.procedureName")}
                    aria-describedby={getError("clinical.procedureName") ? "err-procedureName" : undefined}
                    placeholder="e.g. Laparoscopic Cholecystectomy"
                    {...register("clinical.procedureName", {
                      onChange: (e) => handleProcedureInput(e.target.value),
                    })}
                    onFocus={() => {
                      const val = getValues("clinical.procedureName");
                      if (val) handleProcedureInput(val);
                    }}
                    autoComplete="off"
                  />
                  <VoiceMicButton
                    onResult={(text) => {
                      setValue("clinical.procedureName", text);
                      handleProcedureInput(text);
                    }}
                  />
                  {showProcSuggestions && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 overflow-hidden"
                      style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                    >
                      {procSuggestions.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onMouseDown={() => selectProcedure(s)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors border-b last:border-b-0"
                          style={{ borderColor: "rgba(0,0,0,0.06)", color: "#0b0f1a" }}
                        >
                          <span className="font-medium">{s.name}</span>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">{s.risks.slice(0, 80)}…</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showProcSuggestions && (
                  <p className="text-[11px] text-neutral-400 mt-1.5">Select to auto-fill risks below</p>
                )}
                <FieldError id="err-procedureName" message={getError("clinical.procedureName")} />
              </div>
              <div>
                <label htmlFor="clinical.procedureDate" className={labelCls}>
                  Procedure Date <span aria-hidden="true">*</span>
                </label>
                <input
                  id="clinical.procedureDate"
                  type="date"
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("clinical.procedureDate")}
                  aria-describedby={getError("clinical.procedureDate") ? "err-procedureDate" : undefined}
                  {...register("clinical.procedureDate")}
                />
                <FieldError id="err-procedureDate" message={getError("clinical.procedureDate")} />
              </div>
              <div>
                <label htmlFor="clinical.counselingLanguage" className={labelCls}>
                  Counseling Language <span aria-hidden="true">*</span>
                </label>
                <select
                  id="clinical.counselingLanguage"
                  className={inputCls}
                  aria-required="true"
                  {...register("clinical.counselingLanguage")}
                >
                  {COUNSELING_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className={labelCls} id="languageLevel-label">
                  Document Language Level <span aria-hidden="true">*</span>
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="languageLevel-label"
                  className="grid grid-cols-3 gap-3 mt-1"
                >
                  {[
                    { value: "plain_english", label: "Plain English", desc: "Simple, easy to read" },
                    { value: "standard", label: "Standard", desc: "Medical terminology" },
                    { value: "formal_legal", label: "Formal Legal", desc: "Legal document style" },
                  ].map((opt) => {
                    const currentLevel = watch("languageLevel");
                    const checked = currentLevel === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all ${
                          checked
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={opt.value}
                          {...register("languageLevel")}
                        />
                        <p className={`text-xs font-semibold ${checked ? "text-white" : "text-neutral-800"}`}>
                          {opt.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${checked ? "text-neutral-300" : "text-neutral-500"}`}>
                          {opt.desc}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 5: Risks & Clauses */}
        {step === 5 && (
          <fieldset>
            <legend className="sr-only">Risks, alternatives, and optional clauses</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="clinical.specificRisks" className={labelCls}>
                  Specific Risks <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="clinical.specificRisks"
                  rows={4}
                  className={inputCls}
                  aria-required="true"
                  aria-invalid={!!getError("clinical.specificRisks")}
                  aria-describedby={getError("clinical.specificRisks") ? "err-specificRisks" : undefined}
                  placeholder="List the specific risks of this procedure for this patient..."
                  {...register("clinical.specificRisks")}
                />
                <FieldError id="err-specificRisks" message={getError("clinical.specificRisks")} />
              </div>
              <div>
                <label htmlFor="clinical.alternatives" className={labelCls}>
                  Alternatives <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="clinical.alternatives"
                  rows={3}
                  className={inputCls}
                  placeholder="Describe available treatment alternatives..."
                  {...register("clinical.alternatives")}
                />
              </div>
              <div>
                <label htmlFor="clinical.additionalNotes" className={labelCls}>
                  Additional Notes <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="clinical.additionalNotes"
                  rows={3}
                  className={inputCls}
                  placeholder="Any additional clinical notes..."
                  {...register("clinical.additionalNotes")}
                />
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-neutral-700 mb-3">Optional Consent Clauses</p>
                <div className="space-y-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  {[
                    { key: "clauses.anaesthesia" as const, field: "anaesthesia", label: "Anaesthesia Clause", desc: "Patient consents to anaesthesia as required" },
                    { key: "clauses.bloodTransfusion" as const, field: "bloodTransfusion", label: "Blood Transfusion Clause", desc: "Patient consents to blood transfusion if necessary" },
                    { key: "clauses.tissueDisposal" as const, field: "tissueDisposal", label: "Tissue Disposal Clause", desc: "Patient consents to disposal of removed tissue" },
                    { key: "clauses.photographyAcademicUse" as const, field: "photographyAcademicUse", label: "Photography for Academic Use", desc: "Patient consents to photographs for academic purposes" },
                  ].map((item) => (
                    <Toggle
                      key={item.field}
                      id={item.key}
                      checked={clauses?.[item.field as keyof typeof clauses] ?? false}
                      onChange={(v) => setValue(item.key, v)}
                      label={item.label}
                      description={item.desc}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-neutral-700 mb-3">Document Blocks</p>
                <div className="space-y-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <Toggle
                    id="includeWitnessBlock"
                    checked={includeWitnessBlock}
                    onChange={(v) => setValue("includeWitnessBlock", v)}
                    label="Include Witness Signature Block"
                    description="Adds a witness signature section to the document"
                  />
                  <Toggle
                    id="includeGuardianBlock"
                    checked={includeGuardianBlock}
                    onChange={(v) => setValue("includeGuardianBlock", v)}
                    label="Include Guardian Signature Block"
                    description="Adds a guardian/parent signature section"
                  />
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 6: Preview */}
        {step === 6 && (
          <div>
            <ConsentPreview data={getValues()} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-8 py-4 border-t border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50 mt-auto">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Back
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-neutral-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-all"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="rounded-xl bg-neutral-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
