"use client";

import { useState, useEffect, Suspense, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Lock, ArrowRight, CheckCircle, WarningCircle, Eye, EyeSlash, Check, X
} from "@phosphor-icons/react";

const RED = "#BE3D2A";
const INK = "#171410";

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const passwordId = useId();
  const confirmPasswordId = useId();

  // Verify that an active recovery session exists
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      // 1. Check existing session from cookies/storage
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (mounted) {
          setHasValidSession(true);
          setCheckingSession(false);
        }
        return;
      }

      // 2. Also listen for auth state changes (e.g. hash fragments / recovery event)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY" || session) {
          setHasValidSession(true);
          setCheckingSession(false);
        }
      });

      // Allow a brief grace period for hash fragment tokens to be parsed
      setTimeout(() => {
        if (mounted && checkingSession) {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) {
              setHasValidSession(!!s);
              setCheckingSession(false);
            }
          });
        }
      }, 1200);

      return () => {
        subscription.unsubscribe();
      };
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [supabase, checkingSession]);

  // Handle countdown redirect on success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push("/login?message=reset_success");
    }
  }, [success, countdown, router]);

  // Password criteria checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const score = [hasMinLength, hasNumber, hasLetter, hasMixedCase, hasSpecial].filter(Boolean).length;

  const getStrengthInfo = () => {
    if (!password) return { label: "Enter password", color: "#ccc", width: "0%" };
    if (score <= 2) return { label: "Weak", color: "#BE3D2A", width: "25%" };
    if (score === 3) return { label: "Fair", color: "#d97706", width: "50%" };
    if (score === 4) return { label: "Good", color: "#2563eb", width: "75%" };
    return { label: "Strong & Medico-Legally Secure", color: "#16a34a", width: "100%" };
  };

  const strength = getStrengthInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      // Clear the temporary recovery session so the user performs a fresh sign-in
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Your recovery session may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
        <div
          className="w-full max-w-[420px] p-8 sm:p-10 rounded-sm border shadow-lg text-center space-y-4"
          style={{ backgroundColor: "var(--sheet)", borderColor: "var(--rule)" }}
        >
          <div
            className="w-9 h-9 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
          />
          <h2 className="font-serif font-medium text-lg" style={{ color: INK }}>
            Verifying recovery session…
          </h2>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Confirming your cryptographic token with the authentication server.
          </p>
        </div>
      </div>
    );
  }

  if (!hasValidSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
        <div
          className="w-full max-w-[440px] p-8 sm:p-10 rounded-sm border shadow-xl text-center space-y-5"
          style={{ backgroundColor: "var(--sheet)", borderColor: "var(--rule)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(190,61,42,0.1)" }}>
            <WarningCircle weight="fill" className="w-8 h-8" style={{ color: RED }} />
          </div>

          <div>
            <h1 className="font-serif font-semibold text-2xl tracking-tight mb-2" style={{ color: INK }}>
              Link Expired or Invalid
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              The password reset link you used has either expired or has already been completed. For security, password reset links are single-use and valid for 60 minutes.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/forgot-password"
              className="w-full py-3 px-4 rounded text-xs font-mono uppercase tracking-[0.14em] font-semibold transition-opacity"
              style={{ backgroundColor: INK, color: "var(--sheet)" }}
            >
              Request a New Reset Link
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded text-xs font-mono uppercase tracking-[0.12em] border hover:bg-black/5 transition-colors"
              style={{ borderColor: "var(--rule)", color: INK }}
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div
        className="w-full max-w-[440px] p-8 sm:p-10 rounded-sm border shadow-xl relative"
        style={{ backgroundColor: "var(--sheet)", borderColor: "var(--rule)" }}
      >
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit group">
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

        {success ? (
          <div className="text-center py-4 space-y-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(63,122,78,0.12)" }}>
              <CheckCircle weight="fill" className="w-9 h-9 text-emerald-700" />
            </div>

            <div>
              <h1 className="font-serif font-semibold text-2xl tracking-tight mb-2" style={{ color: INK }}>
                Password Updated Successfully
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                Your practitioner account password has been reset securely. Please sign in with your new password.
              </p>
            </div>

            <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Redirecting to sign-in page in {countdown} second{countdown === 1 ? "" : "s"}…
            </p>

            <Link
              href="/login?message=reset_success"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded text-xs font-mono uppercase tracking-[0.14em] font-semibold"
              style={{ backgroundColor: INK, color: "var(--sheet)" }}
            >
              Sign In Now <ArrowRight weight="bold" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-serif font-semibold text-3xl tracking-tight mb-2" style={{ color: INK }}>
                Create New Password
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                Enter a strong, confidential password for your practitioner account.
              </p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor={passwordId}
                  className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
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
                    id={passwordId}
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Strength Meter Bar */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span style={{ color: strength.color }}>{strength.label}</span>
                      <span style={{ color: "var(--ink-muted)" }}>Min 8 chars</span>
                    </div>

                    {/* Criteria checklist */}
                    <div className="pt-2 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <span className={`inline-flex items-center gap-1 ${hasMinLength ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                        {hasMinLength ? <Check size={12} weight="bold" /> : <X size={12} />} 8+ chars
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                        {hasNumber ? <Check size={12} weight="bold" /> : <X size={12} />} One number
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasMixedCase ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                        {hasMixedCase ? <Check size={12} weight="bold" /> : <X size={12} />} Upper & lower
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasSpecial ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                        {hasSpecial ? <Check size={12} weight="bold" /> : <X size={12} />} Special symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor={confirmPasswordId}
                  className="block font-mono text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5"
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
                    id={confirmPasswordId}
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
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {confirmPassword && (
                  <p className={`mt-1.5 text-[11px] font-mono ${passwordsMatch ? "text-emerald-700" : "text-rose-700"}`}>
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
                    Updating password…
                  </>
                ) : (
                  <>
                    Save New Password
                    <ArrowRight weight="bold" className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
