"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
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
  Sparkle,
  CheckCircle,
  Brain,
  Eye,
  Drop,
  Syringe,
  Scissors,
  Flask,
  Heart,
  DeviceMobile,
  Baby,
  FirstAidKit,
  Tooth,
  Bone,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";

gsap.registerPlugin(ScrollTrigger);

/* ─── PALETTE ─── */
const WHITE    = "#FFFFFF";
const PAGE_BG  = "#F5F5F5";
const DARK_PANEL = "#FFFFFF";
const INK      = "#0A0A0B";
const BODY_TXT = "#6B6B78";
const MUTED    = "#9B9BA8";
const BORDER   = "#E8E8EA";
const PILL_BG  = "#F0F0F2";
const DARK_BTN = "#111118";

/* ─── DATA ─── */
const COMPLIANCE_LAWS = [
  { code: "IMC 2002",    name: "Indian Medical Council Regulations" },
  { code: "BNS §§24-30", name: "Bharatiya Nyaya Sanhita" },
  { code: "MoRTH 2025",  name: "Ministry of Road Transport" },
  { code: "CPA 2019",    name: "Consumer Protection Act" },
  { code: "Aadhaar Act", name: "Aadhaar Act 2016" },
  { code: "DPDP 2023",   name: "Digital Personal Data Protection" },
];

const ORG_LOGOS = [
  { code: "IMC",   name: "Indian Medical Council",      color: "#22C55E", bg: "#F0FDF4" },
  { code: "BNS",   name: "Bharatiya Nyaya Sanhita",     color: "#8B5CF6", bg: "#F5F3FF" },
  { code: "MoRTH", name: "Min. of Road Transport",      color: "#F59E0B", bg: "#FFFBEB" },
  { code: "CPA",   name: "Consumer Protection Act",     color: "#EF4444", bg: "#FEF2F2" },
  { code: "UIDAI", name: "Aadhaar / UIDAI",             color: "#3B82F6", bg: "#EFF6FF" },
  { code: "MeitY", name: "DPDP Act 2023",               color: "#06B6D4", bg: "#ECFEFF" },
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

const MARQUEE_ITEMS = [
  { icon: <Scissors   className="w-3.5 h-3.5" />, name: "Surgical" },
  { icon: <Syringe    className="w-3.5 h-3.5" />, name: "Anaesthesia" },
  { icon: <FirstAidKit className="w-3.5 h-3.5" />, name: "Emergency" },
  { icon: <Brain      className="w-3.5 h-3.5" />, name: "Psychiatric" },
  { icon: <Flask      className="w-3.5 h-3.5" />, name: "Research" },
  { icon: <Eye        className="w-3.5 h-3.5" />, name: "Ophthalmic" },
  { icon: <Heart      className="w-3.5 h-3.5" />, name: "Cardiac" },
  { icon: <DeviceMobile className="w-3.5 h-3.5" />, name: "Telemedicine" },
  { icon: <Baby       className="w-3.5 h-3.5" />, name: "Obstetric" },
  { icon: <MagnifyingGlass className="w-3.5 h-3.5" />, name: "Diagnostic" },
  { icon: <Drop       className="w-3.5 h-3.5" />, name: "Blood Transfusion" },
  { icon: <Tooth      className="w-3.5 h-3.5" />, name: "Dental" },
  { icon: <Bone       className="w-3.5 h-3.5" />, name: "Orthopaedic" },
  { icon: <Stethoscope className="w-3.5 h-3.5" />, name: "Paediatric" },
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
   DNA HELIX CANVAS (Three.js)
═══════════════════════════════════════════ */
function DNAHelixCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth || 500;
    const h = el.clientHeight || 700;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.z = 5.5;

    const group = new THREE.Group();
    const N = 120;
    const R = 1.1;
    const HEIGHT = 9;
    const TURNS = 4;

    const sphGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x7C3AED }); // deep violet
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x0EA5E9 }); // ocean blue

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const angle = t * TURNS * Math.PI * 2;
      const y = (t - 0.5) * HEIGHT;

      // Strand 1
      const m1 = new THREE.Mesh(sphGeo, mat1);
      m1.position.set(Math.cos(angle) * R, y, Math.sin(angle) * R);
      group.add(m1);

      // Strand 2 (opposite side)
      const m2 = new THREE.Mesh(sphGeo, mat2);
      m2.position.set(Math.cos(angle + Math.PI) * R, y, Math.sin(angle + Math.PI) * R);
      group.add(m2);

      // Base pair rungs
      if (i % 5 === 0) {
        const p1 = new THREE.Vector3(Math.cos(angle) * R, y, Math.sin(angle) * R);
        const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * R, y, Math.sin(angle + Math.PI) * R);
        const len = p1.distanceTo(p2);
        const rungGeo = new THREE.CylinderGeometry(0.012, 0.012, len, 4);
        const rungMat = new THREE.MeshBasicMaterial({ color: 0xaaaacc, transparent: true, opacity: 0.45 });
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.copy(p1).lerp(p2, 0.5);
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        group.add(rung);
      }
    }

    scene.add(group);

    // Ambient glow particles
    const particleGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 80; i++) {
      positions.push(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 4
      );
    }
    particleGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x7C3AED, size: 0.05, transparent: true, opacity: 0.25 });
    scene.add(new THREE.Points(particleGeo, particleMat));

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w2 = el.clientWidth;
      const h2 = el.clientHeight;
      if (!w2 || !h2) return;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />;
}

