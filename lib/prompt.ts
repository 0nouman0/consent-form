import { ConsentFormInput } from "./types";
import { REQUIRED_CLAUSES } from "./clauses";
import { generateConsentId, nowIST } from "./utils";

export function buildSystemPrompt(): string {
  return `You are a senior medico-legal documentation specialist in India.
You draft patient informed consent forms that comply with:
- Standard Medical Law & Ethics (Rules of Consent, Informed Consent elements)
- Bharatiya Nyaya Sanhita (BNS) 2023 §§24-30 (consent capacity and validity)
- Indian Medical Council (Professional Conduct) Regulations 2002
- MoRTH Gazette S.O.2489(E) June 2025 — Cashless Treatment of Road Accident Victims Scheme 2025
- Consumer Protection Act 2019 (medical negligence provisions)
- Aadhaar Act 2016 (data masking for private entities)

RULES YOU MUST NEVER BREAK:
1. The procedure name must appear exactly as provided. Never generalize it.
   Legal Rule: "Written consent should refer to ONE specific procedure,
   not blanket permission." Blanket consent is VOID in Indian law.
2. Every section listed in REQUIRED SECTIONS must appear as a ## heading.
3. Every signature block must have Date AND Time fields — not just date.
   Legal Precedent: "Absence of a timestamp is a common loophole in negligence cases."
4. The counseling language used must be stated on the face of the form.
   Indian courts require proof of comprehension.
5. Right to withdraw consent must appear clearly and prominently.
6. Never guarantee outcomes. Never make promises about success.
7. Aadhaar: display ONLY as XXXX-XXXX-[last4]. Never show full Aadhaar.
8. Use only the clinical information provided. Never invent risks or facts.
9. Output ONLY the consent form in Markdown. No preamble. No explanation.
   Start directly with the document title on the first line.`;
}

