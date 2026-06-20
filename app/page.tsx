"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
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
import LandingNavbar from "@/components/LandingNavbar";

gsap.registerPlugin(ScrollTrigger);

/* ─── PALETTE ─── */
const BG       = "#060810";
const BG2      = "#0A0C16";
const SURFACE  = "#0F1220";
const BORDER   = "rgba(255,255,255,0.07)";
const BORDER_B = "rgba(82,130,255,0.2)";
const TEXT     = "#E4E8FF";
const MUTED    = "#525878";
const ACCENT   = "#5282FF";
const TEAL     = "#00D4C8";
const GREEN    = "#10D990";
const WHITE    = "#FFFFFF";

/* ─── DATA ─── */
const COMPLIANCE_LAWS = [
  { code: "IMC 2002",    name: "Indian Medical Council Regulations" },
  { code: "BNS §§24-30", name: "Bharatiya Nyaya Sanhita" },
  { code: "MoRTH 2025",  name: "Ministry of Road Transport" },
  { code: "CPA 2019",    name: "Consumer Protection Act" },
  { code: "Aadhaar Act", name: "Aadhaar Act 2016" },
  { code: "DPDP 2023",   name: "Digital Personal Data Protection" },
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
  { quote: "ConsentGen completely changed how I manage patient documentation. The AI-generated forms are accurate, compliant, and save me at least 30 minutes every day.", name: "Dr. Rajesh Kumar",  role: "Senior Surgeon, AIIMS Delhi", initials: "RK" },
  { quote: "The medico-legal alignment gave our hospital legal confidence we've never had before. We've standardised all consent forms with ConsentGen.",                    name: "Dr. Priya Mehta",  role: "Medical Superintendent",      initials: "PM" },
  { quote: "Real-time clause verification is a game changer. I never worry about missing a critical medico-legal requirement before a procedure.",                          name: "Dr. Arjun Nair",   role: "Anaesthesiologist",            initials: "AN" },
];

const STEPS = [
  { n: "01", title: "Enter patient details", body: "Patient name, age, diagnosis, procedure type, and attending doctor — in a clean guided form." },
  { n: "02", title: "Select consent type",   body: "Choose from 10+ procedure-specific templates. Each type loads the relevant clause set automatically." },
  { n: "03", title: "Generate & export",     body: "AI drafts a compliant form. Review, verify clauses, then download as PDF or print for hospital records." },
];

