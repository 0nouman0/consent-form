import Link from "next/link";
import { ShieldCheck, ArrowLeft, Scales, FileText, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Terms of Service — ConsentGen",
  description: "Terms of service and practitioner agreement for ConsentGen medico-legal documentation platform.",
};

const INK = "#171410";
const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const RED = "#BE3D2A";
const RULE = "rgba(23,20,16,0.15)";
const MUTED = "#7A7466";

export default function TermsPage() {
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
        <Link href="/login" className="px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] rounded" style={{ backgroundColor: INK, color: PAPER }}>
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-10 pb-6 border-b" style={{ borderColor: RULE }}>
          <div className="flex items-center gap-2 mb-3">
            <Scales className="w-5 h-5" style={{ color: RED }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: RED }}>
              Practitioner Agreement & Legal Terms
            </span>
          </div>
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: INK }}>
            Terms of Service
          </h1>
          <p className="font-mono text-xs" style={{ color: MUTED }}>
            Effective Date: January 1, 2026 · Governing Jurisdiction: New Delhi, India
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed" style={{ color: "#3A362D" }}>
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              1. Nature of the Platform and Eligibility
            </h2>
            <p>
              ConsentGen (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is an assistive clinical documentation tool engineered specifically for registered medical practitioners (&ldquo;RMPs&rdquo;), hospitals, nursing homes, and clinics operating within the Republic of India.
            </p>
            <p>
              By accessing or creating an account on ConsentGen, you represent and warrant that you are a qualified medical professional registered with the National Medical Commission (NMC) or an applicable State Medical Council, or an authorized representative acting on behalf of a licensed clinical establishment.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              2. Assistive Drafting Role & Clinician Duty
            </h2>
            <div className="p-4 rounded-md border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
              <p className="font-serif font-semibold text-sm mb-1" style={{ color: INK }}>
                Important Medico-Legal Notice
              </p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                ConsentGen generates structured drafts aligned with the Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations 2002 and the landmark judgment of the Hon’ble Supreme Court of India in <em>Samira Kohli v. Dr. Prabha Manchanda (2008) 2 SCC 1</em>. The software serves strictly as an administrative drafting aid and does NOT replace the treating physician’s statutory counseling duties.
              </p>
            </div>
            <p>
              The treating doctor remains solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>Personally counseling the patient or surrogate in a language they comprehend;</li>
              <li>Explaining the diagnosis, proposed procedure, material risks, known complications, and alternative treatments;</li>
              <li>Verifying the legal capacity and voluntariness of the signatory under Sections 24–30 of the Bharatiya Nyaya Sanhita 2023 (BNS);</li>
              <li>Reviewing, signing, and countersigning the generated document with exact date and time.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              3. Prohibition of Blanket & Unverified Consents
            </h2>
            <p>
              Under Indian law, &ldquo;blanket consent&rdquo; (&ldquo;I consent to any procedure the doctor deems fit&rdquo;) is legally void and constitutes actionable negligence. ConsentGen is architected to prohibit generic blanket consent. Users agree not to attempt to bypass procedural risk specifications or omit counseling disclosures.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              4. Credits, Billing, and Refunds
            </h2>
            <p>
              Consent generation operates on a credit system (1 credit = 1 bilingual paired consent draft). Credits may be purchased via authorized Indian payment gateways (Cashfree / UPI / Cards).
            </p>
            <p>
              Purchased credits do not expire as long as your account remains in good standing. In the event of a system error resulting in an unrendered document, the deducted credit is automatically reinstated or refunded upon notification to support.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              5. Limitation of Liability
            </h2>
            <p>
              While ConsentGen implements strict clause verification algorithms checking all 11 statutory elements, we do not provide legal representation. To the maximum extent permitted by Indian law, ConsentGen, its founders, and operators shall not be liable for any indirect, disciplinary, or consequential damages resulting from clinician omissions, patient misrepresentations, or disputes before Consumer Disputes Redressal Commissions or Medical Councils.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              6. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the substantive laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
            </p>
          </section>

          {/* Contact */}
          <div className="pt-8 border-t mt-12" style={{ borderColor: RULE }}>
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: MUTED }}>
              Contact Legal & Compliance
            </p>
            <p className="text-sm mt-1">
              For legal inquiries or statutory clarifications, contact: <span className="font-mono font-semibold" style={{ color: INK }}>compliance@consentgen.in</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
