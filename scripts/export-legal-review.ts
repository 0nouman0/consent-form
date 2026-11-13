/**
 * Generates the legal-review pack for counsel from the REAL clause library, so the document can never
 * drift from what the app actually produces.
 *
 *   npm run legal-pack
 *
 * Output: docs/legal-review/ConsentGen-Clause-Library-<version>-Legal-Review.{docx,md}
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun,
} from "docx";
import { consentFormSchema, type ConsentFormSchema } from "../lib/schema";
import { REQUIRED_CLAUSES } from "../lib/clauses";
import {
  CLAUSE_LIBRARY_STATUS, CLAUSE_LIBRARY_VERSION, composeClinicalMarkdown, composeResearchMarkdown,
  fallbackProcedureContent, verifyClauses,
} from "../lib/consent-template";

/* ───────────── document model ───────────── */
type Block =
  | { t: "title" | "h1" | "h2" | "h3" | "p" | "bullet" | "bullet2" | "quote" | "form"; text: string }
  | { t: "rule" };
const blocks: Block[] = [];
const add = (t: Exclude<Block["t"], "rule">, text: string) => blocks.push({ t, text });
const rule = () => blocks.push({ t: "rule" });

/** Insert a composed markdown form as plain document lines. */
function addForm(md: string) {
  for (const line of md.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.startsWith("### ")) add("h3", line.slice(4));
    else if (line.startsWith("## ")) add("h2", line.slice(3));
    else if (line.startsWith("> ")) add("quote", line.slice(2));
    else if (/^\s{2,}\* /.test(line)) add("bullet2", line.replace(/^\s+\* /, ""));
    else if (line.startsWith("- ")) add("form", line.slice(2));
    else add("form", line);
  }
}

/* ───────────── sample inputs ───────────── */
function sample(over: { clinical?: object; patient?: object; clauses?: object; languageLevel?: ConsentFormSchema["languageLevel"] } = {}): ConsentFormSchema {
  return consentFormSchema.parse({
    patient: { patientName: "[Patient Name]", age: "42", sex: "Female", hospitalOpdIpdNo: "[IPD No]", aadhaarLast4: "0000", insuranceProvider: "", insurancePolicyNo: "", patientCompetent: true, guardianName: "", guardianRelationship: "", ...over.patient },
    clinical: { doctorName: "[Doctor Name]", doctorRegistrationNo: "[Council Reg. No.]", hospitalName: "[Hospital]", hospitalAddress: "[Address]", diagnosis: "[Diagnosis]", procedureName: "[Procedure Name]", procedureDate: "[Date]", consentType: "surgical", counselingLanguage: "English", specificRisks: "[Risk 1 as stated by the clinician]; [Risk 2]; [Risk 3]", alternatives: "[Alternative 1]; [Alternative 2]", additionalNotes: "", edarVictimId: "", tmsPatientId: "", ...over.clinical },
    clauses: { anaesthesia: true, bloodTransfusion: true, tissueDisposal: true, photographyAcademicUse: true, ...over.clauses },
    languageLevel: over.languageLevel ?? "standard",
    includeWitnessBlock: true, includeGuardianBlock: false,
  });
}
const form = (i: ConsentFormSchema) => composeClinicalMarkdown(i, fallbackProcedureContent(i));

/* ───────────── content ───────────── */
const today = new Date().toISOString().slice(0, 10);

add("title", "ConsentGen — Approved Clause Library");
add("h1", "Legal Review Pack for Counsel");
add("p", `Clause library version: ${CLAUSE_LIBRARY_VERSION}    |    Current status: ${CLAUSE_LIBRARY_STATUS.replace(/_/g, " ").toUpperCase()}    |    Prepared: ${today}`);
add("p", "ConsentGen generates informed-consent forms for doctors in India. The legally significant wording of every form is fixed text, reproduced in full in this pack. An AI model does not write that wording. This document is for a qualified lawyer to review, correct and approve it. It is not legal advice and nothing in it has been approved yet.");

add("h2", "1. What we are asking you to do");
add("bullet", "Check every statute and regulation citation in Section 2 and tell us the correct reference for each.");
add("bullet", "Review the fixed wording in Section 4 (both reading levels) and mark changes.");
add("bullet", "Review the complete sample forms in Section 5 as a patient and a court would read them.");
add("bullet", "Answer the questions in Section 7, which cover gaps we believe exist for specific consent types.");
add("bullet", "Sign off in Section 8, or return the pack with required changes. We will not mark the library 'approved' in the software until you have signed off.");

