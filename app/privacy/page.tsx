import Link from "next/link";
import { ShieldCheck, ArrowLeft, LockKey, FileLock, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import PublicNavActions from "@/components/PublicNavActions";

export const metadata = {
  title: "Privacy Policy — ConsentGen",
  description: "DPDP Act 2023 & Aadhaar Act compliant privacy policy for clinical consent generation.",
};

const INK = "#171410";
const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const RED = "#BE3D2A";
const RULE = "rgba(23,20,16,0.15)";
const MUTED = "#7A7466";

export default function PrivacyPage() {
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
        <PublicNavActions label="Sign In" loggedInLabel="Dashboard" loggedInHref="/dashboard" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-10 pb-6 border-b" style={{ borderColor: RULE }}>
          <div className="flex items-center gap-2 mb-3">
            <LockKey className="w-5 h-5" style={{ color: RED }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: RED }}>
              DPDP Act 2023 & Clinical Data Governance
            </span>
          </div>
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: INK }}>
            Privacy Policy
          </h1>
          <p className="font-mono text-xs" style={{ color: MUTED }}>
            Last Updated: January 1, 2026 · Compliant with DPDP Act 2023 & Aadhaar Act § 29
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed" style={{ color: "#3A362D" }}>
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              1. Our Data Protection Commitment
            </h2>
            <p>
              ConsentGen is engineered with privacy-by-design for the Indian medical community. We process health and consent documentation in accordance with the <strong>Digital Personal Data Protection Act 2023 (DPDP Act)</strong>, the <strong>Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act 2016</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              2. Data We Collect & Purpose Limitation
            </h2>
            <p>
              Under the DPDP Act principle of purpose limitation, we only collect data essential for rendering legally enforceable consent documentation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
                <p className="font-serif font-semibold text-sm mb-1.5" style={{ color: INK }}>Practitioner Data</p>
                <ul className="text-xs space-y-1" style={{ color: MUTED }}>
                  <li>• Clinician Full Name & Qualifications</li>
                  <li>• Medical Council Registration Number (NMC / State)</li>
                  <li>• Hospital / Clinical Establishment Name & Address</li>
                  <li>• Login credentials & audit authentication tokens</li>
                </ul>
              </div>
              <div className="p-4 rounded-md border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
                <p className="font-serif font-semibold text-sm mb-1.5" style={{ color: INK }}>Consent Generation Data</p>
                <ul className="text-xs space-y-1" style={{ color: MUTED }}>
                  <li>• Patient Name, Age, Gender, and Counseling Language</li>
                  <li>• Clinical Procedure, Stated Indications, and Known Risks</li>
                  <li>• Timestamps of drafting and signature execution</li>
                  <li>• Permanent Consent Reference ID (e.g. CG-xxxx)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              3. Mandatory Aadhaar Masking (§ 29 Compliance)
            </h2>
            <div className="p-4 rounded-md border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
              <p className="font-serif font-semibold text-sm mb-1" style={{ color: INK }}>
                Zero Raw Aadhaar Storage
              </p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                In strict compliance with Section 29 of the Aadhaar Act 2016 and UIDAI regulations, ConsentGen NEVER stores, renders, or logs unmasked 12-digit Aadhaar numbers. Any Aadhaar reference entered is masked automatically on client ingestion to display only the last 4 digits (e.g., <code>XXXX-XXXX-1234</code>).
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              4. Data Retention, Encryption & Security
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li><strong>Encryption in Transit:</strong> All HTTP traffic is protected by TLS 1.3 with Strict-Transport-Security (HSTS).</li>
              <li><strong>Encryption at Rest:</strong> Database records and saved consent histories are encrypted using AES-256.</li>
              <li><strong>Zero Advertising / Zero Reselling:</strong> Clinical data is NEVER monetized, shared with third-party advertisers, or used to train external public LLMs without explicit authorization.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              5. Rights of Data Principals (DPDP Act)
            </h2>
            <p>
              Practitioners and patients retain full rights under Chapter III of the DPDP Act 2023, including:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>The right to access a summary of personal data being processed;</li>
              <li>The right to correct, complete, or update outdated clinical establishment credentials;</li>
              <li>The right to request erasure of account records (subject to statutory medical record retention obligations under IMC Regulation 1.3 for 3 years).</li>
            </ul>
          </section>

          {/* Grievance Redressal */}
          <div className="pt-8 border-t mt-12" style={{ borderColor: RULE }}>
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: MUTED }}>
              Data Protection & Grievance Redressal
            </p>
            <p className="text-sm mt-1">
              Under Section 10 of the DPDP Act, contact our designated Grievance Officer at: <span className="font-mono font-semibold" style={{ color: INK }}>dpo@consentgen.in</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
