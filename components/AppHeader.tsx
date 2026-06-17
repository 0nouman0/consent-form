"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "@/components/UserMenu";

interface ProfileSnap {
  doctorName: string;
  hospitalName: string;
}

export default function AppHeader() {
  const [profile, setProfile] = useState<ProfileSnap | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("doctor_name, hospital_name")
        .eq("id", user.id)
        .single();
      if (p) setProfile({ doctorName: p.doctor_name || "", hospitalName: p.hospital_name || "" });
    });
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

      {/* Right — UserMenu */}
      <UserMenu />
    </header>
  );
}
