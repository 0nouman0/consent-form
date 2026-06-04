export interface Clause {
  id: string;
  title: string;
  partLabel: string;
  legalBasis: string;
  description: string;
  requiredFor: string[];
  locked?: boolean;
}

export const REQUIRED_CLAUSES: Clause[] = [
  {
    id: "authorization",
    title: "Authorization",
    partLabel: "Part B — Clause 1",
    legalBasis: "Standard legal precedent — treating without consent is assault in law",
    description:
      "Patient authorizes the named doctor and team to perform the specific named procedure only.",
    requiredFor: ["all"],
  },
  {
    id: "disclosure_comprehension",
    title: "Disclosure & Comprehension",
    partLabel: "Part B — Clause 2",
    legalBasis:
      "Legal precedent — all disclosures must be in language the patient understands; IMC Regulation 3.1",
    description:
      "Procedure explained in the patient's own language. Counseling language must be recorded.",
    requiredFor: ["all"],
  },
  {
    id: "risks_complications",
    title: "Risks & Complications",
    partLabel: "Part B — Clause 3",
    legalBasis:
      "Standard Informed Consent element 5 — risks and benefits of both proposed and alternative procedures",
    description:
      "Specific and general risks disclosed including unforeseen events requiring additional interventions.",
    requiredFor: ["all"],
  },
  {
    id: "alternatives",
    title: "Alternatives to Treatment",
    partLabel: "Part B — Clause 4",
    legalBasis:
      "Standard Informed Consent element 4 — details of alternative treatment courses",
    description:
      "Available alternatives and consequences of declining all treatment explained.",
    requiredFor: ["all"],
  },
  {
    id: "anaesthesia_blood",
    title: "Anaesthesia & Blood Transfusion",
    partLabel: "Part B — Clause 5",
    legalBasis:
      "Legal Rule 3 — consent form must include specific consent to anaesthesia; Rule 4 — blood transfusion requires express consent",
    description:
      "Consent for anaesthesia and blood products if clinically necessary.",
    requiredFor: [
      "surgical",
      "anaesthesia",
      "minor_procedure",
      "obstetric",
      "blood_transfusion",
      "road_accident_emergency",
    ],
  },
  {
    id: "tissue_disposal",
    title: "Disposal of Tissues",
    partLabel: "Part B — Clause 6",
    legalBasis:
      "Standard legal practice — pathological examination requires consent",
    description:
      "Consent for pathological examination and disposal of removed tissues or specimens.",
    requiredFor: ["surgical", "obstetric", "diagnostic"],
  },
  {
    id: "photography_academic",
    title: "Photography / Academic Use",
    partLabel: "Part B — Clause 7",
    legalBasis:
      "IMC Ethics Regulations — patient identity must remain confidential; Legal Rule 23",
    description:
      "Optional consent for photography or video for educational purposes with identity confidentiality.",
    requiredFor: ["surgical", "diagnostic", "research"],
  },
  {
    id: "voluntariness",
    title: "Voluntariness & Right to Withdraw",
    partLabel: "Part B — Clause 8",
    legalBasis:
      "Legal Rule 7 — consent must be free, voluntary, clear, intelligent; IPC §90 — fear vitiates consent",
    description:
      "Consent given freely without coercion. Right to withdraw before procedure begins.",
    requiredFor: ["all"],
    locked: true,
  },
  {
    id: "capacity_validation",
    title: "Capacity Validation",
    partLabel: "Part B — Clause 9",
    legalBasis:
      "IPC §87 — valid consent requires person above 18; IPC §89 — minor or insane cannot consent; IPC §90 — intoxicated consent invalid",
    description:
      "Patient is of sound mind, not intoxicated, above 18 years. Guardian block activated otherwise.",
    requiredFor: ["all"],
    locked: true,
  },
  {
    id: "information_receipt",
    title: "Information Receipt",
    partLabel: "Part B — Clause 10",
    legalBasis:
      "Legal precedent — physicians have legal and ethical duty to provide all relevant information",
    description:
      "Patient confirms they received adequate information and had opportunity to ask questions.",
    requiredFor: ["all"],
  },
  {
    id: "road_accident_emergency",
    title: "Road Accident Emergency Clause",
    partLabel: "Part B — Clause 11",
    legalBasis:
      "MoRTH Gazette S.O.2489(E) June 2025 — Cashless Treatment of Road Accident Victims Scheme 2025; MV Act 1988 §162; IPC §92 emergency implied consent",
    description:
      "Emergency treatment under MoRTH Scheme 2025. Coverage: ₹1.5 lakh per victim, 7 days from accident date.",
    requiredFor: ["road_accident_emergency"],
  },
  {
    id: "signature_block",
    title: "Signatures (Parts C & D)",
    partLabel: "Parts C & D",
    legalBasis:
      "Legal precedent — missing timestamp is a common loophole in negligence cases; Rule 3 — written consent must be witnessed",
    description:
      "Patient, witness, guardian (if minor), and doctor signatures with exact date and time.",
    requiredFor: ["all"],
    locked: true,
  },
];