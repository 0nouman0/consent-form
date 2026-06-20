"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Stethoscope,
  Lightning,
  Star,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";

gsap.registerPlugin(ScrollTrigger);

/* ─── PALETTE ─── */
const WHITE    = "#FFFFFF";
const PAGE_BG  = "#F5F5F5";
const MINT     = "#C4D5CF";
const INK      = "#0A0A0B";
const BODY_TXT = "#6B6B78";
const MUTED    = "#9B9BA8";
const BORDER   = "#E8E8EA";
const PILL_BG  = "#F0F0F2";
const DARK_BTN = "#111118";
const BLOB_LAV = "#C0AEE8";
const BLOB_PINK= "#EAA8C0";
const BLOB_ORA = "#E89860";

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
  { value: "6+",  label: "Legal Frameworks", sub: "IMC · BNS · MoRTH · more" },
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

const WORKFLOW_DOTS = [
  { label: "Patient Identity",      angle: 0   },
  { label: "Procedure Briefing",    angle: 60  },
  { label: "Risk Disclosure",       angle: 120 },
  { label: "Alternatives Listed",   angle: 180 },
  { label: "Witness Block",         angle: 240 },
  { label: "Doctor Sign-off",       angle: 300 },
];

/* ═══════════════════════════════════════════
   PRISMATIC LIGHT SVG
═══════════════════════════════════════════ */
function PrismaticLight() {
  const lines = Array.from({ length: 70 }, (_, i) => {
    const x = i * 1.4;
    const wave = Math.sin(i * 0.15) * 14;
    const hue = 255 + i * 3;
    const sat = 55 + Math.sin(i * 0.4) * 15;
    const lit = 52 + Math.sin(i * 0.7) * 12;
    const opacity = 0.65 + Math.sin(i * 0.5) * 0.35;
    return { x1: x, x2: x + wave, hue, sat, lit, opacity };
  });

  return (
    <svg width="100" height="280" viewBox="0 0 100 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={0}
          x2={l.x2} y2={280}
          stroke={`hsl(${l.hue}, ${l.sat}%, ${l.lit}%)`}
          strokeWidth={1.2}
          strokeOpacity={l.opacity}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   ABSTRACT ART (blobs + prismatic)
═══════════════════════════════════════════ */
function AbstractArt() {
  return (
    <div className="relative w-full h-full">
      {/* Lavender blob — top left area */}
      <div
        className="blob-drift absolute"
        style={{
          top: "5%", left: "5%",
          width: 300, height: 260,
          background: `radial-gradient(ellipse, ${BLOB_LAV} 0%, rgba(192,174,232,0.6) 50%, transparent 75%)`,
          borderRadius: "60% 40% 55% 45% / 50% 60% 40% 55%",
          filter: "blur(2px)",
        }}
      />
      {/* Pink blob — top right */}
      <div
        className="blob-drift-2 absolute"
        style={{
          top: "0%", right: "0%",
          width: 240, height: 220,
          background: `radial-gradient(ellipse, ${BLOB_PINK} 0%, rgba(234,168,192,0.5) 50%, transparent 75%)`,
          borderRadius: "45% 55% 40% 60% / 60% 40% 55% 45%",
          filter: "blur(1px)",
        }}
      />
      {/* Orange blob — bottom right */}
      <div
        className="blob-drift-3 absolute"
        style={{
          bottom: "5%", right: "5%",
          width: 220, height: 200,
          background: `radial-gradient(ellipse, ${BLOB_ORA} 0%, rgba(232,152,96,0.5) 50%, transparent 75%)`,
          borderRadius: "55% 45% 60% 40% / 45% 55% 45% 55%",
          filter: "blur(1px)",
        }}
      />
      {/* Prismatic vertical strip — center */}
      <div
        className="absolute"
        style={{
          top: "15%", left: "42%",
          transform: "translateX(-50%)",
        }}
      >
        <PrismaticLight />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FLOATING CARD
═══════════════════════════════════════════ */
function FloatingCard() {
  return (
    <div
      className="float-card absolute top-6 right-6 w-56 rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 10,
      }}
    >
      {/* Three dots */}
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: i === 0 ? "#D1D1D6" : "transparent", border: `1px solid ${BORDER}` }}
          />
        ))}
      </div>
      {/* Text */}
      <p className="text-xs font-dm leading-relaxed mb-3" style={{ color: INK }}>
        Generate consent in 30 seconds with full legal compliance
      </p>
      {/* Avatar row */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #6B7FD4, #8B6FC4)", fontSize: 9 }}
        >
          DR
        </div>
        <div>
          <div className="font-dm font-medium" style={{ fontSize: 10, color: INK }}>@consentgen</div>
          <div style={{ fontSize: 9, color: MUTED }}>AI Verified</div>
        </div>
      </div>
      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="font-dm" style={{ fontSize: 10, color: MUTED }}>Consultant</span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: DARK_BTN }}
        >
          <ArrowUpRight className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════ */
