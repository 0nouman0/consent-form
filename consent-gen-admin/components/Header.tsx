"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Bell, User } from "@phosphor-icons/react";

export default function Header({ title }: { title: string }) {
  const [adminEmail, setAdminEmail] = useState<string>("admin@consentgen.com");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setAdminEmail(user.email);
      }
    });
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-6 glass-card border-x-0 border-t-0 border-b border-card-border">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>

      {/* Admin Actions */}
      <div className="flex items-center gap-4">
        {/* Alerts / System status */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>System Healthy</span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-4 border-l border-card-border">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-500" weight="fill" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-tight">Administrator</p>
            <p className="text-[10px] text-muted leading-tight truncate max-w-[150px]">{adminEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
