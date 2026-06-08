"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, FileText, Sparkle, CheckCircle, ArrowRight,
  BookOpen, Scales, Stethoscope, CaretRight, Star,
  Lightning, Lock, DownloadSimple, Play,
} from "@phosphor-icons/react/dist/ssr";

/* ─── DATA ─── */
const COMPLIANCE_BADGES = [
  "IMC 2002", "IPC §§87-93", "MoRTH 2025",
  "Consumer Protection Act 2019", "Aadhaar Act 2016",
];

const FEATURES = [
  {
    icon: Sparkle,
    title: "AI-Powered Generation",
    description:
      "Generate comprehensive consent forms in seconds using advanced language models trained on medico-legal best practices.",
    color: "from-violet-50 to-purple-50",
    iconBg: "gradient-bg",
  },
  {
    icon: Scales,
    title: "India Compliant",
    description:
      "Fully compliant with IMC 2002, Indian Penal Code §§87-93, Consumer Protection Act 2019, and MoRTH 2025 guidelines.",
    color: "bg-background",
    iconBg: "bg-violet-50",
  },
  {
    icon: BookOpen,
    title: "Legally Aligned",
    description:
      "Built on the 7 essential elements of informed consent and all 30 rules from the authoritative medico-legal reference.",
    color: "bg-background",
    iconBg: "bg-amber-50",
  },
  {
    icon: Stethoscope,
    title: "10+ Consent Types",
    description:
      "Covers surgical, anaesthesia, diagnostic, blood transfusion, telemedicine, obstetric, psychiatric, and emergency consents.",
    color: "bg-background",
    iconBg: "bg-teal-50",
  },
  {
    icon: FileText,
    title: "PDF & Print Ready",
    description:
      "Export generated consent forms directly as PDF or print them with optimized formatting for hospital records.",
    color: "bg-background",
    iconBg: "bg-slate-50",
  },
  {
    icon: CheckCircle,
    title: "Clause Verification",
    description:
      "Real-time checklist ensures every required medico-legal clause is present before you sign off on the document.",
    color: "bg-background",
    iconBg: "bg-red-50",
  },
];

const STEPS = [
  { number: "01", icon: FileText, title: "Enter Patient Details", description: "Fill in patient demographics, clinical information, and procedure details in a guided form." },
  { number: "02", icon: Stethoscope, title: "Select Consent Type", description: "Choose from 10+ consent types tailored to specific medical procedures and specialties." },
  { number: "03", icon: DownloadSimple, title: "Generate & Export", description: "AI generates a compliant form instantly. Download as PDF or print directly for records." },
];

const TESTIMONIALS = [
  {
    quote: "ConsentGen completely changed how I manage patient documentation. The AI-generated forms are accurate, compliant, and save me at least 30 minutes every day.",
    highlight: "Saves me at least 30 minutes every day.",
    name: "Dr. Rajesh Kumar", role: "Senior Surgeon, AIIMS Delhi", avatar: "RK", color: "from-violet-500 to-indigo-600",
  },
  {
    quote: "The medico-legal alignment and IMC 2002 compliance gave our hospital legal confidence. We've standardized all our consent forms with ConsentGen.",
    highlight: "We've standardized all our consent forms.",
    name: "Dr. Priya Mehta", role: "Medical Superintendent", avatar: "PM", color: "from-pink-500 to-rose-600",
  },
  {
    quote: "Real-time clause verification is a game changer. I never worry about missing a critical medico-legal requirement before a procedure.",
    highlight: "Never worry about missing a critical requirement.",
    name: "Dr. Arjun Nair", role: "Anaesthesiologist", avatar: "AN", color: "from-blue-500 to-cyan-600",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } }),
};

