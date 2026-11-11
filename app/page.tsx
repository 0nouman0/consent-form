"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";
import { List, X, CheckCircle, ShieldCheck, Translate, Clock } from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════════════════
   CONSENTGEN — LANDING
   Editorial paper-and-ink system. Typography does the work.
   Palette: paper / ink / one stamp red.
═══════════════════════════════════════════════════════════ */

const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const INK = "#171410";
const MUTED = "#7A7466";
const RULE = "rgba(23,20,16,0.15)";
const RULE_SOFT = "rgba(23,20,16,0.08)";
const RED = "#BE3D2A";

function Accent({ children }: { children: ReactNode }) {
  return <span style={{ color: RED }}>{children}</span>;
}

/* ─── DATA ─── */

const FRAMEWORKS = [
  { code: "IMC 2002", name: "Indian Medical Council (Professional Conduct) Regulations", ref: "Cl. 7.16 / 7.17" },
  { code: "BNS 2023", name: "Bharatiya Nyaya Sanhita — consent capacity & validity", ref: "§§ 24–30" },
  { code: "MoRTH 2025", name: "Cashless Treatment of Road Accident Victims Scheme", ref: "S.O. 2489(E)" },
  { code: "CPA 2019", name: "Consumer Protection Act — medical negligence provisions", ref: "Ch. VI" },
  { code: "AADHAAR 2016", name: "Aadhaar Act — mandatory data masking for private entities", ref: "§ 29" },
  { code: "DPDP 2023", name: "Digital Personal Data Protection Act — health data consent", ref: "§§ 4–9" },
];

const CLAUSES = [
  { n: "01", title: "Authorization", basis: "Treating without consent is assault in law" },
  { n: "02", title: "Disclosure & Comprehension", basis: "IMC Regulation 3.1 — patient's own language" },
  { n: "03", title: "Risks & Complications", basis: "Informed consent element 5" },
  { n: "04", title: "Alternatives to Treatment", basis: "Informed consent element 4" },
  { n: "05", title: "Anaesthesia & Blood Transfusion", basis: "Express consent required — Rules 3 & 4" },
  { n: "06", title: "Disposal of Tissues", basis: "Pathological examination requires consent" },
  { n: "07", title: "Photography / Academic Use", basis: "IMC Ethics — identity confidentiality" },
  { n: "08", title: "Voluntariness & Right to Withdraw", basis: "BNS § 27 — fear vitiates consent" },
  { n: "09", title: "Capacity Validation", basis: "BNS §§ 24–26 — age, soundness, sobriety" },
  { n: "10", title: "Information Receipt", basis: "Duty to provide all relevant information" },
  { n: "11", title: "Signatures with Date & Time", basis: "Missing timestamps lose negligence cases" },
];

const SECTIONS = [
  {
    num: "§ 01",
    tag: "Drafting",
    title: ["Thirty seconds,", "clause by clause."],
    body:
      "Enter the patient, the procedure, and the counseling language. The engine drafts a complete consent form — every mandatory clause present, every signature block timestamped, the procedure named exactly as you typed it. Blanket consent is void in Indian law; ConsentGen never writes it.",
    metric: { value: "30 s", label: "average generation, down from 30 minutes of manual drafting" },
    type: "stream",
  },
  {
    num: "§ 02",
    tag: "Verification",
    title: ["Nothing signed", "before it's checked."],
    body:
      "A live clause register audits the draft as it streams in — authorization, risk disclosure, alternatives, withdrawal rights, capacity. Anything missing is flagged before the form ever reaches a patient. The checklist follows the same eleven clauses courts look for.",
    metric: { value: "11", label: "mandatory clauses verified against Supreme Court precedent" },
    type: "checklist",
  },
  {
    num: "§ 03",
    tag: "Language",
    title: ["Counseled in Hindi,", "filed in English."],
    body:
      "Indian courts require proof the patient understood in their own tongue. ConsentGen generates the complete document twice — once in English for the hospital record, once in any of 11 regional Indian languages for the patient — with the counseling language affirmed on the face of the document. 12 languages total: English plus Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, and Urdu.",
    metric: { value: "12", label: "languages total — English plus 11 regional Indian languages" },
    type: "bilingual",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set your practice once",
    body: "Your name, registration number, and hospital live in your profile. Every form inherits them — you never type them again.",
  },
  {
    n: "02",
    title: "Describe the procedure",
    body: "A guided six-step record: patient, competency, identifiers, procedure, risks. Autocomplete fills known risks for 40+ common procedures.",
  },
  {
    n: "03",
    title: "Generate, verify, sign",
    body: "The form streams in, clauses are checked live, and you export to PDF, Word, or print — filed to history with a permanent consent ID.",
  },
];

