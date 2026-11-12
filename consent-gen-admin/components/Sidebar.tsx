"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import {
  SquaresFour,
  Users,
  FileText,
  CreditCard,
  ShieldCheck,
  SignOut,
  Sun,
  Moon,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/users", label: "Doctors & Accounts", icon: Users },
  { href: "/generations", label: "Generations Audit", icon: FileText },
  { href: "/payments", label: "Billing & Payments", icon: CreditCard },
  { href: "/audit-log", label: "Admin Logs", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      className="w-64 shrink-0 flex flex-col h-screen sticky top-0 font-body select-none transition-colors duration-150"
      style={{
        background: "var(--sheet)",
        borderRight: "1px solid var(--rule)",
      }}
    >
      {/* Brand Header */}
      <div
        className="h-16 px-5 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: "var(--badge-dark-bg)" }}
          >
            <ShieldCheck weight="bold" className="w-4 h-4" style={{ color: "var(--badge-dark-text)" }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-semibold text-sm tracking-tight" style={{ color: "var(--ink)" }}>
                ConsentGen
              </span>
              <span
                className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--badge-light-bg)",
                  color: "var(--ink)",
                  border: "1px solid var(--rule)",
                }}
              >
                Ops
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] leading-none mt-0.5" style={{ color: "var(--ink-muted)" }}>
              Luffy Monitor
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--ink-muted)" }}>
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? "var(--nav-active-bg)" : "transparent",
                color: isActive ? "var(--nav-active-text)" : "var(--ink-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--nav-hover-bg)";
                  e.currentTarget.style.color = "var(--ink)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--ink-muted)";
                }
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                weight={isActive ? "fill" : "duotone"}
                style={{ color: isActive ? "var(--nav-active-text)" : "currentColor" }}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--rule)" }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: "var(--header-pill-bg)",
            border: "1px solid var(--header-pill-border)",
            color: "var(--ink)",
          }}
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300" weight="fill" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" weight="fill" />
                <span>Light Mode</span>
              </>
            )}
          </span>
          <span
            className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded transition-colors"
            style={{ backgroundColor: "var(--badge-light-bg)", color: "var(--ink-muted)" }}
          >
            Toggle
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer"
          style={{
            backgroundColor: "transparent",
            color: "var(--red)",
            border: "1px solid var(--status-fail-border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--status-fail-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <SignOut className="w-3.5 h-3.5" weight="bold" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
