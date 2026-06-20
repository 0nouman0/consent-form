"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ShieldCheck,
  Sparkle,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  Stethoscope,
  Lightning,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import * as Tooltip from "@radix-ui/react-tooltip";
import LandingNavbar from "@/components/LandingNavbar";

/* ─── PALETTE ─── */
const INK     = "#100F0D";
const MIST    = "#7A736C";
const RULE    = "#E2D9CE";
const BG      = "#F9F7F4";
const BG_ALT  = "#F2EDE5";
const BG_DARK = "#0C0A09";
const GREEN   = "#15562F";
const WHITE   = "#FFFFFF";

/* ─── DATA ─── */
const COMPLIANCE_LAWS = [
  { code: "IMC 2002",     name: "Indian Medical Council Regulations" },
  { code: "BNS §§24-30",  name: "Bharatiya Nyaya Sanhita" },
  { code: "MoRTH 2025",   name: "Ministry of Road Transport" },
  { code: "CPA 2019",     name: "Consumer Protection Act" },
  { code: "Aadhaar Act",  name: "Aadhaar Act 2016" },
  { code: "DPDP 2023",    name: "Digital Personal Data Protection" },
];

const STATS = [
  { value: "10+", label: "Consent Types",    sub: "Surgical to Psychiatric" },
  { value: "30s", label: "Generation Time",  sub: "Down from 30 minutes" },
  { value: "98%", label: "Compliance Score", sub: "Across all frameworks" },
  { value: "6",   label: "Legal Frameworks", sub: "IMC · BNS · MoRTH · more" },
];

const FEATURES = [
  {
    num: "01", tag: "AI Generation",
    title: "Draft in seconds,\nnot hours.",
    body: "Groq-powered language models trained on medico-legal best practices generate a complete, clause-correct consent form from patient details and procedure type — in under 30 seconds.",
    metric: { value: "30×", label: "Faster than manual drafting" },
  },
  {
    num: "02", tag: "India Compliance",
    title: "Every clause has\na legal basis.",
    body: "Forms are built on the 7 elements of informed consent and validated against IMC 2002, Bharatiya Nyaya Sanhita §§24-30, and MoRTH 2025 — not just generic templates.",
    metric: { value: "100%", label: "Guideline coverage" },
  },
  {
    num: "03", tag: "Clause Verification",
    title: "No critical clause\ngets missed.",
    body: "A real-time clause checklist flags missing or incomplete sections before you sign off. Witness block, risk disclosure, alternative treatments — all verified automatically.",
    metric: { value: "0", label: "Missed clauses" },
  },
];

const CONSENT_TYPES = [
  { icon: "🏥", name: "Surgical",          sub: "Pre-operative" },
  { icon: "💉", name: "Anaesthesia",       sub: "General & Regional" },
  { icon: "🔬", name: "Diagnostic",        sub: "Invasive procedures" },
  { icon: "🩸", name: "Blood Transfusion", sub: "Donor / recipient" },
  { icon: "📱", name: "Telemedicine",      sub: "Remote consultation" },
  { icon: "🤰", name: "Obstetric",         sub: "Labour & delivery" },
  { icon: "🧠", name: "Psychiatric",       sub: "ECT & admission" },
  { icon: "🚨", name: "Emergency",         sub: "Life-threatening" },
  { icon: "🧪", name: "Research",          sub: "Clinical trials" },
  { icon: "🦷", name: "Dental",            sub: "Surgical extractions" },
  { icon: "👁️", name: "Ophthalmic",       sub: "LASIK & cataract" },
  { icon: "🫀", name: "Cardiac",           sub: "Catheterisation" },
];

const TESTIMONIALS = [
  {
    quote: "ConsentGen completely changed how I manage patient documentation. The AI-generated forms are accurate, compliant, and save me at least 30 minutes every day.",
    name: "Dr. Rajesh Kumar", role: "Senior Surgeon, AIIMS Delhi", initials: "RK",
  },
  {
    quote: "The medico-legal alignment gave our hospital legal confidence we've never had before. We've standardised all consent forms with ConsentGen.",
    name: "Dr. Priya Mehta", role: "Medical Superintendent", initials: "PM",
  },
  {
    quote: "Real-time clause verification is a game changer. I never worry about missing a critical medico-legal requirement before a procedure.",
    name: "Dr. Arjun Nair", role: "Anaesthesiologist", initials: "AN",
  },
];

