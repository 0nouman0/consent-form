"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { List, ShieldCheck } from "@phosphor-icons/react";

/**
 * Top bar. On phones it carries the menu button and a compact admin badge; the status pill and the
 * subtitle only appear when there is room for them.
 */
export default function Header({
  title,
  subtitle,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}) {
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
      className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 mx-3 mt-3 sm:mx-4 sm:mt-4 rounded-xl shrink-0 sticky top-3 z-30 transition-colors duration-150"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--rule)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation menu"
            className="lg:hidden w-11 h-11 -ml-1 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            style={{ background: "var(--header-pill-bg)", border: "1px solid var(--header-pill-border)", color: "var(--ink)" }}
          >
            <List className="w-5 h-5" weight="bold" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-serif font-semibold text-base sm:text-lg tracking-tight leading-tight truncate" style={{ color: "var(--ink)" }}>
            {title}
          </h1>
          <p className="hidden sm:block font-mono text-xs uppercase tracking-[0.08em] mt-0.5 leading-tight truncate" style={{ color: "var(--ink-muted)" }}>
            {subtitle || "ConsentGen Internal Operations"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-[0.08em] font-semibold"
          style={{ background: "var(--header-pill-bg)", border: "1px solid var(--header-pill-border)", color: "var(--ink)" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Operational</span>
        </div>

        <div
          className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg"
          style={{ background: "var(--header-pill-bg)", border: "1px solid var(--header-pill-border)" }}
          title={adminEmail}
        >
          <div
            className="w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--badge-dark-bg)" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" weight="bold" style={{ color: "var(--badge-dark-text)" }} />
          </div>
          <div className="hidden sm:block text-left min-w-0">
            <p className="font-serif font-semibold text-xs leading-tight" style={{ color: "var(--ink)" }}>
              Luffy Admin
            </p>
            <p className="text-xs font-mono leading-tight truncate max-w-[140px] lg:max-w-[200px]" style={{ color: "var(--ink-muted)" }}>
              {adminEmail}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
