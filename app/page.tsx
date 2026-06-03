"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Scale,
  Stethoscope,
  ChevronRight,
  Star,
  Zap,
  Lock,
  Download,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Generate comprehensive consent forms in seconds using advanced language models trained on medico-legal best practices.",
  },
  {
    icon: Scale,
    title: "India Compliant",
    description:
      "Fully compliant with IMC 2002, Indian Penal Code §§87-93, Consumer Protection Act 2019, and MoRTH 2025 guidelines.",
  },
  {
    icon: BookOpen,
    title: "Narayan Reddy Aligned",
    description:
      "Built on the 7 essential elements of informed consent and all 30 rules from the authoritative medico-legal reference.",
  },
  {
    icon: Stethoscope,
    title: "10+ Consent Types",
    description:
      "Covers surgical, anaesthesia, diagnostic, blood transfusion, telemedicine, obstetric, psychiatric, and emergency consents.",
  },
  {
    icon: FileText,
    title: "PDF & Print Ready",
    description:
      "Export generated consent forms directly as PDF or print them with optimized formatting for hospital records.",
  },
  {
    icon: CheckCircle2,
    title: "Clause Verification",
    description:
      "Real-time checklist ensures every required medico-legal clause is present before you sign off on the document.",
  },
];

const COMPLIANCE_BADGES = [
  "IMC 2002",
  "IPC §§87-93",
  "MoRTH 2025",
  "Consumer Protection Act 2019",
  "Narayan Reddy Guidelines",
  "Aadhaar Act 2016",
];