/* ═══════════════════════════════════════════
   CONSENT FLOW ANIMATION (3-phase illustration)
═══════════════════════════════════════════ */
function ConsentFlowAnimation() {
  const [phase, setPhase] = useState(0);
  const [typedName, setTypedName] = useState("");
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState([false, false, false, false]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let typerInterval: ReturnType<typeof setInterval> | null = null;
    let progInterval: ReturnType<typeof setInterval> | null = null;

    const runCycle = () => {
      setPhase(0);
      setTypedName("");
      setProgress(0);
      setChecks([false, false, false, false]);

      const fullName = "Rajesh Kumar";
      let i = 0;
      typerInterval = setInterval(() => {
        i++;
        setTypedName(fullName.slice(0, i));
        if (i >= fullName.length && typerInterval) clearInterval(typerInterval);
      }, 90);

      timers.push(setTimeout(() => {
        setPhase(1);
        let p = 0;
        progInterval = setInterval(() => {
          p += 3;
          setProgress(Math.min(p, 100));
          if (p >= 100 && progInterval) clearInterval(progInterval);
        }, 40);
      }, 2200));

      timers.push(setTimeout(() => {
        setPhase(2);
        [600, 1100, 1600, 2100].forEach((d, idx) => {
          timers.push(setTimeout(() => {
            setChecks(prev => { const n = [...prev]; n[idx] = true; return n; });
          }, d));
        });
      }, 5400));
    };

    runCycle();
    const cycle = setInterval(runCycle, 10500);
    return () => {
      clearInterval(cycle);
      if (typerInterval) clearInterval(typerInterval);
      if (progInterval) clearInterval(progInterval);
      timers.forEach(clearTimeout);
    };
  }, []);

  const PHASES = ["Fill Details", "AI Generating", "Form Ready"];

  return (
    <div className="float-card absolute inset-0 flex flex-col items-center justify-center"
      style={{ padding: "60px 40px 60px" }}>

      {/* Phase indicator pills */}
      <div className="flex items-center gap-2 mb-4">
        {PHASES.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-dm transition-all duration-500"
            style={{
              fontSize: 9,
              background: i === phase ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
              color: i === phase ? INK : "rgba(255,255,255,0.6)",
              fontWeight: i === phase ? 600 : 400,
            }}>
            <div className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{ background: i === phase ? "#166534" : "rgba(255,255,255,0.3)" }} />
            {label}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-[320px] rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        }}>

        {/* Mac chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(248,248,250,0.8)" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map(c => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
          <span className="ml-auto font-dm text-[10px] font-medium" style={{ color: MUTED }}>ConsentGen</span>
        </div>

        {/* Phase 0 — Fill Details */}
        {phase === 0 && (
          <div className="p-5">
            <p className="font-bricolage font-bold text-xs mb-3" style={{ color: INK }}>Patient Details</p>
            <div className="space-y-2.5">
              {[
                { label: "Patient Name", value: typedName, typing: true },
                { label: "Procedure", value: "Surgical", typing: false },
                { label: "Consent Type", value: "Pre-operative", typing: false },
              ].map(field => (
                <div key={field.label}>
                  <div className="font-dm mb-1" style={{ fontSize: 9, color: MUTED }}>{field.label}</div>
                  <div className="flex items-center h-8 px-3 rounded-lg"
                    style={{ border: `1px solid ${field.typing ? "#166534" : BORDER}`, fontSize: 12, color: field.value ? INK : MUTED, fontFamily: "var(--font-dm)" }}>
                    {field.value}
                    {field.typing && <span className="animate-pulse ml-px text-[#166534]">|</span>}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-white font-dm font-medium"
              style={{ background: DARK_BTN, fontSize: 12 }}>
              <Sparkle className="w-3 h-3" /> Generate Consent
            </button>
          </div>
        )}

        {/* Phase 1 — AI Generating */}
        {phase === 1 && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4CAF50" }} />
              <p className="font-bricolage font-bold text-xs" style={{ color: INK }}>AI Generating…</p>
              <span className="ml-auto font-dm font-semibold" style={{ fontSize: 10, color: "#166534" }}>{progress}%</span>
            </div>
            <div className="space-y-2 mb-4">
              {[
                "Applying IMC 2002 guidelines",
                "Verifying BNS §§24-30",
                "Checking MoRTH 2025",
                "Finalizing all clauses",
              ].map((msg, i) => {
                const done = progress > (i + 1) * 25;
                return (
                  <div key={msg} className="flex items-center gap-2 transition-all duration-300">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{ background: done ? "#166534" : BORDER }}>
                      {done && <span className="text-white" style={{ fontSize: 8 }}>✓</span>}
                    </div>
                    <span className="font-dm transition-colors duration-300"
                      style={{ fontSize: 10, color: done ? INK : MUTED }}>{msg}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #166534, #4CAF50)" }} />
            </div>
          </div>
        )}

        {/* Phase 2 — Form Ready */}
        {phase === 2 && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bricolage font-bold text-xs" style={{ color: INK }}>Consent Form Ready</p>
              <span className="font-dm font-semibold px-2 py-0.5 rounded-full"
                style={{ fontSize: 9, background: "#DCFCE7", color: "#166534" }}>IMC ✓</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {[95, 100, 78, 100, 82].map((w, i) => (
                <div key={i} className="h-1 rounded-full" style={{ width: `${w}%`, background: "#EBEBEB" }} />
              ))}
            </div>
            <div className="pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="font-dm uppercase tracking-wider mb-2" style={{ fontSize: 8, color: MUTED }}>Clause Verification</p>
              <div className="space-y-1.5">
                {["Risks & benefits disclosed", "Alternatives listed", "Signature block present", "Witness section ready"].map((clause, i) => (
                  <div key={clause} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center transition-all duration-300"
                      style={{ background: checks[i] ? "#166534" : BORDER }}>
                      {checks[i] && <CheckCircle className="w-2.5 h-2.5 text-white" weight="fill" />}
                    </div>
                    <span className="font-dm transition-colors duration-300"
                      style={{ fontSize: 10, color: checks[i] ? INK : MUTED }}>{clause}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 h-8 rounded-lg flex items-center justify-center font-dm font-medium"
                style={{ border: `1px solid ${BORDER}`, fontSize: 12, color: INK }}>PDF</div>
              <div className="flex-1 h-8 rounded-lg flex items-center justify-center font-dm font-medium text-white"
                style={{ background: DARK_BTN, fontSize: 12 }}>Print</div>
            </div>
          </div>
        )}
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
    tl.from(".hero-nav",    { opacity: 0, y: -20, duration: 0.5 })
      .from(".split-word",  { opacity: 0, y: 50,  stagger: 0.06, duration: 0.65 }, "-=0.2")
      .from(".hero-sub",    { opacity: 0, y: 20,  duration: 0.4 }, "-=0.2")
      .from(".hero-cta",    { opacity: 0, y: 20,  duration: 0.4 }, "-=0.2")
      .from(".hero-marquee",{ opacity: 0, y: 20,  duration: 0.4 }, "-=0.1")
      .from(".right-panel", { opacity: 0, x: 30,  duration: 0.7, ease: "power2.out" }, "-=0.4")
      .from(".float-card",  { opacity: 0, y: -20, duration: 0.5 }, "-=0.3");
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
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ border: `1px solid ${BORDER}`, background: PILL_BG }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: INK }} />
            <span className="font-bricolage font-semibold text-sm" style={{ color: INK }}>ConsentGen</span>
          </div>

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
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-14 pb-6">
          {/* Headline */}
          <h1
            className="font-bricolage font-extrabold leading-[0.9] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(52px, 7vw, 96px)", color: INK }}
          >
            {["Generate", "Compliant", "Consent"].map((word, i) => (
              <span key={i} className="split-word block">{word}</span>
            ))}
            <span className="split-word block">Forms.</span>
          </h1>

          {/* Subtext */}
          <p className="hero-sub font-dm text-base leading-relaxed max-w-xs mb-8" style={{ color: BODY_TXT }}>
            Indian doctors generate IMC 2002 compliant consent forms in under 30 seconds using AI.
          </p>

          {/* CTA */}
          <div className="hero-cta flex items-center gap-4 mb-10">
            <Link
              href="/generate"
              className="px-8 py-3.5 rounded-full font-dm font-medium text-sm tracking-[0.08em] uppercase text-white"
              style={{ background: DARK_BTN }}
            >
              Generate Now
            </Link>
            <Link
              href="#how-it-works"
              className="px-6 py-3.5 rounded-full font-dm font-medium text-sm"
              style={{ border: `1px solid ${BORDER}`, color: BODY_TXT }}
            >
              How it works
            </Link>
          </div>
        </div>

        {/* CONSENT TYPE MARQUEE */}
        <div className="hero-marquee overflow-hidden pb-8 px-10 sm:px-14">
          <p className="font-dm text-xs uppercase tracking-[0.12em] mb-3" style={{ color: MUTED }}>
            Consent Types Available
          </p>
          <div className="overflow-hidden relative">
            <div
              className="marquee-track flex gap-3"
              style={{ width: "max-content" }}
            >
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ border: `1px solid ${BORDER}`, background: PILL_BG, color: BODY_TXT }}
                >
                  <span style={{ color: INK }}>{item.icon}</span>
                  <span className="font-dm text-xs whitespace-nowrap">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="right-panel relative flex-1 overflow-hidden"
        style={{ background: DARK_PANEL, borderRadius: "0 0 0 24px" }}
      >
        {/* DNA Helix fills the panel */}
        <DNAHelixCanvas />

        {/* Subtle vignette for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(240,240,245,0.6) 100%)",
          }}
        />

        {/* Animated consent flow illustration */}
        <ConsentFlowAnimation />
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
          <p className="font-bricolage font-semibold text-sm mb-2" style={{ color: INK }}>{card.title}</p>
          <p className="font-dm text-sm leading-relaxed" style={{ color: BODY_TXT }}>{card.body}</p>
        </div>
      ))}
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
    gsap.from(".org-card", {
      opacity: 0, scale: 0.85, stagger: 0.07, duration: 0.5, ease: "back.out(1.5)",
      scrollTrigger: { trigger: ".org-grid", start: "top 80%" },
    });
  }, []);

  return (
    <section className="stats-section" style={{ background: WHITE, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Mission text */}
        <div className="mb-16">
          <h2 className="font-bricolage font-bold leading-tight tracking-tight"
            style={{ fontSize: "clamp(28px, 4vw, 52px)", maxWidth: 760 }}>
            <span style={{ color: INK }}>Our mission is to simplify medico-legal documentation</span>
            <span style={{ color: "#D0D0D8" }}>{" "}for every Indian doctor, every time.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left: 2×2 stat grid */}
          <div className="grid grid-cols-2 gap-0">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="stat-cell"
                style={{
                  padding: "36px 32px",
                  borderBottom: i < 2 ? `1px solid ${BORDER}` : "none",
                  borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : "none",
                }}>
                <div className="font-bricolage font-bold"
                  style={{ fontSize: "clamp(44px, 5vw, 64px)", color: INK, lineHeight: 1, marginBottom: 6 }}>
                  {stat.value}
                </div>
                <div className="w-8 h-0.5 mb-3" style={{ background: BORDER }} />
                <div className="font-dm text-sm font-medium mb-1" style={{ color: INK }}>{stat.label}</div>
                <div className="font-dm text-xs" style={{ color: MUTED }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Right: Legal framework org logos */}
          <div>
            <p className="font-bricolage font-bold text-lg mb-1" style={{ color: INK }}>
              Legal Frameworks Covered
            </p>
            <p className="font-dm text-sm mb-8" style={{ color: BODY_TXT }}>
              Every form is validated against these Indian medico-legal authorities.
            </p>
            <div className="org-grid grid grid-cols-3 gap-4">
              {ORG_LOGOS.map(org => (
                <div
                  key={org.code}
                  className="org-card flex flex-col items-center gap-3 p-4 rounded-2xl"
                  style={{ border: `1px solid ${BORDER}`, background: PAGE_BG }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bricolage font-extrabold text-sm"
                    style={{
                      background: org.bg,
                      color: org.color,
                      border: `2px solid ${org.color}30`,
                    }}
                  >
                    {org.code}
                  </div>
                  <span className="font-dm text-center leading-tight" style={{ fontSize: 10, color: BODY_TXT }}>
                    {org.name}
                  </span>
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
   FEATURES SECTION
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
          className="font-bricolage font-extrabold"
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
                    className="font-bricolage font-extrabold"
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
                  className="font-bricolage font-extrabold"
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
                  <span className="font-bricolage font-extrabold" style={{ fontSize: 40, color: INK }}>
                    {feat.metric.value}
                  </span>
                  <span className="font-dm text-sm" style={{ color: MUTED }}>{feat.metric.label}</span>
                </div>
              </div>

              <div
                className="feature-visual"
                style={{
                  padding: "56px 48px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  order: isEven ? 1 : 0,
                  background: PILL_BG,
                }}
              >
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
                    <div className="w-2 h-2 rounded-full" style={{ background: featureColors[i] }} />
                    <span className="font-dm text-xs font-semibold" style={{ color: INK }}>{feat.tag} Active</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[92, 75, 100, 63, 84].map((w, j) => (
                      <div key={j} style={{ height: 7, borderRadius: 4, background: BORDER, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%", borderRadius: 4, width: `${w}%`,
                            background: `linear-gradient(90deg, ${featureColors[i]}, ${featureColors[i]}80)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-2 mt-6">
                    <span className="font-bricolage font-bold text-3xl" style={{ color: INK }}>{feat.metric.value}</span>
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
            className="font-bricolage font-extrabold"
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
                className="font-bricolage font-extrabold"
                style={{ fontSize: 80, color: "#C0C0CC", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 20 }}
              >
                {step.n}
              </div>
              <h3
                className="font-bricolage font-bold"
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
      <div
        className="font-bricolage"
        style={{
          position: "absolute", top: 20, left: 48, fontSize: 200,
          color: `${BORDER}`,
          lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}
      >
        &ldquo;
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="font-dm text-xs font-semibold tracking-[0.1em] uppercase mb-10" style={{ color: MUTED }}>
          Testimonials
        </div>

        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <Star key={i} className="w-4 h-4" style={{ color: "#E89860" }} weight="fill" />
          ))}
        </div>

        <div ref={containerRef}>
          <blockquote
            className="font-bricolage font-bold"
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
              <div className="font-bricolage font-bold text-sm" style={{ color: INK }}>{t.name}</div>
              <div className="font-dm text-xs" style={{ color: MUTED }}>{t.role}</div>
            </div>
          </div>
        </div>

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
          style={{ padding: "80px 64px", textAlign: "center", background: INK }}
        >
          <div
            className="font-bricolage"
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
              className="font-bricolage font-extrabold"
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(32px, 5vw, 60px)",
                lineHeight: 1.1, letterSpacing: "-0.025em",
                color: WHITE, fontWeight: 800,
              }}
            >
              Generate your first{" "}
              <span style={{ color: "#C4D5CF" }}>consent form for free.</span>
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

            <div className="flex gap-12 justify-center mt-14 flex-wrap">
              {[
                { value: "10+", label: "Consent Types" },
                { value: "30s", label: "Generation Time" },
                { value: "100%", label: "IMC Compliant" },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div className="font-bricolage font-extrabold text-3xl mb-1" style={{ color: WHITE }}>{value}</div>
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
   PAGE FOOTER (compact)
═══════════════════════════════════════════ */
function PageFooter() {
  return (
    <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: "32px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: INK }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-bricolage font-bold text-sm" style={{ color: INK }}>ConsentGen</span>
              <span className="font-dm text-xs ml-2" style={{ color: MUTED }}>AI-powered medico-legal consent forms for Indian doctors</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center gap-6">
            {[
              { label: "Generate", href: "/generate" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "History", href: "/history" },
              { label: "Sign In", href: "/login" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="font-dm text-sm transition-colors" style={{ color: BODY_TXT }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Compliance badges */}
          <div className="flex flex-wrap gap-2">
            {["IMC 2002", "BNS", "DPDP"].map(b => (
              <span
                key={b}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-dm"
                style={{ border: `1px solid ${BORDER}`, color: MUTED, background: PILL_BG }}
              >
                <ShieldCheck className="w-3 h-3" style={{ color: INK }} />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between flex-wrap gap-2 mt-6 pt-5"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <p className="font-dm text-xs" style={{ color: MUTED }}>
            © 2025 ConsentGen. Built for Indian Medical Practice.
          </p>
          <p className="font-dm text-xs" style={{ color: MUTED }}>
            IMC 2002 · BNS §§24-30 · MoRTH 2025 · CPA 2019 · Aadhaar Act · DPDP 2023
          </p>
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
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <PageFooter />
    </div>
  );
}
