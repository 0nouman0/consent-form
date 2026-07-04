"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { Coins } from "@phosphor-icons/react/dist/ssr";

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
      className="hidden md:flex items-center justify-between px-6 py-2.5 mx-3 mt-3 sm:mx-4 sm:mt-4 rounded-md shrink-0"
      style={{
        background: "rgba(252,251,247,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--rule)",
      }}
    >
      {/* Left — greeting / doctor info */}
      <div className="pl-2">
        {profile?.doctorName ? (
          <div>
            <p className="font-serif font-semibold text-sm tracking-tight leading-tight" style={{ color: "var(--ink)" }}>
              {profile.doctorName}
            </p>
            {profile.hospitalName && (
              <p className="text-[10px] mt-0.5 leading-tight font-mono uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>{profile.hospitalName}</p>
            )}
          </div>
        ) : (
          <p className="font-serif font-semibold text-sm tracking-tight" style={{ color: "var(--ink)" }}>Welcome back</p>
        )}
      </div>

      {/* Right — Credits + UserMenu */}
      <div className="flex items-center gap-3">
        <Link
          href="/credits"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.08em] font-semibold transition-all"
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