/* ═══════════════════════════════════════════
   DOCUMENT PREVIEW
═══════════════════════════════════════════ */
function DocumentPreview() {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    const delays = [700, 1200, 1700, 2200];
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
    <div
      className="hero-preview w-full max-w-[780px] mx-auto select-none pointer-events-none"
      style={{
        borderRadius: 20,
        background: SURFACE,
        border: `1px solid ${BORDER_B}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(82,130,255,0.1)",
        overflow: "hidden",
      }}
    >
      {/* Chrome bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
        background: BG2,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FFBD2E", "#28CA41"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `rgba(82,130,255,0.12)`, borderRadius: 20, padding: "3px 10px",
          fontSize: 11, fontWeight: 600, color: ACCENT,
        }}>
          <ShieldCheck size={11} weight="bold" />
          IMC Compliant
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.03em" }}>
          ConsentGen
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", minHeight: 240 }}>
        {/* Left panel */}
        <div style={{ width: 200, borderRight: `1px solid ${BORDER}`, padding: 16, flexShrink: 0, background: BG }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Patient Details
          </div>
          {["Patient Name", "Procedure", "Surgeon"].map((label) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>{label}</div>
              <div style={{ height: 28, border: `1px solid ${BORDER}`, borderRadius: 6, display: "flex", alignItems: "center", padding: "0 8px", background: SURFACE }}>
                <div style={{ height: 6, borderRadius: 3, background: BORDER, width: "70%" }} />
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 12, height: 32, borderRadius: 8,
            background: ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: "0 0 16px rgba(82,130,255,0.3)",
          }}>
            <Sparkle size={11} color={WHITE} weight="fill" />
            <span style={{ color: WHITE, fontSize: 10, fontWeight: 600 }}>Generate</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, padding: 16, background: SURFACE }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Surgical Consent Form</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["PDF", "Print"].map(label => (
                <div key={label} style={{
                  fontSize: 9, fontWeight: 600, color: MUTED,
                  border: `1px solid ${BORDER}`, borderRadius: 5, padding: "3px 8px",
                }}>{label}</div>
              ))}
            </div>
          </div>
          {[95, 80, 100, 72, 88, 60].map((w, i) => (
            <div key={i} style={{ height: 6, borderRadius: 3, background: BORDER, marginBottom: 6, width: `${w}%` }} />
          ))}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Clause Verification
            </div>
            {clauses.map((clause, i) => (
              <div key={clause} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div
                  style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: checked[i] ? GREEN : BORDER,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.3s ease",
                  }}
                >
                  {checked[i] && <CheckCircle size={10} color={BG} weight="bold" />}
                </div>
                <span style={{ fontSize: 9, color: checked[i] ? TEXT : MUTED, transition: "color 0.3s ease" }}>{clause}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════ */
function HeroSection() {
  const compliancePills = ["IMC 2002", "BNS §§24-30", "MoRTH 2025", "CPA 2019"];

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-badge",   { opacity: 0, y: 20, duration: 0.6 })
      .from(".split-word",   { opacity: 0, y: 60, stagger: 0.05, duration: 0.7 }, "-=0.3")
      .from(".hero-sub",     { opacity: 0, y: 20, duration: 0.5 }, "-=0.3")
      .from(".hero-ctas",    { opacity: 0, y: 20, duration: 0.5 }, "-=0.3")
      .from(".hero-pills",   { opacity: 0, y: 10, duration: 0.4 }, "-=0.2")
      .from(".hero-preview", { opacity: 0, y: 50, duration: 0.9, ease: "power2.out" }, "-=0.3");
  }, []);

  return (
    <section
      style={{ minHeight: "100vh", background: BG, position: "relative", overflow: "hidden" }}
      className="flex flex-col items-center justify-center pt-24 pb-16 px-5"
    >
      {/* Dot grid overlay */}
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />

      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
        background: "rgba(82,130,255,0.15)", filter: "blur(120px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", right: "-10%",
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
        background: "rgba(0,212,200,0.08)", filter: "blur(120px)",
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Pill badge */}
        <div
          className="hero-badge"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
            padding: "6px 16px", borderRadius: 999,
            border: `1px solid ${BORDER_B}`,
            background: "rgba(82,130,255,0.07)",
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: ACCENT,
            flexShrink: 0, boxShadow: `0 0 8px ${ACCENT}`,
            animation: "glow-pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 11, color: "#A0B4FF", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            AI-POWERED · IMC 2002 COMPLIANT
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ margin: 0, padding: 0, lineHeight: 0.88, letterSpacing: "-0.04em" }}>
          <div style={{ display: "block", fontSize: "clamp(56px, 11vw, 128px)", fontWeight: 800, color: TEXT, lineHeight: 0.88 }}>
            <span className="split-word inline-block font-syne">Generate</span>
          </div>
          <div style={{ display: "block", fontSize: "clamp(56px, 11vw, 128px)", fontWeight: 800, lineHeight: 0.88 }}>
            <span className="split-word inline-block font-syne gradient-text">compliant</span>
          </div>
          <div style={{ display: "block", fontSize: "clamp(56px, 11vw, 128px)", fontWeight: 800, color: TEXT, lineHeight: 0.88 }}>
            <span className="split-word inline-block font-syne">consent</span>{" "}
            <span className="split-word inline-block font-syne">forms.</span>
          </div>
        </h1>

        {/* Subtext */}
        <p
          className="hero-sub"
          style={{ marginTop: 28, fontSize: 18, color: MUTED, maxWidth: 380, lineHeight: 1.55, textAlign: "center" }}
        >
          For Indian doctors. IMC 2002 compliant.
          <br />
          Draft in 30 seconds, not 30 minutes.
        </p>

        {/* CTAs */}
        <div
          className="hero-ctas"
          style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link
            href="/generate"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: ACCENT, color: WHITE, borderRadius: 999,
              padding: "12px 24px",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              border: `1px solid rgba(82,130,255,0.4)`,
              boxShadow: "0 0 24px rgba(82,130,255,0.3)",
              transition: "box-shadow 0.2s, opacity 0.2s",
            }}
            className="hover:opacity-90"
          >
            Generate Now
            <ArrowRight size={15} weight="bold" />
          </Link>
          <a
            href="#features"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: TEXT, fontSize: 14, fontWeight: 500, textDecoration: "none",
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 999, padding: "12px 20px",
              transition: "border-color 0.2s",
            }}
            className="hover:border-white/30"
          >
            See how it works
            <ArrowUpRight size={14} />
          </a>
        </div>

        {/* Compliance pills */}
        <div
          className="hero-pills"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 28 }}
        >
          {compliancePills.map((pill) => (
            <div
              key={pill}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                border: `1px solid ${BORDER_B}`, borderRadius: 999,
                padding: "4px 12px", fontSize: 11, fontWeight: 600,
                color: "#A0B4FF", background: "rgba(82,130,255,0.07)",
              }}
            >
              <ShieldCheck size={11} color={TEAL} weight="bold" />
              {pill}
            </div>
          ))}
        </div>

        {/* Document preview */}
        <div className="w-full mt-14">
          <DocumentPreview />
        </div>
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
      background: BG2, position: "relative", overflow: "hidden",
      paddingTop: 18, paddingBottom: 18,
      borderTop: `1px solid rgba(82,130,255,0.15)`,
      borderBottom: `1px solid rgba(82,130,255,0.15)`,
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(to right, ${BG2}, transparent)`,
      }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(to left, ${BG2}, transparent)`,
      }} />

      <div className="marquee-track" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
        {doubled.map((law, i) => (
          <div
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, paddingLeft: 32, paddingRight: 32 }}
          >
            <ShieldCheck size={13} color={TEAL} weight="bold" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>
              {law.code}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.01em" }}>
              {law.name}
            </span>
            <span style={{ width: 1, height: 14, background: BORDER, marginLeft: 8, display: "inline-block" }} />
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
  useGSAP(() => {
    gsap.from(".stat-cell", {
      opacity: 0, y: 40, stagger: 0.1, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".stats-section", start: "top 75%" },
    });
  }, []);

  return (
    <section className="stats-section" style={{ background: BG }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        maxWidth: 1280, margin: "0 auto",
      }}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="stat-cell"
            style={{
              padding: "44px 40px",
              borderTop: `1px solid rgba(82,130,255,0.15)`,
              borderRight: i < 3 ? `1px solid ${BORDER}` : "none",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div
              className={`font-syne ${i % 2 === 0 ? "gradient-text" : ""}`}
              style={{
                fontSize: "clamp(44px, 6vw, 72px)",
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 8,
                color: i % 2 !== 0 ? TEXT : undefined,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURE VISUALS
═══════════════════════════════════════════ */
function FeatureVisual01() {
  const ref = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);
  const lines = [92, 75, 100, 63, 84];

  useGSAP(() => {
    gsap.from(linesRef.current, {
      width: 0, duration: 0.7,
      stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      style={{
        background: SURFACE, border: `1px solid ${BORDER_B}`, borderRadius: 16,
        padding: 28, minHeight: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: ACCENT,
          animation: "glow-pulse 1.5s ease-in-out infinite",
          boxShadow: `0 0 8px ${ACCENT}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT }}>Generating…</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((w, i) => (
          <div key={i} style={{ height: 8, borderRadius: 4, background: BORDER, overflow: "hidden" }}>
            <div
              ref={(el) => { if (el) linesRef.current[i] = el; }}
              style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})`, width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureVisual02() {
  const ref = useRef<HTMLDivElement>(null);
  const barRefs = useRef<HTMLDivElement[]>([]);
  const frameworks = [
    { name: "IMC 2002",    pct: 100 },
    { name: "BNS §§24-30", pct: 100 },
    { name: "MoRTH 2025",  pct: 95  },
    { name: "CPA 2019",    pct: 98  },
  ];

  useGSAP(() => {
    gsap.from(barRefs.current, {
      width: 0, duration: 0.8,
      stagger: 0.15, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, minHeight: 200 }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 18, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Frameworks
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {frameworks.map((f, i) => (
          <div key={f.name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: TEAL, fontWeight: 700 }}>{f.pct}%</span>
            </div>
            <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
              <div
                ref={(el) => { if (el) barRefs.current[i] = el; }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})`, borderRadius: 2, width: `${f.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        <span className="font-syne gradient-text" style={{ fontSize: 32, fontWeight: 700 }}>100%</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>coverage</span>
      </div>
    </div>
  );
}

function FeatureVisual03() {
  const ref = useRef<HTMLDivElement>(null);
  const clauses = [
    "Patient identification verified",
    "Procedure explained in detail",
    "Risks & complications disclosed",
    "Alternative treatments listed",
    "Voluntary consent confirmed",
    "Witness block complete",
    "Doctor's countersignature",
  ];

  useGSAP(() => {
    gsap.from(".clause-item", {
      opacity: 0, x: -20, stagger: 0.07, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      style={{
        background: SURFACE, border: `1px solid ${BORDER_B}`, borderRadius: 16,
        padding: 28, minHeight: 200,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Clauses
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {clauses.map((c) => (
          <div
            key={c}
            className="clause-item"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3, background: GREEN,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CheckCircle size={9} color={BG} weight="bold" />
            </div>
            <span style={{ fontSize: 11, color: TEXT, fontWeight: 500 }}>{c}</span>
          </div>
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
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Section header
    gsap.from(".features-header", {
      opacity: 0, y: 30, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".features-header", start: "top 80%" },
    });

    // Feature rows
    gsap.utils.toArray<HTMLElement>(".feature-row").forEach((row, i) => {
      const text = row.querySelector(".feature-text");
      const visual = row.querySelector(".feature-visual");
      gsap.from([text, visual], {
        opacity: 0,
        x: (j: number) => (i % 2 === 0 ? (j === 0 ? -40 : 40) : (j === 0 ? 40 : -40)),
        duration: 0.8, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: row, start: "top 75%" },
      });
    });
  }, { scope: sectionRef });

  return (
    <section id="features" ref={sectionRef} style={{ background: BG }}>
      {/* Section header */}
      <div className="features-header" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
          <Lightning size={14} color={ACCENT} weight="bold" />
          <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Features
          </span>
        </div>
        <div style={{ paddingBottom: 48, borderBottom: `1px solid ${BORDER}` }}>
          <h2
            className="font-syne"
            style={{ margin: 0, padding: 0, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: TEXT, fontWeight: 700 }}
          >
            Everything a doctor needs
            <br />
            <span className="gradient-text">before the procedure.</span>
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
              className="feature-row"
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              {/* Text side */}
              <div
                className="feature-text"
                style={{
                  padding: "56px 48px",
                  borderRight: isEven ? `1px solid ${BORDER}` : "none",
                  borderLeft: isEven ? "none" : `1px solid ${BORDER}`,
                  order: isEven ? 0 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20 }}>
                  <span className="font-syne" style={{ fontSize: 80, fontWeight: 700, color: "rgba(255,255,255,0.06)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                    {feat.num}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {feat.tag}
                  </span>
                </div>
                <h3
                  className="font-syne"
                  style={{
                    margin: "0 0 16px",
                    fontSize: "clamp(28px, 3.5vw, 42px)",
                    fontWeight: 700, color: TEXT,
                    lineHeight: 1.15, letterSpacing: "-0.02em",
                    whiteSpace: "pre-line",
                  }}
                >
                  {feat.title}
                </h3>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, marginBottom: 28, maxWidth: 420 }}>
                  {feat.body}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="font-syne gradient-text" style={{ fontSize: 40, fontWeight: 700 }}>
                    {feat.metric.value}
                  </span>
                  <span style={{ fontSize: 13, color: MUTED }}>
                    {feat.metric.label}
                  </span>
                </div>
              </div>

              {/* Visual side */}
              <div
                className="feature-visual"
                style={{ padding: "56px 48px", display: "flex", alignItems: "center", order: isEven ? 1 : 0 }}
              >
                <div style={{ width: "100%" }}>
                  <Visual />
                </div>
              </div>
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
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".type-card", {
      opacity: 0, x: 30, stagger: 0.04, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: ".types-track", start: "top 80%" },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} style={{ background: BG2, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
            <Stethoscope size={14} color={ACCENT} weight="bold" />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Consent Types
            </span>
          </div>
          <h2
            className="font-syne"
            style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", fontWeight: 700, color: TEXT }}
          >
            10+ procedure-specific{" "}
            <span className="gradient-text">consent templates.</span>
          </h2>
        </div>

        {/* Horizontal scroll */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to right, ${BG2}, transparent)`,
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to left, ${BG2}, transparent)`,
          }} />
          <div
            className="types-track no-scrollbar"
            style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}
          >
            {CONSENT_TYPES.map((ct) => (
              <div
                key={ct.name}
                className="type-card glow-card"
                style={{
                  width: 160, flexShrink: 0, borderRadius: 16, padding: 20,
                  cursor: "default",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{ct.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{ct.name}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{ct.sub}</div>
              </div>
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
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".step-cell", {
      opacity: 0, y: 30, stagger: 0.15, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".steps-grid", start: "top 75%" },
    });
  }, { scope: sectionRef });

  return (
    <section id="how-it-works" ref={sectionRef} style={{ background: BG, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h2
            className="font-syne"
            style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", fontWeight: 700, color: TEXT }}
          >
            Three steps to a{" "}
            <span className="gradient-text">compliant consent form.</span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="step-cell"
              style={{
                borderTop: `1px solid rgba(82,130,255,0.15)`,
                borderRight: i < 2 ? `1px solid ${BORDER}` : "none",
                padding: "36px 36px 40px",
              }}
            >
              <div
                className="font-syne"
                style={{
                  fontSize: 80, fontWeight: 700, color: "rgba(255,255,255,0.05)", lineHeight: 1,
                  letterSpacing: "-0.04em", marginBottom: 20,
                }}
              >
                {step.n}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 10, lineHeight: 1.3 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>
                {step.body}
              </p>
            </div>
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [active]);

  const t = TESTIMONIALS[active];

  return (
    <section style={{ background: BG2, padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      {/* Decorative quote */}
      <div className="font-syne" style={{
        position: "absolute", top: 20, left: 48, fontSize: 200,
        color: "rgba(82,130,255,0.08)",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>
        &ldquo;
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40 }}>
          Testimonials
        </div>

        <div ref={containerRef}>
          <blockquote
            className="font-syne"
            style={{
              margin: 0, marginBottom: 40,
              fontSize: "clamp(20px, 3vw, 34px)",
              fontWeight: 500, color: TEXT,
              lineHeight: 1.35, letterSpacing: "-0.01em",
              maxWidth: 720,
            }}
          >
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: WHITE, flexShrink: 0,
            }}>
              {t.initials}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 36 }}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                height: 6, borderRadius: 999,
                width: i === active ? 24 : 6,
                background: i === active ? ACCENT : "rgba(255,255,255,0.15)",
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
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".cta-block", {
      opacity: 0, scale: 0.95, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".cta-block", start: "top 80%" },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} style={{ background: BG, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="cta-block dark-card"
          style={{ padding: "80px 64px", textAlign: "center" }}
        >
          {/* Background watermark */}
          <div
            className="font-syne"
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(80px, 14vw, 200px)", fontWeight: 800,
              color: "rgba(82,130,255,0.03)", lineHeight: 1, pointerEvents: "none",
              userSelect: "none", whiteSpace: "nowrap", overflow: "hidden",
            }}
          >
            ConsentGen
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
              <Sparkle size={14} color={ACCENT} />
              <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Ready to streamline
              </span>
            </div>
            <h2
              className="font-syne"
              style={{ margin: "0 0 16px", fontSize: "clamp(32px, 5vw, 60px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: TEXT, fontWeight: 800 }}
            >
              Generate your first{" "}
              <span className="gradient-text">consent form for free.</span>
            </h2>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Join hundreds of Indian doctors who trust ConsentGen for their medico-legal documentation.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/generate"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: WHITE, color: BG, borderRadius: 999,
                  padding: "14px 32px", fontSize: 15, fontWeight: 700,
                  textDecoration: "none", transition: "opacity 0.15s",
                }}
                className="hover:opacity-90"
              >
                Start Generating
                <ArrowRight size={15} weight="bold" />
              </Link>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", color: TEXT,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  borderRadius: 999, padding: "14px 28px", fontSize: 15, fontWeight: 600,
                  textDecoration: "none", transition: "border-color 0.15s",
                }}
                className="hover:border-white/40"
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
                  <div className="font-syne gradient-text" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
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
    <footer style={{ background: BG, borderTop: `1px solid ${BORDER_B}`, padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldCheck size={16} color={WHITE} weight="bold" />
              </div>
              <span className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>ConsentGen</span>
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, maxWidth: 240, marginBottom: 18 }}>
              AI-powered medico-legal consent form generator for Indian doctors. Generate, verify, and export in seconds.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["IMC 2002", "BNS §§24-30", "MoRTH 2025"].map(b => (
                <div key={b} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  border: `1px solid ${BORDER_B}`, borderRadius: 999,
                  padding: "3px 9px", fontSize: 10, fontWeight: 600, color: "#A0B4FF",
                  background: "rgba(82,130,255,0.07)",
                }}>
                  <ShieldCheck size={9} color={TEAL} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Application */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Application
            </div>
            {[
              { label: "Generate Form", href: "/generate" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "History", href: "/history" },
              { label: "Sign In", href: "/login" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{ display: "block", fontSize: 14, color: MUTED, textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}
                className="hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Compliance */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Compliance
            </div>
            {COMPLIANCE_LAWS.map(law => (
              <div key={law.code} style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: TEXT }}>{law.code}</span>
                <span style={{ display: "block", fontSize: 11, color: MUTED, marginTop: 1 }}>{law.name}</span>
              </div>
            ))}
          </div>

          {/* Stay Updated */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Stay Updated
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 14 }}>
              Get updates on new consent templates and compliance changes.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1, fontSize: 13, padding: "9px 12px",
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  background: SURFACE, color: TEXT, outline: "none",
                }}
              />
              <button
                type="button"
                style={{
                  padding: "9px 16px", background: ACCENT, color: WHITE,
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", boxShadow: `0 0 12px rgba(82,130,255,0.3)`,
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 24, borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: MUTED }}>© 2025 ConsentGen. Built for Indian Medical Practice.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: MUTED }}>
            <ShieldCheck size={12} color={TEAL} />
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
