"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleNotch,
  CaretDown,
  CaretUp,
  User,
  BookOpen,
  ClipboardText,
  Check,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { ResearchConsentFormSchema } from "@/lib/schema";
import { GenerationStatus } from "@/lib/types";

interface ResearchConsentFormProps {
  form: UseFormReturn<ResearchConsentFormSchema>;
  onSubmit: (data: ResearchConsentFormSchema) => void;
  status: GenerationStatus;
}

const LANGUAGES = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu",
  "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia", "Urdu",
] as const;

const RESEARCH_TEMPLATES = [
  {
    id: "aetcom_study",
    title: "AETCOM Module 1.2 Role Play Study",
    studyTitle: "Perception on Role Play as a Teaching-Learning Method for AETCOM Module [1.2] among First-Year Medical Students — A Descriptive Cross-Sectional Study",
    principalInvestigator: "Dr. Mohammed Aslam",
    department: "Department of Physiology",
    institutionName: "S R Patil Medical College Hospital and Research Center",
    institutionAddress: "Badagandi, Bagalkote, Karnataka, India",
    contactMobile: "8310363634",
    studyPurpose: "To assess the perception, usefulness, and effectiveness of role play as a teaching-learning method for the AETCOM Module 1.2 (attitude, ethics, and communication skills) among first-year medical students.",
    dataToCollect: "Completion of a questionnaire detailing student experience, involvement, and learning during the role play session.",
    timeRequired: "10-15 minutes",
    risks: "There are no physical, mental, or emotional risks involved in this study. It is simply a reflection of your learning experience.",
    benefits: "No direct benefit to the participant. However, your feedback may help improve the way AETCOM modules are taught to future medical students.",
    monetaryBenefits: "No monetary benefits or compensation are provided for participating in this research study.",
  },
  {
    id: "ssi_surveillance",
    title: "Surgical Site Infection (SSI) Surveillance",
    studyTitle: "Surgical Site Infection (SSI) Surveillance and Outcomes Monitoring Study",
    principalInvestigator: "Dr. S. R. Patil",
    department: "Department of Surgery",
    institutionName: "S R Patil Medical College, Hospital & Research Centre",
    institutionAddress: "Badagandi, Bagalkote, Karnataka, India",
    contactMobile: "8310363634",
    studyPurpose: "To conduct research on Surgical Site Infection (SSI) Surveillance to monitor infection rates, improve surgical care, and prevent future infections.",
    dataToCollect: "Collection of medical information from patient surgical records, clinical data, and follow-up records for surveillance purposes only.",
    timeRequired: "Retrospective record review (no direct participant time required)",
    risks: "There are no physical or medical risks. All data will be anonymized to protect participant identity and confidentiality.",
    benefits: "No direct benefit to the participant. However, data helps monitor and reduce surgical site infection rates and improve surgical care outcomes.",
    monetaryBenefits: "No monetary benefits or compensation are provided for participation.",
  }
];

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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: isOpen ? "#0b0f1a" : "#f5f5f5" }}>
          <Icon className="w-4 h-4" style={{ color: isOpen ? "#fff" : "#9ca3af" }} />
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

function CheckboxCard({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-neutral-50"
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
        className="sr-only"
      />
      <div>
        <p className="text-sm font-semibold text-neutral-800">{label}</p>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
    </label>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      {children}
    </div>
  );
}