add("h2", "2. Priority: statute citations to verify");
add("p", "The wording was originally drawn from a forensic-medicine textbook that cites the Indian Penal Code (IPC) sections 87–92. The software later expressed these as Bharatiya Nyaya Sanhita (BNS) section numbers. We believe several BNS numbers in the software are wrong. Our understanding is that IPC 87–92 correspond to BNS 25–30, but we are not lawyers and have not verified this against the Act. Please confirm.");
const cites: Array<[string, string, string, string]> = [
  ["Adult (18+) can consent to risk of harm", "BNS §§24–25 (and §§24–27 in the capacity line)", "IPC §87 → BNS §25. We believe §24 concerns intoxication.", "Cite §25 only?"],
  ["Child under 12 / person of unsound mind: guardian consent", "BNS §§26–27", "IPC §89 → BNS §27.", "Cite §27? Also confirm the position for patients aged 12–18."],
  ["Emergency treatment without consent / implied consent (also used for road-accident forms)", "BNS §29", "IPC §92 → BNS §30. We believe §29 is a different provision (IPC §91).", "Cite §30?"],
  ["Consent vitiated by fear or misconception", "BNS §27 (internal clause note)", "IPC §90 → BNS §28.", "Cite §28?"],
  ["Authority to extend the procedure for unforeseen findings", "BNS §26", "Textbook calls this the 'extension doctrine' and grounds it in good-faith benefit and necessity.", "Which BNS section(s) properly support this clause?"],
  ["Right to withdraw consent", "BNS §§24–30; Consumer Protection Act 2019", "The Consumer Protection Act 2019 concerns deficiency in service and negligence. We are unsure it is the right source for a right to withdraw.", "Is this citation appropriate? What is the correct basis?"],
  ["General range", "BNS §§24–30", "Probably §§25–30 if the mapping above is right.", "Confirm the range."],
];
for (const [what, app, source, ask] of cites) {
  add("bullet", `${what}`);
  add("bullet2", `Software currently says: ${app}`);
  add("bullet2", `Our understanding: ${source}`);
  add("bullet2", `Question: ${ask}`);
}
add("p", "Verified correct (checked against the gazette in the project): the MoRTH Cashless Treatment of Road Accident Victims Scheme 2025, notification S.O. 2489(E) dated 4 June 2025 under section 162 of the Motor Vehicles Act 1988 — cover up to Rs. 1.5 lakh per victim for a maximum of 7 days from the date of the accident; victims first hospitalised after 24 hours are not eligible. Counsel should still confirm the wording used on the form.");

add("h2", "3. Clauses the software requires on every form");
add("p", "A programmatic check runs on every form generated and refuses to release it if a required clause is missing. The list below is that check.");
for (const c of REQUIRED_CLAUSES) {
  add("h3", `${c.title}  (${c.partLabel})`);
  add("bullet", `Stated legal basis: ${c.legalBasis}`);
  add("bullet", `Requirement: ${c.description}`);
  add("bullet", `Required for: ${c.requiredFor.includes("all") ? "all consent types" : c.requiredFor.map((x) => x.replace(/_/g, " ")).join(", ")}`);
  add("bullet", `Locked (cannot be removed by the doctor): ${c.locked ? "yes" : "no"}`);
}

add("h2", "4. The fixed wording — two reading levels");
add("p", "Every form uses one of two tones. 'Plain' is used when the doctor selects plain English; 'Professional' is used for 'standard' and 'formal legal'. Both are shown below. Square brackets mark values filled in from the doctor's input.");
{
  const plain = form(sample({ languageLevel: "plain_english" }));
  const pro = form(sample({ languageLevel: "standard" }));
  add("h3", "Declarations and signatures — Professional tone");
  addForm(pro.slice(pro.indexOf("## 4.")));
  add("h3", "Declarations and signatures — Plain tone");
  addForm(plain.slice(plain.indexOf("## 4.")));
}
add("p", "The foreseeable-complications list, the emergency-judgment clause and the voluntariness/right-to-withdraw clause also exist in both tones; they appear in full inside the sample forms in Section 5.");

