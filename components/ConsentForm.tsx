"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleNotch,
  CaretDown,
  CaretUp,
  User,
  Stethoscope,
  ClipboardText,
  Check,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { ConsentFormSchema } from "@/lib/schema";
import { GenerationStatus } from "@/lib/types";
import { PREBUILT_TEMPLATES } from "@/lib/templates";
import diagnosesData from "@/lib/diagnoses.json";

const typedDiagnoses = diagnosesData as Record<string, string[]>;

interface ConsentFormProps {
  form: UseFormReturn<ConsentFormSchema>;
  onSubmit: (data: ConsentFormSchema) => void;
  status: GenerationStatus;
}

const LANGUAGES = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu",
  "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia", "Urdu",
] as const;

const CONSENT_TYPES = [
  { label: "Surgical Procedure", value: "surgical" },
  { label: "Anaesthesia Consent", value: "anaesthesia" },
  { label: "Diagnostic Procedure", value: "diagnostic" },
  { label: "Blood Transfusion", value: "blood_transfusion" },
  { label: "Research / Clinical Trial", value: "research" },
  { label: "Telemedicine", value: "telemedicine" },
  { label: "Minor Procedure", value: "minor_procedure" },
  { label: "Obstetric", value: "obstetric" },
  { label: "Psychiatric", value: "psychiatric" },
  { label: "Road Accident Emergency (MoRTH 2025)", value: "road_accident_emergency" },
] as const;

const LANGUAGE_LEVELS = [
  { label: "Plain English (Grade 8)", value: "plain_english" },
  { label: "Standard Medical", value: "standard" },
  { label: "Formal / Legal", value: "formal_legal" },
] as const;

const INPUT_CLASSES =
  "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 bg-white"
  + " border border-neutral-200";

const LABEL_CLASSES = "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block";
const ERROR_CLASSES = "text-xs font-medium text-red-500 mt-1.5";

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  isOpen,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between text-left focus:outline-none group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: isOpen ? "#0b0f1a" : "#f5f5f5" }}>
          <Icon
            className="w-4 h-4"
            style={{ color: isOpen ? "#fff" : "#9ca3af" }}
          />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "#0b0f1a" }}>{title}</span>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors">
        {isOpen
          ? <CaretUp className="w-3.5 h-3.5 text-neutral-500" />
          : <CaretDown className="w-3.5 h-3.5 text-neutral-500" />}
      </div>
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className="w-11 h-6 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "#0b0f1a" : "#e5e7eb" }}
      >
        <div
          className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </label>
  );
}

function LockedClauseCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 opacity-60" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 bg-neutral-200">
        <Check className="w-3 h-3 text-neutral-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-700">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ClauseCard({
  label,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-50"}`}
      style={{
        border: checked ? "1px solid rgba(11,15,26,0.25)" : "1px solid rgba(0,0,0,0.08)",
        backgroundColor: checked ? "rgba(11,15,26,0.03)" : "#fff",
      }}
    >
      <div
        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors"
        style={{
          border: checked ? "2px solid #0b0f1a" : "2px solid #d1d5db",
          backgroundColor: checked ? "#0b0f1a" : "#fff",
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div>
        <p className="text-sm font-semibold text-neutral-800">{label}</p>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
    </label>
  );
}

// Shared section card wrapper
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      {children}
    </div>
  );
}

