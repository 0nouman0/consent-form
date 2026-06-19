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
      className="hidden md:flex items-center justify-between px-6 py-2 mx-3 mt-3 sm:mx-4 sm:mt-4 rounded-full shrink-0"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Left — greeting / doctor info */}
      <div className="pl-2">
        {profile?.doctorName ? (
          <div>
            <p className="text-sm font-bold tracking-tight text-neutral-900 leading-tight">
              {profile.doctorName}
            </p>
            {profile.hospitalName && (
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{profile.hospitalName}</p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold tracking-tight text-neutral-900">Welcome back</p>
        )}
      </div>

      {/* Right — Credits + UserMenu */}
      <div className="flex items-center gap-3">
        <Link 
          href="/credits" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-neutral-50 border border-black/[0.06] text-neutral-700 hover:bg-neutral-100 hover:border-black/[0.12] transition-all"
        >
          <Coins className="w-3.5 h-3.5 text-neutral-500" weight="fill" />
          <span>{credits !== null ? `${credits} Credits` : "—"}</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
