"use client";

import { useState, Suspense, useId } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Envelope, Lock, ArrowRight, CheckCircle, User, IdentificationCard, ArrowLeft
} from "@phosphor-icons/react";

const TRUST_BADGES = ["IMC 2002", "NMC 2023", "BNS §§24-30", "DPDP 2023", "Supreme Court (2008)"];

const INK = "#171410";
const RED = "#BE3D2A";

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "None", color: "#ccc" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak (min 8 chars)", color: "#BE3D2A" };
  if (score === 2) return { score: 2, label: "Fair", color: "#d97706" };
  if (score === 3 || score === 4) return { score: 3, label: "Good", color: "#2563eb" };
  return { score: 4, label: "Strong", color: "#16a34a" };
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const msgParam = searchParams.get("message");
  const errParam = searchParams.get("error");
  const initialMessage = msgParam === "reset_success"
    ? "Password reset successful! Please sign in with your new password."
    : msgParam === "verified"
    ? "Email verified successfully! Please sign in to continue."
    : null;
  const initialError = errParam === "verification_failed"
    ? "Email verification link was invalid or has expired. Please sign in or register again."
    : errParam || null;

  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(initialMessage);

  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const nameId = useId();
  const regId = useId();

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        if (!email) {
          throw new Error("Please enter your registered email address.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
        });
        if (error) throw error;
        setMessage("Password reset instructions sent! Check your inbox for the recovery link.");
        return;
      }

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
        // Sign-up validations
        if (!doctorName.trim()) {
          throw new Error("Doctor's Full Name is required for medico-legal verification.");
        }
        if (!registrationNo.trim()) {
          throw new Error("Medical Registration Number (State Council / NMC) is required.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match. Please re-enter.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              doctor_name: doctorName.trim(),
              doctor_registration_no: registrationNo.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding`,
          },
        });
        if (error) throw error;

        if (data.user) {
          // Immediately update profile if session is established
          await supabase.from("profiles").upsert({
            id: data.user.id,
            doctor_name: doctorName.trim(),
            doctor_registration_no: registrationNo.trim(),
            updated_at: new Date().toISOString(),
          });
        }

        if (data?.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setRegisteredEmail(email);
          setSignupSuccess(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: "var(--paper)" }}>
      {/* ── Left branding panel (lg+) ── */}
      <div
        className="hidden lg:flex flex-col w-[460px] xl:w-[520px] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: "var(--ink)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(252,251,247,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(252,251,247,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${RED}, transparent 65%)` }}
        />

        <div className="relative flex flex-col h-full p-10 xl:p-12 justify-between">
          <div>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-12 group w-fit">
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
                ConsentGen<span className="text-[10px] font-mono align-super ml-0.5" style={{ color: RED }}>®</span>
              </span>
            </Link>

            {/* Headline + copy */}
            <h2
              className="font-serif font-semibold text-3xl xl:text-4xl leading-[1.12] tracking-tight mb-4"
              style={{ color: "var(--sheet)" }}
            >
              Consent forms<br />
              <span style={{ color: RED }}>built for Indian law.</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(252,251,247,0.62)" }}>
              Purpose-built for Registered Medical Practitioners. Generate IMC 2002, BNS 2023, and Supreme Court
              compliant informed consent in 30 seconds.
            </p>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-2 mb-10">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: "rgba(252,251,247,0.07)",
                    color: "rgba(252,251,247,0.85)",
                    border: "1px solid rgba(252,251,247,0.12)",
                  }}
                >
                  <CheckCircle weight="fill" className="w-3 h-3" style={{ color: RED }} />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Supreme Court Landmark Jurisprudence */}
          <div
            className="rounded-md p-5 mt-auto"
            style={{
              backgroundColor: "rgba(252,251,247,0.05)",
              border: "1px solid rgba(252,251,247,0.1)",
            }}
          >
            <p className="font-serif italic text-xs leading-relaxed mb-3" style={{ color: "rgba(252,251,247,0.78)" }}>
              &ldquo;Consent so given should be real and valid, based on adequate information concerning the nature
              of the condition, proposed treatment, alternatives, and substantial risks.&rdquo;
            </p>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: "var(--sheet)" }}>
                Supreme Court of India
              </p>
              <p className="font-mono text-[9px] tracking-wide" style={{ color: "rgba(252,251,247,0.45)" }}>
                Samira Kohli v. Dr. Prabha Manchanda (2008) 2 SCC 1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10 min-h-screen"
        style={{ backgroundColor: "var(--sheet)" }}
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8 w-fit">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5" style={{ color: "var(--sheet)" }} />
            </div>
            <span className="font-serif font-semibold text-base tracking-tight" style={{ color: "var(--ink)" }}>
              ConsentGen<span className="text-[10px] font-mono align-super ml-0.5" style={{ color: RED }}>®</span>
            </span>
          </Link>

          {signupSuccess ? (
            <div className="text-center py-2">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(63,122,78,0.1)",
                  border: "1.5px solid rgba(63,122,78,0.25)",
                }}
              >
                <Envelope weight="duotone" className="w-8 h-8" style={{ color: "#3f7a4e" }} />
              </div>

              <span
                className="inline-block font-mono text-[10.5px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded mb-3"
                style={{
                  backgroundColor: "rgba(63,122,78,0.1)",
                  color: "#2f6b3e",
                  border: "1px solid rgba(63,122,78,0.2)",
                }}
              >
                Verification Sent
              </span>

              <h1
                className="font-serif font-semibold text-2xl sm:text-3xl tracking-tight mb-2.5"
                style={{ color: "var(--ink)" }}
              >
                Account verification sent
              </h1>

              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
                We have sent an account verification link to{" "}
                <strong className="font-semibold break-all" style={{ color: "var(--ink)" }}>
                  {registeredEmail || email}
                </strong>
                . Please click the link to verify your email address and activate your clinical account.
              </p>

              <div
                className="rounded-md p-4 mb-6 text-left text-xs leading-relaxed"
                style={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink-muted)",
                }}
              >
                <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>
                  Next steps:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your inbox (or spam folder) for the verification email.</li>
                  <li>Click the confirmation link to activate your clinical profile.</li>
                  <li>Click the button below to sign in with your email and password.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSignupSuccess(false);
                  setMode("signin");
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setMessage("Account verification email sent. Please sign in after verifying.");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-all hover:opacity-90 cursor-pointer shadow-sm"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                <ArrowLeft weight="bold" className="w-4 h-4" /> Head back to sign in
              </button>

              <p className="mt-5 text-center text-xs" style={{ color: "var(--ink-muted)" }}>
                Didn&apos;t receive the email?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSignupSuccess(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-semibold underline hover:opacity-80"
                  style={{ color: RED }}
                >
                  Edit details and try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
          <div className="mb-6">
            <h1
              className="font-serif font-semibold text-3xl tracking-tight mb-2"
              style={{ color: "var(--ink)" }}
            >
              {mode === "signin" && "Welcome back"}
              {mode === "signup" && "Practitioner Registration"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              {mode === "signin" && "Sign in to access your consent forms and clinical history."}
              {mode === "signup" && "For Registered Medical Practitioners (NMC / State Councils)."}
              {mode === "forgot" && "Enter your email address to receive password recovery instructions."}
            </p>
          </div>

          {/* Error / success alerts */}
          {error && (
            <div
              role="alert"
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
              role="status"
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
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor={nameId}
                    className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Doctor&apos;s Full Name
                  </label>
                  <div className="relative">
                    <User
                      weight="regular"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "var(--ink-muted)" }}
                    />
                    <input
                      id={nameId}
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Anita Sharma"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all"
                      style={{
                        border: "1.5px solid var(--rule)",
                        color: "var(--ink)",
                        backgroundColor: "var(--paper)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={regId}
                    className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Medical Registration Number
                  </label>
                  <div className="relative">
                    <IdentificationCard
                      weight="regular"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "var(--ink-muted)" }}
                    />
                    <input
                      id={regId}
                      name="medical-registration-number"
                      type="text"
                      autoComplete="off"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      placeholder="e.g. MCI-48291 or DMC/R/10492"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all"
                      style={{
                        border: "1.5px solid var(--rule)",
                        color: "var(--ink)",
                        backgroundColor: "var(--paper)",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor={emailId}
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
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: "var(--ink)",
                    backgroundColor: "var(--paper)",
                  }}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={passwordId}
                    className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Password
                  </label>
                  {mode === "signin" && (
                    <Link
                      href="/forgot-password"
                      className="text-xs hover:underline"
                      style={{ color: RED }}
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    weight="regular"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "var(--ink-muted)" }}
                  />
                  <input
                    id={passwordId}
                    name={mode === "signin" ? "password" : "new-password"}
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all"
                    style={{
                      border: "1.5px solid var(--rule)",
                      color: "var(--ink)",
                      backgroundColor: "var(--paper)",
                    }}
                  />
                </div>

                {mode === "signup" && password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(strength.score / 4) * 100}%`,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span style={{ color: strength.color }}>{strength.label}</span>
                      <span style={{ color: "var(--ink-muted)" }}>Min 8 characters</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label
                  htmlFor={confirmPasswordId}
                  className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    weight="regular"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "var(--ink-muted)" }}
                  />
                  <input
                    id={confirmPasswordId}
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all"
                    style={{
                      border: "1.5px solid var(--rule)",
                      color: "var(--ink)",
                      backgroundColor: "var(--paper)",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-opacity mt-4 disabled:opacity-60"
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
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Register as Practitioner"}
                  {mode === "forgot" && "Send Recovery Link"}
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode switch */}
          {mode === "forgot" ? (
            <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:opacity-80"
                style={{ color: INK }}
              >
                <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> Back to sign in
              </button>
            </p>
          ) : (
            <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
              {mode === "signin" ? "Don't have an account?" : "Already registered?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "signin" ? "signup" : "signin"));
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: RED }}
              >
                {mode === "signin" ? "Register here" : "Sign in"}
              </button>
            </p>
          )}

          {/* Working Medico-Legal Policy Links */}
          <p className="mt-8 text-center text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="underline font-medium hover:text-[#171410] transition-colors"
              style={{ color: INK }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline font-medium hover:text-[#171410] transition-colors"
              style={{ color: INK }}
            >
              Privacy Policy
            </Link>
            .
          </p>
          </>
          )}
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
