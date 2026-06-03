"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, Lock, LogIn, UserPlus } from "lucide-react";

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(redirect);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        setMessage(
          "Account created! Please check your email to confirm your account before signing in."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nq-bg flex flex-col items-center justify-center px-4 py-12 font-inter relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-nq-text tracking-tight">ConsentGen</span>
        </Link>

        <div className="nq-card nq-noise p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-nq-text tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-nq-text-muted mt-2">
              {mode === "signin"
                ? "Sign in to access your dashboard and history"
                : "Sign up to start saving consent forms"}
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
              <span className="font-semibold text-red-700">Error:</span> {error}
            </div>
          )}

          {message && (
            <div className="mb-6 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-nq-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nq-text-light" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-nq-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nq-text-light" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full nq-btn-primary justify-center py-3.5 mt-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === "signin" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
              className="text-sm font-medium text-nq-text-muted hover:text-nq-purple transition-colors"
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-nq-text-light mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-nq-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
