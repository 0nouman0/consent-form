"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Envelope, Lock, ArrowRight, CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

const TRUST_BADGES = ["IMC 2002", "NMC 2023", "BNS §§24-30", "ICMR Guidelines"];

function LoginContent() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirect);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) throw error;
        setMessage("Account created! Check your email to confirm before signing in.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex font-body">
      {/* ── Left branding panel (lg+) ── */}
      <div
        className="hidden lg:flex flex-col w-[460px] xl:w-[520px] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: "#0b0f1a" }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow top-right */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 65%)" }}
        />

        <div className="relative flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-14 group w-fit">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">ConsentGen</span>
          </Link>

          {/* Headline + copy */}
          <div className="flex-1">
            <h2
              className="text-4xl xl:text-[44px] font-black text-white leading-[1.1] tracking-tight mb-5"
            >
              Consent forms<br />
              <span style={{ color: "#a78bfa" }}>built for India.</span>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.52)" }}>
              Purpose-built for Indian doctors. Generate IMC&nbsp;2002-compliant
              informed consent in under 30 seconds — bilingual, medico-legally
              sound, and PDF-ready.
            </p>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-2 mb-12">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <CheckCircle weight="fill" className="w-3 h-3" style={{ color: "#a78bfa" }} />
                  {badge}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "30s", label: "Form generation" },
                { value: "12+", label: "Indian languages" },
                { value: "100%", label: "IMC compliant" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-2xl font-black text-white mb-0.5">{value}</p>
                  <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.42)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div
            className="mt-10 rounded-2xl p-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.60)" }}>
              &ldquo;ConsentGen has saved our clinic hours every week. The forms
              are legally sound and patients appreciate the bilingual option.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: "rgba(124,58,237,0.55)" }}
              >
                RK
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Dr. Rajesh Kumar</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
                  General Surgeon, Apollo Hospitals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-10 min-h-screen">
        <div className="w-full max-w-[360px]">
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10 w-fit">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: "#0b0f1a" }}>
              ConsentGen
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-3xl font-black tracking-tight mb-2"
              style={{ color: "#0b0f1a" }}
            >
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {mode === "signin"
                ? "Sign in to access your dashboard and history."
                : "Sign up to start generating consent forms."}
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
              }}
            >
              <span className="font-semibold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
              }}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "#374151" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Envelope
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#9ca3af" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: "1.5px solid #e5e7eb",
                    color: "#111827",
                    backgroundColor: "#f9fafb",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#7c3aed";
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#9ca3af" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: "1.5px solid #e5e7eb",
                    color: "#111827",
                    backgroundColor: "#f9fafb",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#7c3aed";
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity mt-2 disabled:opacity-60"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode switch */}
          <p className="mt-6 text-center text-sm" style={{ color: "#6b7280" }}>
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: "#7c3aed" }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs leading-relaxed" style={{ color: "#9ca3af" }}>
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-neutral-600 transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline cursor-pointer hover:text-neutral-600 transition-colors">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