/* ─── CONSENT PREVIEW CARD (replaces dashboard mock) ─── */
function ConsentPreview() {
  return (
    <div className="select-none pointer-events-none w-full">
      {/* App top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border text-[11px] bg-background">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-[9px]">C</span>
          </div>
          <span className="font-semibold text-foreground text-[12px]">ConsentGen</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-border bg-muted/60">
            <span className="text-muted-foreground">🔍 Search...</span>
            <span className="ml-2 text-muted-foreground opacity-50">⌘K</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-[9px]">DR</span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex bg-background" style={{ minHeight: 260 }}>
        {/* Sidebar */}
        <div className="w-36 border-r border-border p-3 flex flex-col gap-0.5 text-[10px] shrink-0">
          {[
            { label: "Dashboard", active: false },
            { label: "Generate Consent", active: true },
            { label: "Templates", active: false },
            { label: "History", active: false },
            { label: "Chat AI", active: false },
            { label: "Profile", active: false },
          ].map((item) => (
            <div key={item.label} className={`px-2.5 py-1.5 rounded font-medium ${item.active ? "bg-foreground text-background" : "text-muted-foreground"}`}>
              {item.label}
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-border text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Compliance</div>
          {["IMC 2002", "IPC §87-93", "MoRTH 2025"].map(b => (
            <div key={b} className="px-2.5 py-1 text-[9px] text-muted-foreground">{b}</div>
          ))}
        </div>

        {/* Main: form + preview */}
        <div className="flex-1 p-4 flex gap-3 bg-muted/30">
          {/* Form fields */}
          <div className="w-44 shrink-0">
            <div className="text-[11px] font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
              Patient Details
            </div>
            <div className="space-y-2 mb-3">
              {["Patient Name", "Procedure Type", "Attending Doctor"].map(label => (
                <div key={label}>
                  <div className="text-[9px] text-muted-foreground mb-0.5">{label}</div>
                  <div className="h-7 rounded border border-border bg-background flex items-center px-2.5">
                    <div className="h-1.5 rounded-full bg-border w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-7 rounded bg-foreground flex items-center justify-center gap-1.5">
              <Sparkle className="w-2.5 h-2.5 text-background" />
              <span className="text-background text-[10px] font-semibold">Generate with AI</span>
            </div>
          </div>

          {/* Generated document preview */}
          <div className="flex-1 bg-background rounded border border-border p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-foreground">Consent Document</div>
              <span className="px-1.5 py-0.5 text-[8px] font-semibold rounded bg-foreground text-background">IMC Compliant</span>
            </div>
            {/* Doc content lines */}
            {[90, 100, 75, 100, 85].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-border/70" style={{ width: `${w}%` }} />
            ))}
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              {[
                { label: "Risks & Benefits Disclosed", ok: true },
                { label: "Alternatives Listed", ok: true },
                { label: "Patient Signature Block", ok: true },
                { label: "Witness Section", ok: false },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckCircle className={`w-3 h-3 shrink-0 ${ok ? "text-foreground" : "text-border"}`} />
                  <span className={`text-[9px] ${ok ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <div className="flex-1 h-6 rounded border border-border flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground font-medium">Download PDF</span>
              </div>
              <div className="flex-1 h-6 rounded bg-foreground flex items-center justify-center">
                <span className="text-[9px] text-background font-semibold">Print Form</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function Home() {
  return (
    <div className="min-h-screen font-body" style={{ background: "hsl(var(--background))" }}>

      {/* ─── NAVBAR ─── */}
      <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
            <ShieldCheck className="w-[17px] h-[17px] text-background" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">ConsentGen</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Compliance", "How It Works"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/generate" className="btn-primary rounded-full px-5 py-2.5 text-sm">
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section id="hero" className="relative overflow-hidden flex flex-col items-center justify-start pt-16 md:pt-20 bg-background border-b border-border pb-16">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full px-5 sm:px-8 overflow-hidden">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="badge">
              India&rsquo;s AI Medico-Legal Consent Platform ✨
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-3xl mb-4 font-bold"
          >
            Generate{" "}
            <em style={{ fontStyle: "italic" }}>compliant</em>
            {" "}consent forms
            <br className="hidden sm:block" />
            {" "}in{" "}
            <em style={{ fontStyle: "italic" }}>seconds</em>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-center text-base md:text-lg text-muted-foreground max-w-[600px] leading-relaxed font-body"
          >
            ConsentGen helps Indian doctors create medico-legal informed consent forms that comply with IMC&nbsp;2002, IPC&nbsp;§§87-93, and MoRTH&nbsp;2025—so your team can focus on patient care.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex items-center gap-3"
          >
            <Link href="/generate" className="btn-primary px-7 py-3 text-sm">
              Generate Consent Form
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Compliance badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {COMPLIANCE_BADGES.map(b => (
              <span key={b} className="px-3 py-1.5 text-xs font-medium rounded bg-muted text-muted-foreground border border-border">
                {b}
              </span>
            ))}
          </motion.div>

          {/* Consent Preview "Dashboard" */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 w-full max-w-5xl"
          >
            <div
              className="rounded overflow-hidden border border-border shadow-dashboard bg-background"
            >
              <ConsentPreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BENTO FEATURES ─── */}
      <section id="features" className="py-20 sm:py-28" style={{ background: "hsl(var(--muted))" }}>
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex justify-center mb-4">
              <span className="section-label"><Lightning className="w-3.5 h-3.5" /> Features</span>
            </motion.div>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="font-display text-4xl sm:text-5xl text-foreground mb-4 tracking-tight leading-tight">
              The future of consent<br />
              <em className="gradient-text" style={{ fontStyle: "italic" }}>documentation</em>
            </motion.h2>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" custom={2} viewport={{ once: true }}
              className="text-muted-foreground max-w-lg mx-auto text-lg font-body">
              Capture, organize, and print legally sound consent forms in seconds.
            </motion.p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Large card */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="md:col-span-5 nq-card p-8 min-h-[360px] flex flex-col bg-background"
            >
              <div className="mb-auto">
                <div className="w-10 h-10 rounded bg-foreground flex items-center justify-center mb-5">
                  <Sparkle className="w-5 h-5 text-background" />
                </div>
                <h3 className="text-2xl font-display text-foreground mb-3 tracking-tight font-bold">
                  AI-Powered Generation
                </h3>
                <p className="text-muted-foreground leading-relaxed font-body">
                  Generate comprehensive consent forms in seconds. Reduces drafting from 30 minutes to 30 seconds.
                </p>
              </div>
              <div className="mt-6 bg-muted rounded p-4 border border-border space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">AI Generating…</span>
                </div>
                {[100, 80, 90, 70].map((w, i) => (
                  <div key={i} className="h-2 rounded bg-foreground/10" style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>

            {/* 2×2 right grid */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { Icon: Scales, bg: "bg-muted", text: "text-foreground", title: "India Compliant", desc: "IMC 2002, IPC §§87-93, Consumer Protection Act 2019, and MoRTH 2025 — all covered.", extra: <div className="mt-4 flex flex-wrap gap-1.5">{["IMC 2002","IPC","MoRTH"].map(b=><span key={b} className="px-2 py-1 text-xs font-semibold rounded bg-muted text-foreground border border-border">{b}</span>)}</div> },
                { Icon: BookOpen, bg: "bg-muted", text: "text-foreground", title: "Legally Aligned", desc: "All 7 elements of informed consent and 30 rules from the authoritative medico-legal reference.", extra: <><div className="mt-4 h-1.5 rounded bg-border overflow-hidden"><div className="h-full bg-foreground w-full" /></div><span className="text-xs text-muted-foreground mt-1.5 block">100% guideline coverage</span></> },
                { Icon: Stethoscope, bg: "bg-muted", text: "text-foreground", title: "10+ Consent Types", desc: "Surgical, anaesthesia, diagnostic, blood transfusion, telemedicine, obstetric, psychiatric & more.", extra: <div className="mt-4 grid grid-cols-3 gap-1.5">{["Surgical","Anaes.","Telemd.","Obstetric","Psych.","Emerg."].map(t=><span key={t} className="px-1.5 py-1 text-[10px] font-medium rounded text-muted-foreground bg-muted border border-border text-center">{t}</span>)}</div> },
                { Icon: CheckCircle, bg: "bg-muted", text: "text-foreground", title: "Clause Verification", desc: "Real-time checklist ensures every required medico-legal clause is present before sign-off.", extra: <div className="mt-4 space-y-1.5">{[{label:"Risks disclosed",ok:true},{label:"Alternatives listed",ok:true},{label:"Witness signed",ok:false}].map(({label,ok})=><div key={label} className="flex items-center gap-2"><div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${ok?"bg-muted border border-border":"bg-border"}`}>{ok&&<div className="w-1.5 h-1.5 rounded bg-foreground" />}</div><span className={`text-xs ${ok?"text-muted-foreground":"text-muted-foreground/50"}`}>{label}</span></div>)}</div> },
              ].map(({ Icon, bg, text, title, desc, extra }, i) => (
                <motion.div key={title} variants={fadeUp} initial="hidden" whileInView="show" custom={i + 1} viewport={{ once: true }}
                  className="nq-card p-6 flex flex-col bg-background">
                  <div className={`w-9 h-9 rounded ${bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-[18px] h-[18px] ${text}`} />
                  </div>
                  <h3 className="text-lg font-display text-foreground mb-2 tracking-tight font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 font-body">{desc}</p>
                  {extra}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom 2 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="nq-card p-6 flex items-center gap-6 bg-background">
              <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 bg-foreground">
                <FileText className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="text-lg font-display text-foreground mb-1 font-bold">PDF & Print Ready</h3>
                <p className="text-sm text-muted-foreground font-body">Export consent forms as PDF or print with optimized hospital formatting.</p>
              </div>
              <Link href="/generate" className="ml-auto shrink-0 w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:border-foreground transition-colors">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="nq-card p-6 flex items-center gap-6 bg-background">
              <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 bg-foreground">
                <Lock className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="text-lg font-display text-foreground mb-1 font-bold">Secure & Private</h3>
                <p className="text-sm text-muted-foreground font-body">Patient data is never stored. All generations happen on-demand with full privacy.</p>
              </div>
              <div className="ml-auto shrink-0">
                <span className="px-3 py-1.5 text-xs font-semibold rounded bg-muted text-foreground border border-border">HIPAA-safe</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-background">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex justify-center mb-4">
              <span className="section-label"><CaretRight className="w-3.5 h-3.5" /> Process</span>
            </motion.div>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="font-display text-4xl sm:text-5xl text-foreground mb-4 tracking-tight font-bold">
              Three steps to a<br />
              <em style={{ fontStyle: "italic" }}>compliant consent form</em>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.number} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                className="nq-card p-8 text-center bg-background">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded bg-foreground flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-background" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                    <span className="text-[10px] font-black text-background">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-xl font-display text-foreground mb-3 font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="compliance" className="py-20 sm:py-28 bg-muted/50 border-t border-b border-border">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex justify-center mb-4">
              <span className="section-label"><Star className="w-3.5 h-3.5" /> Testimonials</span>
            </motion.div>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="font-display text-4xl sm:text-5xl text-foreground mb-4 tracking-tight font-bold">
              Doctors share their<br />
              <em style={{ fontStyle: "italic" }}>documentation success</em>
            </motion.h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                className="nq-card p-8 flex flex-col bg-background">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 fill-foreground text-foreground" />)}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-5 flex-1 text-[15px] font-body">&ldquo;{t.quote}&rdquo;</p>
                <blockquote className="border-l-2 border-foreground pl-4 mb-6">
                  <span className="font-semibold text-[15px] font-body text-foreground">{t.highlight}</span>
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-background text-sm font-bold shrink-0 bg-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DARK CTA ─── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="dark-card p-12 sm:p-16 text-center">
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "#ffffff" }}>
                    <Sparkle className="w-3.5 h-3.5" /> Ready to streamline documentation?
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-5 tracking-tight font-bold">
                  Generate your first<br />
                  <em style={{ fontStyle: "italic" }}>
                    consent form for free
                  </em>
                </h2>
                <p className="text-white/60 max-w-xl mx-auto mb-10 text-lg leading-relaxed font-body">
                  Join hundreds of Indian doctors who trust ConsentGen for their medico-legal documentation. Generate in under a minute.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/generate"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded text-foreground bg-white hover:bg-white/90 transition-all font-body">
                    Start Generating <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all font-body">
                    View Dashboard <CaretRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
                  {[{ val: "10+", label: "Consent Types" }, { val: "30s", label: "Avg. Generation Time" }, { val: "100%", label: "IMC Compliant" }].map(({ val, label }) => (
                    <div key={label} className="text-center">
                      <div className="font-display text-3xl text-white mb-1">{val}</div>
                      <div className="text-sm text-white/50 font-body">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background border-t border-border py-12 sm:py-16">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
                  <ShieldCheck className="w-[17px] h-[17px] text-background" />
                </div>
                <span className="text-base font-bold text-foreground">ConsentGen</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-body">
                AI-powered medico-legal consent form generator for Indian doctors. IMC 2002 compliant. Generate, verify, and export in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["IMC 2002", "IPC §§87-93", "MoRTH 2025"].map(b => (
                  <span key={b} className="px-3 py-1 text-xs font-medium rounded bg-muted text-foreground border border-border">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4">Application</div>
              <div className="space-y-3">
                {[{ label: "Generate Form", href: "/generate" }, { label: "Dashboard", href: "/dashboard" }, { label: "History", href: "/history" }, { label: "Sign In", href: "/login" }].map(({ label, href }) => (
                  <Link key={label} href={href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors font-body">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4">Stay Updated</div>
              <p className="text-sm text-muted-foreground mb-4 font-body">Get updates on new consent templates and compliance changes.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email"
                  className="flex-1 text-sm px-3 py-2.5 rounded border border-border bg-muted text-foreground placeholder-muted-foreground outline-none focus:border-foreground transition-colors" />
                <button type="button" className="px-4 py-2.5 rounded text-background text-sm font-semibold bg-foreground">→</button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-body">© 2025 ConsentGen. Built for Indian Medical Practice.</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <ShieldCheck className="w-3 h-3" /> IMC 2002 Compliant Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