export function buildUserPrompt(
  input: ConsentFormInput,
  consentId: string
): string {
  const { patient, clinical, clauses } = input;

  // Filter clauses applicable to this consent type
  const applicable = REQUIRED_CLAUSES.filter(
    (c) =>
      c.requiredFor.includes("all") ||
      c.requiredFor.includes(clinical.consentType)
  );

  const clauseList = applicable
    .map(
      (c, i) =>
        `${i + 1}. **${c.title}** (${c.partLabel})\n` +
        `   Requirement: ${c.description}\n` +
        `   Legal basis: ${c.legalBasis}`
    )
    .join("\n\n");

  const languageInstruction = {
    plain_english:
      "Write in plain English, Grade 8 reading level. Short sentences. " +
      "Explain any medical term immediately in plain brackets. Use 'you' and 'your doctor'. " +
      "No words like 'aforementioned', 'herein', or 'pursuant to'.",
    standard:
      "Write in clear professional English. Medical terms allowed but explain each on first use.",
    formal_legal:
      "Write in formal medico-legal English per Indian court standards. " +
      "Use 'the patient' and 'the attending physician'. Reference BNS sections where relevant.",
  }[input.languageLevel];

  const bilingualInstruction = clinical.counselingLanguage !== "English"
    ? `\nCRITICAL MULTI-LANGUAGE DOCUMENT REQUIREMENT:\n` +
      `Since the counseling language is ${clinical.counselingLanguage}, you MUST generate TWO SEPARATE complete consent forms.\n` +
      `First, generate the entire form in English, complying fully with all clinical specifications, legal requirements, and signature blocks.\n` +
      `Once the English form is fully complete, output the exact separator token on a single line: __LANG_SEPARATOR__\n` +
      `Immediately after the separator, generate the complete consent form fully translated into ${clinical.counselingLanguage} (e.g. Hindi, Tamil, etc.).\n` +
      `Do not mix languages inside each document. The first document must be 100% in English, and the second document must be 100% in ${clinical.counselingLanguage}. Both documents must contain the exact same details, clauses, and signature blocks in their respective languages.`
    : "";

  const roadAccidentSection =
    clinical.consentType === "road_accident_emergency"
      ? `
ROAD ACCIDENT EMERGENCY DETAILS (MoRTH Gazette S.O.2489(E) June 2025):
eDAR Victim ID: ${clinical.edarVictimId || "Pending — police to generate on eDAR application"}
NHA TMS Patient ID: ${clinical.tmsPatientId || "Pending — hospital to generate on TMS portal"}
Scheme Coverage: Up to Rs. 1,50,000 per victim for maximum 7 days from accident date
Legal basis: Motor Vehicles Act 1988 Section 162; BNS Section 29 (Bharatiya Nyaya Sanhita) — emergency implied consent
Note: Include the MoRTH Cashless Treatment of Road Accident Victims Scheme 2025 reference in the form.`
      : "";

  return `Generate a complete legally valid Indian medical consent form.

════════════════════════════════
DOCUMENT HEADER INFORMATION:
════════════════════════════════
Consent ID: ${consentId}
Hospital: ${clinical.hospitalName}
Address: ${clinical.hospitalAddress}
Date and Time Generated: ${nowIST()} IST
Form Type: STANDARD INFORMED CONSENT FORM — ${clinical.consentType.replace(/_/g, " ").toUpperCase()}

════════════════════════════════
PART A — PATIENT INFORMATION:
════════════════════════════════
Patient Full Name: ${patient.patientName}
Age / Sex: ${patient.age} years / ${patient.sex}
Hospital OPD/IPD Number: ${patient.hospitalOpdIpdNo}
Aadhaar (Last 4 digits only — Aadhaar Act 2016): XXXX-XXXX-${patient.aadhaarLast4}
Insurance Provider: ${patient.insuranceProvider || "Not provided"}
Insurance Policy Number: ${patient.insurancePolicyNo || "Not provided"}
Patient Competency: ${
    patient.patientCompetent
      ? "COMPETENT — Adult, sound mind, not intoxicated (BNS §24-25)"
      : "NOT COMPETENT / MINOR — Guardian consent required (BNS §26-27)"
  }
${
  !patient.patientCompetent
    ? `Guardian Name: ${patient.guardianName}
Guardian Relationship: ${patient.guardianRelationship}`
    : ""
}

════════════════════════════════
CLINICAL DETAILS:
════════════════════════════════
Doctor / Surgeon: Dr. ${clinical.doctorName}
Medical Council Registration Number: ${clinical.doctorRegistrationNo}
Primary Diagnosis / Underlying Condition: ${input.clinical.diagnosis || "Not specified"}
Procedure Name: ${input.clinical.procedureName}
Scheduled Date: ${clinical.procedureDate}
Consent Type: ${clinical.consentType.replace(/_/g, " ")}
Language of Counseling (mandatory for court proof): ${clinical.counselingLanguage}
Specific Risks Disclosed: ${clinical.specificRisks}
Treatment Alternatives Discussed: ${
    clinical.alternatives ||
    "Include standard alternatives appropriate for this procedure type"
  }
Additional Clinical Notes: ${clinical.additionalNotes || "None"}
${roadAccidentSection}

════════════════════════════════
CLAUSE CONFIGURATION:
════════════════════════════════
Anaesthesia and Blood Transfusion: ${clauses.anaesthesia ? "PATIENT CONSENTS" : "NOT APPLICABLE"}
Tissue and Specimen Disposal: ${clauses.tissueDisposal ? "PATIENT CONSENTS" : "NOT APPLICABLE"}
Photography and Academic Use: ${clauses.photographyAcademicUse ? "PATIENT CONSENTS — identity confidentiality required" : "PATIENT DOES NOT CONSENT"}
Right to Withdraw: ALWAYS INCLUDED — mandatory (Legal Requirement)
Voluntary Consent: ALWAYS INCLUDED — mandatory (BNS §27)
Capacity Confirmation: ALWAYS INCLUDED — mandatory (BNS §24-26)

════════════════════════════════
LANGUAGE INSTRUCTION:
════════════════════════════════
${languageInstruction}
${bilingualInstruction}

════════════════════════════════
REQUIRED SECTIONS — USE ## FOR EACH HEADING:
════════════════════════════════
${clauseList}

${input.includeWitnessBlock ? "INCLUDE: A Witness Signature Block with fields: Full Name, Relationship to Patient, Contact Number, Signature, Date, and exact Time. This is a recommended legal requirement." : ""}
${input.includeGuardianBlock || !patient.patientCompetent ? "INCLUDE: A Parent or Guardian Consent Block with fields: Guardian Name, Relationship, Signature, Date, and exact Time. Required by BNS §26 (Bharatiya Nyaya Sanhita)." : ""}

════════════════════════════════
PART D — DOCTOR'S DECLARATION:
════════════════════════════════
Include a Doctor's Declaration section stating:
- Dr. ${clinical.doctorName} personally explained the procedure, risks, and alternatives
- Explanation was given in ${clinical.counselingLanguage}
- All questions were answered to the best of their ability
- Fields: Doctor Signature, Registration No. ${clinical.doctorRegistrationNo}, Date, exact Time

════════════════════════════════
DOCUMENT FOOTER (include at the end):
════════════════════════════════
- Consent ID: ${consentId}
- "This form is legally binding per IMC (Professional Conduct, Etiquette and Ethics) Regulations 2002"
- "Aadhaar data is masked per the Aadhaar Act 2016. Private entities may not store full Aadhaar numbers."
- "This consent applies to the named procedure only. Blanket consent is void in India."
- Generation timestamp: ${nowIST()} IST`;
}

