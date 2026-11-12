import Link from "next/link";
import { ShieldCheck, ArrowLeft, Scales, BookOpen, CheckCircle, Warning, FileText } from "@phosphor-icons/react/dist/ssr";
import PublicNavActions from "@/components/PublicNavActions";
import PublicCTA from "@/components/PublicCTA";

export const metadata = {
  title: "Statutory Regulations & Medico-Legal Frameworks — ConsentGen",
  description: "Comprehensive Indian regulatory guide on informed consent: IMC 2002, NMC 2023, BNS 2023, Supreme Court Samira Kohli doctrine.",
};

const INK = "#171410";
const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const RED = "#BE3D2A";
const RULE = "rgba(23,20,16,0.15)";
const MUTED = "#7A7466";

const STATUTES = [
  {
    code: "IMC 2002",
    title: "IMC Code of Medical Ethics Regulations, 2002",
    clauses: "Clause 7.16 & 7.17",
    summary:
      "Mandates that before performing an operation, a registered medical practitioner shall obtain written informed consent. Clause 7.17 requires personal explanation of the illness, proposed treatment, risks, benefits, and alternatives in a language the patient understands. Failure to obtain written informed consent constitutes professional misconduct.",
    keyTakeaway: "Written consent is legally mandatory for all operative and invasive procedures in India.",
  },
  {
    code: "NMC 2023",
    title: "NMC Registered Medical Practitioner (Professional Conduct) Regulations, 2023",
    clauses: "Guidelines on Consent & Documentation",
    summary:
      "The National Medical Commission sets modern guidelines for medical practice in India, reiterating the statutory duty of doctors to obtain specific, informed, and documented consent. Emphasizes patient autonomy and prohibits coercion or misleading counseling.",
    keyTakeaway: "Requires active disclosure of treatment alternatives and complication likelihoods.",
  },
  {
    code: "BNS 2023",
    title: "Bharatiya Nyaya Sanhita, 2023",
    clauses: "Sections 24, 25, 26, 27 & 30",
    summary:
      "Replaced the Indian Penal Code. Operating or administering treatment without valid consent constitutes assault and criminal force. Section 27 explicitly states that consent given under fear of injury or misconception of fact is not valid consent in law. Sections 24–26 govern age of capacity (18+ for independent surgical consent) and mental soundness.",
    keyTakeaway: "Consent given under misconception, duress, or incomplete disclosure is void in criminal law.",
  },
  {
    code: "SUPREME COURT",
    title: "Samira Kohli v. Dr. Prabha Manchanda (2008) 2 SCC 1",
    clauses: "Landmark Doctrine on Informed Consent",
    summary:
      "The Hon’ble Supreme Court of India laid down the definitive test for valid consent: (1) Patient must possess capacity; (2) Consent must be based on adequate explanation of the nature of the procedure, normal risks, and alternatives; (3) Consent for a diagnostic procedure cannot be construed as consent for a major surgical excision unless emergency life-threat exists; (4) Blanket consent is completely void in law.",
    keyTakeaway: "The definitive four-point legal test applied by all consumer courts and High Courts in India.",
  },
  {
    code: "DPDP 2023",
    title: "Digital Personal Data Protection Act, 2023",
    clauses: "Sections 4–9 (Health Data Consent)",
    summary:
      "Digital health records and digital consent forms are classified as sensitive personal data. Consent must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action. Purpose limitation strictly forbids using clinical consent records for marketing or unapproved research.",
    keyTakeaway: "Mandates purpose limitation and strong encryption for digital clinical consent records.",
  },
  {
    code: "MoRTH 2025",
    title: "Cashless Treatment of Road Accident Victims Scheme",
    clauses: "S.O. 2489(E) (June 2025 Mandate)",
    summary:
      "Ministry of Road Transport & Highways guidelines for the Golden Hour treatment of trauma victims. Outlines emergency care protocols and specific express informed consent for cashless stabilization procedures.",
    keyTakeaway: "Defines protocol and statutory consent requirements for emergency and trauma interventions.",
  },
];

