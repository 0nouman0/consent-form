"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";

/* ═══════════════════════════════════════════════════════════
   CONSENTGEN — LANDING
   Editorial paper-and-ink system. Typography does the work.
   Palette: paper / ink / one stamp red. No gradients. No glass.
═══════════════════════════════════════════════════════════ */

const PAPER = "#F4F1E9";
const SHEET = "#FCFBF7";
const INK = "#171410";
const MUTED = "#7A7466";
const RULE = "rgba(23,20,16,0.15)";
const RULE_SOFT = "rgba(23,20,16,0.08)";
const RED = "#BE3D2A";

const serif = { fontFamily: "'Instrument Serif', serif" } as const;

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
  },
  {
    num: "§ 02",
    tag: "Verification",
    title: ["Nothing signed", "before it's checked."],
    body:
      "A live clause register audits the draft as it streams in — authorization, risk disclosure, alternatives, withdrawal rights, capacity. Anything missing is flagged before the form ever reaches a patient. The checklist follows the same eleven clauses courts look for.",
    metric: { value: "11", label: "mandatory clauses verified on every single form" },
  },
  {
    num: "§ 03",
    tag: "Language",
    title: ["Counseled in Hindi,", "filed in English."],
    body:
      "Indian courts require proof the patient understood. ConsentGen generates the full form twice — once in English for the record, once in any of twelve Indian languages for the patient — with the counseling language stated on the face of the document.",
    metric: { value: "12", label: "Indian languages, generated as complete paired documents" },
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
  { value: "12", suffix: "languages", label: "Bilingual output with counseling language on record" },
  { value: "6", suffix: "frameworks", label: "IMC, BNS, MoRTH, CPA, Aadhaar Act, DPDP" },
  { value: "40", suffix: "+ procedures", label: "Pre-mapped risk libraries with autocomplete" },
];

/* ─── PRIMITIVES ─── */

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in (or above) the viewport — show immediately.
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

    // Scroll fallback for environments where IO never fires.
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
    <div className="relative select-none" aria-hidden>
      {/* Sheet behind */
      }
      <div
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.2deg]"
        style={{ backgroundColor: SHEET, border: `1px solid ${RULE_SOFT}` }}
      />
      {/* Main sheet */}
      <div
        className="relative p-7 sm:p-9"
        style={{ backgroundColor: SHEET, border: `1px solid ${RULE}`, boxShadow: "0 24px 48px -24px rgba(23,20,16,0.25)" }}
      >
        {/* Doc header */}
        <div className="flex items-baseline justify-between pb-4 mb-5" style={{ borderBottom: `1px solid ${INK}` }}>
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
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] mb-6" style={{ color: MUTED }}>
          Surgical procedure · Bilingual — English / हिन्दी
        </p>

        {/* Fields */}
        {[
          ["Patient", "Anita Deshmukh"],
          ["Age / Sex", "42 · Female"],
          ["Procedure", "Laparoscopic Cholecystectomy"],
          ["Counseled in", "Hindi"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 py-2" style={{ borderBottom: `1px solid ${RULE_SOFT}` }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] w-24 shrink-0" style={{ color: MUTED }}>
              {k}
            </span>
            <span className="text-[15px] italic" style={{ ...serif, color: INK }}>
              {v}
            </span>
          </div>
        ))}

        {/* Clause excerpt */}
        <p className="mt-6 mb-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
          Cl. 08 — Voluntariness
        </p>
        <p className="text-[12.5px] leading-[1.75]" style={{ color: "#4A463C", textAlign: "justify" }}>
          I confirm this consent is given freely, without coercion, and that I retain the right to withdraw
          it at any time before the procedure begins, per BNS § 27. The procedure named above is the only
          procedure authorised by this document.
        </p>

        {/* Signature row */}
        <div className="mt-7 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[22px] italic leading-none mb-1.5 pl-1" style={{ ...serif, color: INK }}>
              A. Deshmukh
            </p>
            <div style={{ borderTop: `1px solid ${INK}` }} className="pt-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Patient · Date & Time
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div style={{ borderTop: `1px solid ${INK}` }} className="pt-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Physician · Reg. No.
              </span>
            </div>
          </div>
        </div>

        {/* Stamp */}
        <div
          className="absolute -right-3 top-36 rotate-[8deg] px-3.5 py-2.5 text-center"
          style={{ border: `2px solid ${RED}`, borderRadius: "3px", backgroundColor: "rgba(252,251,247,0.92)" }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] leading-tight" style={{ color: RED }}>
            Verified
          </p>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] leading-tight mt-0.5" style={{ color: RED }}>
            IMC 2002
          </p>
          <div className="my-1" style={{ borderTop: `1px solid ${RED}` }} />
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] leading-tight" style={{ color: RED }}>
            11/11 clauses
          </p>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        Fig. 01 — Generated in 28.4 seconds. Streamed, verified, filed.
      </p>
    </div>
  );
}

