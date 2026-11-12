"use client";

import { useState, Suspense, useId } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck, Envelope, ArrowRight, ArrowLeft, CheckCircle, WarningCircle,
} from "@phosphor-icons/react";

const INK = "#171410";
const RED = "#BE3D2A";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "invalid_link"
      ? "The reset link was invalid or expired. Request a new one below."
      : initialError || null
  );

  const emailId = useId();
  const supabase = createClient();

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid practitioner email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
      });

      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Too many reset emails have been requested. Please wait a few minutes and try again.");
          return;
        }
        throw resetError;
      }

      // Same response whether or not the address is registered (no account enumeration)
      setEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send recovery instructions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div
        className="w-full max-w-[460px] p-8 sm:p-10 rounded-2xl border shadow-xl relative"
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
            ConsentGen<span className="text-xs font-mono align-super ml-0.5" style={{ color: RED }}>®</span>
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-serif font-semibold text-3xl tracking-tight mb-2" style={{ color: INK }}>
            Reset Password
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Enter your registered email and we will send you a secure link to choose a new password.
          </p>
        </div>

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

        {emailSent ? (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(63,122,78,0.12)" }}>
              <CheckCircle weight="fill" className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-xl tracking-tight mb-1" style={{ color: INK }}>
                Check your inbox
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                If an account exists for <strong>{email}</strong>, a reset link is on its way. Click the link in the email to continue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmailSent(false)}
              className="w-full py-2.5 rounded-md text-xs font-mono uppercase tracking-[0.1em] border hover:bg-black/5"
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
                className="block font-mono text-xs uppercase tracking-[0.08em] font-semibold mb-1.5"
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