export default function ConsentForm({ form, onSubmit, status }: ConsentFormProps) {
  const [section1Open, setSection1Open] = useState(true);
  const [section2Open, setSection2Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);

  const patientCompetent = form.watch("patient.patientCompetent");
  const consentType = form.watch("clinical.consentType");

  useEffect(() => {
    if (!patientCompetent) {
      form.setValue("includeGuardianBlock", true);
    }
  }, [patientCompetent, form]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("consentgen_doctor_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.doctorName && !form.getValues("clinical.doctorName")) {
          form.setValue("clinical.doctorName", parsed.doctorName, { shouldValidate: true });
        }
        if (parsed.doctorRegistrationNo && !form.getValues("clinical.doctorRegistrationNo")) {
          form.setValue("clinical.doctorRegistrationNo", parsed.doctorRegistrationNo, { shouldValidate: true });
        }
        if (parsed.hospitalName && !form.getValues("clinical.hospitalName")) {
          form.setValue("clinical.hospitalName", parsed.hospitalName, { shouldValidate: true });
        }
        if (parsed.hospitalAddress && !form.getValues("clinical.hospitalAddress")) {
          form.setValue("clinical.hospitalAddress", parsed.hospitalAddress, { shouldValidate: true });
        }
      } catch (e) {
        console.error("Failed to parse profile data", e);
      }
    }
  }, [form]);

  const handleClauseChange = (field: string, value: boolean) => {
    form.setValue(`clauses.${field}` as `clauses.${keyof ConsentFormSchema["clauses"]}`, value, { shouldValidate: true });
  };

  const isLoading = status === "loading" || status === "streaming";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

      {/* ── Section 1: Patient Information ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section1Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={User}
            title="Patient Information"
            subtitle="Demographics and identity details"
            isOpen={section1Open}
            onClick={() => setSection1Open(!section1Open)}
          />
        </div>

        <AnimatePresence initial={false}>
          {section1Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-6 pb-6 space-y-5 pt-5">
                {/* Patient Name */}
                <div>
                  <label htmlFor="patient.patientName" className={LABEL_CLASSES}>
                    Patient Full Name <span className="text-red-400">*</span>
                  </label>
                  <input id="patient.patientName" type="text" {...form.register("patient.patientName")} className={INPUT_CLASSES} placeholder="e.g. Ramesh Kumar" />
                  {form.formState.errors.patient?.patientName && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.patient.patientName.message as string}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div>
                    <label htmlFor="patient.age" className={LABEL_CLASSES}>Age <span className="text-red-400">*</span></label>
                    <input id="patient.age" type="number" {...form.register("patient.age")} className={INPUT_CLASSES} placeholder="e.g. 45" />
                    {form.formState.errors.patient?.age && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.patient.age.message as string}</p>
                    )}
                  </div>
                  {/* Sex */}
                  <div>
                    <label htmlFor="patient.sex" className={LABEL_CLASSES}>Sex <span className="text-red-400">*</span></label>
                    <select id="patient.sex" {...form.register("patient.sex")} className={INPUT_CLASSES}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.patient?.sex && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.patient.sex.message as string}</p>
                    )}
                  </div>
                </div>

                {/* OPD/IPD No */}
                <div>
                  <label htmlFor="patient.hospitalOpdIpdNo" className={LABEL_CLASSES}>
                    Hospital OPD/IPD Number <span className="text-red-400">*</span>
                  </label>
                  <input id="patient.hospitalOpdIpdNo" type="text" {...form.register("patient.hospitalOpdIpdNo")} className={INPUT_CLASSES} placeholder="e.g. OPD-2025-001" />
                  {form.formState.errors.patient?.hospitalOpdIpdNo && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.patient.hospitalOpdIpdNo.message as string}</p>
                  )}
                </div>

                {/* Second Language */}
                <div>
                  <label htmlFor="clinical.counselingLanguage" className={LABEL_CLASSES}>
                    Second Language <span className="text-red-400">*</span>
                  </label>
                  <select id="clinical.counselingLanguage" {...form.register("clinical.counselingLanguage")} className={INPUT_CLASSES}>
                    <option value="">Select...</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-400 mt-1.5">English is always included. Select an Indian language for a bilingual form.</p>
                </div>

                {/* Aadhaar */}
                <div>
                  <label htmlFor="patient.aadhaarLast4" className={LABEL_CLASSES}>Aadhaar Last 4 Digits</label>
                  <input id="patient.aadhaarLast4" type="text" maxLength={4} {...form.register("patient.aadhaarLast4")} className={INPUT_CLASSES} placeholder="e.g. 1234" />
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ Only last 4 digits — full Aadhaar storage prohibited (Aadhaar Act 2016)</p>
                </div>

                {/* Insurance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="patient.insuranceProvider" className={LABEL_CLASSES}>Insurance Provider</label>
                    <input id="patient.insuranceProvider" type="text" {...form.register("patient.insuranceProvider")} className={INPUT_CLASSES} placeholder="e.g. Star Health" />
                  </div>
                  <div>
                    <label htmlFor="patient.insurancePolicyNo" className={LABEL_CLASSES}>Insurance Policy Number</label>
                    <input id="patient.insurancePolicyNo" type="text" {...form.register("patient.insurancePolicyNo")} className={INPUT_CLASSES} placeholder="e.g. POL-001234" />
                  </div>
                </div>

                {/* Patient Competency Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#f9f9f9", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Patient is competent to consent</p>
                    <p className="text-xs text-neutral-400 mt-0.5">BNS §24-27 — minor or intoxicated consent is invalid</p>
                  </div>
                  <ToggleSwitch
                    checked={patientCompetent ?? true}
                    onChange={(checked) => form.setValue("patient.patientCompetent", checked, { shouldValidate: true })}
                  />
                </div>

                {/* Guardian Fields */}
                <AnimatePresence>
                  {!patientCompetent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-4 pl-4 border-l-2 mt-2" style={{ borderColor: "#0b0f1a" }}>
                        <div>
                          <label htmlFor="patient.guardianName" className={LABEL_CLASSES}>Guardian Full Name <span className="text-red-400">*</span></label>
                          <input id="patient.guardianName" type="text" {...form.register("patient.guardianName")} className={INPUT_CLASSES} />
                          {form.formState.errors.patient?.guardianName && (
                            <p className={ERROR_CLASSES}>{form.formState.errors.patient.guardianName.message as string}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="patient.guardianRelationship" className={LABEL_CLASSES}>Relationship to Patient <span className="text-red-400">*</span></label>
                          <input id="patient.guardianRelationship" type="text" {...form.register("patient.guardianRelationship")} className={INPUT_CLASSES} />
                          {form.formState.errors.patient?.guardianRelationship && (
                            <p className={ERROR_CLASSES}>{form.formState.errors.patient.guardianRelationship.message as string}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Section 2: Clinical Details ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section2Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={Stethoscope}
            title="Clinical Details"
            subtitle="Procedure, doctor and hospital information"
            isOpen={section2Open}
            onClick={() => setSection2Open(!section2Open)}
          />
        </div>

        <AnimatePresence initial={false}>
          {section2Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-6 pb-6 space-y-5 pt-5">
                {/* Doctor Name */}
                <div>
                  <label htmlFor="clinical.doctorName" className={LABEL_CLASSES}>Doctor / Surgeon Full Name <span className="text-red-400">*</span></label>
                  <input id="clinical.doctorName" type="text" {...form.register("clinical.doctorName")} className={INPUT_CLASSES} placeholder="Dr. John Doe" />
                  {form.formState.errors.clinical?.doctorName && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.doctorName.message as string}</p>
                  )}
                </div>

                {/* Reg No */}
                <div>
                  <label htmlFor="clinical.doctorRegistrationNo" className={LABEL_CLASSES}>Medical Council Registration No. <span className="text-red-400">*</span></label>
                  <input id="clinical.doctorRegistrationNo" type="text" {...form.register("clinical.doctorRegistrationNo")} className={INPUT_CLASSES} placeholder="e.g. KMC 12345" />
                  {form.formState.errors.clinical?.doctorRegistrationNo && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.doctorRegistrationNo.message as string}</p>
                  )}
                </div>

                {/* Hospital Name */}
                <div>
                  <label htmlFor="clinical.hospitalName" className={LABEL_CLASSES}>Hospital / Clinic Name <span className="text-red-400">*</span></label>
                  <input id="clinical.hospitalName" type="text" {...form.register("clinical.hospitalName")} className={INPUT_CLASSES} placeholder="City General Hospital" />
                  {form.formState.errors.clinical?.hospitalName && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.hospitalName.message as string}</p>
                  )}
                </div>

                {/* Hospital Address */}
                <div>
                  <label htmlFor="clinical.hospitalAddress" className={LABEL_CLASSES}>Hospital Address <span className="text-red-400">*</span></label>
                  <textarea id="clinical.hospitalAddress" rows={2} {...form.register("clinical.hospitalAddress")} className={INPUT_CLASSES} placeholder="123 Hospital Way, City" />
                  {form.formState.errors.clinical?.hospitalAddress && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.hospitalAddress.message as string}</p>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <label htmlFor="clinical.diagnosis" className={LABEL_CLASSES}>
                    Diagnosis / Underlying Condition <span className="text-neutral-400 normal-case font-normal">(Optional)</span>
                  </label>
                  <input id="clinical.diagnosis" type="text" list="diagnoses-list" placeholder="e.g. Acute appendicitis" {...form.register("clinical.diagnosis")} className={INPUT_CLASSES} />
                  <datalist id="diagnoses-list">
                    {Object.entries(typedDiagnoses).map(([dept, diags]) => (
                      <optgroup key={dept} label={dept}>
                        {diags.map((d) => <option key={d} value={d} />)}
                      </optgroup>
                    ))}
                  </datalist>
                </div>

                {/* Procedure Name */}
                <div>
                  <label htmlFor="clinical.procedureName" className={LABEL_CLASSES}>Procedure Name <span className="text-red-400">*</span></label>
                  <input id="clinical.procedureName" type="text" {...form.register("clinical.procedureName")} className={INPUT_CLASSES} placeholder="e.g. Laparoscopic Cholecystectomy" />
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ Be specific — blanket consent is legally void in India</p>
                  {form.formState.errors.clinical?.procedureName && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.procedureName.message as string}</p>
                  )}
                </div>

                {/* Procedure Date */}
                <div>
                  <label htmlFor="clinical.procedureDate" className={LABEL_CLASSES}>Scheduled Procedure Date <span className="text-red-400">*</span></label>
                  <input id="clinical.procedureDate" type="date" {...form.register("clinical.procedureDate")} className={INPUT_CLASSES} />
                  {form.formState.errors.clinical?.procedureDate && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.procedureDate.message as string}</p>
                  )}
                </div>

                {/* Consent Type + Language Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinical.consentType" className={LABEL_CLASSES}>Consent Type <span className="text-red-400">*</span></label>
                    <select id="clinical.consentType" {...form.register("clinical.consentType")} className={INPUT_CLASSES}>
                      <option value="">Select...</option>
                      {CONSENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {form.formState.errors.clinical?.consentType && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.clinical.consentType.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="languageLevel" className={LABEL_CLASSES}>Document Language Level <span className="text-red-400">*</span></label>
                    <select id="languageLevel" {...form.register("languageLevel")} className={INPUT_CLASSES}>
                      <option value="">Select...</option>
                      {LANGUAGE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                    {form.formState.errors.languageLevel && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.languageLevel.message as string}</p>
                    )}
                  </div>
                </div>

                {/* MoRTH — conditional */}
                <AnimatePresence>
                  {consentType === "road_accident_emergency" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="p-4 rounded-xl space-y-4" style={{ backgroundColor: "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <p className="text-sm font-semibold text-blue-700">MoRTH Cashless Treatment Scheme 2025 — enter IDs from eDAR and TMS</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="clinical.edarVictimId" className={LABEL_CLASSES}>eDAR Victim ID</label>
                            <input id="clinical.edarVictimId" type="text" {...form.register("clinical.edarVictimId")} className={INPUT_CLASSES} />
                          </div>
                          <div>
                            <label htmlFor="clinical.tmsPatientId" className={LABEL_CLASSES}>NHA TMS Patient ID</label>
                            <input id="clinical.tmsPatientId" type="text" {...form.register("clinical.tmsPatientId")} className={INPUT_CLASSES} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Specific Risks */}
                <div>
                  <label htmlFor="clinical.specificRisks" className={LABEL_CLASSES}>Specific Risks <span className="text-red-400">*</span></label>
                  <textarea id="clinical.specificRisks" rows={3} placeholder="e.g. Bleeding, infection, nerve damage, anaesthetic reaction, wound dehiscence..." {...form.register("clinical.specificRisks")} className={INPUT_CLASSES} />
                  {form.formState.errors.clinical?.specificRisks && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.clinical.specificRisks.message as string}</p>
                  )}
                </div>

                {/* Alternatives */}
                <div>
                  <label htmlFor="clinical.alternatives" className={LABEL_CLASSES}>Treatment Alternatives</label>
                  <textarea id="clinical.alternatives" rows={2} {...form.register("clinical.alternatives")} className={INPUT_CLASSES} placeholder="e.g. Conservative management, alternative surgery..." />
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="clinical.additionalNotes" className={LABEL_CLASSES}>Additional Notes</label>
                  <textarea id="clinical.additionalNotes" rows={2} {...form.register("clinical.additionalNotes")} className={INPUT_CLASSES} placeholder="Any special instructions or additional context..." />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Section 3: Clause Selections ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section3Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={ClipboardText}
            title="Clause Selections"
            subtitle="Mandatory clauses and optional consent blocks"
            isOpen={section3Open}
            onClick={() => setSection3Open(!section3Open)}
          />
        </div>

        <AnimatePresence initial={false}>
          {section3Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-6 pb-6 pt-5 space-y-2.5">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Mandatory Clauses</p>
                <LockedClauseCard title="Voluntariness & Right to Withdraw" subtitle="Legal requirement — mandatory" />
                <LockedClauseCard title="Capacity Validation" subtitle="BNS §24-27 (Bharatiya Nyaya Sanhita) — mandatory" />
                <LockedClauseCard title="Information Receipt" subtitle="Standard Informed Consent doctrine" />

                <div className="pt-3">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Optional Clauses</p>
                  <div className="space-y-2.5">
                    <ClauseCard
                      label="Anaesthesia & Blood Transfusion Consent"
                      checked={form.watch("clauses.anaesthesia") ?? false}
                      onChange={(checked) => handleClauseChange("anaesthesia", checked)}
                    />
                    <ClauseCard
                      label="Tissue / Specimen Disposal Consent"
                      checked={form.watch("clauses.tissueDisposal") ?? false}
                      onChange={(checked) => handleClauseChange("tissueDisposal", checked)}
                    />
                    <ClauseCard
                      label="Photography & Academic Use Consent"
                      checked={form.watch("clauses.photographyAcademicUse") ?? false}
                      onChange={(checked) => handleClauseChange("photographyAcademicUse", checked)}
                    />
                  </div>
                </div>

                <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 pt-3">Signature Blocks</p>
                  <div className="space-y-2.5">
                    <ClauseCard
                      label="Include Witness Signature Block"
                      subtitle="Legal best practice — recommended"
                      checked={form.watch("includeWitnessBlock") ?? false}
                      onChange={(checked) => form.setValue("includeWitnessBlock", checked, { shouldValidate: true })}
                    />
                    <ClauseCard
                      label="Include Guardian Consent Block"
                      checked={patientCompetent ? (form.getValues("includeGuardianBlock") ?? false) : true}
                      onChange={(checked) => form.setValue("includeGuardianBlock", checked, { shouldValidate: true })}
                      disabled={!patientCompetent}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#0b0f1a" }}
      >
        {isLoading ? (
          <>
            <CircleNotch className="w-4 h-4 animate-spin" />
            Generating Consent Form...
          </>
        ) : (
          <>
            <Sparkle className="w-4 h-4" />
            Generate Consent Form
          </>
        )}
      </button>
    </form>
  );
}