/* ─── PAGE ─── */

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Enable reveal animations only once JS is confirmed running.
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
    <div ref={rootRef} className="landing min-h-screen font-body" style={{ backgroundColor: PAPER, color: INK }}>

      {/* ══ TICKER ══ */}
      <div className="overflow-hidden py-2" style={{ backgroundColor: INK }}>
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 items-center">
              {FRAMEWORKS.map((f) => (
                <span key={`${i}-${f.code}`} className="flex items-center font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: PAPER }}>
                  <span className="px-6">{f.code}</span>
                  <span style={{ color: RED }}>✳</span>
                </span>
              ))}
              <span className="flex items-center font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: PAPER }}>
                <span className="px-6">Compliant by construction</span>
                <span style={{ color: RED }}>✳</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ NAV ══ */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: `${PAPER}F2`, backdropFilter: "blur(8px)", borderBottom: `1px solid ${RULE}` }}>
        <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-5 sm:px-8 h-[68px]">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="text-[22px] tracking-tight" style={{ ...serif, color: INK }}>
              ConsentGen
            </span>
            <span className="text-[10px] align-super" style={{ color: RED }}>®</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              ["The form", "#anatomy"],
              ["Method", "#method"],
              ["Process", "#process"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="link-rule font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            {isLoggedIn === true ? (
              <>
                <Link href="/dashboard" className="link-rule hidden sm:inline font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
                  Dashboard
                </Link>
                <UserMenu compact />
              </>
            ) : (
              <>
                <Link href="/login" className="link-rule hidden sm:inline font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: INK }}>
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
        </nav>
      </header>

      {/* ══ HERO ══ */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pt-16 sm:pt-24 pb-20">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <Reveal>
              <MonoLabel red>For registered medical practitioners · India</MonoLabel>
            </Reveal>
            <Reveal delay={80}>
              <h1
                className="mt-6 text-[13.5vw] sm:text-[76px] lg:text-[88px] leading-[0.98] tracking-[-0.01em]"
                style={{ ...serif, color: INK }}
              >
                Consent, drafted
                <br />
                to the letter
                <br />
                <em>of the law.</em>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 max-w-[46ch] text-[16px] leading-[1.7]" style={{ color: MUTED }}>
                ConsentGen turns patient details into complete, medico-legally sound informed
                consent — every clause present, every signature timestamped, in English and
                eleven Indian languages. Thirty seconds, not thirty minutes.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <InkButton href={primaryHref}>Generate a form</InkButton>
                <GhostButton href="#anatomy">Read the anatomy</GhostButton>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-14 flex flex-wrap gap-x-10 gap-y-3">
                {["Est. 30 s / form", "10 consent types", "12 languages"].map((t) => (
                  <span key={t} className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5 flex items-center">
            <Reveal delay={200} className="w-full max-w-[440px] mx-auto lg:mx-0">
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
              <MonoLabel>06 instruments</MonoLabel>
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
                <h2 className="mt-5 text-[42px] sm:text-[52px] leading-[1.02] tracking-[-0.01em]" style={{ ...serif, color: INK }}>
                  Anatomy of a<br />
                  <em>defensible</em> consent.
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
                    <span className="font-mono text-[11px] tracking-[0.12em] transition-colors duration-300 group-hover:text-[#BE3D2A]" style={{ color: MUTED }}>
                      Cl. {c.n}
                    </span>
                    <span className="text-[19px] sm:text-[22px] leading-tight transition-colors duration-300 group-hover:text-[#F4F1E9]" style={{ ...serif, color: INK }}>
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
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-2">
                <Reveal>
                  <span className="font-mono text-[13px] tracking-[0.1em]" style={{ color: RED }}>{s.num}</span>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
                    {s.tag}
                  </p>
                </Reveal>
              </div>
              <div className={`lg:col-span-6 ${idx % 2 === 1 ? "lg:order-3" : ""}`}>
                <Reveal delay={60}>
                  <h3 className="text-[36px] sm:text-[48px] leading-[1.04] tracking-[-0.01em]" style={{ ...serif, color: INK }}>
                    {s.title[0]}
                    <br />
                    <em>{s.title[1]}</em>
                  </h3>
                  <p className="mt-6 max-w-[52ch] text-[15.5px] leading-[1.75]" style={{ color: MUTED }}>
                    {s.body}
                  </p>
                </Reveal>
              </div>
              <div className={`lg:col-span-4 flex lg:justify-end ${idx % 2 === 1 ? "lg:order-2 lg:justify-start" : ""}`}>
                <Reveal delay={140}>
                  <div className="lg:text-right">
                    <p className="text-[84px] sm:text-[104px] leading-none tracking-[-0.02em]" style={{ ...serif, color: INK }}>
                      {s.metric.value}
                    </p>
                    <p className="mt-3 max-w-[26ch] font-mono text-[10px] uppercase tracking-[0.14em] leading-[1.8] lg:ml-auto" style={{ color: MUTED }}>
                      {s.metric.label}
                    </p>
                  </div>
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
              <h2 className="text-[42px] sm:text-[52px] leading-[1.02] tracking-[-0.01em]" style={{ ...serif, color: INK }}>
                Three steps. <em>No template hunting.</em>
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
                    ...(i > 0 ? {} : {}),
                  }}
                >
                  <span className="text-[64px] leading-none" style={{ ...serif, color: "rgba(23,20,16,0.18)" }}>
                    {st.n}
                  </span>
                  <h3 className="mt-5 text-[22px]" style={{ ...serif, color: INK }}>
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

      {/* ══ PULL QUOTE ══ */}
      <section style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-[980px] px-5 sm:px-8 py-24 sm:py-32 text-center">
          <Reveal>
            <span className="text-[28px]" style={{ color: RED }}>✳</span>
            <blockquote className="mt-8 text-[30px] sm:text-[44px] leading-[1.25] tracking-[-0.01em]" style={{ ...serif, color: INK }}>
              “The forms are accurate, compliant, and save me thirty minutes a day.
              The clause register means <em>nothing critical is ever missed</em> before
              a procedure.”
            </blockquote>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              Dr. Rajesh Kumar — Senior Surgeon, New Delhi
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
                    <span className="text-[64px] sm:text-[80px] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
                      {st.value}
                    </span>
                    <span className="ml-2 text-[18px] italic" style={{ ...serif, color: RED }}>
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
      <section style={{ backgroundColor: INK }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-24 sm:py-32">
          <Reveal>
            <MonoLabel red>Begin</MonoLabel>
            <h2 className="mt-6 text-[12vw] sm:text-[72px] lg:text-[92px] leading-[1.0] tracking-[-0.01em]" style={{ ...serif, color: PAPER }}>
              Stop drafting.
              <br />
              <em>Start generating.</em>
            </h2>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <InkButton href={primaryHref} invert>
                Generate your first form
              </InkButton>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(244,241,233,0.5)" }}>
                1 credit = 1 form · No card required to start
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ backgroundColor: INK, borderTop: `1px solid rgba(244,241,233,0.15)` }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14">
            <div className="col-span-2 md:col-span-1">
              <p className="text-[20px]" style={{ ...serif, color: PAPER }}>
                ConsentGen<span className="text-[10px] align-super" style={{ color: RED }}>®</span>
              </p>
              <p className="mt-3 max-w-[28ch] text-[12.5px] leading-[1.7]" style={{ color: "rgba(244,241,233,0.45)" }}>
                Medico-legal consent documentation for Indian clinical practice.
              </p>
            </div>
            {[
              { h: "Product", links: [["Generate", "/generate"], ["Templates", "/templates"], ["History", "/history"], ["Chat", "/chat"]] },
              { h: "Reference", links: [["Regulations", "/regulations"], ["The form", "#anatomy"], ["Method", "#method"]] },
              { h: "Account", links: [["Sign in", "/login"], ["Dashboard", "/dashboard"], ["Credits", "/credits"]] },
            ].map((col) => (
              <div key={col.h}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: "rgba(244,241,233,0.4)" }}>
                  {col.h}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="link-rule text-[13.5px]" style={{ color: "rgba(244,241,233,0.75)" }}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-5" style={{ borderTop: "1px solid rgba(244,241,233,0.15)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(244,241,233,0.4)" }}>
              © {new Date().getFullYear()} ConsentGen — Not a substitute for legal counsel
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(244,241,233,0.4)" }}>
              Made for Indian practice ✳ IMC · BNS · MoRTH
            </span>
          </div>

          {/* Giant clipped wordmark */}
          <div className="overflow-hidden -mb-2" aria-hidden>
            <p
              className="text-center whitespace-nowrap text-[19vw] leading-[0.78] tracking-[-0.02em] translate-y-[12%] select-none"
              style={{ ...serif, color: "rgba(244,241,233,0.09)" }}
            >
              ConsentGen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