const STATS = [
  { value: "10", suffix: "types", label: "Surgical, obstetric, psychiatric, telemedicine, research & more" },
  { value: "12", suffix: "languages", label: "English + 11 regional Indian languages with counseling language on record" },
  { value: "6", suffix: "frameworks", label: "IMC, BNS, MoRTH, CPA, Aadhaar Act, DPDP" },
  { value: "40", suffix: "+ procedures", label: "Pre-mapped risk libraries with autocomplete" },
];

/* ─── PRIMITIVES ─── */

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add("is-visible");
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      show();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);

    const onScroll = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        show();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function MonoLabel({ children, red = false }: { children: ReactNode; red?: boolean }) {
  return (
    <span
      className="font-mono text-[11px] uppercase tracking-[0.18em]"
      style={{ color: red ? RED : MUTED }}
    >
      {children}
    </span>
  );
}

function InkButton({ href, children, invert = false }: { href: string; children: ReactNode; invert?: boolean }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.16em] transition-colors duration-300"
      style={{
        backgroundColor: invert ? PAPER : INK,
        color: invert ? INK : PAPER,
        borderRadius: "2px",
      }}
    >
      {children}
      <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.16em] transition-colors duration-300 hover:bg-[#171410] hover:text-[#F4F1E9]"
      style={{ color: INK, border: `1px solid ${RULE}`, borderRadius: "2px" }}
    >
      {children}
    </Link>
  );
}

/* ─── DOCUMENT SPECIMEN (hero artifact) ─── */

function Specimen() {
  return (
    <div className="relative select-none max-w-[420px] w-full mx-auto" aria-hidden>
      {/* Sheet behind */}
      <div
        className="absolute inset-0 translate-x-2 sm:translate-x-3 translate-y-2 sm:translate-y-3 rotate-[1.2deg] pointer-events-none"
        style={{ backgroundColor: SHEET, border: `1px solid ${RULE_SOFT}` }}
      />
      {/* Main sheet */}
      <div
        className="relative p-6 sm:p-8"
        style={{ backgroundColor: SHEET, border: `1px solid ${RULE}`, boxShadow: "0 24px 48px -24px rgba(23,20,16,0.25)" }}
      >
        {/* Doc header */}
        <div className="flex items-baseline justify-between pb-3 mb-4" style={{ borderBottom: `1px solid ${INK}` }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: INK }}>
            Form CG-01
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
            Consent ID · SRPX-4407
          </span>
        </div>

        <p className="text-center text-[13px] uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: INK }}>
          Standard Informed Consent
        </p>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] mb-5" style={{ color: MUTED }}>
          Surgical procedure · Bilingual — English / हिन्दी
        </p>

        {/* Fields */}
        {[
          ["Patient", "Anita Deshmukh"],
          ["Age / Sex", "42 · Female"],
          ["Procedure", "Laparoscopic Cholecystectomy"],
          ["Counseled in", "Hindi"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 py-1.5" style={{ borderBottom: `1px solid ${RULE_SOFT}` }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] w-24 shrink-0" style={{ color: MUTED }}>
              {k}
            </span>
            <span className="text-[14.5px] font-serif font-medium" style={{ color: INK }}>
              {v}
            </span>
          </div>
        ))}

        {/* Clause excerpt */}
        <p className="mt-5 mb-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
          Cl. 08 — Voluntariness
        </p>
        <p className="text-[12px] leading-[1.7]" style={{ color: "#4A463C", textAlign: "justify" }}>
          I confirm this consent is given freely, without coercion, and that I retain the right to withdraw
          it at any time before the procedure begins, per BNS § 27. The procedure named above is the only
          procedure authorised by this document.
        </p>

        {/* Signature row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-[20px] font-serif font-medium leading-none mb-1 pl-1" style={{ color: INK }}>
              A. Deshmukh
            </p>
            <div style={{ borderTop: `1px solid ${INK}` }} className="pt-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Patient · Date & Time
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div style={{ borderTop: `1px solid ${INK}` }} className="pt-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Physician · Reg. No.
              </span>
            </div>
          </div>
        </div>

        {/* Stamp clamped within mobile bounds */}
        <div
          className="absolute right-2 sm:-right-2 top-28 sm:top-36 rotate-[6deg] sm:rotate-[8deg] px-2.5 sm:px-3.5 py-2 text-center"
          style={{ border: `2px solid ${RED}`, borderRadius: "3px", backgroundColor: "rgba(252,251,247,0.96)", boxShadow: "0 4px 12px rgba(190,61,42,0.15)" }}
        >
          <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.22em] leading-tight" style={{ color: RED }}>
            Verified
          </p>
          <p className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] leading-tight mt-0.5" style={{ color: RED }}>
            IMC 2002
          </p>
          <div className="my-1" style={{ borderTop: `1px solid ${RED}` }} />
          <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-[0.18em] leading-tight" style={{ color: RED }}>
            11/11 clauses
          </p>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        Fig. 01 — Generated in 28.4 seconds. Streamed, verified, filed.
      </p>
    </div>
  );
}