function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setIsLoggedIn(!!(s?.user)));
    return () => subscription.unsubscribe();
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-nav",     { opacity: 0, y: -20, duration: 0.5 })
      .from(".hero-eyebrow", { opacity: 0, y: 20,  duration: 0.5 }, "-=0.2")
      .from(".split-word",   { opacity: 0, y: 50,  stagger: 0.06, duration: 0.65 }, "-=0.2")
      .from(".hero-sub",     { opacity: 0, y: 20,  duration: 0.4 }, "-=0.2")
      .from(".hero-cta",     { opacity: 0, y: 20,  duration: 0.4 }, "-=0.2")
      .from(".hero-info",    { opacity: 0, y: 30,  duration: 0.5 }, "-=0.1")
      .from(".right-panel",  { opacity: 0, x: 30,  duration: 0.7, ease: "power2.out" }, "-=0.5")
      .from(".float-card",   { opacity: 0, y: -20, duration: 0.5 }, "-=0.3");
  }, []);

  return (
    <section className="flex min-h-screen" style={{ background: PAGE_BG }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="flex flex-col"
        style={{ width: "55%", background: WHITE, borderRadius: "0 0 24px 0" }}
      >
        {/* NAV */}
        <nav className="hero-nav flex items-center justify-between px-8 py-5 flex-shrink-0">
          {/* Logo pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ border: `1px solid ${BORDER}`, background: PILL_BG }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: INK }} />
            <span className="font-syne font-semibold text-sm" style={{ color: INK }}>ConsentGen</span>
          </div>

          {/* Center nav pills */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="#"
              className="px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ border: `1px solid ${BORDER}`, background: PILL_BG, color: INK }}
            >
              <span className="mr-1">•</span> Home
            </a>
            {["Features", "How It Works"].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="px-4 py-1.5 rounded-full text-sm transition-colors"
                style={{ border: `1px solid ${BORDER}`, background: PILL_BG, color: BODY_TXT }}
              >
                {item}
              </a>
            ))}
            {isLoggedIn === false && (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full text-sm"
                style={{ border: `1px solid ${BORDER}`, background: PILL_BG, color: BODY_TXT }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isLoggedIn === null && (
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: PILL_BG }} />
            )}
            {isLoggedIn === false && (
              <Link
                href="/generate"
                className="px-5 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: DARK_BTN }}
              >
                Get Started
              </Link>
            )}
            {isLoggedIn === true && (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 rounded-full text-sm font-medium"
                  style={{ border: `1px solid ${BORDER}`, background: PILL_BG, color: INK }}
                >
                  Dashboard
                </Link>
                <UserMenu compact />
              </div>
            )}
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-14 pb-8">
          {/* Eyebrow */}
          <div className="hero-eyebrow flex items-center gap-3 mb-6">
            <div className="w-8 h-0.5" style={{ background: INK }} />
            <span className="text-sm font-dm" style={{ color: BODY_TXT }}>
              Generate Compliant Consent Forms With AI
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-syne font-extrabold leading-[0.9] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(52px, 7vw, 96px)", color: INK }}
          >
            {["Generate", "Compliant", "Consent"].map((word, i) => (
              <span key={i} className="split-word block">{word}</span>
            ))}
            {/* Last line with inline avatar + arrow */}
            <span className="flex items-end gap-3 flex-wrap">
              <span className="split-word">Forms.</span>
              <span className="inline-flex items-center gap-2 mb-2">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #6B7FD4, #8B6FC4)" }}
                >
                  DR
                </span>
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: PILL_BG, border: `1px solid ${BORDER}` }}
                >
                  <ArrowUpRight className="w-4 h-4" style={{ color: INK }} />
                </span>
              </span>
            </span>
          </h1>

          {/* Subtext */}
          <p className="hero-sub font-dm text-base leading-relaxed max-w-xs mb-8" style={{ color: BODY_TXT }}>
            Learn how Indian doctors generate IMC 2002 compliant consent forms in under 30 seconds using AI.
          </p>

          {/* CTA */}
          <div className="hero-cta flex items-center gap-4">
            <Link
              href="/generate"
              className="px-8 py-3.5 rounded-full font-dm font-medium text-sm tracking-[0.08em] uppercase text-white"
              style={{ background: DARK_BTN }}
            >
              Explore More
            </Link>
          </div>

          {/* Scroll badge */}
          <div
            className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full self-start"
            style={{ border: `1px solid ${BORDER}`, background: PILL_BG }}
          >
            <span className="text-xs font-dm" style={{ color: MUTED }}>Scroll</span>
            <ArrowRight className="w-3 h-3 rotate-90" style={{ color: MUTED }} />
          </div>
        </div>

        {/* BOTTOM INFO ROW */}
        <div className="hero-info px-10 sm:px-14 pb-8 flex gap-6 items-start flex-wrap">
          {/* Top consent types */}
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-lg mb-3" style={{ color: INK }}>
              Top consent types
            </p>
            <div className="flex flex-wrap gap-2">
              {["Surgical", "Anaesthesia", "Emergency", "Psychiatric"].map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-dm"
                  style={{ border: `1px solid ${BORDER}`, color: BODY_TXT }}
                >
                  {tag}
                </span>
              ))}
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: INK }} />
              </span>
            </div>
          </div>

          {/* Feature mini-card */}
          <div className="w-56 rounded-2xl p-4 flex-shrink-0" style={{ background: PILL_BG }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-syne font-semibold" style={{ color: INK }}>
                AI Consent Progress
              </span>
              <div className="flex gap-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ border: `1px solid ${BORDER}`, color: MUTED }}
                >←</span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ border: `1px solid ${BORDER}`, color: MUTED }}
                >→</span>
              </div>
            </div>
            <p className="font-dm leading-relaxed" style={{ fontSize: 11, color: MUTED }}>
              AI provides doctors support &amp; legally validated consent documentation in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="right-panel relative flex-1 overflow-hidden"
        style={{ background: MINT, borderRadius: "0 0 0 24px" }}
      >
        {/* Abstract blob art — fills the panel */}
        <div className="absolute inset-0">
          <AbstractArt />
        </div>

        {/* Floating card */}
        <FloatingCard />

        {/* Bottom stats strip */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {[
            { label: "2.1k", sub: "Forms Generated" },
            { label: "98%",  sub: "Compliance Rate" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex-1 p-6"
              style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.2)" : "none" }}
            >
              <p className="font-dm mb-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {s.sub}
              </p>
              <div className="flex items-end gap-2">
                <span className="font-syne font-bold text-3xl text-white">{s.label}</span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center mb-0.5"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <ArrowUpRight className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="absolute bottom-20 right-6 max-w-[180px]">
          <p className="font-dm leading-relaxed" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            Patients who benefit from compliant documentation and enjoying compliance with peace of mind
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   INFO STRIP (below hero — 3 cards)
═══════════════════════════════════════════ */
function InfoStrip() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto"
      style={{ padding: "0 40px", gap: 24, marginTop: 40, marginBottom: 40 }}
    >
      {[
        {
          icon: <ShieldCheck className="w-5 h-5" style={{ color: "#6B7FD4" }} />,
          title: "IMC 2002 Compliant",
          body: "Every form built on Indian Medical Council Regulation standards.",
        },
        {
          icon: <Lightning className="w-5 h-5" style={{ color: "#E89860" }} />,
          title: "AI in 30 Seconds",
          body: "Groq-powered drafting from patient details to final consent.",
        },
        {
          icon: <Stethoscope className="w-5 h-5" style={{ color: "#EAA8C0" }} />,
          title: "10+ Consent Types",
          body: "Surgical, anaesthesia, psychiatric, emergency and more.",
        },
      ].map((card, i) => (
        <div
          key={i}
          className="rounded-2xl p-6"
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
            style={{ background: PILL_BG }}
          >
            {card.icon}
          </div>
          <p className="font-syne font-semibold text-sm mb-2" style={{ color: INK }}>{card.title}</p>
          <p className="font-dm text-sm leading-relaxed" style={{ color: BODY_TXT }}>{card.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STATS SECTION (MYDNA-inspired)
═══════════════════════════════════════════ */
function StatsSection() {
  useGSAP(() => {
    gsap.from(".stat-cell", {
      opacity: 0, y: 40, stagger: 0.1, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".stats-section", start: "top 75%" },
    });
  }, []);

  // Concentric circles SVG
  const cx = 200, cy = 200;
  const radii = [60, 100, 140, 175];

  return (
    <section className="stats-section" style={{ background: WHITE, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left: 2×2 large stat grid */}
          <div className="grid grid-cols-2 gap-0">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="stat-cell"
                style={{
                  padding: "36px 32px",
                  borderBottom: i < 2 ? `1px solid ${BORDER}` : "none",
                  borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div
                  className="font-syne font-bold"
                  style={{ fontSize: "clamp(44px, 5vw, 64px)", color: INK, lineHeight: 1, marginBottom: 6 }}
                >
                  {stat.value}
                </div>
                <div className="w-8 h-0.5 mb-3" style={{ background: BORDER }} />
                <div className="font-dm text-sm font-medium mb-1" style={{ color: INK }}>{stat.label}</div>
                <div className="font-dm text-xs" style={{ color: MUTED }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Right: Concentric circles diagram */}
          <div className="flex flex-col items-center">
            <p className="font-syne font-bold text-xl mb-2" style={{ color: INK }}>
              Consent Workflow
            </p>
            <p className="font-dm text-sm mb-8" style={{ color: BODY_TXT }}>
              Six-stage compliance verification process
            </p>
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
              {radii.map(r => (
                <circle key={r} cx={cx} cy={cy} r={r} stroke={BORDER} strokeWidth={1.5} fill="none" />
              ))}
              {/* Center dot */}
              <circle cx={cx} cy={cy} r={6} fill="#9B84D8" />
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize={9} fill={MUTED} fontFamily="DM Sans">
                AI Core
              </text>

              {/* Workflow dots */}
              {WORKFLOW_DOTS.map((dot, i) => {
                const r = i < 3 ? 140 : 175;
                const rad = (dot.angle - 90) * (Math.PI / 180);
                const dx = cx + r * Math.cos(rad);
                const dy = cy + r * Math.sin(rad);
                const labelDx = cx + (r + 22) * Math.cos(rad);
                const labelDy = cy + (r + 22) * Math.sin(rad);
                return (
                  <g key={dot.label}>
                    <circle cx={dx} cy={dy} r={5} fill="#9B84D8" />
                    <text
                      x={labelDx}
                      y={labelDy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fill={BODY_TXT}
                      fontFamily="DM Sans"
                    >
                      {dot.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES SECTION (light theme)
═══════════════════════════════════════════ */
function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".features-header", {
      opacity: 0, y: 30, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".features-header", start: "top 80%" },
    });
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

  const featureColors = ["#C0AEE8", "#EAA8C0", "#E89860"];

  return (
    <section id="features" ref={sectionRef} style={{ background: PAGE_BG, padding: "80px 0 0" }}>
      <div className="features-header" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 48px" }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightning className="w-3.5 h-3.5" style={{ color: INK }} />
          <span className="font-dm text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: INK }}>
            Features
          </span>
        </div>
        <h2
          className="font-syne font-extrabold"
          style={{ margin: 0, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: INK }}
        >
          Everything a doctor needs
          <br />
          <span style={{ color: MUTED }}>before the procedure.</span>
        </h2>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {FEATURES.map((feat, i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={feat.num}
              className="feature-row grid grid-cols-1 md:grid-cols-2"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {/* Text side */}
              <div
                className="feature-text"
                style={{
                  padding: "56px 48px",
                  borderRight: isEven ? `1px solid ${BORDER}` : "none",
                  borderLeft: isEven ? "none" : `1px solid ${BORDER}`,
                  order: isEven ? 0 : 1,
                  background: WHITE,
                }}
              >
                <div className="flex items-baseline gap-3 mb-6">
                  <span
                    className="font-syne font-extrabold"
                    style={{ fontSize: 80, color: `${featureColors[i]}30`, lineHeight: 1, letterSpacing: "-0.04em" }}
                  >
                    {feat.num}
                  </span>
                  <span
                    className="font-dm text-xs font-semibold tracking-[0.08em] uppercase"
                    style={{ color: featureColors[i] }}
                  >
                    {feat.tag}
                  </span>
                </div>
                <h3
                  className="font-syne font-extrabold"
                  style={{
                    margin: "0 0 16px", whiteSpace: "pre-line",
                    fontSize: "clamp(28px, 3.5vw, 42px)",
                    lineHeight: 1.15, letterSpacing: "-0.02em", color: INK,
                  }}
                >
                  {feat.title}
                </h3>
                <p className="font-dm text-sm leading-relaxed mb-8" style={{ color: BODY_TXT, maxWidth: 400 }}>
                  {feat.body}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-syne font-extrabold"
                    style={{ fontSize: 40, color: INK }}
                  >
                    {feat.metric.value}
                  </span>
                  <span className="font-dm text-sm" style={{ color: MUTED }}>{feat.metric.label}</span>
                </div>
              </div>

              {/* Visual side */}
              <div
                className="feature-visual"
                style={{
                  padding: "56px 48px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  order: isEven ? 1 : 0,
                  background: PILL_BG,
                }}
              >
                {/* Abstract visual */}
                <div
                  className="rounded-2xl w-full"
                  style={{
                    background: WHITE,
                    border: `1px solid ${BORDER}`,
                    padding: 32, minHeight: 200,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: featureColors[i] }}
                    />
                    <span className="font-dm text-xs font-semibold" style={{ color: INK }}>{feat.tag} Active</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[92, 75, 100, 63, 84].map((w, j) => (
                      <div key={j} style={{ height: 7, borderRadius: 4, background: BORDER, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%", borderRadius: 4,
                            width: `${w}%`,
                            background: `linear-gradient(90deg, ${featureColors[i]}, ${featureColors[i]}80)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-2 mt-6">
                    <span className="font-syne font-bold text-3xl" style={{ color: INK }}>{feat.metric.value}</span>
                    <span className="font-dm text-xs" style={{ color: MUTED }}>{feat.metric.label}</span>
                  </div>
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
    <section ref={sectionRef} style={{ background: WHITE, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-3.5 h-3.5" style={{ color: INK }} />
            <span className="font-dm text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: INK }}>
              Consent Types
            </span>
          </div>
          <h2
            className="font-syne font-extrabold"
            style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: INK }}
          >
            10+ procedure-specific{" "}
            <span style={{ color: MUTED }}>consent templates.</span>
          </h2>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to right, ${WHITE}, transparent)`,
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 60, zIndex: 1, pointerEvents: "none",
            background: `linear-gradient(to left, ${WHITE}, transparent)`,
          }} />
          <div
            className="types-track no-scrollbar"
            style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}
          >
            {CONSENT_TYPES.map((ct) => (
              <div
                key={ct.name}
                className="type-card"
                style={{
                  width: 160, flexShrink: 0, borderRadius: 16, padding: 20,
                  cursor: "default",
                  background: PILL_BG,
                  border: `1px solid ${BORDER}`,
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{ct.icon}</div>
                <div className="font-syne font-semibold text-sm mb-1" style={{ color: INK }}>{ct.name}</div>
                <div className="font-dm text-xs" style={{ color: MUTED }}>{ct.sub}</div>
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
    <section id="how-it-works" ref={sectionRef} style={{ background: PAGE_BG, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ marginBottom: 56 }}>
          <h2
            className="font-syne font-extrabold"
            style={{ margin: 0, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: INK }}
          >
            Three steps to a{" "}
            <span style={{ color: MUTED }}>compliant consent form.</span>
          </h2>
        </div>

        <div className="steps-grid grid grid-cols-1 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="step-cell"
              style={{
                borderTop: `1px solid ${BORDER}`,
                borderRight: i < 2 ? `1px solid ${BORDER}` : "none",
                padding: "36px 36px 40px",
                background: WHITE,
              }}
            >
              <div
                className="font-syne font-extrabold"
                style={{ fontSize: 80, color: `${INK}08`, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 20 }}
              >
                {step.n}
              </div>
              <h3
                className="font-syne font-bold"
                style={{ fontSize: 20, color: INK, marginBottom: 10, lineHeight: 1.3 }}
              >
                {step.title}
              </h3>
              <p className="font-dm text-sm leading-relaxed" style={{ color: BODY_TXT }}>
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
    <section style={{ background: WHITE, padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      {/* Decorative quote */}
      <div
        className="font-syne"
        style={{
          position: "absolute", top: 20, left: 48, fontSize: 200,
          color: `${BORDER}`,
          lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}
      >
        &ldquo;
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          className="font-dm text-xs font-semibold tracking-[0.1em] uppercase mb-10"
          style={{ color: MUTED }}
        >
          Testimonials
        </div>

        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <Star key={i} className="w-4 h-4" style={{ color: "#E89860" }} weight="fill" />
          ))}
        </div>

        <div ref={containerRef}>
          <blockquote
            className="font-syne font-bold"
            style={{
              margin: "0 0 40px",
              fontSize: "clamp(20px, 3vw, 34px)",
              color: INK,
              lineHeight: 1.35, letterSpacing: "-0.01em",
              maxWidth: 720,
            }}
          >
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm"
              style={{ background: "linear-gradient(135deg, #6B7FD4, #8B6FC4)" }}
            >
              {t.initials}
            </div>
            <div>
              <div className="font-syne font-bold text-sm" style={{ color: INK }}>{t.name}</div>
              <div className="font-dm text-xs" style={{ color: MUTED }}>{t.role}</div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-9">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                height: 6, borderRadius: 999,
                width: i === active ? 24 : 6,
                background: i === active ? INK : BORDER,
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
    <section ref={sectionRef} style={{ background: PAGE_BG, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="cta-block relative overflow-hidden rounded-3xl"
          style={{
            padding: "80px 64px",
            textAlign: "center",
            background: INK,
          }}
        >
          {/* Background watermark */}
          <div
            className="font-syne"
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(80px, 14vw, 200px)", fontWeight: 800,
              color: "rgba(255,255,255,0.03)", lineHeight: 1,
              pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap", overflow: "hidden",
            }}
          >
            ConsentGen
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <ShieldCheck className="w-4 h-4" style={{ color: MUTED }} />
              <span className="font-dm text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: MUTED }}>
                Ready to streamline
              </span>
            </div>
            <h2
              className="font-syne font-extrabold"
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(32px, 5vw, 60px)",
                lineHeight: 1.1, letterSpacing: "-0.025em",
                color: WHITE, fontWeight: 800,
              }}
            >
              Generate your first{" "}
              <span style={{ color: `${MINT}` }}>consent form for free.</span>
            </h2>
            <p className="font-dm text-base" style={{ color: MUTED, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Join hundreds of Indian doctors who trust ConsentGen for their medico-legal documentation.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-full font-dm font-semibold text-sm"
                style={{ background: WHITE, color: INK, padding: "14px 32px" }}
              >
                Start Generating
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full font-dm font-semibold text-sm"
                style={{
                  background: "transparent", color: WHITE,
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "14px 28px",
                }}
              >
                View Dashboard
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex gap-12 justify-center mt-14 flex-wrap">
              {[
                { value: "10+", label: "Consent Types" },
                { value: "30s", label: "Generation Time" },
                { value: "100%", label: "IMC Compliant" },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div className="font-syne font-extrabold text-3xl mb-1" style={{ color: WHITE }}>{value}</div>
                  <div className="font-dm text-xs" style={{ color: MUTED }}>{label}</div>
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
    <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: INK }}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-syne font-bold text-base" style={{ color: INK }}>ConsentGen</span>
            </div>
            <p className="font-dm text-sm leading-relaxed mb-4" style={{ color: BODY_TXT, maxWidth: 280 }}>
              AI-powered medico-legal consent form generator for Indian doctors. Generate, verify, and export in seconds.
            </p>
            <div className="flex flex-wrap gap-2">
              {["IMC 2002", "BNS §§24-30", "MoRTH 2025"].map(b => (
                <div
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-dm font-medium"
                  style={{ border: `1px solid ${BORDER}`, color: BODY_TXT, background: PILL_BG }}
                >
                  <ShieldCheck className="w-3 h-3" style={{ color: INK }} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Application links */}
          <div>
            <div className="font-dm text-xs font-semibold tracking-[0.1em] uppercase mb-4" style={{ color: MUTED }}>
              Application
            </div>
            {[
              { label: "Generate Form", href: "/generate" },
              { label: "Dashboard",     href: "/dashboard" },
              { label: "History",       href: "/history" },
              { label: "Sign In",       href: "/login" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="block font-dm text-sm mb-3 transition-colors"
                style={{ color: BODY_TXT }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Compliance */}
          <div>
            <div className="font-dm text-xs font-semibold tracking-[0.1em] uppercase mb-4" style={{ color: MUTED }}>
              Compliance
            </div>
            {COMPLIANCE_LAWS.map(law => (
              <div key={law.code} className="mb-3">
                <span className="font-dm text-sm font-semibold" style={{ color: INK }}>{law.code}</span>
                <span className="block font-dm text-xs mt-0.5" style={{ color: MUTED }}>{law.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between flex-wrap gap-3"
          style={{ paddingTop: 24, borderTop: `1px solid ${BORDER}` }}
        >
          <p className="font-dm text-xs" style={{ color: MUTED }}>
            © 2025 ConsentGen. Built for Indian Medical Practice.
          </p>
          <div className="flex items-center gap-1.5 font-dm text-xs" style={{ color: MUTED }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: INK }} />
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
    <div style={{ background: PAGE_BG }}>
      <HeroSection />
      <InfoStrip />
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
