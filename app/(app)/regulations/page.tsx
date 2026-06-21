"use client";

import { useState } from "react";
import {
  ShieldCheck, BookOpen, Gavel, Hospital, FileText,
  ArrowSquareOut, CalendarBlank, Tag,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

interface RegUpdate {
  id: string;
  title: string;
  body: string;
  source: string;
  category: "NMC" | "MCI" | "BNS" | "DPDP" | "ICMR" | "MoHFW";
  date: string;
  link?: string;
}

const UPDATES: RegUpdate[] = [
  {
    id: "nmc-2023-ethics",
    title: "NMC Registered Medical Practitioners (Professional Conduct) Regulations 2023",
    body: "The National Medical Commission replaced the MCI's 2002 code of ethics. These regulations govern professional conduct, duties of RMPs, and the obligations around informed consent. Every registered doctor must obtain written informed consent before any surgical or invasive procedure, and must explain the nature of the procedure, risks, alternatives, and consequences of refusal in a language the patient understands.",
    source: "National Medical Commission",
    category: "NMC",
    date: "2023-09-29",
    link: "https://www.nmc.org.in",
  },
  {
    id: "imc-2002-consent",
    title: "IMC Code of Medical Ethics 2002 — Informed Consent (Clause 7.16 / 7.17)",
    body: "Before performing an operation, the registered medical practitioner shall obtain in writing the consent of the patient or in the case of a minor, or a patient of unsound mind, of the guardian or parent. Clause 7.17 requires the doctor to explain the nature of the illness, the proposed treatment or investigation, its risks, benefits, and the alternatives available. Failure to do so constitutes professional misconduct.",
    source: "Medical Council of India",
    category: "MCI",
    date: "2002-04-01",
  },
  {
    id: "bns-2023-consent",
    title: "Bharatiya Nyaya Sanhita 2023 (BNS) — Sections 24–30 on Medical Consent",
    body: "The BNS 2023, which replaced the Indian Penal Code, retains provisions relevant to medical consent. Sections 24–30 address assault and criminal force, and a procedure performed without valid consent may constitute an offence. The law recognises exceptions for good-faith acts done for the benefit of the patient (Section 24 exception), but the burden rests on the doctor to demonstrate valid informed consent.",
    source: "Ministry of Law & Justice",
    category: "BNS",
    date: "2023-12-25",
  },
  {
    id: "dpdp-2023",
    title: "Digital Personal Data Protection Act 2023 (DPDP) — Health Data Obligations",
    body: "The DPDP Act 2023 classifies health data as sensitive personal data. Hospitals and clinics that store patient records digitally must obtain explicit, informed, and specific consent before processing health information. Purpose limitation applies — data collected for consent forms cannot be used for marketing or research without separate consent. Data principals (patients) have the right to withdraw consent and request data erasure.",
    source: "Ministry of Electronics & IT",
    category: "DPDP",
    date: "2023-08-11",
  },
  {
    id: "icmr-biomedical-2017",
    title: "ICMR National Ethical Guidelines for Biomedical & Health Research 2017",
    body: "Applicable to all research involving human subjects in India. Mandates an informed consent process that is voluntary, comprehensible, and documented. Requires an independent ethics committee approval. Special provisions apply for vulnerable populations (children, prisoners, pregnant women). The researcher must use a participant information sheet in the local language and allow adequate time for decision-making.",
    source: "Indian Council of Medical Research",
    category: "ICMR",
    date: "2017-10-01",
    link: "https://main.icmr.nic.in/sites/default/files/guidelines/ICMR_Ethical_Guidelines_2017.pdf",
  },
  {
    id: "mohfw-telemedicine-2020",
    title: "Telemedicine Practice Guidelines 2020",
    body: "Published jointly by the MoHFW and NITI Aayog. A registered medical practitioner may provide teleconsultation via any technology platform. For telemedicine consultations, verbal or digital consent at the start of the session is required. RMPs must inform patients of the limitations of telemedicine. Prescribing Schedule X drugs via telemedicine is prohibited. The guidelines have been incorporated into the MCI/NMC framework.",
    source: "Ministry of Health & Family Welfare",
    category: "MoHFW",
    date: "2020-03-25",
  },
  {
    id: "icmr-ai-2023",
    title: "ICMR Ethical Guidelines for Application of Artificial Intelligence in Biomedical Research and Healthcare 2023",
    body: "ICMR's first AI-specific guidance for healthcare. AI-generated consent forms or AI-assisted clinical tools must be transparent and auditable. The treating clinician remains legally responsible even when AI aids the process. Patients must be informed when AI is involved in their care or in preparing consent documents. Accountability, fairness, and explicability are core principles.",
    source: "Indian Council of Medical Research",
    category: "ICMR",
    date: "2023-07-20",
    link: "https://main.icmr.nic.in",
  },
  {
    id: "nmc-gazette-2024-fee",
    title: "NMC (Fees) Regulations 2024 — Patient Rights Provisions",
    body: "The 2024 regulations reinforce patient rights including the right to receive a copy of all consent documents, investigation reports, and discharge summaries at no extra charge. Hospitals cannot withhold consent forms or medical records as leverage for payment. This directly reinforces the consent documentation practices mandated by the 2023 ethics regulations.",
    source: "National Medical Commission",
    category: "NMC",
    date: "2024-03-15",
  },
];

const CATEGORY_META: Record<RegUpdate["category"], { color: string; bg: string; icon: Icon }> = {
  NMC:   { color: "#1e40af", bg: "#eff6ff", icon: ShieldCheck },
  MCI:   { color: "#6d28d9", bg: "#f5f3ff", icon: Hospital },
  BNS:   { color: "#b45309", bg: "#fffbeb", icon: Gavel },
  DPDP:  { color: "#0f766e", bg: "#f0fdfa", icon: FileText },
  ICMR:  { color: "#be185d", bg: "#fdf2f8", icon: BookOpen },
  MoHFW: { color: "#166534", bg: "#f0fdf4", icon: ShieldCheck },
};

const CATEGORIES = ["All", "NMC", "MCI", "BNS", "DPDP", "ICMR", "MoHFW"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function RegulationsPage() {
  const [activeCategory, setActiveCategory] = useState<"All" | RegUpdate["category"]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? UPDATES
    : UPDATES.filter((u) => u.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div
          className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">India</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
            Regulatory{" "}
            <span
              className="font-serif italic font-normal text-neutral-600"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              updates
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Key laws, guidelines and notifications governing medical consent in India.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as typeof activeCategory)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  isActive
                    ? { backgroundColor: "#0b0f1a", color: "#fff", border: "1px solid #0b0f1a" }
                    : { backgroundColor: "#fff", color: "#374151", border: "1px solid rgba(0,0,0,0.1)" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Updates list */}
        <div className="space-y-3">
          {filtered.map((update) => {
            const meta = CATEGORY_META[update.category];
            const Icon = meta.icon;
            const isOpen = expanded === update.id;
            return (
              <div
                key={update.id}
                className="bg-white rounded-2xl overflow-hidden transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <button
                  type="button"
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start gap-4 hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : update.id)}
                  aria-expanded={isOpen}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <Icon weight="duotone" className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <Tag weight="fill" className="w-2.5 h-2.5" />
                        {update.category}
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <CalendarBlank weight="regular" className="w-3 h-3" />
                        {formatDate(update.date)}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold leading-snug" style={{ color: "#0b0f1a" }}>
                      {update.title}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">{update.source}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-neutral-400 shrink-0 mt-1 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    viewBox="0 0 16 16" fill="none"
                  >
                    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="pl-[52px]">
                      <p className="text-sm text-neutral-600 leading-relaxed">{update.body}</p>
                      {update.link && (
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold transition-colors hover:opacity-80"
                          style={{ color: meta.color }}
                        >
                          View official source
                          <ArrowSquareOut weight="bold" className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-neutral-400 pb-4">
          Information is for reference only. Always verify with the official source before clinical or legal use.
        </p>
      </div>
    </div>
  );
}
