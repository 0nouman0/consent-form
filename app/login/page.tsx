"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Envelope, Lock, ArrowRight, CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

const TRUST_BADGES = ["IMC 2002", "NMC 2023", "BNS §§24-30", "ICMR Guidelines"];

const INK = "#171410";
const RED = "#BE3D2A";

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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check if clinician profile has been completed
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("doctor_name, doctor_registration_no")
            .eq("id", data.user.id)
            .single();

          if (!profile || !profile.doctor_name || !profile.doctor_registration_no) {
            router.push("/onboarding");
            router.refresh();
            return;
          }
        }

        router.push(redirect);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding` },
        });
        if (error) throw error;

        if (data?.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setMessage("Account created! Check your email to verify your address and complete your clinical registration.");
        }
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
    <div className="min-h-screen flex font-body" style={{ backgroundColor: "var(--paper)" }}>
      {/* ── Left branding panel (lg+) ── */}
      <div
        className="hidden lg:flex flex-col w-[460px] xl:w-[520px] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: "var(--ink)" }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(252,251,247,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(252,251,247,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow top-right */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${RED}, transparent 65%)` }}
        />

        <div className="relative flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-14 group w-fit">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: "rgba(252,251,247,0.1)",
                border: "1px solid rgba(252,251,247,0.15)",
              }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5" style={{ color: "var(--sheet)" }} />
            </div>
            <span className="font-serif font-semibold text-base tracking-tight" style={{ color: "var(--sheet)" }}>
              ConsentGen
            </span>
          </Link>

          {/* Headline + copy */}
          <div className="flex-1">
            <h2
              className="font-serif font-semibold text-4xl xl:text-[44px] leading-[1.1] tracking-tight mb-5"
              style={{ color: "var(--sheet)" }}
            >
              Consent forms<br />
              <span style={{ color: RED }}>built for India.</span>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(252,251,247,0.56)" }}>
              Purpose-built for Indian doctors. Generate IMC&nbsp;2002-compliant
              informed consent in under 30 seconds — bilingual, medico-legally
              sound, and PDF-ready.
            </p>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-2 mb-12">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold px-3 py-1.5 rounded-md"
                  style={{
                    backgroundColor: "rgba(252,251,247,0.07)",
                    color: "rgba(252,251,247,0.75)",
                    border: "1px solid rgba(252,251,247,0.12)",
                  }}
                >
                  <CheckCircle weight="fill" className="w-3 h-3" style={{ color: RED }} />
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
                  className="rounded-md p-4"
                  style={{
                    backgroundColor: "rgba(252,251,247,0.05)",
                    border: "1px solid rgba(252,251,247,0.09)",
                  }}
                >
                  <p className="font-serif font-semibold text-2xl mb-0.5" style={{ color: "var(--sheet)" }}>
                    {value}
                  </p>
                  <p className="text-[11px] leading-tight" style={{ color: "rgba(252,251,247,0.42)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div
            className="mt-10 rounded-md p-5"
            style={{
              backgroundColor: "rgba(252,251,247,0.05)",
              border: "1px solid rgba(252,251,247,0.1)",
            }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(252,251,247,0.62)" }}>
              &ldquo;ConsentGen has saved our clinic hours every week. The forms
              are legally sound and patients appreciate the bilingual option.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: "rgba(190,61,42,0.55)", color: "var(--sheet)" }}
              >
                RK
              </div>
              <div>
                <p className="font-serif font-semibold text-sm leading-tight" style={{ color: "var(--sheet)" }}>
                  Dr. Rajesh Kumar
                </p>
                <p className="text-xs" style={{ color: "rgba(252,251,247,0.42)" }}>
                  General Surgeon, Apollo Hospitals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10 min-h-screen"
        style={{ backgroundColor: "var(--sheet)" }}
      >
        <div className="w-full max-w-[360px]">
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10 w-fit">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5" style={{ color: "var(--sheet)" }} />
            </div>
            <span className="font-serif font-semibold text-base tracking-tight" style={{ color: "var(--ink)" }}>
              ConsentGen
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="font-serif font-semibold text-3xl tracking-tight mb-2"
              style={{ color: "var(--ink)" }}
            >
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              {mode === "signin"
                ? "Sign in to access your dashboard and history."
                : "Sign up to start generating consent forms."}
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-md text-sm flex items-start gap-2"
              style={{
                backgroundColor: "rgba(190,61,42,0.06)",
                border: "1px solid rgba(190,61,42,0.25)",
                color: RED,
              }}
            >
              <span className="font-semibold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div
              className="mb-5 px-4 py-3 rounded-md text-sm"
              style={{
                backgroundColor: "rgba(63,122,78,0.08)",
                border: "1px solid rgba(63,122,78,0.25)",
                color: "#3f7a4e",
              }}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                style={{ color: "var(--ink-soft)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Envelope
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md outline-none transition-all"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: "var(--ink)",
                    backgroundColor: "var(--paper)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.backgroundColor = "var(--sheet)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,20,16,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--rule)";
                    e.currentTarget.style.backgroundColor = "var(--paper)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                style={{ color: "var(--ink-soft)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md outline-none transition-all"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: "var(--ink)",
                    backgroundColor: "var(--paper)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.backgroundColor = "var(--sheet)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,20,16,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--rule)";
                    e.currentTarget.style.backgroundColor = "var(--paper)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-sm font-semibold transition-opacity mt-2 disabled:opacity-60"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(252,251,247,0.3)", borderTopColor: "var(--sheet)" }}
                  />
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
          <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: RED }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer transition-colors hover:opacity-70">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline cursor-pointer transition-colors hover:opacity-70">
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
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--sheet)" }}>
          <div
            className="w-9 h-9 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
