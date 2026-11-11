"use client";

import { useState, Suspense, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Envelope, ArrowRight, ArrowLeft, CheckCircle, WarningCircle,
  Lightning, Lock, IdentificationCard, Eye, EyeSlash, Check, X
} from "@phosphor-icons/react";

const INK = "#171410";
const RED = "#BE3D2A";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  // Modes: "instant" (direct with Reg No, zero email limits) vs "email" (standard link)
  const [method, setMethod] = useState<"instant" | "email">("instant");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "invalid_link"
      ? "The reset link was invalid or expired. Use Instant Reset below to update your password immediately."
      : initialError || null
  );
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  const emailId = useId();
  const verifId = useId();
  const passId = useId();
  const confirmPassId = useId();

  const supabase = createClient();

  // Password criteria
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // 1. Instant Reset handler (Zero email rate limit)
  const handleInstantReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRateLimitNotice(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid practitioner email.");
      return;
    }
    if (!verificationCode.trim()) {
      setError("Please enter your Medical Registration Number or Doctor Name.");
      return;
    }
    if (!hasMinLength) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/direct-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          verificationCode: verificationCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password.");
      }

      router.push("/login?message=reset_success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Reset handler
  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid practitioner email address.");
      return;
    }

    setError(null);
    setRateLimitNotice(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
      });

      if (resetError) {
        // If email rate limit is exceeded by Supabase auth server:
        if (
          resetError.message.toLowerCase().includes("rate limit") ||
          resetError.message.toLowerCase().includes("too many")
        ) {
          setMethod("instant");
          setRateLimitNotice(
            "The email server has reached its hourly rate limit. You can reset your password instantly below using your Medical Registration Number with zero waiting time!"
          );
          return;
        }
        throw resetError;
      }

      setEmailSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send recovery instructions.";
      if (msg.toLowerCase().includes("rate limit")) {
        setMethod("instant");
        setRateLimitNotice(
          "The email server has reached its hourly rate limit. Switched to Instant Reset below — no email required!"
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div
        className="w-full max-w-[460px] p-8 sm:p-10 rounded-sm border shadow-xl relative"
        style={{ backgroundColor: "var(--sheet)", borderColor: "var(--rule)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-6 w-fit group">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: INK }}
          >
            <ShieldCheck weight="bold" className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-semibold text-base tracking-tight" style={{ color: INK }}>
            ConsentGen<span className="text-[10px] font-mono align-super ml-0.5" style={{ color: RED }}>®</span>
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-serif font-semibold text-3xl tracking-tight mb-2" style={{ color: INK }}>
            Reset Password
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Choose how you would like to reset your medical practitioner account password.
          </p>
        </div>

        {/* Method Toggle Tabs */}
        <div className="flex border-b border-black/10 mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMethod("instant");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-center font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              method === "instant"
                ? "border-[#BE3D2A] text-[#171410]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <Lightning weight="fill" className="text-amber-600" /> Instant Reset (No Email Limits)
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("email");
              setError(null);
            }}
            className={`py-2.5 px-4 text-center font-semibold border-b-2 transition-colors ${
              method === "email"
                ? "border-[#BE3D2A] text-[#171410]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            Via Email
          </button>
        </div>

        {/* Informative Rate Limit Notice */}
        {rateLimitNotice && (
          <div
            role="status"
            className="mb-5 p-3.5 rounded-md text-xs leading-relaxed flex items-start gap-2.5 border"
            style={{
              backgroundColor: "rgba(217, 119, 6, 0.08)",
              borderColor: "rgba(217, 119, 6, 0.3)",
              color: "#92400e",
            }}
          >
            <Lightning weight="fill" className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{rateLimitNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-md text-sm flex items-start gap-2.5"
            style={{
              backgroundColor: "rgba(190,61,42,0.06)",
              border: "1px solid rgba(190,61,42,0.25)",
              color: RED,
            }}
          >
            <WarningCircle weight="fill" className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug text-xs">{error}</span>
          </div>
        )}

        {/* METHOD 1: INSTANT RESET (Bypasses email rate limit entirely) */}
        {method === "instant" && (
          <form onSubmit={handleInstantReset} className="space-y-4">
            <div>
              <label
                htmlFor={emailId}
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1"
                style={{ color: "var(--ink-soft)" }}
              >
                Registered Email
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
                    color: INK,
                    backgroundColor: "var(--paper)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={verifId}
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1"
                style={{ color: "var(--ink-soft)" }}
              >
                Medical Reg. No. or Doctor Name
              </label>
              <div className="relative">
                <IdentificationCard
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  id={verifId}
                  name="verification-code"
                  type="text"
                  autoComplete="off"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. kmc9876789876232123 or Dr. Aslam"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md outline-none transition-all font-mono"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: INK,
                    backgroundColor: "var(--paper)",
                  }}
                />
              </div>
              <p className="mt-1 text-[10.5px] font-mono" style={{ color: "var(--ink-muted)" }}>
                Verified against your clinician profile · No email wait time
              </p>
            </div>

            <div>
              <label
                htmlFor={passId}
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1"
                style={{ color: "var(--ink-soft)" }}
              >
                New Password
              </label>
              <div className="relative">
                <Lock
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  id={passId}
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-md outline-none transition-all font-mono"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: INK,
                    backgroundColor: "var(--paper)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {newPassword && (
                <div className="pt-2 grid grid-cols-2 gap-1 text-[10.5px] font-mono">
                  <span className={hasMinLength ? "text-emerald-700" : "text-stone-400"}>
                    {hasMinLength ? "✓" : "✗"} 8+ characters
                  </span>
                  <span className={hasNumber ? "text-emerald-700" : "text-stone-400"}>
                    {hasNumber ? "✓" : "✗"} At least 1 number
                  </span>
                  <span className={hasMixedCase ? "text-emerald-700" : "text-stone-400"}>
                    {hasMixedCase ? "✓" : "✗"} Mixed case
                  </span>
                  <span className={hasSpecial ? "text-emerald-700" : "text-stone-400"}>
                    {hasSpecial ? "✓" : "✗"} Special symbol
                  </span>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor={confirmPassId}
                className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1"
                style={{ color: "var(--ink-soft)" }}
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  weight="regular"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  id={confirmPassId}
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-md outline-none transition-all font-mono"
                  style={{
                    border: "1.5px solid var(--rule)",
                    color: INK,
                    backgroundColor: "var(--paper)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirmPassword && (
                <p className={`mt-1 text-[11px] font-mono ${passwordsMatch ? "text-emerald-700" : "text-rose-700"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !hasMinLength || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-opacity mt-4 disabled:opacity-50"
              style={{ backgroundColor: INK, color: "var(--sheet)" }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(252,251,247,0.3)", borderTopColor: "var(--sheet)" }}
                  />
                  Resetting Password…
                </>
              ) : (
                <>
                  Update Password Now
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* METHOD 2: VIA EMAIL */}
        {method === "email" && (
          <>
            {emailSent ? (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(63,122,78,0.12)" }}>
                  <CheckCircle weight="fill" className="w-8 h-8 text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-xl tracking-tight mb-1" style={{ color: INK }}>
                    Link Dispatched
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                    Recovery instructions sent to <strong>{email}</strong>. Click the link in your email to reset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full py-2.5 rounded text-xs font-mono uppercase tracking-[0.1em] border hover:bg-black/5"
                  style={{ borderColor: "var(--rule)", color: INK }}
                >
                  Send Another Link
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailReset} className="space-y-4">
                <div>
                  <label
                    htmlFor={emailId}
                    className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Practitioner Email
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
                        color: INK,
                        backgroundColor: "var(--paper)",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-opacity mt-4 disabled:opacity-60"
                  style={{ backgroundColor: INK, color: "var(--sheet)" }}
                >
                  {loading ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "rgba(252,251,247,0.3)", borderTopColor: "var(--sheet)" }}
                      />
                      Sending link…
                    </>
                  ) : (
                    <>
                      Send Recovery Link
                      <ArrowRight weight="bold" className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Back Link */}
        <div className="mt-8 pt-4 border-t border-black/5 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: INK }}
          >
            <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--paper)" }}>
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
          />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