export default function ResearchConsentForm({ form, onSubmit, status }: ResearchConsentFormProps) {
  const [section1Open, setSection1Open] = useState(true);
  const [section2Open, setSection2Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);

  const participantCompetent = form.watch("participant.isCompetent");
  const includeWitness = form.watch("includeWitnessBlock");
  const includeResearcher = form.watch("includeResearcherDeclaration");

  const applyTemplate = (templateId: string) => {
    const template = RESEARCH_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      form.setValue("study.studyTitle", template.studyTitle, { shouldValidate: true });
      form.setValue("study.principalInvestigator", template.principalInvestigator, { shouldValidate: true });
      form.setValue("study.department", template.department, { shouldValidate: true });
      form.setValue("study.institutionName", template.institutionName, { shouldValidate: true });
      form.setValue("study.institutionAddress", template.institutionAddress, { shouldValidate: true });
      form.setValue("study.contactMobile", template.contactMobile, { shouldValidate: true });
      form.setValue("study.studyPurpose", template.studyPurpose, { shouldValidate: true });
      form.setValue("study.dataToCollect", template.dataToCollect, { shouldValidate: true });
      form.setValue("study.timeRequired", template.timeRequired, { shouldValidate: true });
      form.setValue("study.risks", template.risks, { shouldValidate: true });
      form.setValue("study.benefits", template.benefits, { shouldValidate: true });
      form.setValue("study.monetaryBenefits", template.monetaryBenefits, { shouldValidate: true });
    }
  };

  const isLoading = status === "loading" || status === "streaming";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

      {/* ── Section 1: Study Information ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section1Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={BookOpen}
            title="Study Information"
            subtitle="Research study details and investigator information"
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
              <div className="px-6 pb-6 pt-5 space-y-5">
                {/* Study Title */}
                <div>
                  <label htmlFor="study.studyTitle" className={LABEL_CLASSES}>Study Title <span className="text-red-400">*</span></label>
                  <input id="study.studyTitle" type="text" {...form.register("study.studyTitle")} className={INPUT_CLASSES} placeholder="e.g. Perception on Role Play as a Teaching-Learning Method..." />
                  {form.formState.errors.study?.studyTitle && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.study.studyTitle.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="study.principalInvestigator" className={LABEL_CLASSES}>Principal Investigator <span className="text-red-400">*</span></label>
                    <input id="study.principalInvestigator" type="text" {...form.register("study.principalInvestigator")} className={INPUT_CLASSES} placeholder="Dr. Mohammed Aslam" />
                    {form.formState.errors.study?.principalInvestigator && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.study.principalInvestigator.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="study.department" className={LABEL_CLASSES}>Department <span className="text-red-400">*</span></label>
                    <input id="study.department" type="text" {...form.register("study.department")} className={INPUT_CLASSES} placeholder="Department of Physiology" />
                    {form.formState.errors.study?.department && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.study.department.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="study.institutionName" className={LABEL_CLASSES}>Institution / Hospital <span className="text-red-400">*</span></label>
                    <input id="study.institutionName" type="text" {...form.register("study.institutionName")} className={INPUT_CLASSES} placeholder="S R Patil Medical College" />
                    {form.formState.errors.study?.institutionName && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.study.institutionName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="study.contactMobile" className={LABEL_CLASSES}>Contact Phone / Mobile <span className="text-red-400">*</span></label>
                    <input id="study.contactMobile" type="text" {...form.register("study.contactMobile")} className={INPUT_CLASSES} placeholder="e.g. 8310363634" />
                    {form.formState.errors.study?.contactMobile && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.study.contactMobile.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="study.institutionAddress" className={LABEL_CLASSES}>Institution Address <span className="text-red-400">*</span></label>
                  <input id="study.institutionAddress" type="text" {...form.register("study.institutionAddress")} className={INPUT_CLASSES} placeholder="Badagandi, Bagalkote" />
                  {form.formState.errors.study?.institutionAddress && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.study.institutionAddress.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="study.studyPurpose" className={LABEL_CLASSES}>Study Purpose & Background <span className="text-red-400">*</span></label>
                  <textarea id="study.studyPurpose" rows={3} {...form.register("study.studyPurpose")} className={INPUT_CLASSES} placeholder="Explain the background and objective of the study..." />
                  {form.formState.errors.study?.studyPurpose && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.study.studyPurpose.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="study.dataToCollect" className={LABEL_CLASSES}>Data to be Collected / Participant Task <span className="text-red-400">*</span></label>
                  <textarea id="study.dataToCollect" rows={3} {...form.register("study.dataToCollect")} className={INPUT_CLASSES} placeholder="What exactly will the participant do or what records will be accessed?" />
                  {form.formState.errors.study?.dataToCollect && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.study.dataToCollect.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="study.timeRequired" className={LABEL_CLASSES}>Time Required</label>
                    <input id="study.timeRequired" type="text" {...form.register("study.timeRequired")} className={INPUT_CLASSES} placeholder="e.g. 10-15 minutes" />
                  </div>
                  <div>
                    <label htmlFor="study.counselingLanguage" className={LABEL_CLASSES}>Second Language <span className="text-red-400">*</span></label>
                    <select id="study.counselingLanguage" {...form.register("study.counselingLanguage")} className={INPUT_CLASSES}>
                      <option value="">Select...</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="study.risks" className={LABEL_CLASSES}>Disclosed Risks</label>
                  <textarea id="study.risks" rows={2} {...form.register("study.risks")} className={INPUT_CLASSES} placeholder="e.g. No physical risks. All data anonymized..." />
                </div>

                <div>
                  <label htmlFor="study.benefits" className={LABEL_CLASSES}>Disclosed Benefits</label>
                  <textarea id="study.benefits" rows={2} {...form.register("study.benefits")} className={INPUT_CLASSES} placeholder="e.g. No direct benefit. Findings contribute to..." />
                </div>

                <div>
                  <label htmlFor="study.monetaryBenefits" className={LABEL_CLASSES}>Monetary Benefits / Compensation</label>
                  <input id="study.monetaryBenefits" type="text" {...form.register("study.monetaryBenefits")} className={INPUT_CLASSES} placeholder="e.g. No monetary compensation provided" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Section 2: Participant Information ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section2Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={User}
            title="Participant Information"
            subtitle="Participant demographics and identity"
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
              <div className="px-6 pb-6 pt-5 space-y-5">
                <div>
                  <label htmlFor="participant.participantName" className={LABEL_CLASSES}>Participant Name <span className="text-red-400">*</span></label>
                  <input id="participant.participantName" type="text" {...form.register("participant.participantName")} className={INPUT_CLASSES} />
                  {form.formState.errors.participant?.participantName && (
                    <p className={ERROR_CLASSES}>{form.formState.errors.participant.participantName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="participant.participantId" className={LABEL_CLASSES}>Roll No / Subject ID <span className="text-red-400">*</span></label>
                    <input id="participant.participantId" type="text" {...form.register("participant.participantId")} className={INPUT_CLASSES} placeholder="e.g. Roll No 12" />
                    {form.formState.errors.participant?.participantId && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.participant.participantId.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="participant.age" className={LABEL_CLASSES}>Age <span className="text-red-400">*</span></label>
                    <input id="participant.age" type="number" {...form.register("participant.age")} className={INPUT_CLASSES} />
                    {form.formState.errors.participant?.age && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.participant.age.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="participant.sex" className={LABEL_CLASSES}>Sex <span className="text-red-400">*</span></label>
                    <select id="participant.sex" {...form.register("participant.sex")} className={INPUT_CLASSES}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.participant?.sex && (
                      <p className={ERROR_CLASSES}>{form.formState.errors.participant.sex.message}</p>
                    )}
                  </div>
                </div>

                {/* Competency Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#f9f9f9", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Participant is competent to consent</p>
                    <p className="text-xs text-neutral-400 mt-0.5">If unchecked, a guardian consent block will be generated</p>
                  </div>
                  <ToggleSwitch
                    checked={participantCompetent ?? true}
                    onChange={(checked) => form.setValue("participant.isCompetent", checked, { shouldValidate: true })}
                  />
                </div>

                {/* Guardian Fields */}
                <AnimatePresence>
                  {!participantCompetent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-4 pl-4 border-l-2 mt-2" style={{ borderColor: "#0b0f1a" }}>
                        <div>
                          <label htmlFor="participant.guardianName" className={LABEL_CLASSES}>Guardian Name <span className="text-red-400">*</span></label>
                          <input id="participant.guardianName" type="text" {...form.register("participant.guardianName")} className={INPUT_CLASSES} />
                        </div>
                        <div>
                          <label htmlFor="participant.guardianRelationship" className={LABEL_CLASSES}>Relationship to Participant <span className="text-red-400">*</span></label>
                          <input id="participant.guardianRelationship" type="text" {...form.register("participant.guardianRelationship")} className={INPUT_CLASSES} />
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

      {/* ── Section 3: Consent Configuration ── */}
      <SectionCard>
        <div className="px-6 py-5" style={{ borderBottom: section3Open ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
          <SectionHeader
            icon={ClipboardText}
            title="Consent Configuration"
            subtitle="Signature blocks and declaration options"
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
                <CheckboxCard
                  label="Include Witness Signature Block"
                  subtitle="Generates a space for a witness to sign confirming the informed consent process"
                  checked={includeWitness ?? false}
                  onChange={(checked) => form.setValue("includeWitnessBlock", checked, { shouldValidate: true })}
                />
                <CheckboxCard
                  label="Include Researcher's Declaration"
                  subtitle="Generates a declaration signed by the researcher confirming the study was fully explained"
                  checked={includeResearcher ?? false}
                  onChange={(checked) => form.setValue("includeResearcherDeclaration", checked, { shouldValidate: true })}
                />
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
            Generate Research Consent Form
          </>
        )}
      </button>
    </form>
  );
}