const STEPS = [
  { n: "01", title: "Enter patient details",  body: "Patient name, age, diagnosis, procedure type, and attending doctor — in a clean guided form." },
  { n: "02", title: "Select consent type",    body: "Choose from 10+ procedure-specific templates. Each type loads the relevant clause set automatically." },
  { n: "03", title: "Generate & export",      body: "AI drafts a compliant form. Review, verify clauses, then download as PDF or print for hospital records." },
];

/* ─── ANIMATION VARIANTS ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

/* ═══════════════════════════════════════════
   DOCUMENT PREVIEW
═══════════════════════════════════════════ */
function DocumentPreview() {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    const delays = [800, 1400, 2000, 2600];
    const timers = delays.map((d, i) =>
      setTimeout(() => setChecked(prev => { const n = [...prev]; n[i] = true; return n; }), d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const clauses = [
    "Risks & Benefits Disclosed",
    "Alternatives Listed",
    "Patient Signature Block",
    "Witness Section",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[780px] mx-auto select-none pointer-events-none"
      style={{
        borderRadius: 20,
        background: WHITE,
        border: `1px solid ${RULE}`,
        boxShadow: "0 24px 64px rgba(16,15,13,0.1), 0 4px 16px rgba(16,15,13,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Chrome bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: `1px solid ${RULE}`,
        background: BG,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57","#FFBD2E","#28CA41"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `${GREEN}18`, borderRadius: 20, padding: "3px 10px",
          fontSize: 11, fontWeight: 600, color: GREEN,
        }}>
          <ShieldCheck size={11} weight="bold" />
          IMC Compliant
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: MIST, letterSpacing: "0.03em" }}>
          ConsentGen
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", minHeight: 240 }}>
        {/* Left panel */}
        <div style={{ width: 200, borderRight: `1px solid ${RULE}`, padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MIST, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Patient Details
          </div>
          {["Patient Name", "Procedure", "Surgeon"].map((label) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: MIST, marginBottom: 3 }}>{label}</div>
              <div style={{ height: 28, border: `1px solid ${RULE}`, borderRadius: 6, display: "flex", alignItems: "center", padding: "0 8px" }}>
                <div style={{ height: 6, borderRadius: 3, background: RULE, width: "70%" }} />
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 12, height: 32, borderRadius: 8, background: INK,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            <Sparkle size={11} color={WHITE} weight="fill" />
            <span style={{ color: WHITE, fontSize: 10, fontWeight: 600 }}>Generate</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>Surgical Consent Form</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["PDF", "Print"].map(label => (
                <div key={label} style={{
                  fontSize: 9, fontWeight: 600, color: MIST,
                  border: `1px solid ${RULE}`, borderRadius: 5, padding: "3px 8px",
                }}>{label}</div>
              ))}
            </div>
          </div>
          {[95, 80, 100, 72, 88, 60].map((w, i) => (
            <div key={i} style={{ height: 6, borderRadius: 3, background: `${RULE}`, marginBottom: 6, width: `${w}%` }} />
          ))}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${RULE}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MIST, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Clause Verification
            </div>
            {clauses.map((clause, i) => (
              <div key={clause} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <motion.div
                  animate={checked[i] ? { backgroundColor: GREEN, scale: 1 } : { backgroundColor: RULE, scale: 1 }}
                  initial={{ backgroundColor: RULE, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{ width: 14, height: 14, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  {checked[i] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <CheckCircle size={10} color={WHITE} weight="bold" />
                    </motion.div>
                  )}
                </motion.div>
                <span style={{ fontSize: 9, color: checked[i] ? INK : MIST }}>{clause}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════ */
function HeroSection() {
  const compliancePills = ["IMC 2002", "BNS §§24-30", "MoRTH 2025", "CPA 2019"];

  return (
    <section
      style={{ minHeight: "100vh", background: BG, position: "relative", overflow: "hidden" }}
      className="flex flex-col items-center justify-center pt-24 pb-16 px-5"
    >
      {/* Mesh blobs */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: 700, height: 700, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(21,86,47,0.06) 0%, transparent 65%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: 800, height: 800, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(180,130,80,0.07) 0%, transparent 65%)",
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, color: MIST, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            India&rsquo;s AI-Powered Consent Platform
          </span>
        </motion.div>

        {/* Headline */}
        <h1 style={{ margin: 0, padding: 0, lineHeight: 0.92, letterSpacing: "-0.035em" }}>
          {[
            { text: "Generate", serif: false },
            { text: "compliant", serif: true },
            { text: "consent forms.", serif: false },
          ].map((line, i) => (
            <motion.div
              key={line.text}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={i}
              style={{
                display: "block",
                fontSize: "clamp(52px, 10.5vw, 120px)",
                fontWeight: line.serif ? 400 : 700,
                fontStyle: line.serif ? "italic" : "normal",
                fontFamily: line.serif ? "'Instrument Serif', Georgia, serif" : "Inter, system-ui, sans-serif",
                color: INK,
                lineHeight: 0.92,
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </h1>

        {/* Subtext */}
        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          style={{
            marginTop: 28, fontSize: 18, color: MIST, maxWidth: 380,
            lineHeight: 1.55, textAlign: "center",
          }}
        >
          For Indian doctors. IMC 2002 compliant.
          <br />
          Draft in 30 seconds, not 30 minutes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={4}
          style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link
            href="/generate"
            style={{
              display: "inline-flex", alignItems: "center", gap: 0,
              background: INK, color: WHITE, borderRadius: 999,
              paddingLeft: 22, paddingRight: 6, paddingTop: 8, paddingBottom: 8,
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-85"
          >
            Generate Now
            <span style={{
              marginLeft: 10, width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.14)", display: "inline-flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight size={14} color={WHITE} weight="bold" />
            </span>
          </Link>
          <a
            href="#features"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              color: INK, fontSize: 14, fontWeight: 500, textDecoration: "none",
              opacity: 0.7,
            }}
            className="hover:opacity-100 transition-opacity"
          >
            See how it works
            <ArrowUpRight size={14} />
          </a>
        </motion.div>

        {/* Compliance pills */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={5}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 28 }}
        >
          <Tooltip.Provider delayDuration={200}>
            {compliancePills.map((pill) => {
              const law = COMPLIANCE_LAWS.find(l => l.code === pill);
              return (
                <Tooltip.Root key={pill}>
                  <Tooltip.Trigger asChild>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      border: `1px solid ${RULE}`, borderRadius: 999,
                      padding: "4px 11px", fontSize: 11, fontWeight: 600,
                      color: INK, background: WHITE, cursor: "default",
                    }}>
                      <ShieldCheck size={11} color={GREEN} weight="bold" />
                      {pill}
                    </div>
                  </Tooltip.Trigger>
                  {law && (
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="bottom"
                        sideOffset={6}
                        style={{
                          background: INK, color: WHITE, borderRadius: 8,
                          padding: "6px 12px", fontSize: 11, fontWeight: 500,
                          boxShadow: "0 8px 24px rgba(16,15,13,0.18)",
                          zIndex: 9999,
                        }}
                      >
                        {law.name}
                        <Tooltip.Arrow style={{ fill: INK }} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>
              );
            })}
          </Tooltip.Provider>
        </motion.div>

        {/* Document preview */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={6}
          className="w-full mt-14"
        >
          <DocumentPreview />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   COMPLIANCE TICKER
═══════════════════════════════════════════ */
function ComplianceTicker() {
  const doubled = [...COMPLIANCE_LAWS, ...COMPLIANCE_LAWS];

  return (
    <div style={{
      background: BG_DARK, position: "relative", overflow: "hidden",
      paddingTop: 18, paddingBottom: 18,
    }}>
      {/* Fade edges */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(to right, ${BG_DARK}, transparent)`,
      }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(to left, ${BG_DARK}, transparent)`,
      }} />

      <div className="marquee-track" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
        {doubled.map((law, i) => (
          <div
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 0, paddingLeft: 32, paddingRight: 32 }}
          >
            <ShieldCheck size={13} color={GREEN} weight="bold" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>
              {law.code}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.01em" }}>
              {law.name}
            </span>
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", marginLeft: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STATS SECTION
═══════════════════════════════════════════ */
function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section ref={ref} style={{ background: BG_DARK }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        maxWidth: 1280, margin: "0 auto",
      }} className="grid-cols-2 sm:grid-cols-4">
        {STATS.map((stat, i) => {
          const isSerifValue = i === 1 || i === 3;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                padding: "44px 40px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                fontWeight: isSerifValue ? 400 : 700,
                fontStyle: isSerifValue ? "italic" : "normal",
                fontFamily: isSerifValue ? "'Instrument Serif', Georgia, serif" : "Inter, system-ui, sans-serif",
                color: WHITE,
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {stat.sub}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURE VISUALS
═══════════════════════════════════════════ */
function FeatureVisual01() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const lines = [92, 75, 100, 63, 84];

  return (
    <div
      ref={ref}
      style={{
        background: BG, border: `1px solid ${RULE}`, borderRadius: 16,
        padding: 28, minHeight: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: GREEN }}>Generating…</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((w, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={inView ? { width: `${w}%` } : { width: 0 }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 8, borderRadius: 4, background: `${INK}18` }}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureVisual02() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const frameworks = [
    { name: "IMC 2002",    pct: 100 },
    { name: "BNS §§24-30", pct: 100 },
    { name: "MoRTH 2025",  pct: 95  },
    { name: "CPA 2019",    pct: 98  },
  ];

  return (
    <div
      ref={ref}
      style={{
        background: INK, borderRadius: 16, padding: 28, minHeight: 200,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 18, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Frameworks
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {frameworks.map((f, i) => (
          <div key={f.name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{f.pct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${f.pct}%` } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: "100%", background: GREEN, borderRadius: 2 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: WHITE, fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>100%</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>coverage</span>
      </div>
    </div>
  );
}

function FeatureVisual03() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const clauses = [
    "Patient identification verified",
    "Procedure explained in detail",
    "Risks & complications disclosed",
    "Alternative treatments listed",
    "Voluntary consent confirmed",
    "Witness block complete",
    "Doctor's countersignature",
  ];

  return (
    <div
      ref={ref}
      style={{
        background: BG_ALT, border: `1px solid ${RULE}`, borderRadius: 16,
        padding: 28, minHeight: 200,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: MIST, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Clauses
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {clauses.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3, background: GREEN,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CheckCircle size={9} color={WHITE} weight="bold" />
            </div>
            <span style={{ fontSize: 11, color: INK, fontWeight: 500 }}>{c}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const featureVisuals = [FeatureVisual01, FeatureVisual02, FeatureVisual03];

/* ═══════════════════════════════════════════
   FEATURES SECTION
═══════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section id="features" style={{ background: BG }}>
      {/* Section header */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
          <Lightning size={14} color={GREEN} weight="bold" />
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Features
          </span>
        </div>
        <div style={{ paddingBottom: 48, borderBottom: `1px solid ${RULE}` }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            <span style={{ fontWeight: 700, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
              Everything a doctor needs
            </span>
            <br />
            <span style={{ fontWeight: 400, fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif", color: INK }}>
              before the procedure.
            </span>
          </h2>
        </div>
      </div>

      {/* Feature rows */}
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {FEATURES.map((feat, i) => {
          const isEven = i % 2 === 0;
          const Visual = featureVisuals[i];
          return (
            <div
              key={feat.num}
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                borderBottom: `1px solid ${RULE}`,
                flexDirection: isEven ? "row" : "row-reverse",
              }}
              className="flex-col sm:grid"
            >
              {/* Text side */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                style={{
                  padding: "56px 48px",
                  borderRight: isEven ? `1px solid ${RULE}` : "none",
                  borderLeft: isEven ? "none" : `1px solid ${RULE}`,
                  order: isEven ? 0 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 80, fontWeight: 700, color: RULE, lineHeight: 1, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em" }}>
                    {feat.num}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {feat.tag}
                  </span>
                </div>
                <h3 style={{
                  margin: "0 0 16px",
                  fontSize: "clamp(28px, 3.5vw, 40px)",
                  fontWeight: 700, color: INK,
                  lineHeight: 1.15, letterSpacing: "-0.02em",
                  whiteSpace: "pre-line",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: 15, color: MIST, lineHeight: 1.65, marginBottom: 28, maxWidth: 420 }}>
                  {feat.body}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontSize: 40, fontWeight: 700, color: INK,
                    fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic",
                  }}>
                    {feat.metric.value}
                  </span>
                  <span style={{ fontSize: 13, color: MIST }}>
                    {feat.metric.label}
                  </span>
                </div>
              </motion.div>

              {/* Visual side */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
                style={{ padding: "56px 48px", display: "flex", alignItems: "center", order: isEven ? 1 : 0 }}
              >
                <div style={{ width: "100%" }}>
                  <Visual />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CONSENT TYPES SECTION
═══════════════════════════════════════════ */
function ConsentTypesSection() {
  return (
    <section style={{ background: BG_ALT, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
            <Stethoscope size={14} color={GREEN} weight="bold" />
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Consent Types
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            <span style={{ fontWeight: 700, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
              10+ procedure-specific
            </span>
            <br />
            <span style={{ fontWeight: 400, fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif", color: INK }}>
              consent templates.
            </span>
          </h2>
        </div>

        {/* Horizontal scroll */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to right, ${BG_ALT}, transparent)`,
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to left, ${BG_ALT}, transparent)`,
          }} />
          <div
            className="no-scrollbar"
            style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}
          >
            {CONSENT_TYPES.map((ct, i) => (
              <motion.div
                key={ct.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                style={{
                  width: 160, flexShrink: 0, borderRadius: 16, padding: 20,
                  background: WHITE, border: `1px solid ${RULE}`,
                  cursor: "default", transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{ct.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 3 }}>{ct.name}</div>
                <div style={{ fontSize: 11, color: MIST }}>{ct.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS SECTION
═══════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ background: BG, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            <span style={{ fontWeight: 700, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
              Three steps to a
            </span>
            <br />
            <span style={{ fontWeight: 400, fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif", color: INK }}>
              compliant consent form.
            </span>
          </h2>
        </div>

        {/* Steps grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }} className="grid-cols-1 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
              style={{
                borderTop: `1px solid ${RULE}`,
                borderRight: i < 2 ? `1px solid ${RULE}` : "none",
                padding: "36px 36px 40px",
              }}
            >
              <div style={{
                fontSize: 80, fontWeight: 700, color: RULE, lineHeight: 1,
                fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em",
                marginBottom: 20,
              }}>
                {step.n}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: INK, marginBottom: 10, lineHeight: 1.3 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: MIST, lineHeight: 1.65 }}>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   TESTIMONIALS SECTION
═══════════════════════════════════════════ */
function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section style={{ background: BG_DARK, padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      {/* Decorative quote */}
      <div style={{
        position: "absolute", top: 20, left: 48, fontSize: 200,
        fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.04)",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>
        &ldquo;
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40 }}>
          Testimonials
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <blockquote style={{
              margin: 0, marginBottom: 40,
              fontSize: "clamp(22px, 3.5vw, 36px)",
              fontWeight: 500, color: WHITE,
              lineHeight: 1.35, letterSpacing: "-0.01em",
              maxWidth: 720,
            }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${GREEN}40`, border: `1px solid ${GREEN}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: GREEN, flexShrink: 0,
              }}>
                {t.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 36 }}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                height: 6, borderRadius: 999,
                width: i === active ? 24 : 6,
                background: i === active ? WHITE : "rgba(255,255,255,0.2)",
                border: "none", cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CTA SECTION
═══════════════════════════════════════════ */
function CTASection() {
  return (
    <section style={{ background: BG, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          background: INK, borderRadius: 28, padding: "80px 64px",
          position: "relative", overflow: "hidden", textAlign: "center",
        }}>
          {/* Huge bg text */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(80px, 14vw, 200px)", fontWeight: 400, fontStyle: "italic",
            fontFamily: "'Instrument Serif', Georgia, serif",
            color: "rgba(255,255,255,0.02)", lineHeight: 1, pointerEvents: "none",
            userSelect: "none", whiteSpace: "nowrap", overflow: "hidden",
          }}>
            ConsentGen
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
              <Sparkle size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Ready to streamline
              </span>
            </div>
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 5vw, 60px)", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
              <span style={{ fontWeight: 700, color: WHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
                Generate your first
              </span>
              <br />
              <span style={{ fontWeight: 400, fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif", color: WHITE }}>
                consent form for free.
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Join hundreds of Indian doctors who trust ConsentGen for their medico-legal documentation.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/generate"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: WHITE, color: INK, borderRadius: 999,
                  padding: "12px 28px", fontSize: 14, fontWeight: 700,
                  textDecoration: "none", transition: "opacity 0.15s",
                }}
                className="hover:opacity-90"
              >
                Start Generating
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", color: WHITE,
                  border: `1px solid rgba(255,255,255,0.25)`,
                  borderRadius: 999, padding: "12px 28px", fontSize: 14, fontWeight: 600,
                  textDecoration: "none", transition: "border-color 0.15s",
                }}
                className="hover:border-white/50"
              >
                View Dashboard
              </Link>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
              {[
                { value: "10+", label: "Consent Types" },
                { value: "30s", label: "Generation Time" },
                { value: "100%", label: "IMC Compliant" },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: WHITE, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PAGE FOOTER
═══════════════════════════════════════════ */
function PageFooter() {
  return (
    <footer style={{ background: BG, borderTop: `1px solid ${RULE}`, padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: 48, marginBottom: 48 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: INK,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldCheck size={16} color={WHITE} weight="bold" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>ConsentGen</span>
            </div>
            <p style={{ fontSize: 13, color: MIST, lineHeight: 1.65, maxWidth: 240, marginBottom: 18 }}>
              AI-powered medico-legal consent form generator for Indian doctors. Generate, verify, and export in seconds.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["IMC 2002", "BNS §§24-30", "MoRTH 2025"].map(b => (
                <div key={b} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  border: `1px solid ${RULE}`, borderRadius: 999,
                  padding: "3px 9px", fontSize: 10, fontWeight: 600, color: MIST,
                }}>
                  <ShieldCheck size={9} color={GREEN} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Application */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MIST, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Application
            </div>
            {[
              { label: "Generate Form", href: "/generate" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "History", href: "/history" },
              { label: "Sign In", href: "/login" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: 14, color: MIST, textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }} className="hover:text-ink">
                {label}
              </Link>
            ))}
          </div>

          {/* Compliance */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MIST, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Compliance
            </div>
            {COMPLIANCE_LAWS.map(law => (
              <div key={law.code} style={{ fontSize: 13, color: MIST, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: INK }}>{law.code}</span>
                <span style={{ display: "block", fontSize: 11, color: MIST, marginTop: 1 }}>{law.name}</span>
              </div>
            ))}
          </div>

          {/* Stay Updated */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MIST, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Stay Updated
            </div>
            <p style={{ fontSize: 13, color: MIST, lineHeight: 1.6, marginBottom: 14 }}>
              Get updates on new consent templates and compliance changes.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1, fontSize: 13, padding: "9px 12px",
                  border: `1px solid ${RULE}`, borderRadius: 8,
                  background: WHITE, color: INK, outline: "none",
                }}
              />
              <button
                type="button"
                style={{
                  padding: "9px 16px", background: INK, color: WHITE,
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 24, borderTop: `1px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: MIST }}>© 2025 ConsentGen. Built for Indian Medical Practice.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: MIST }}>
            <ShieldCheck size={12} color={GREEN} />
            IMC 2002 Compliant Platform
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════ */
export default function Home() {
  return (
    <div style={{ background: BG }}>
      <LandingNavbar />
      <HeroSection />
      <ComplianceTicker />
      <StatsSection />
      <FeaturesSection />
      <ConsentTypesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <PageFooter />
    </div>
  );
}