add("h2", "5. Complete sample forms");
add("p", "These are produced by the software with placeholders in place of real data. The doctor's own risk and alternative wording appears verbatim. The AI is not involved in producing these samples.");

add("h3", "5.1 Surgical consent — Professional tone, adult patient");
addForm(form(sample())); rule();
add("h3", "5.2 Surgical consent — Plain English, minor patient with guardian");
addForm(form(sample({ languageLevel: "plain_english", patient: { age: "9", patientCompetent: false, guardianName: "[Guardian Name]", guardianRelationship: "[Relationship]" } }))); rule();
add("h3", "5.3 Road-accident emergency consent");
addForm(form(sample({ clinical: { consentType: "road_accident_emergency" } }))); rule();
add("h3", "5.4 Research consent (ICMR)");
addForm(composeResearchMarkdown({
  study: { studyTitle: "[Study Title]", principalInvestigator: "[Principal Investigator]", department: "[Department]", institutionName: "[Institution]", institutionAddress: "[Address]", contactMobile: "[Contact]", studyPurpose: "[Purpose as written by the investigator]", dataToCollect: "[Data and procedures as written by the investigator]", timeRequired: "[Time]", risks: "[Risks as written by the investigator]", benefits: "[Benefits]", monetaryBenefits: "[Monetary benefits]", counselingLanguage: "English" },
  participant: { participantName: "[Participant Name]", participantId: "[ID]", age: "30", sex: "Male", isCompetent: true, guardianName: "", guardianRelationship: "" },
}));
for (const type of ["surgical", "road_accident_emergency", "obstetric", "psychiatric"] as const) {
  const i = sample({ clinical: { consentType: type } });
  const { missing } = verifyClauses(form(i), type);
  if (missing.length) throw new Error(`Sample for ${type} is missing clauses: ${missing.join(", ")}`);
}

add("h2", "6. Exactly what the AI does");
add("bullet", "It never writes the clause wording shown above.");
add("bullet", "It restates the doctor's own typed risks and alternatives in clearer language, one item per line, and is instructed to add nothing. If it returns nothing usable, the doctor's own words are used unchanged.");
add("bullet", "If the doctor gives no alternatives, standard ones are inserted and the form says 'standard alternatives — the attending clinician to confirm'.");
add("bullet", "It writes a short plain-language explanation of the procedure (3–4 sentences) from the procedure name and diagnosis. QUESTION: is an AI-written description of a procedure acceptable on a consent form, or must the doctor supply or approve it?");
add("bullet", "For patients counselled in another language it translates the finished English form into one of 12 languages: Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia, Urdu. The translation is machine-generated and has NOT been reviewed by a medical translator in any language. We tested one Hindi translation for structure only (headings, signature lines and dates preserved), not for meaning.");
add("bullet", "Free text typed by doctors cannot add sections, change the headings or inject instructions: the software strips control tokens, HTML and heading syntax from every field before use.");

add("h2", "7. Questions and suspected gaps");
const questions = [
  "Separate consents. Anaesthesia and blood transfusion are lines inside a single procedure consent. The textbook says the consent form should include specific consent to anaesthesia and that blood transfusion needs express consent. Is a line inside one form enough, or should these be separately signed?",
  "Psychiatric consent type. It uses generic wording. Does the Mental Healthcare Act 2017 (nominated representative, advance directive, capacity assessment) require specific wording we are missing?",
  "Obstetric consent. It uses generic wording. Are there requirements under the MTP Act or other law that must appear?",
  "Telemedicine consent. It uses generic wording. Do the Telemedicine Practice Guidelines 2020 require specific disclosures or records?",
  "Research consent. ICMR 2018 expects, among other things, ethics-committee details and contact, compensation for research-related injury, and (in some studies) audio-visual recording of consent. The research form currently has none of these. What must be added?",
  "Minors. The form treats anyone who is not 'competent' as needing a guardian. How should patients aged 12–18 be handled, and who may sign for an incapacitated adult with no guardian present?",
  "Emergency consent. Are the emergency and extension-of-procedure sentences adequate, and are they placed where a court would expect them?",
  "Thumb impression and witness. Is a left-thumb impression with one witness sufficient for patients who cannot sign? Should the interpreter be identified separately?",
  "Electronic signing. Before we add digital signing: what is needed for a signature, OTP confirmation or thumb capture on a phone to be legally sound and admissible?",
  "Data. Each form is stored with the patient's name, date of birth and procedure. What notice and consent does the Digital Personal Data Protection Act 2023 require, and for how long must we retain forms?",
  "Aadhaar. The form header shows only XXXX-XXXX plus the last four digits. Is collecting even the last four digits acceptable for a private hospital?",
  "Disclaimer. What notice should appear on or alongside the form to make clear that the treating doctor must review it before use?",
  "Claims. May the product describe forms as 'compliant' with IMC 2002, BNS, ICMR and DPDP? What wording is safe in marketing?",
];
questions.forEach((q, i) => add("bullet", `Q${i + 1}. ${q}`));