/* ─── METHOD PREVIEW CARDS (fills empty right space) ─── */

function MethodVisualCard({ type }: { type: string }) {
  if (type === "stream") {
    return (
      <div
        className="w-full max-w-[340px] p-5 rounded-sm border"
        style={{ backgroundColor: SHEET, borderColor: RULE, boxShadow: "0 12px 24px -12px rgba(23,20,16,0.15)" }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: RED }}>
            <Clock size={13} weight="bold" /> Live Clause Stream
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            ACTIVE
          </span>
        </div>
        <div className="space-y-2 text-left font-mono text-[11px]">
          <div className="p-2 rounded bg-[#F4F1E9]/60 flex items-center justify-between">
            <span style={{ color: INK }}>Cl. 01 Authorization</span>
            <span className="text-emerald-700 font-semibold text-[10px]">✓ DRAFTED</span>
          </div>
          <div className="p-2 rounded bg-[#F4F1E9]/60 flex items-center justify-between">
            <span style={{ color: INK }}>Cl. 05 Anaesthesia</span>
            <span className="text-emerald-700 font-semibold text-[10px]">✓ DRAFTED</span>
          </div>
          <div className="p-2 rounded bg-[#F4F1E9]/60 flex items-center justify-between">
            <span style={{ color: INK }}>Cl. 08 Voluntariness</span>
            <span className="text-emerald-700 font-semibold text-[10px]">✓ DRAFTED</span>
          </div>
          <div className="p-2 rounded bg-amber-50/60 flex items-center justify-between border border-amber-200/50">
            <span style={{ color: INK }}>Cl. 11 Timestamps</span>
            <span className="text-amber-700 font-semibold text-[10px] animate-pulse">● STREAMING</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "checklist") {
    return (
      <div
        className="w-full max-w-[340px] p-5 rounded-sm border"
        style={{ backgroundColor: SHEET, borderColor: RULE, boxShadow: "0 12px 24px -12px rgba(23,20,16,0.15)" }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: INK }}>
            <ShieldCheck size={14} weight="bold" style={{ color: RED }} /> 11-Point Register Audit
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            11/11 PASS
          </span>
        </div>
        <div className="space-y-1.5 text-left text-[12px] font-sans">
          {[
            { text: "Specific procedure named (no blanket consent)", ref: "Samira Kohli (SC)" },
            { text: "Complications & reasonable alternatives disclosed", ref: "IMC Reg. 7.16" },
            { text: "Patient capacity & sobriety affirmed", ref: "BNS §§ 24–26" },
            { text: "Uncoerced withdrawal right acknowledged", ref: "BNS § 27" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 py-1 border-b border-black/5 last:border-b-0">
              <CheckCircle size={15} weight="fill" className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="leading-tight text-[12px]" style={{ color: INK }}>{item.text}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>{item.ref}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[340px] p-5 rounded-sm border"
      style={{ backgroundColor: SHEET, borderColor: RULE, boxShadow: "0 12px 24px -12px rgba(23,20,16,0.15)" }}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: INK }}>
          <Translate size={14} weight="bold" style={{ color: RED }} /> Dual-Record Output
        </span>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
          BILINGUAL
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-left">
        <div className="p-2.5 rounded bg-[#F4F1E9]/70 border border-black/5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] mb-1 font-semibold" style={{ color: MUTED }}>Hospital Copy</p>
          <p className="font-serif text-[11px] leading-snug" style={{ color: INK }}>English record filed with permanent SHA-256 consent hash.</p>
        </div>
        <div className="p-2.5 rounded bg-[#F4F1E9]/70 border border-black/5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] mb-1 font-semibold" style={{ color: RED }}>Patient Copy</p>
          <p className="font-serif text-[11px] leading-snug" style={{ color: INK }}>हिन्दी / বাংলা / தமிழ் in verified vernacular script.</p>
        </div>
      </div>
      <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-center" style={{ color: MUTED }}>
        Counseling language affirmed on face of record
      </p>
    </div>
  );
}

/* ─── PAGE ─── */

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.classList.add("js-anim");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsLoggedIn(!!session?.user)
    );
    return () => subscription.unsubscribe();
  }, []);

  const primaryHref = isLoggedIn ? "/generate" : "/login?redirect=/generate";

  return (
    <div ref={rootRef} className="landing min-h-screen font-body overflow-x-clip" style={{ backgroundColor: PAPER, color: INK }}>

      {/* ══ TICKER ══ */}
      <div className="overflow-hidden py-2" style={{ backgroundColor: RED }}>
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 items-center">
              {FRAMEWORKS.map((f) => (
                <span key={`${i}-${f.code}`} className="flex items-center font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: PAPER }}>
                  <span className="px-6">{f.code}</span>
                  <span style={{ color: "rgba(244,241,233,0.55)" }}>✳</span>
                </span>
              ))}
              <span className="flex items-center font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: PAPER }}>
                <span className="px-6">Compliant by construction</span>
                <span style={{ color: "rgba(244,241,233,0.55)" }}>✳</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ NAV ══ */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: `${PAPER}F2`, backdropFilter: "blur(8px)", borderBottom: `1px solid ${RULE}` }}>
        <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-5 sm:px-8 h-[68px]">
          <Link href="/" className="inline-flex items-center gap-1 shrink-0">
            <span className="text-[22px] font-serif font-semibold tracking-tight" style={{ color: INK }}>
              ConsentGen
            </span>
            <span className="text-[10px] font-mono leading-none align-super font-bold" style={{ color: RED }}>®</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {[
              ["The form", "#anatomy"],
              ["Method", "#method"],
              ["Process", "#process"],
              ["Regulations", "/regulations"],
            ].map(([label, href]) => (
              href.startsWith("#") ? (
                <a key={href} href={href} className="link-rule font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                  {label}
                </a>
              ) : (
                <Link key={href} href={href} className="link-rule font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                  {label}
                </Link>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {isLoggedIn === true ? (
              <>
                <Link href="/dashboard" className="link-rule font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                  Dashboard
                </Link>
                <UserMenu compact />
              </>
            ) : (
              <>
                <Link href="/login" className="link-rule font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                  Sign in
                </Link>
                <Link
                  href={primaryHref}
                  className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
                  style={{ backgroundColor: INK, color: PAPER, borderRadius: "2px" }}
                >
                  Start
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href={primaryHref}
              className="px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
              style={{ backgroundColor: INK, color: PAPER, borderRadius: "2px" }}
            >
              Start
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 rounded border transition-colors"
              style={{ borderColor: RULE, color: INK, backgroundColor: SHEET }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-b px-5 py-6 space-y-4"
            style={{ backgroundColor: SHEET, borderColor: RULE }}
          >
            <div className="flex flex-col space-y-3">
              {[
                ["The form", "#anatomy"],
                ["Method", "#method"],
                ["Process", "#process"],
                ["Regulations", "/regulations"],
              ].map(([label, href]) => (
                href.startsWith("#") ? (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-[18px] py-1 border-b border-black/5"
                    style={{ color: INK }}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-[18px] py-1 border-b border-black/5"
                    style={{ color: INK }}
                  >
                    {label}
                  </Link>
                )
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] border"
                    style={{ borderColor: RULE, color: INK }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/generate"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 font-mono text-[12px] uppercase tracking-[0.14em]"
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    Generate Form
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] border"
                    style={{ borderColor: RULE, color: INK }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 font-mono text-[12px] uppercase tracking-[0.14em]"
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══ */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pt-12 sm:pt-20 pb-16 sm:pb-20 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <Reveal>
              <MonoLabel red>For registered medical practitioners · India</MonoLabel>
            </Reveal>
            <Reveal delay={80}>
              <h1
                className="mt-6 font-serif font-semibold text-[13vw] sm:text-[76px] lg:text-[88px] leading-[0.98] tracking-[-0.02em]"
                style={{ color: INK }}
              >
                Consent, drafted
                <br />
                to the letter
                <br />
                <Accent>of the law.</Accent>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 max-w-[48ch] text-[16px] leading-[1.7]" style={{ color: MUTED }}>
                ConsentGen turns clinical procedure details into complete, medico-legally sound informed
                consent — every clause present, every signature timestamped, in English and 11 regional
                Indian languages (12 total). Thirty seconds, not thirty minutes.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <InkButton href={primaryHref}>Generate a form</InkButton>
                <GhostButton href="#anatomy">Read the anatomy</GhostButton>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-12 sm:mt-14 flex flex-wrap gap-x-8 gap-y-3">
                {["Est. 30 s / form", "10 consent types", "12 languages (EN + 11 IN)"].map((t) => (
                  <span key={t} className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <Reveal delay={200} className="w-full">
              <Specimen />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ FRAMEWORK INDEX ══ */}
      <section style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-14">
          <Reveal>
            <div className="flex items-baseline justify-between mb-8">
              <MonoLabel>Index of frameworks</MonoLabel>
              <MonoLabel>06 statutory instruments</MonoLabel>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ borderTop: `1px solid ${RULE}` }}>
            {FRAMEWORKS.map((f, i) => (
              <Reveal key={f.code} delay={i * 60}>
                <div
                  className="py-5 pr-6 h-full"
                  style={{ borderBottom: `1px solid ${RULE}` }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: INK }}>
                      {f.code}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: RED }}>
                      {f.ref}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-snug" style={{ color: MUTED }}>
                    {f.name}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CLAUSE ANATOMY ══ */}
      <section id="anatomy" style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <MonoLabel red>The form, dissected</MonoLabel>
                <h2 className="mt-5 font-serif font-semibold text-[42px] sm:text-[52px] leading-[1.02] tracking-[-0.01em]" style={{ color: INK }}>
                  Anatomy of a<br />
                  <Accent>defensible</Accent> consent.
                </h2>
                <p className="mt-6 max-w-[38ch] text-[15px] leading-[1.7]" style={{ color: MUTED }}>
                  Eleven clauses decide whether a consent form protects you in court. ConsentGen
                  writes all of them, every time — and shows you the register while it works.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div style={{ borderTop: `1px solid ${INK}` }}>
              {CLAUSES.map((c, i) => (
                <Reveal key={c.n} delay={Math.min(i * 40, 240)}>
                  <div
                    className="clause-row group grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-4 px-3 sm:px-5 py-4 cursor-default"
                    style={{ borderBottom: `1px solid ${RULE}` }}
                  >
                    <span className="font-mono text-[11px] tracking-[0.12em] transition-colors duration-300 group-hover:text-[#F4F1E9]/70" style={{ color: MUTED }}>
                      Cl. {c.n}
                    </span>
                    <span className="font-serif font-medium text-[19px] sm:text-[22px] leading-tight transition-colors duration-300 group-hover:text-[#F4F1E9]" style={{ color: INK }}>
                      {c.title}
                    </span>
                    <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.1em] text-right max-w-[240px] transition-colors duration-300 group-hover:text-[#F4F1E9]/60" style={{ color: MUTED }}>
                      {c.basis}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
                Register audited live during generation — missing clauses are flagged before signature.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ METHOD — §01–03 ══ */}
      <section id="method" style={{ borderTop: `1px solid ${RULE}` }}>
        {SECTIONS.map((s, idx) => (
          <div key={s.num} style={idx > 0 ? { borderTop: `1px solid ${RULE}` } : undefined}>
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-2">
                <Reveal>
                  <span className="font-mono text-[13px] tracking-[0.1em]" style={{ color: RED }}>{s.num}</span>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
                    {s.tag}
                  </p>
                </Reveal>
              </div>
              <div className={`lg:col-span-5 ${idx % 2 === 1 ? "lg:order-3" : ""}`}>
                <Reveal delay={60}>
                  <h3 className="font-serif font-semibold text-[36px] sm:text-[48px] leading-[1.04] tracking-[-0.01em]" style={{ color: INK }}>
                    {s.title[0]}
                    <br />
                    <Accent>{s.title[1]}</Accent>
                  </h3>
                  <p className="mt-6 max-w-[50ch] text-[15.5px] leading-[1.75]" style={{ color: MUTED }}>
                    {s.body}
                  </p>
                  <div className="mt-8 flex items-baseline gap-4">
                    <span className="font-serif font-semibold text-[56px] leading-none" style={{ color: INK }}>
                      {s.metric.value}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] leading-snug max-w-[26ch]" style={{ color: MUTED }}>
                      {s.metric.label}
                    </span>
                  </div>
                </Reveal>
              </div>
              <div className={`lg:col-span-5 flex justify-center lg:justify-end ${idx % 2 === 1 ? "lg:order-2 lg:justify-start" : ""}`}>
                <Reveal delay={140} className="w-full flex justify-center lg:justify-end">
                  <MethodVisualCard type={s.type} />
                </Reveal>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ PROCESS ══ */}
      <section id="process" style={{ borderTop: `1px solid ${RULE}`, backgroundColor: SHEET }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-20 sm:py-28">
          <Reveal>
            <div className="flex items-baseline justify-between mb-12">
              <h2 className="font-serif font-semibold text-[42px] sm:text-[52px] leading-[1.02] tracking-[-0.01em]" style={{ color: INK }}>
                Three steps. <Accent>No template hunting.</Accent>
              </h2>
              <MonoLabel>Procedure</MonoLabel>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderTop: `1px solid ${INK}` }}>
            {STEPS.map((st, i) => (
              <Reveal key={st.n} delay={i * 100}>
                <div
                  className="py-10 md:pr-10 h-full"
                  style={{
                    borderBottom: `1px solid ${RULE}`,
                  }}
                >
                  <span className="font-serif font-semibold text-[64px] leading-none" style={{ color: "rgba(23,20,16,0.18)" }}>
                    {st.n}
                  </span>
                  <h3 className="mt-5 font-serif font-semibold text-[22px]" style={{ color: INK }}>
                    {st.title}
                  </h3>
                  <p className="mt-3 max-w-[36ch] text-[14px] leading-[1.7]" style={{ color: MUTED }}>
                    {st.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ JURISPRUDENCE QUOTE (Replaces placeholder testimonial) ══ */}
      <section style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[980px] px-5 sm:px-8 py-24 sm:py-32 text-center">
          <Reveal>
            <span className="text-[28px]" style={{ color: RED }}>✳</span>
            <blockquote className="mt-8 font-serif font-medium text-[26px] sm:text-[38px] leading-[1.3] tracking-[-0.01em]" style={{ color: INK }}>
              “A doctor has to seek and secure the consent of the patient before commencing a treatment...
              Consent so given should be real and valid, based on adequate information concerning the nature
              of the condition, proposed treatment, alternatives, and <Accent>substantial risks</Accent>.”
            </blockquote>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: INK }}>
              Supreme Court of India
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em]" style={{ color: MUTED }}>
              Samira Kohli v. Dr. Prabha Manchanda (2008) 2 SCC 1 · Landmark Medico-Legal Ruling
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATS.map((st, i) => (
              <Reveal key={st.suffix} delay={i * 80}>
                <div
                  className="py-12 sm:py-16 pr-6"
                  style={{ borderLeft: i % 2 === 1 ? `1px solid ${RULE}` : undefined, paddingLeft: i % 2 === 1 ? "1.5rem" : undefined }}
                >
                  <p className="leading-none">
                    <span className="font-serif font-semibold text-[64px] sm:text-[80px] tracking-[-0.02em]" style={{ color: INK }}>
                      {st.value}
                    </span>
                    <span className="ml-2 font-serif text-[18px]" style={{ color: RED }}>
                      {st.suffix}
                    </span>
                  </p>
                  <p className="mt-4 max-w-[24ch] font-mono text-[10px] uppercase tracking-[0.14em] leading-[1.8]" style={{ color: MUTED }}>
                    {st.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ backgroundColor: SHEET, borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-24 sm:py-32">
          <Reveal>
            <MonoLabel red>Begin</MonoLabel>
            <h2 className="mt-6 font-serif font-semibold text-[12vw] sm:text-[72px] lg:text-[92px] leading-[1.0] tracking-[-0.01em]" style={{ color: INK }}>
              Stop drafting.
              <br />
              <Accent>Start generating.</Accent>
            </h2>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <InkButton href={primaryHref}>
                Generate your first form
              </InkButton>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
                1 credit = 1 form · No card required to start
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ backgroundColor: SHEET, borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14">
            <div className="col-span-2 md:col-span-1">
              <p className="font-serif font-semibold text-[20px]" style={{ color: INK }}>
                ConsentGen<span className="text-[10px] font-mono align-super" style={{ color: RED }}>®</span>
              </p>
              <p className="mt-3 max-w-[28ch] text-[12.5px] leading-[1.7]" style={{ color: MUTED }}>
                Medico-legal consent documentation for Indian clinical practice.
              </p>
            </div>
            {[
              { h: "Product", links: [["Generate", "/generate"], ["Templates", "/templates"], ["History", "/history"], ["Chat", "/chat"]] },
              { h: "Compliance & Law", links: [["Regulations", "/regulations"], ["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"], ["The form", "#anatomy"], ["Method", "#method"]] },
              { h: "Account", links: [["Sign in", "/login"], ["Dashboard", "/dashboard"], ["Credits", "/credits"]] },
            ].map((col) => (
              <div key={col.h}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: MUTED }}>
                  {col.h}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith("#") ? (
                        <a href={href} className="link-rule text-[13.5px]" style={{ color: "#4A463C" }}>
                          {label}
                        </a>
                      ) : (
                        <Link href={href} className="link-rule text-[13.5px]" style={{ color: "#4A463C" }}>
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-5" style={{ borderTop: `1px solid ${RULE}` }}>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                © {new Date().getFullYear()} ConsentGen
              </span>
              <Link href="/terms" className="font-mono text-[10px] uppercase tracking-[0.16em] hover:underline" style={{ color: MUTED }}>
                Terms
              </Link>
              <Link href="/privacy" className="font-mono text-[10px] uppercase tracking-[0.16em] hover:underline" style={{ color: MUTED }}>
                Privacy
              </Link>
              <Link href="/regulations" className="font-mono text-[10px] uppercase tracking-[0.16em] hover:underline" style={{ color: MUTED }}>
                Regulations
              </Link>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              Made for Indian practice ✳ IMC · BNS · MoRTH · DPDP
            </span>
          </div>

          {/* Wordmark */}
          <div className="overflow-hidden -mb-2 [container-type:inline-size]" aria-hidden>
            <p
              className="text-center whitespace-nowrap font-serif font-semibold leading-[0.78] tracking-[-0.02em] translate-y-[12%] select-none"
              style={{
                fontSize: "clamp(2.75rem, 13cqw, 240px)",
                backgroundImage: `linear-gradient(100deg, ${INK} 0%, ${RED} 50%, ${INK} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                opacity: 0.12,
              }}
            >
              ConsentGen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