const STEPS = [
  {
    number: "01",
    icon: FileText,
    title: "Enter Patient Details",
    description: "Fill in patient demographics, clinical information, and procedure details in a guided form.",
  },
  {
    number: "02",
    icon: Stethoscope,
    title: "Select Consent Type",
    description: "Choose from 10+ consent types tailored to specific medical procedures and specialties.",
  },
  {
    number: "03",
    icon: Download,
    title: "Generate & Export",
    description: "AI generates a compliant form instantly. Download as PDF or print directly for records.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "ConsentGen completely changed how I manage patient documentation. The AI-generated forms are accurate, compliant, and save me at least 30 minutes every day.",
    highlight: "ConsentGen completely changed how I manage documentation.",
    name: "Dr. Rajesh Kumar",
    role: "Senior Surgeon, AIIMS Delhi",
    avatar: "RK",
    color: "from-purple-500 to-indigo-600",
  },
  {
    quote:
      "The Narayan Reddy alignment and IMC 2002 compliance gave our hospital legal confidence. We've standardized all our consent forms with ConsentGen.",
    highlight: "We've standardized all our consent forms.",
    name: "Dr. Priya Mehta",
    role: "Medical Superintendent",
    avatar: "PM",
    color: "from-pink-500 to-rose-600",
  },
  {
    quote:
      "Real-time clause verification is a game changer. I never worry about missing a critical medico-legal requirement before a procedure.",
    highlight: "I never worry about missing a critical requirement.",
    name: "Dr. Arjun Nair",
    role: "Anaesthesiologist",
    avatar: "AN",
    color: "from-blue-500 to-cyan-600",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen bg-nq-bg font-inter">

      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-nq-bg/80 backdrop-blur-xl border-b border-nq-border">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
                <Shield className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
              </div>
              <span className="text-[15px] font-bold text-nq-text tracking-tight">ConsentGen</span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {["Features", "Compliance", "How It Works"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="px-4 py-2 text-sm font-medium text-nq-text-muted hover:text-nq-text rounded-full hover:bg-white/60 transition-all duration-150"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-nq-text-muted hover:text-nq-text transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/generate"
                className="nq-btn-primary text-sm py-2.5 px-5"
              >
                Start for Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section id="hero" className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-40 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-20 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />

        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">

            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="flex justify-center mb-8"
            >
              <div className="nq-badge">
                <Sparkles className="w-3.5 h-3.5 text-nq-purple" />
                <span>Best AI Medico-Legal Consent Platform</span>
                <span className="w-1.5 h-1.5 rounded-full bg-nq-purple/60 ml-1" />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-nq-text leading-[1.05] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Generate compliant{" "}
              <br className="hidden sm:block" />
              consent forms{" "}
              <span className="nq-keyword-highlight text-5xl sm:text-6xl lg:text-7xl font-black">
                in seconds
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="text-lg sm:text-xl text-nq-text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              ConsentGen helps Indian doctors create medico-legal informed consent forms
              that comply with IMC&nbsp;2002, Narayan Reddy guidelines, and MoRTH&nbsp;2025
              emergency treatment regulations.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            >
              <Link href="/generate" className="nq-btn-primary px-8 py-3.5 text-base">
                Generate Consent Form
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="nq-btn-secondary px-8 py-3.5 text-base">
                Sign In to Dashboard
              </Link>
            </motion.div>

            {/* Compliance badges */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {COMPLIANCE_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1.5 text-xs font-medium text-nq-text-muted bg-white rounded-full border border-nq-border"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ─── Hero preview card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="nq-card nq-noise p-1">
              {/* Window chrome */}
              <div className="bg-nq-bg rounded-[22px] p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-nq-text-light font-medium">
                    ConsentGen — Consent Preview
                  </span>
                </div>

                <div className="grid md:grid-cols-5 gap-6 sm:gap-8 items-start">
                  {/* Left: form fields mock */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="text-sm font-semibold text-nq-text mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-nq-purple" />
                      Patient Details
                    </div>
                    {["Patient Name", "Procedure Type", "Attending Doctor", "Hospital/Clinic"].map((label) => (
                      <div key={label} className="space-y-1">
                        <div className="text-xs text-nq-text-muted">{label}</div>
                        <div className="h-9 bg-white rounded-xl border border-nq-border flex items-center px-3">
                          <div className="h-2 rounded-full bg-nq-border w-3/4" />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="nq-btn-primary text-sm py-2.5 w-full justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate with AI
                      </div>
                    </div>
                  </div>

                  {/* Right: generated document mock */}
                  <div className="md:col-span-3 bg-white rounded-2xl border border-nq-border p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-nq-text">Consent Document</div>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
                        IMC Compliant
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-nq-border/60 w-5/6" />
                    <div className="h-2.5 rounded-full bg-nq-border/60 w-full" />
                    <div className="h-2.5 rounded-full bg-nq-border/60 w-4/5" />
                    <div className="h-2.5 rounded-full bg-nq-border/60 w-full" />
                    <div className="border-t border-nq-border pt-3 mt-1 space-y-2">
                      {[
                        { label: "Risks & Benefits", done: true },
                        { label: "Alternatives Disclosed", done: true },
                        { label: "Patient Signature Block", done: true },
                        { label: "Witness Section", done: false },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${done ? "text-nq-purple" : "text-nq-border"}`} />
                          <span className={`text-xs ${done ? "text-nq-text-muted" : "text-nq-text-light"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 h-8 rounded-lg bg-nq-bg border border-nq-border flex items-center justify-center">
                        <span className="text-xs text-nq-text-muted">Download PDF</span>
                      </div>
                      <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
                        Print Form
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BENTO FEATURES ─── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          {/* Section header */}
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="flex justify-center mb-4"
            >
              <span className="nq-section-label">
                <Zap className="w-3.5 h-3.5" /> Features
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-nq-text mb-4 tracking-tight"
            >
              The future of consent
              <br />
              <span className="nq-gradient-text">documentation</span>
            </motion.h2>
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show" custom={2} viewport={{ once: true }}
              className="text-nq-text-muted max-w-lg mx-auto text-lg"
            >
              Capture, organize, and print legally sound consent forms in seconds.
            </motion.p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Large card – left */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="md:col-span-5 nq-card nq-noise p-8 min-h-[360px] flex flex-col"
              style={{ background: "linear-gradient(145deg, #f3f0ff 0%, #ede9fe 60%, #f5f3ff 100%)" }}
            >
              <div className="mb-auto">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-nq-text mb-3 tracking-tight">
                  AI-Powered Generation
                </h3>
                <p className="text-nq-text-muted leading-relaxed">
                  Generate comprehensive consent forms in seconds using advanced language models
                  trained on medico-legal best practices. Reduces drafting from 30 min to 30 sec.
                </p>
              </div>
              {/* Mock AI output */}
              <div className="mt-6 bg-white/70 rounded-2xl p-4 border border-white/80 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-nq-purple animate-pulse" />
                  <span className="text-xs font-semibold text-nq-purple">AI Generating…</span>
                </div>
                {[100, 80, 90, 70].map((w, i) => (
                  <div key={i} className="h-2 rounded-full bg-nq-purple/20" style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>

            {/* Right 2×2 grid */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1 */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
                className="nq-card nq-noise p-6 flex flex-col"
              >
                <div className="w-9 h-9 rounded-xl bg-nq-purple-soft flex items-center justify-center mb-4">
                  <Scale className="w-4.5 h-4.5 text-nq-purple w-[18px] h-[18px]" />
                </div>
                <h3 className="text-lg font-black text-nq-text mb-2 tracking-tight">India Compliant</h3>
                <p className="text-sm text-nq-text-muted leading-relaxed flex-1">
                  IMC 2002, IPC §§87-93, Consumer Protection Act 2019, and MoRTH 2025 — all covered.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["IMC 2002", "IPC", "MoRTH"].map(b => (
                    <span key={b} className="px-2 py-1 text-xs font-semibold rounded-full text-nq-purple bg-nq-purple-soft">{b}</span>
                  ))}
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" custom={2} viewport={{ once: true }}
                className="nq-card nq-noise p-6 flex flex-col"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  <BookOpen className="w-[18px] h-[18px] text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-nq-text mb-2 tracking-tight">Narayan Reddy Aligned</h3>
                <p className="text-sm text-nq-text-muted leading-relaxed flex-1">
                  All 7 elements of informed consent and 30 rules from the authoritative medico-legal reference.
                </p>
                <div className="mt-4 h-1.5 rounded-full bg-nq-border overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: "100%" }} />
                </div>
                <span className="text-xs text-nq-text-muted mt-1.5">100% guideline coverage</span>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" custom={3} viewport={{ once: true }}
                className="nq-card nq-noise p-6 flex flex-col"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <Stethoscope className="w-[18px] h-[18px] text-teal-600" />
                </div>
                <h3 className="text-lg font-black text-nq-text mb-2 tracking-tight">10+ Consent Types</h3>
                <p className="text-sm text-nq-text-muted leading-relaxed flex-1">
                  Surgical, anaesthesia, diagnostic, blood transfusion, telemedicine, obstetric, psychiatric & more.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  {["Surgical", "Anaes.", "Telemd.", "Obstetric", "Psych.", "Emerg."].map(t => (
                    <span key={t} className="px-1.5 py-1 text-[10px] font-medium rounded-lg text-nq-text-muted bg-nq-bg border border-nq-border text-center">{t}</span>
                  ))}
                </div>
              </motion.div>

              {/* Card 4 */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" custom={4} viewport={{ once: true }}
                className="nq-card nq-noise p-6 flex flex-col"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-[18px] h-[18px] text-red-500" />
                </div>
                <h3 className="text-lg font-black text-nq-text mb-2 tracking-tight">Clause Verification</h3>
                <p className="text-sm text-nq-text-muted leading-relaxed flex-1">
                  Real-time checklist ensures every required medico-legal clause is present before sign-off.
                </p>
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: "Risks disclosed", ok: true },
                    { label: "Alternatives listed", ok: true },
                    { label: "Witness signed", ok: false },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-green-100" : "bg-nq-border"}`}>
                        {ok && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      </div>
                      <span className={`text-xs ${ok ? "text-nq-text-muted" : "text-nq-text-light"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom two cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="nq-card nq-noise p-6 flex items-center gap-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0d0d0f 0%, #374151 100%)" }}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-nq-text mb-1 tracking-tight">PDF & Print Ready</h3>
                <p className="text-sm text-nq-text-muted">
                  Export consent forms as PDF or print with optimized hospital formatting.
                </p>
              </div>
              <Link href="/generate" className="ml-auto flex-shrink-0 w-10 h-10 rounded-full bg-nq-bg border border-nq-border flex items-center justify-center hover:border-nq-purple transition-colors">
                <ArrowRight className="w-4 h-4 text-nq-text-muted" />
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="nq-card nq-noise p-6 flex items-center gap-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-nq-text mb-1 tracking-tight">Secure & Private</h3>
                <p className="text-sm text-nq-text-muted">
                  Patient data is never stored. All generations happen on-demand with full privacy.
                </p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full text-nq-purple bg-nq-purple-soft">
                  HIPAA-safe
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="flex justify-center mb-4"
            >
              <span className="nq-section-label">
                <ChevronRight className="w-3.5 h-3.5" /> Process
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-nq-text mb-4 tracking-tight"
            >
              Three steps to a
              <br />
              <span className="nq-gradient-text">compliant consent form</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                className="nq-card nq-noise p-8 text-center"
              >
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-nq-dark flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-nq-text mb-3 tracking-tight">{step.title}</h3>
                <p className="text-nq-text-muted leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="compliance" className="py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="flex justify-center mb-4"
            >
              <span className="nq-section-label">
                <Star className="w-3.5 h-3.5" /> Testimonials
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-nq-text mb-4 tracking-tight"
            >
              Doctors share their
              <br />
              <span className="nq-gradient-text">documentation success</span>
            </motion.h2>
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show" custom={2} viewport={{ once: true }}
              className="text-nq-text-muted max-w-lg mx-auto text-lg"
            >
              Discover how Indian medical teams achieve compliance faster with AI-powered consent forms.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                className="nq-card nq-noise p-8 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-nq-purple text-nq-purple" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-nq-text-muted leading-relaxed mb-5 flex-1 text-[15px]">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Highlighted quote */}
                <blockquote className="border-l-2 border-nq-purple pl-4 mb-6">
                  <span className="nq-gradient-text font-semibold text-[15px]">{t.highlight}</span>
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-nq-text">{t.name}</div>
                    <div className="text-xs text-nq-text-muted">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DARK CTA SECTION ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <div className="nq-dark-card p-12 sm:p-16 text-center relative overflow-hidden">
              {/* Glow blobs inside dark card */}
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
              <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

              <div className="relative">
                <div className="flex justify-center mb-6">
                  <div className="nq-badge" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "#a78bfa" }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ready to streamline documentation?</span>
                  </div>
                </div>

                <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">
                  Generate your first
                  <br />
                  <span style={{ background: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    consent form for free
                  </span>
                </h2>
                <p className="text-white/60 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
                  Join hundreds of Indian doctors who trust ConsentGen for their medico-legal
                  documentation. Generate in under a minute.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/generate"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-full text-nq-dark bg-white hover:bg-white/90 transition-all duration-200 shadow-lg"
                  >
                    Start Generating
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-full text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-200"
                  >
                    View Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Stat row */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
                  {[
                    { val: "10+", label: "Consent Types" },
                    { val: "30s", label: "Avg. Generation Time" },
                    { val: "100%", label: "IMC Compliant" },
                  ].map(({ val, label }) => (
                    <div key={label} className="text-center">
                      <div className="text-3xl font-black text-white mb-1">{val}</div>
                      <div className="text-sm text-white/50">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-nq-border py-12 sm:py-16">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand col */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
                  <Shield className="w-[17px] h-[17px] text-white" />
                </div>
                <span className="text-base font-bold text-nq-text">ConsentGen</span>
              </div>
              <p className="text-sm text-nq-text-muted leading-relaxed max-w-xs">
                AI-powered medico-legal consent form generator for Indian doctors.
                IMC 2002 compliant. Generate, verify, and export in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["IMC 2002", "IPC §§87-93", "MoRTH 2025"].map(b => (
                  <span key={b} className="px-3 py-1 text-xs font-medium rounded-full text-nq-purple bg-nq-purple-soft">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Pages col */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-nq-text-light mb-4">
                Application
              </div>
              <div className="space-y-3">
                {[
                  { label: "Generate Form", href: "/generate" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "History", href: "/history" },
                  { label: "Sign In", href: "/login" },
                ].map(({ label, href }) => (
                  <Link key={label} href={href}
                    className="block text-sm text-nq-text-muted hover:text-nq-purple transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-nq-text-light mb-4">
                Stay Updated
              </div>
              <p className="text-sm text-nq-text-muted mb-4">
                Get updates on new consent templates and compliance changes.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-nq-border bg-nq-bg text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple transition-colors"
                />
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-nq-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-nq-text-light text-center sm:text-left">
              © {new Date().getFullYear()} ConsentGen. Medico-Legal Consent Form Generator for Indian Doctors.
            </p>
            <div className="flex items-center gap-5 text-xs text-nq-text-muted">
              <a href="#" className="hover:text-nq-purple transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-nq-purple transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-nq-purple transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
