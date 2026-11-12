"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck } from "@phosphor-icons/react";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const [adminEmail, setAdminEmail] = useState<string>("admin@consentgen.com");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      if (res?.data?.user?.email) {
        setAdminEmail(res.data.user.email);
      }
    });
  }, [supabase]);

  return (
    <header
      className="flex items-center justify-between px-5 sm:px-6 py-2.5 mx-3 mt-3 sm:mx-4 sm:mt-4 rounded-md shrink-0 sticky top-3 z-30 transition-colors duration-150"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--rule)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Title */}
      <div>
        <h1 className="font-serif font-semibold text-base sm:text-lg tracking-tight leading-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] mt-0.5 leading-tight" style={{ color: "var(--ink-muted)" }}>
          {subtitle || "ConsentGen Internal Operations"}
        </p>
      </div>

      {/* Admin Badges & Status */}
      <div className="flex items-center gap-3">
        {/* System status pill */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.08em] font-semibold transition-colors"
          style={{
            background: "var(--header-pill-bg)",
            border: "1px solid var(--header-pill-border)",
            color: "var(--ink)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Operational</span>
        </div>

        {/* Admin Account Badge */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: "var(--header-pill-bg)",
            border: "1px solid var(--header-pill-border)",
          }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: "var(--badge-dark-bg)" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" weight="bold" style={{ color: "var(--badge-dark-text)" }} />
          </div>
          <div className="text-left">
            <p className="font-serif font-semibold text-xs leading-tight" style={{ color: "var(--ink)" }}>
              Luffy Admin
            </p>
            <p
              className="text-[10px] font-mono leading-tight truncate max-w-[130px] sm:max-w-[180px]"
              style={{ color: "var(--ink-muted)" }}
            >
              {adminEmail}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
