import Link from "next/link";
import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";
import PublicNavActions from "@/components/PublicNavActions";

export const metadata = {
  title: "Privacy Policy — ConsentGen",
  description:
    "How ConsentGen handles practitioner and consent data: what we collect, the AI and service providers that process it, how it is protected, and your rights under the DPDP Act 2023.",
};

const INK = "#171410";
const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const RED = "#BE3D2A";
const RULE = "rgba(23,20,16,0.15)";
const MUTED = "#7A7466";

const PROVIDERS: Array<{ name: string; role: string; data: string }> = [
  {
    name: "Groq, Inc. (United States)",
    role: "AI service. Restates procedure details in clear language, translates forms into other languages, and powers the Chat assistant.",
    data: "Clinical text from the form, the form text sent for translation, and chat messages (details in the AI section above).",
  },
  {
    name: "Supabase",
    role: "Database, sign-in (authentication) and storage.",
    data: "Account details, saved consent forms, generation audit records, credit and payment records.",
  },
  {
    name: "Cashfree Payments",
    role: "Payment processing for credit purchases.",
    data: "Order amount, order and payment identifiers, and your name and email for the order. Card, UPI and bank details are entered with Cashfree and never reach our servers.",
  },
  {
    name: "Email delivery provider",
    role: "Sends transactional email (sign-up confirmation, password reset, purchase invoices).",
    data: "Your email address and the content of the message.",
  },
  {
    name: "Hosting provider",
    role: "Runs the ConsentGen application.",
    data: "Technical request data needed to serve pages (such as IP address) in standard server logs.",
  },
];

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
          <span className="text-xs align-super" style={{ color: RED }}>®</span>
        </Link>
        <PublicNavActions label="Sign In" loggedInLabel="Dashboard" loggedInHref="/dashboard" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-10 pb-6 border-b" style={{ borderColor: RULE }}>
          <div className="flex items-center gap-2 mb-3">
            <LockKey className="w-5 h-5" style={{ color: RED }} />
            <span className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: RED }}>
              DPDP Act 2023 & Clinical Data Governance
            </span>
          </div>
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: INK }}>
            Privacy Policy
          </h1>
          <p className="font-mono text-xs" style={{ color: MUTED }}>
            Last updated: 13 November 2026 · Prepared with reference to the DPDP Act 2023 and the Aadhaar Act 2016
          </p>
          <p className="font-mono text-xs mt-1" style={{ color: MUTED }}>
            13 Nov 2026: named our AI service provider and other processors, clarified how data is encrypted, and described analytics and error reports.
          </p>
        </div>

        <div className="space-y-10 text-base leading-relaxed" style={{ color: "#3A362D" }}>
          {/* 1 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              1. Our Data Protection Commitment
            </h2>
            <p>
              ConsentGen is designed for the Indian medical community with privacy in mind. We handle health and consent documentation with reference to the <strong>Digital Personal Data Protection Act 2023 (DPDP Act)</strong>, the <strong>Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act 2016</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011</strong>.
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              The treating doctor or institution decides what patient information is entered into a form and is responsible for having the patient&apos;s permission to record it. ConsentGen processes that information on the doctor&apos;s behalf to produce the form.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              2. Data We Collect & Purpose Limitation
            </h2>
            <p>
              We collect only what is needed to create, store and deliver consent documentation and to run your account:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
                <p className="font-serif font-semibold text-sm mb-1.5" style={{ color: INK }}>Practitioner &amp; Account Data</p>
                <ul className="text-xs space-y-1" style={{ color: MUTED }}>
                  <li>• Clinician full name and email address</li>
                  <li>• Medical Council registration number (NMC / State)</li>
                  <li>• Hospital or clinic name, address and billing address</li>
                  <li>• Sign-in credentials (the password is stored only as a hash by our authentication provider)</li>
                  <li>• Credit purchases, order identifiers and invoices</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
                <p className="font-serif font-semibold text-sm mb-1.5" style={{ color: INK }}>Consent Form Data</p>
                <ul className="text-xs space-y-1" style={{ color: MUTED }}>
                  <li>• Patient or participant name, age, sex and counselling language</li>
                  <li>• Hospital OPD/IPD number, and insurance provider and policy number if entered</li>
                  <li>• Guardian name and relationship, where the patient is a minor</li>
                  <li>• Last four digits of an Aadhaar number, if entered (see section 4)</li>
                  <li>• Diagnosis, procedure, risks, alternatives and clinician notes</li>
                  <li>• Consent reference ID (for example APOL-20261113-7F3A91C2) and timestamps</li>
                  <li>• The generated form text, and an audit record of each generation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              3. AI Processing & Service Providers
            </h2>
            <p>
              ConsentGen uses a third-party AI service, <strong>Groq, Inc.</strong>, a company based in the United States, through its API. Its servers may process requests in data centres inside or outside India. We send it only what each feature needs:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>Procedure details.</strong> To restate a clinician&apos;s notes in clear language we send the procedure name, diagnosis, consent type, and the risks, alternatives and notes the clinician typed. <strong>The patient&apos;s name, age, sex, identification numbers and Aadhaar digits are not sent for this step.</strong>
              </li>
              <li>
                <strong>Translation.</strong> When a form is produced in a language other than English, the text of the form is sent to be translated. <strong>That text includes the patient&apos;s (or participant&apos;s) name, the guardian&apos;s name where a guardian signs, and the treating clinician&apos;s name and registration number</strong> (the principal investigator&apos;s name on research forms), because they appear in the declarations and signature lines. It does not include age, sex, OPD/IPD number, insurance details or Aadhaar digits.
              </li>
              <li>
                <strong>Chat assistant.</strong> Whatever you type into the chat is sent to answer you. Please do not enter patient names or identifiers in chat.
              </li>
            </ul>
            <p className="text-sm">
              If you prefer that a patient&apos;s full name does not leave our servers for translation, enter initials or a reference in the name field. The form shows exactly what you enter.
            </p>
            <p className="text-sm">
              We do not ask the AI provider to train models on this content. How the provider handles requests is governed by its own terms and privacy policy, available on its website (groq.com). AI-generated wording, including translations, must always be reviewed by the treating clinician before use.
            </p>

            <p className="font-serif font-semibold text-sm pt-2" style={{ color: INK }}>Who else processes your data</p>
            <div className="grid grid-cols-1 gap-3">
              {PROVIDERS.map((p) => (
                <div key={p.name} className="p-4 rounded-xl border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
                  <p className="font-serif font-semibold text-sm mb-1" style={{ color: INK }}>{p.name}</p>
                  <p className="text-xs leading-relaxed" style={{ color: INK }}>{p.role}</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: MUTED }}>Data: {p.data}</p>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Some of these providers may store or process data outside India. We do not sell personal data and do not share it with advertisers.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              4. Aadhaar Handling (§ 29)
            </h2>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: SHEET, borderColor: RULE }}>
              <p className="font-serif font-semibold text-sm mb-1" style={{ color: INK }}>
                Last four digits only
              </p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                ConsentGen has no field for a full Aadhaar number. The form accepts only the last four digits and displays them as <code>XXXX-XXXX-1234</code>. We never ask for, store, display or log a full 12-digit Aadhaar number.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              5. Analytics & Error Reports
            </h2>
            <p>
              To understand which parts of ConsentGen work and which break, we keep our own simple usage and error records. We do not use advertising trackers or third-party analytics.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li><strong>Usage events:</strong> page views and key actions (for example sign-up completed, form generated, PDF downloaded, payment succeeded) with the page path, where a visit came from (referrer site and campaign tags), and a random identifier that lasts only for the browser tab. We do not record IP addresses in these events and never record the content of forms. Events our servers record while you are signed in (such as a form being generated or a payment succeeding) are linked to your account identifier, so we can count active users and fix problems.</li>
              <li><strong>Error reports:</strong> when something fails we record a technical message and the page or feature involved, plus your account identifier when you are signed in, so we can fix the problem. Email addresses and long digit sequences are masked, and form content is not included.</li>
              <li><strong>Do Not Track:</strong> if your browser sends a Do Not Track signal we do not record usage events.</li>
              <li><strong>Cookies:</strong> we use only the cookies needed to keep you signed in and remember your preferences.</li>
              <li><strong>Retention:</strong> usage events and error reports are deleted automatically after 12 months.</li>
            </ul>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              6. Retention, Encryption & Security
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>In transit:</strong> all traffic uses HTTPS (TLS), with Strict-Transport-Security (HSTS) enforced.</li>
              <li><strong>At rest, platform level:</strong> our database provider encrypts stored data at rest.</li>
              <li><strong>At rest, application level:</strong> the patient name kept in the generation audit trail is additionally encrypted with a key held separately from the database.</li>
              <li><strong>Saved consent forms</strong> are protected by access controls: only the doctor who created a form, and authorised ConsentGen administrators, can read it. They are not individually encrypted at the application level, so a person with administrative access to the database could read them.</li>
              <li><strong>Administrator access</strong> to the patient name in the audit trail is limited to administrator accounts.</li>
              <li><strong>Retention:</strong> saved consent forms are kept until you delete them or ask us to close your account, subject to the statutory record-retention requirements below. No system is completely secure; we cannot guarantee absolute security.</li>
            </ul>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: INK }}>
              7. Rights of Data Principals (DPDP Act)
            </h2>
            <p>
              Practitioners, and patients through their treating practitioner or by writing to us, have rights under Chapter III of the DPDP Act 2023, including:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>The right to access a summary of personal data being processed;</li>
              <li>The right to correct, complete, or update inaccurate or outdated data;</li>
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