export default function RegulationsPage() {
  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: PAPER, color: INK }}>
      {/* Top Header */}
      <header className="sticky top-0 z-50 px-5 sm:px-8 h-[68px] flex items-center justify-between border-b" style={{ backgroundColor: `${PAPER}F2`, backdropFilter: "blur(8px)", borderColor: RULE }}>
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" style={{ color: INK }} />
          <span className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: INK }}>Back to Home</span>
        </Link>
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-serif font-semibold text-lg tracking-tight" style={{ color: INK }}>ConsentGen</span>
          <span className="text-[10px] align-super" style={{ color: RED }}>®</span>
        </Link>
        <PublicNavActions label="Practitioner Portal" loggedInLabel="Dashboard" loggedInHref="/dashboard" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-12 pb-6 border-b" style={{ borderColor: RULE }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5" style={{ color: RED }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: RED }}>
              Public Statutory Directory
            </span>
          </div>
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl tracking-tight mb-4" style={{ color: INK }}>
            Medico-Legal Regulations & Statutory Frameworks
          </h1>
          <p className="text-base max-w-3xl leading-relaxed" style={{ color: MUTED }}>
            Every consent form rendered on ConsentGen is mathematically and textually verified against the six statutory pillars of Indian medical jurisprudence.
          </p>
        </div>

        {/* Statutes Cards */}
        <div className="space-y-6">
          {STATUTES.map((statute, i) => (
            <div
              key={statute.code}
              className="p-6 sm:p-8 rounded-md border"
              style={{ backgroundColor: SHEET, borderColor: RULE }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded"
                    style={{ backgroundColor: "rgba(190,61,42,0.08)", color: RED, border: "1px solid rgba(190,61,42,0.2)" }}
                  >
                    {statute.code}
                  </span>
                  <span className="font-mono text-xs font-semibold" style={{ color: MUTED }}>
                    {statute.clauses}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">§ 0{i + 1}</span>
              </div>

              <h2 className="font-serif font-bold text-xl sm:text-2xl mb-3" style={{ color: INK }}>
                {statute.title}
              </h2>

              <p className="text-[14.5px] leading-relaxed mb-4" style={{ color: "#3A362D" }}>
                {statute.summary}
              </p>

              <div className="flex items-start gap-2 pt-3 border-t text-xs font-mono" style={{ borderColor: "rgba(23,20,16,0.08)" }}>
                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span style={{ color: INK }}>
                  <strong>Practice Takeaway:</strong> {statute.keyTakeaway}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Supreme Court 4-Point Test Callout */}
        <div className="mt-12 p-8 rounded-md border" style={{ backgroundColor: INK, color: PAPER, borderColor: INK }}>
          <div className="flex items-center gap-2 mb-3">
            <Scales className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
              The Samira Kohli Four-Point Test
            </span>
          </div>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white mb-4">
            What Indian Courts Require for Defensible Consent
          </h3>
          <ol className="list-decimal pl-5 space-y-3 text-sm text-neutral-300 leading-relaxed">
            <li>
              <strong>Competency & Capacity:</strong> The patient must be an adult of sound mind, possessing the cognitive capacity to understand the consequences of consenting or refusing (BNS §§24–26).
            </li>
            <li>
              <strong>Adequate Disclosure:</strong> The doctor must disclose: (a) nature and procedure; (b) common and material risks; (c) alternatives; and (d) adverse consequences of refusal.
            </li>
            <li>
              <strong>Non-Extendability:</strong> Consent given for diagnostic or exploratory intervention cannot be extended to therapeutic excision unless imminent danger to life requires immediate action.
            </li>
            <li>
              <strong>Informed Voluntariness:</strong> Blanket or generic consent (&ldquo;I consent to whatever the doctor deems appropriate&rdquo;) is legally invalid and void ab initio.
            </li>
          </ol>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center py-8">
          <p className="font-serif font-semibold text-2xl mb-3" style={{ color: INK }}>
            Ready to generate compliant consent in your practice?
          </p>
          <p className="text-sm mb-6" style={{ color: MUTED }}>
            Experience 30-second drafting with real-time statutory audit.
          </p>
          <PublicCTA label="Start Generating Today" />
        </div>
      </main>
    </div>
  );
}
