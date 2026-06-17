import { z } from "zod";

const patientSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  age: z.string().min(1, "Age is required"),
  sex: z.enum(["Male", "Female", "Other"]),
  hospitalOpdIpdNo: z.string().min(1, "OPD/IPD number is required"),
  aadhaarLast4: z
    .string()
    .length(4, "Enter exactly 4 digits")
    .regex(/^\d{4}$/, "Must be 4 digits only"),
  insuranceProvider: z.string().default(""),
  insurancePolicyNo: z.string().default(""),
  patientCompetent: z.boolean().default(true),
  guardianName: z.string().default(""),
  guardianRelationship: z.string().default(""),
});

const clinicalSchema = z.object({
  doctorName: z.string().min(2, "Doctor name is required"),
  doctorRegistrationNo: z.string().min(2, "Registration number is required"),
  hospitalName: z.string().min(2, "Hospital name is required"),
  hospitalAddress: z.string().min(5, "Hospital address is required"),
  diagnosis: z.string().default(""),
  procedureName: z
    .string()
    .min(5, "Procedure name must be specific (min 5 characters)"),
  procedureDate: z.string().min(1, "Procedure date is required"),
  consentType: z.enum([
    "surgical",
    "anaesthesia",
    "diagnostic",
    "blood_transfusion",
    "research",
    "telemedicine",
    "minor_procedure",
    "obstetric",
    "psychiatric",
    "road_accident_emergency",
  ]),
  counselingLanguage: z.enum([
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
  ]),
  specificRisks: z.string().min(10, "Please describe at least one risk"),
  alternatives: z.string().default(""),
  additionalNotes: z.string().default(""),
  edarVictimId: z.string().default(""),
  tmsPatientId: z.string().default(""),
});

const clausesSchema = z.object({
  anaesthesia: z.boolean(),
  bloodTransfusion: z.boolean(),
  tissueDisposal: z.boolean(),
  photographyAcademicUse: z.boolean(),
});

export const consentFormSchema = z.object({
  patient: patientSchema,
  clinical: clinicalSchema,
  clauses: clausesSchema,
  languageLevel: z.enum(["plain_english", "standard", "formal_legal"]),
  includeWitnessBlock: z.boolean().default(true),
  includeGuardianBlock: z.boolean().default(false),
});

export type ConsentFormSchema = z.infer<typeof consentFormSchema>;

export const researchConsentFormSchema = z.object({
  study: z.object({
    studyTitle: z.string().min(5, "Study title is required"),
    principalInvestigator: z.string().min(2, "Principal investigator name is required"),
    department: z.string().min(2, "Department is required"),
    institutionName: z.string().min(2, "Institution/Hospital name is required"),
    institutionAddress: z.string().min(5, "Institution address is required"),
    contactMobile: z.string().min(10, "Contact number is required"),
    studyPurpose: z.string().min(10, "Study purpose is required"),
    dataToCollect: z.string().min(10, "Description of data/tasks is required"),
    timeRequired: z.string().default("10-15 minutes"),
    risks: z.string().default("There are no physical, mental, or emotional risks involved in this study."),
    benefits: z.string().default("No direct benefit to the participant. However, feedback may help improve future practices."),
    monetaryBenefits: z.string().default("No monetary benefits are provided for participating."),
    counselingLanguage: z.enum([
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
    ]),
  }),
  participant: z.object({
    participantName: z.string().min(2, "Participant name is required"),
    participantId: z.string().min(1, "Participant ID or Roll Number is required"),
    age: z.string().min(1, "Age is required"),
    sex: z.enum(["Male", "Female", "Other"]),
    isCompetent: z.boolean().default(true),
    guardianName: z.string().default(""),
    guardianRelationship: z.string().default(""),
  }),
  includeWitnessBlock: z.boolean().default(true),
  includeResearcherDeclaration: z.boolean().default(true),
});

export type ResearchConsentFormSchema = z.infer<typeof researchConsentFormSchema>;