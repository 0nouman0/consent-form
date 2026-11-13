"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { Coins } from "@phosphor-icons/react/dist/ssr";

function firstName(full: string) {
  const parts = full.replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  const n = parts[0] || full;
  return /^dr\.?\s/i.test(full) ? `Dr. ${n}` : n;
}

interface ProfileSnap {
  doctorName: string;
  hospitalName: string;
}

export default function AppHeader() {
  const [profile, setProfile] = useState<ProfileSnap | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCreditsOnly = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (p) setCredits(p.credits);
    };

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("doctor_name, hospital_name, credits")
        .eq("id", user.id)
        .single();
      if (p) {
        setProfile({ doctorName: p.doctor_name || "", hospitalName: p.hospital_name || "" });
        setCredits(p.credits);
      }
    });

    window.addEventListener("credits-updated", fetchCreditsOnly);
    return () => window.removeEventListener("credits-updated", fetchCreditsOnly);
  }, []);

  return (
    <header
      className="hidden md:flex items-center justify-between px-5 py-2.5 mx-3 mt-3 sm:mx-4 sm:mt-4 rounded-xl shrink-0 relative z-40"
      style={{
        background: "rgba(252,251,247,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--rule)",
      }}
    >
      {/* Left — greeting (full identity lives in the user menu) */}
      <p className="pl-2 font-serif font-semibold text-base tracking-tight" style={{ color: "var(--ink)" }}>
        {profile?.doctorName ? `Welcome back, ${firstName(profile.doctorName)}` : "Welcome back"}
      </p>

      {/* Right — Credits + UserMenu */}
      <div className="flex items-center gap-3">
        <Link
          href="/credits"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-[0.08em] font-semibold transition-all"
          style={{ background: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink)" }}
        >
          <Coins className="w-3.5 h-3.5" weight="fill" style={{ color: "var(--red)" }} />
          <span>{credits !== null ? `${credits} Credits` : "—"}</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
