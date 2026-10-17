"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Eye,
  EyeSlash,
  Lock,
  Envelope,
  Warning,
  ArrowRight,
  Shield,
} from "@phosphor-icons/react";

const TRUST_BADGES = ["IMC 2002", "NMC 2023", "BNS §§24-30", "RBAC Security"];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized_admin") {
      setErrorMsg("Unauthorized: Only administrator accounts can access the Luffy Ops dashboard.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Verify role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        setErrorMsg("Access Denied: Only administrator accounts can access this console.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg("An unexpected login error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: "var(--paper)" }}>
      {/* Left branding panel (lg+) matching user website */}
      <div
        className="hidden lg:flex flex-col w-[440px] xl:w-[480px] shrink-0 relative overflow-hidden"
        style={{ backgroundColor: "#171410" }}
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

        {/* Glow circle */}
        <div
          className="absolute -top-32 -right-32 w-[450px] h-[450px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, var(--red), transparent 65%)" }}
        />

        <div className="relative flex flex-col justify-between h-full p-10 xl:p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group w-fit">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: "rgba(252,251,247,0.1)",
                border: "1px solid rgba(252,251,247,0.15)",
              }}
            >
              <ShieldCheck weight="bold" className="w-5 h-5" style={{ color: "#FCFBF7" }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-base tracking-tight" style={{ color: "#FCFBF7" }}>
                ConsentGen
              </span>
              <span
                className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(252,251,247,0.15)", color: "#FCFBF7" }}
              >
                Luffy Ops
              </span>
            </div>
          </div>

          {/* Center message */}
          <div className="space-y-4 my-auto">
            <p className="font-mono text-xs uppercase tracking-[0.08em] font-semibold text-amber-400">
              Internal Operations Console
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight" style={{ color: "#FCFBF7" }}>
              Platform control, doctor audits, & revenue telemetry.
            </h2>
            <p className="text-xs leading-relaxed opacity-70" style={{ color: "#FCFBF7" }}>
              Restricted administrative environment for ConsentGen engineers, compliance officers, and operations managers.
            </p>

            <div className="pt-6 flex flex-wrap gap-2">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b}
                  className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: "rgba(252,251,247,0.08)",
                    border: "1px solid rgba(252,251,247,0.12)",
                    color: "#FCFBF7",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6" style={{ borderTop: "1px solid rgba(252,251,247,0.1)" }}>
            <p className="text-[11px] font-mono opacity-50" style={{ color: "#FCFBF7" }}>
              Authorized personnel only. All access attempts are recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <ShieldCheck weight="bold" className="w-4 h-4" style={{ color: "var(--sheet)" }} />
            </div>
            <span className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>
              ConsentGen Luffy Ops
            </span>
          </div>

          <div
            className="rounded-md p-7 sm:p-9"
            style={{
              backgroundColor: "var(--sheet)",
              border: "1px solid var(--rule)",
              boxShadow: "0 2px 16px rgba(23, 20, 16, 0.05)",
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                Restricted Terminal
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Admin <span style={{ color: "var(--red)" }}>sign in</span>
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                Authenticate with your operator credentials
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div
                className="mb-5 p-3 rounded-md flex items-start gap-2.5 text-xs leading-normal"
                style={{
                  backgroundColor: "rgba(190, 61, 42, 0.08)",
                  border: "1px solid rgba(190, 61, 42, 0.25)",
                  color: "var(--red)",
                }}
              >
                <Warning className="w-4 h-4 shrink-0 mt-0.5" weight="fill" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink-muted)" }}>
                  Admin Email
                </label>
                <div className="relative">
                  <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                  <input
                    type="email"
                    required
                    placeholder="admin@consentgen.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md text-xs outline-none transition-all"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink-muted)" }}>
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-md text-xs outline-none transition-all"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-5"
                style={{
                  backgroundColor: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
              >
                {loading ? (
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(252,251,247,0.3)", borderTopColor: "var(--sheet)" }}
                  />
                ) : (
                  <>
                    <span>Authenticate & Access</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid var(--rule)" }}>
              <p className="text-[10px] font-mono leading-normal" style={{ color: "var(--ink-muted)" }}>
                Luffy Operations Console • Multi-factor & RBAC Protected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
