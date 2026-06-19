"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Coins, Eye, EyeSlash, Lock, Envelope, Warning } from "@phosphor-icons/react";

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
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#080b11] p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] z-10">
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-white/5 bg-slate-900/40">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25 mb-4">
              <Coins className="w-6 h-6 text-amber-400" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
              Luffy Admin Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ConsentGen Operations & System Control
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-xs text-red-400 leading-normal">
              <Warning className="w-4 h-4 shrink-0 mt-0.5 text-red-400" weight="fill" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@consentgen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] disabled:opacity-50 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Authenticate & Access"
              )}
            </button>
          </form>

          {/* Footer details */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 leading-normal">
              SECURED ACCESS. Unauthorized login attempts are tracked and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#080b11]">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