add("h2", "8. Sign-off");
add("p", "Reviewer name: ______________________________    Bar Council enrolment no.: ______________________");
add("p", "Date: ________________    Decision (circle):   APPROVED   /   APPROVED WITH CHANGES   /   NOT APPROVED");
add("p", "Changes required: ____________________________________________________________________________");
add("p", "Signature: ______________________________");
add("h3", "Language reviewers (each language needs a medically literate native speaker)");
for (const lang of ["Hindi", "Kannada", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia", "Urdu"]) {
  add("bullet", `${lang} — reviewer: ______________________   date: ____________   result: ____________`);
}
add("p", `After sign-off, the engineering team changes CLAUSE_LIBRARY_STATUS to "approved" and records the new version. Every saved form already stores the library version that produced it.`);

/* ───────────── renderers ───────────── */
function toMarkdown(): string {
  return blocks.map((b) => {
    if (b.t === "rule") return "\n---\n";
    switch (b.t) {
      case "title": return `# ${b.text}\n`;
      case "h1": return `## ${b.text}\n`;
      case "h2": return `\n### ${b.text}\n`;
      case "h3": return `\n#### ${b.text}\n`;
      case "bullet": case "form": return `- ${b.text}`;
      case "bullet2": return `  - ${b.text}`;
      case "quote": return `> ${b.text}\n`;
      default: return `${b.text}\n`;
    }
  }).join("\n") + "\n";
}

function runs(text: string, size = 22, italics = false): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((seg) =>
    seg.startsWith("**") && seg.endsWith("**")
      ? new TextRun({ text: seg.slice(2, -2), bold: true, size, italics })
      : new TextRun({ text: seg, size, italics }));
}

function toDocx(): Document {
  const children = blocks.map((b) => {
    if (b.t === "rule") return new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } }, spacing: { before: 200, after: 200 } });
    switch (b.t) {
      case "title": return new Paragraph({ heading: HeadingLevel.TITLE, children: runs(b.text, 44), spacing: { after: 120 } });
      case "h1": return new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(b.text, 30), spacing: { after: 160 } });
      case "h2": return new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(b.text, 28), spacing: { before: 320, after: 120 }, keepNext: true });
      case "h3": return new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(b.text, 24), spacing: { before: 220, after: 80 }, keepNext: true });
      case "bullet": return new Paragraph({ bullet: { level: 0 }, children: runs(b.text), spacing: { after: 60 } });
      case "form": return new Paragraph({ children: runs(b.text), spacing: { after: 70 }, indent: { left: 240 } });
      case "bullet2": return new Paragraph({ bullet: { level: 1 }, children: runs(b.text, 21), spacing: { after: 40 } });
      case "quote": return new Paragraph({ children: runs(b.text, 21, true), indent: { left: 480 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: "AAAAAA", space: 8 } }, spacing: { after: 100 } });
      default: return new Paragraph({ children: runs(b.text), spacing: { after: 120 }, alignment: AlignmentType.LEFT });
    }
  });
  return new Document({
    creator: "ConsentGen",
    title: `ConsentGen Clause Library ${CLAUSE_LIBRARY_VERSION} — Legal Review Pack`,
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children }],
  });
}

(async () => {
  const dir = join(process.cwd(), "docs", "legal-review");
  mkdirSync(dir, { recursive: true });
  const base = `ConsentGen-Clause-Library-${CLAUSE_LIBRARY_VERSION}-Legal-Review`;
  writeFileSync(join(dir, `${base}.md`), toMarkdown(), "utf8");
  writeFileSync(join(dir, `${base}.docx`), await Packer.toBuffer(toDocx()));
  console.log(`Wrote ${join("docs", "legal-review", base)}.{md,docx}  (${blocks.length} blocks)`);
})();
