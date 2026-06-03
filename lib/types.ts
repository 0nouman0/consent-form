export type ConsentType =
  | "surgical"
  | "anaesthesia"
  | "diagnostic"
  | "blood_transfusion"
  | "research"
  | "telemedicine"
  | "minor_procedure"
  | "obstetric"
  | "psychiatric"
  | "road_accident_emergency";

export type LanguageLevel = "plain_english" | "standard" | "formal_legal";

export type CounselingLanguage =
  | "English"
  | "Hindi"
  | "Kannada"
  | "Tamil"
  | "Telugu"
  | "Marathi"
  | "Bengali"
  | "Gujarati"
  | "Malayalam"
  | "Punjabi"
  | "Odia"
  | "Urdu";

export interface PatientInfo {
  patientName: string;
  age: string;
  sex: "Male" | "Female" | "Other";
  hospitalOpdIpdNo: string;
  aadhaarLast4: string;
  insuranceProvider: string;
  insurancePolicyNo: string;
  patientCompetent: boolean;
  guardianName: string;
  guardianRelationship: string;
}

export interface ClinicalDetails {
  doctorName: string;
  doctorRegistrationNo: string;
  hospitalName: string;
  hospitalAddress: string;
  procedureName: string;
  procedureDate: string;
  consentType: ConsentType;
  counselingLanguage: CounselingLanguage;
  specificRisks: string;
  alternatives: string;
  additionalNotes: string;
  edarVictimId: string;
  tmsPatientId: string;
}

export interface AgreedClauses {
  anaesthesia: boolean;
  bloodTransfusion: boolean;
  tissueDisposal: boolean;
  photographyAcademicUse: boolean;
}

export interface ConsentFormInput {
  patient: PatientInfo;
  clinical: ClinicalDetails;
  clauses: AgreedClauses;
  languageLevel: LanguageLevel;
  includeWitnessBlock: boolean;
  includeGuardianBlock: boolean;
}

export type GenerationStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";