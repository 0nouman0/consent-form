"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope,
  ClipboardList,
  Check,
} from "lucide-react";
import { ConsentFormSchema } from "@/lib/schema";
import { GenerationStatus } from "@/lib/types";

interface ConsentFormProps {
  form: UseFormReturn<ConsentFormSchema>;
  onSubmit: (data: ConsentFormSchema) => void;
  status: GenerationStatus;
}

const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Malayalam",
  "Punjabi",
  "Odia",
  "Urdu",
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
  "w-full px-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium";
const LABEL_CLASSES = "text-sm font-bold text-nq-text mb-1.5 block tracking-tight";
const ERROR_CLASSES = "text-xs font-semibold text-red-600 mt-1.5";

function SectionHeader({
  icon: Icon,
  title,
  isOpen,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-nq-purple focus:ring-inset rounded-xl p-1 -m-1 transition-all"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-nq-purple-soft flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-nq-purple" />
        </div>
        <span className="font-bold text-nq-text tracking-tight">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-nq-text-light" />
      ) : (
        <ChevronDown className="w-5 h-5 text-nq-text-light" />
      )}
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
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-nq-purple ${
          checked ? "bg-nq-purple" : "bg-nq-border"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}

function LockedClauseCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-nq-border opacity-60 cursor-not-allowed">
      <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-nq-text-light bg-slate-100 flex items-center justify-center mt-0.5">
        <Check className="w-3.5 h-3.5 text-nq-text-muted" />
      </div>
      <div>
        <p className="text-sm font-bold text-nq-text">{title}</p>
        <p className="text-xs font-medium text-nq-text-muted mt-0.5">{subtitle}</p>
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
    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
      checked
        ? "border-nq-purple/30 bg-nq-purple-soft"
        : "border-nq-border bg-white hover:bg-slate-50"
    } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors ${
          checked ? "border-nq-purple bg-nq-purple" : "border-nq-text-light bg-white"
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div>
        <p className={`text-sm font-bold ${checked ? "text-nq-text" : "text-nq-text"}`}>{label}</p>
        {subtitle && <p className="text-xs font-medium text-nq-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </label>
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Patient Information */}
      <motion.div
        initial={false}
        className="nq-card p-6"
      >
        <div className="mb-4">
          <SectionHeader
            icon={User}
            title="Patient Information"
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
              <div className="space-y-5 pt-3">
                {/* Patient Full Name */}
                <div>
                  <label htmlFor="patient.patientName" className={LABEL_CLASSES}>
                    Patient Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="patient.patientName"
                    type="text"
                    {...form.register("patient.patientName")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.patient?.patientName && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.patient.patientName.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Age */}
                  <div>
                    <label htmlFor="patient.age" className={LABEL_CLASSES}>
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="patient.age"
                      type="number"
                      {...form.register("patient.age")}
                      className={INPUT_CLASSES}
                    />
                    {form.formState.errors.patient?.age && (
                      <p className={ERROR_CLASSES}>
                        {form.formState.errors.patient.age.message as string}
                      </p>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label htmlFor="patient.sex" className={LABEL_CLASSES}>
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="patient.sex"
                      {...form.register("patient.sex")}
                      className={INPUT_CLASSES}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.patient?.sex && (
                      <p className={ERROR_CLASSES}>
                        {form.formState.errors.patient.sex.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hospital OPD/IPD Number */}
                <div>
                  <label htmlFor="patient.hospitalOpdIpdNo" className={LABEL_CLASSES}>
                    Hospital OPD/IPD Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="patient.hospitalOpdIpdNo"
                    type="text"
                    {...form.register("patient.hospitalOpdIpdNo")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.patient?.hospitalOpdIpdNo && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.patient.hospitalOpdIpdNo.message as string}
                    </p>
                  )}
                </div>

                {/* Counseling Language */}
                <div>
                  <label htmlFor="clinical.counselingLanguage" className={LABEL_CLASSES}>
                    Counseling Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="clinical.counselingLanguage"
                    {...form.register("clinical.counselingLanguage")}
                    className={INPUT_CLASSES}
                  >
                    <option value="">Select...</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.clinical?.counselingLanguage && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.counselingLanguage.message as string}
                    </p>
                  )}
                </div>

                {/* Aadhaar Last 4 Digits */}
                <div>
                  <label htmlFor="patient.aadhaarLast4" className={LABEL_CLASSES}>
                    Aadhaar Last 4 Digits
                  </label>
                  <input
                    id="patient.aadhaarLast4"
                    type="text"
                    maxLength={4}
                    {...form.register("patient.aadhaarLast4")}
                    className={INPUT_CLASSES}
                  />
                  <p className="text-xs font-semibold text-amber-600 mt-1.5">
                    ⚠ Only last 4 digits — full Aadhaar storage is prohibited for private
                    entities (Aadhaar Act 2016)
                  </p>
                  {form.formState.errors.patient?.aadhaarLast4 && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.patient.aadhaarLast4.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Insurance Provider */}
                  <div>
                    <label htmlFor="patient.insuranceProvider" className={LABEL_CLASSES}>
                      Insurance Provider
                    </label>
                    <input
                      id="patient.insuranceProvider"
                      type="text"
                      {...form.register("patient.insuranceProvider")}
                      className={INPUT_CLASSES}
                    />
                  </div>

                  {/* Insurance Policy Number */}
                  <div>
                    <label htmlFor="patient.insurancePolicyNo" className={LABEL_CLASSES}>
                      Insurance Policy Number
                    </label>
                    <input
                      id="patient.insurancePolicyNo"
                      type="text"
                      {...form.register("patient.insurancePolicyNo")}
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>

                {/* Patient Competency Toggle */}
                <div className="flex items-center justify-between py-4 px-5 bg-slate-50/70 rounded-xl border border-nq-border mt-2">
                  <div>
                    <p className="text-sm font-bold text-nq-text">
                      Patient is competent (adult, sound mind, not intoxicated)
                    </p>
                    <p className="text-xs font-medium text-nq-text-muted mt-0.5">
                      IPC §87-90 — minor or intoxicated consent is invalid
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={patientCompetent ?? true}
                    onChange={(checked) =>
                      form.setValue("patient.patientCompetent", checked, { shouldValidate: true })
                    }
                  />
                </div>

                {/* Guardian Fields - animated reveal */}
                <AnimatePresence>
                  {!patientCompetent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-5 pl-5 border-l-2 border-nq-purple/30 mt-4">
                        {/* Guardian Full Name */}
                        <div>
                          <label htmlFor="patient.guardianName" className={LABEL_CLASSES}>
                            Guardian Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="patient.guardianName"
                            type="text"
                            {...form.register("patient.guardianName")}
                            className={INPUT_CLASSES}
                          />
                          {form.formState.errors.patient?.guardianName && (
                            <p className={ERROR_CLASSES}>
                              {form.formState.errors.patient.guardianName.message as string}
                            </p>
                          )}
                        </div>

                        {/* Guardian Relationship */}
                        <div>
                          <label htmlFor="patient.guardianRelationship" className={LABEL_CLASSES}>
                            Guardian Relationship to Patient <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="patient.guardianRelationship"
                            type="text"
                            {...form.register("patient.guardianRelationship")}
                            className={INPUT_CLASSES}
                          />
                          {form.formState.errors.patient?.guardianRelationship && (
                            <p className={ERROR_CLASSES}>
                              {form.formState.errors.patient.guardianRelationship.message as string}
                            </p>
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
      </motion.div>

      {/* Section 2: Clinical Details */}
      <motion.div
        initial={false}
        className="nq-card p-6"
      >
        <div className="mb-4">
          <SectionHeader
            icon={Stethoscope}
            title="Clinical Details"
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
              <div className="space-y-5 pt-3">
                {/* Doctor / Surgeon Full Name */}
                <div>
                  <label htmlFor="clinical.doctorName" className={LABEL_CLASSES}>
                    Doctor / Surgeon Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinical.doctorName"
                    type="text"
                    {...form.register("clinical.doctorName")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.doctorName && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.doctorName.message as string}
                    </p>
                  )}
                </div>

                {/* Medical Council Registration Number */}
                <div>
                  <label htmlFor="clinical.doctorRegistrationNo" className={LABEL_CLASSES}>
                    Medical Council Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinical.doctorRegistrationNo"
                    type="text"
                    {...form.register("clinical.doctorRegistrationNo")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.doctorRegistrationNo && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.doctorRegistrationNo.message as string}
                    </p>
                  )}
                </div>

                {/* Hospital / Clinic Name */}
                <div>
                  <label htmlFor="clinical.hospitalName" className={LABEL_CLASSES}>
                    Hospital / Clinic Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinical.hospitalName"
                    type="text"
                    {...form.register("clinical.hospitalName")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.hospitalName && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.hospitalName.message as string}
                    </p>
                  )}
                </div>

                {/* Hospital Address */}
                <div>
                  <label htmlFor="clinical.hospitalAddress" className={LABEL_CLASSES}>
                    Hospital Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="clinical.hospitalAddress"
                    rows={2}
                    {...form.register("clinical.hospitalAddress")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.hospitalAddress && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.hospitalAddress.message as string}
                    </p>
                  )}
                </div>

                {/* Procedure Name */}
                <div>
                  <label htmlFor="clinical.procedureName" className={LABEL_CLASSES}>
                    Procedure Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinical.procedureName"
                    type="text"
                    {...form.register("clinical.procedureName")}
                    className={INPUT_CLASSES}
                  />
                  <p className="text-xs font-semibold text-amber-600 mt-1.5">
                    ⚠ Be specific. Narayan Reddy: blanket consent is legally void in India.
                  </p>
                  {form.formState.errors.clinical?.procedureName && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.procedureName.message as string}
                    </p>
                  )}
                </div>

                {/* Scheduled Procedure Date */}
                <div>
                  <label htmlFor="clinical.procedureDate" className={LABEL_CLASSES}>
                    Scheduled Procedure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinical.procedureDate"
                    type="date"
                    {...form.register("clinical.procedureDate")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.procedureDate && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.procedureDate.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Consent Type */}
                  <div>
                    <label htmlFor="clinical.consentType" className={LABEL_CLASSES}>
                      Consent Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="clinical.consentType"
                      {...form.register("clinical.consentType")}
                      className={INPUT_CLASSES}
                    >
                      <option value="">Select...</option>
                      {CONSENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.clinical?.consentType && (
                      <p className={ERROR_CLASSES}>
                        {form.formState.errors.clinical.consentType.message as string}
                      </p>
                    )}
                  </div>

                  {/* Document Language Level */}
                  <div>
                    <label htmlFor="languageLevel" className={LABEL_CLASSES}>
                      Document Language Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="languageLevel"
                      {...form.register("languageLevel")}
                      className={INPUT_CLASSES}
                    >
                      <option value="">Select...</option>
                      {LANGUAGE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.languageLevel && (
                      <p className={ERROR_CLASSES}>
                        {form.formState.errors.languageLevel.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* eDAR Victim ID and NHA TMS Patient ID - conditional */}
                <AnimatePresence>
                  {consentType === "road_accident_emergency" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
                        <p className="text-sm text-blue-700 font-bold">
                          MoRTH Cashless Treatment Scheme 2025 — enter IDs from the eDAR and TMS
                          systems
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {/* eDAR Victim ID */}
                          <div>
                            <label htmlFor="clinical.edarVictimId" className={LABEL_CLASSES}>
                              eDAR Victim ID
                            </label>
                            <input
                              id="clinical.edarVictimId"
                              type="text"
                              {...form.register("clinical.edarVictimId")}
                              className={INPUT_CLASSES}
                            />
                          </div>

                          {/* NHA TMS Patient ID */}
                          <div>
                            <label htmlFor="clinical.tmsPatientId" className={LABEL_CLASSES}>
                              NHA TMS Patient ID
                            </label>
                            <input
                              id="clinical.tmsPatientId"
                              type="text"
                              {...form.register("clinical.tmsPatientId")}
                              className={INPUT_CLASSES}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Specific Risks */}
                <div>
                  <label htmlFor="clinical.specificRisks" className={LABEL_CLASSES}>
                    Specific Risks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="clinical.specificRisks"
                    rows={3}
                    placeholder="e.g. Bleeding, infection, nerve damage, anaesthetic reaction, wound dehiscence..."
                    {...form.register("clinical.specificRisks")}
                    className={INPUT_CLASSES}
                  />
                  {form.formState.errors.clinical?.specificRisks && (
                    <p className={ERROR_CLASSES}>
                      {form.formState.errors.clinical.specificRisks.message as string}
                    </p>
                  )}
                </div>

                {/* Treatment Alternatives */}
                <div>
                  <label htmlFor="clinical.alternatives" className={LABEL_CLASSES}>
                    Treatment Alternatives
                  </label>
                  <textarea
                    id="clinical.alternatives"
                    rows={2}
                    {...form.register("clinical.alternatives")}
                    className={INPUT_CLASSES}
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="clinical.additionalNotes" className={LABEL_CLASSES}>
                    Additional Notes
                  </label>
                  <textarea
                    id="clinical.additionalNotes"
                    rows={2}
                    {...form.register("clinical.additionalNotes")}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Section 3: Clause Selections */}
      <motion.div
        initial={false}
        className="nq-card p-6"
      >
        <div className="mb-4">
          <SectionHeader
            icon={ClipboardList}
            title="Clause Selections"
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
              <div className="space-y-3 pt-3">
                {/* Locked Clauses */}
                <LockedClauseCard
                  title="Voluntariness & Right to Withdraw"
                  subtitle="Narayan Reddy Rule 7 — mandatory"
                />
                <LockedClauseCard
                  title="Capacity Validation"
                  subtitle="IPC §87-90 — mandatory"
                />
                <LockedClauseCard
                  title="Information Receipt"
                  subtitle="Narayan Reddy Informed Consent doctrine"
                />

                {/* Toggleable Clauses */}
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

                {/* Separator */}
                <div className="border-t border-nq-border my-5" />

                {/* Include Witness Signature Block */}
                <ClauseCard
                  label="Include Witness Signature Block"
                  subtitle="Narayan Reddy Rule 3 — recommended"
                  checked={form.watch("includeWitnessBlock") ?? false}
                  onChange={(checked) =>
                    form.setValue("includeWitnessBlock", checked, { shouldValidate: true })
                  }
                />

                {/* Include Guardian Consent Block */}
                <ClauseCard
                  label="Include Guardian Consent Block"
                  checked={
                    patientCompetent
                      ? (form.getValues("includeGuardianBlock") ?? false)
                      : true
                  }
                  onChange={(checked) =>
                    form.setValue("includeGuardianBlock", checked, { shouldValidate: true })
                  }
                  disabled={!patientCompetent}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="nq-btn-primary w-full justify-center py-4 text-base disabled:opacity-70 mt-4"
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? "Generating Form..." : "Generate Consent Form"}
      </button>
    </form>
  );
}