export function buildResearchSystemPrompt(): string {
  return `You are a senior medico-legal and bioethics documentation specialist in India.
You draft research informed consent forms that comply with:
- ICMR National Ethical Guidelines for Biomedical and Health Research Involving Human Participants (2018)
- Standard Research Ethics (Informed Consent elements: voluntariness, disclosure, understanding, capacity)
- Bharatiya Nyaya Sanhita (BNS) 2023 §§24-27 (consent capacity and validity)

RULES YOU MUST NEVER BREAK:
1. The study title and principal investigator details must appear exactly as provided.
2. Every signature block must have Date AND Time fields — not just date.
3. The counseling language used must be stated on the face of the form.
4. Right to withdraw consent at any time without any academic, professional, or health consequences must appear clearly and prominently.
5. Emphasize that participation is 100% voluntary.
6. Outline confidentiality measures (e.g. data anonymization).
7. Output ONLY the consent form in Markdown. No preamble. No explanation.
   Start directly with the document title on the first line.`;
}

export function buildResearchUserPrompt(
  input: any, // ResearchConsentFormSchema
  consentId: string
): string {
  const { study, participant } = input;

  const bilingualInstruction = study.counselingLanguage !== "English"
    ? `\nCRITICAL MULTI-LANGUAGE DOCUMENT REQUIREMENT:\n` +
      `Since the counseling language is ${study.counselingLanguage}, you MUST generate TWO SEPARATE complete consent forms.\n` +
      `First, generate the entire form in English, complying fully with all study details, ethical disclosures, and signature blocks.\n` +
      `Once the English form is fully complete, output the exact separator token on a single line: __LANG_SEPARATOR__\n` +
      `Immediately after the separator, generate the complete consent form fully translated into ${study.counselingLanguage} (e.g. Hindi, Kannada, Tamil, etc.).\n` +
      `Do not mix languages inside each document. The first document must be 100% in English, and the second document must be 100% in ${study.counselingLanguage}. Both documents must contain the exact same details and signature blocks in their respective languages.`
    : "";

  return `Generate a complete legally and ethically valid Indian research consent form.

════════════════════════════════
DOCUMENT HEADER INFORMATION:
════════════════════════════════
Consent ID: ${consentId}
Institution: ${study.institutionName}
Address: ${study.institutionAddress}
Date and Time Generated: ${nowIST()} IST
Form Type: INFORMED WRITTEN CONSENT FOR VOLUNTARY PARTICIPATION IN RESEARCH

════════════════════════════════
STUDY INFORMATION:
════════════════════════════════
Title of Study: ${study.studyTitle}
Principal Investigator: ${study.principalInvestigator}
Department: ${study.department}
Contact Number: ${study.contactMobile}
Purpose of Study: ${study.studyPurpose}
Data/Tasks/Procedure to be Collected: ${study.dataToCollect}
Time Required: ${study.timeRequired}
Risks: ${study.risks}
Benefits: ${study.benefits}
Monetary Benefits: ${study.monetaryBenefits}
Counseling Language: ${study.counselingLanguage}

════════════════════════════════
PARTICIPANT INFORMATION:
════════════════════════════════
Participant Full Name: ${participant.participantName}
Participant ID / Roll Number: ${participant.participantId}
Age / Sex: ${participant.age} years / ${participant.sex}
Participant Competency: ${
    participant.isCompetent
      ? "COMPETENT — Adult, sound mind, not intoxicated (BNS §24-25)"
      : "NOT COMPETENT / MINOR — Guardian consent required (BNS §26-27)"
  }
${
  !participant.isCompetent
    ? `Guardian Name: ${participant.guardianName}
Guardian Relationship: ${participant.guardianRelationship}`
    : ""
}

════════════════════════════════
REQUIRED SECTIONS — USE ## FOR EACH HEADING:
════════════════════════════════
## 1. PURPOSE OF DATA COLLECTION / STUDY
## 2. DATA TO BE COLLECTED / PROCEDURES
## 3. CONFIDENTIALITY & USE OF DATA
## 4. VOLUNTARY PARTICIPATION & RIGHT TO WITHDRAW
## 5. RISKS AND BENEFITS
## 6. INFORMED CONSENT & DECLARATION

${input.includeWitnessBlock ? "INCLUDE: A Witness Signature Block with fields: Full Name, Relationship to Participant, Contact Number, Signature, Date, and exact Time." : ""}
${!participant.isCompetent ? "INCLUDE: A Parent or Guardian Consent Block with fields: Guardian Name, Relationship, Signature, Date, and exact Time." : ""}

════════════════════════════════
PARTICIPANT / RESEARCHER DECLARATION:
════════════════════════════════
Include a Researcher's Declaration section stating:
- ${study.principalInvestigator} (or their representative) explained the study, procedures, risks, and benefits
- Explanation was given in ${study.counselingLanguage}
- All questions were answered to the best of their ability
- Fields: Participant Signature, Researcher Signature, Date, exact Time

════════════════════════════════
LANGUAGE INSTRUCTION:
════════════════════════════════
Write in clear, standard research language. Explain terms clearly.
${bilingualInstruction}

════════════════════════════════
DOCUMENT FOOTER (include at the end):
════════════════════════════════
- Consent ID: ${consentId}
- "This research consent form is drafted in compliance with ICMR National Ethical Guidelines (2018)."
- Generation timestamp: ${nowIST()} IST`;
}