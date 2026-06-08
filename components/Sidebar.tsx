"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  SquaresFour,
  FileText,
  Columns,
  ClockCounterClockwise,
  ChatCircleText,
  User,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { href: "/dashboard",  label: "Dashboard",        icon: SquaresFour         },
  { href: "/generate",   label: "Generate Consent",  icon: FileText            },
  { href: "/templates",  label: "Templates",         icon: Columns             },
  { href: "/history",    label: "History",           icon: ClockCounterClockwise },
  { href: "/chat",       label: "Chat",              icon: ChatCircleText      },
  { href: "/profile",    label: "Profile",           icon: User                },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <aside
      className="hidden md:flex flex-col border-r border-border bg-background sticky top-0 h-screen overflow-hidden"
      style={{
        width: collapsed ? "68px" : "240px",
        minWidth: collapsed ? "68px" : "240px",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center border-b border-border shrink-0 overflow-hidden"
        style={{
          padding: collapsed ? "0" : "0 12px",
          height: "64px",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 group overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
            pointerEvents: collapsed ? "none" : "auto",
            transition: "opacity 0.15s ease, width 0.25s ease",
            whiteSpace: "nowrap",
          }}
        >
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <ShieldCheck weight="bold" className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-[16px] font-bold text-foreground tracking-tight">ConsentGen</span>
        </Link>

        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {collapsed
            ? <CaretRight weight="bold" className="w-4 h-4" />
            : <CaretLeft weight="bold" className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl font-medium transition-all text-sm group overflow-hidden ${
                isActive
                  ? "gradient-bg text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              style={{
                gap: collapsed ? 0 : "12px",
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "padding 0.25s ease, gap 0.25s ease, background 0.15s ease",
              }}
            >
              <Icon
                weight={isActive ? "fill" : "duotone"}
                className={`shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}
                style={{ width: "20px", height: "20px" }}
              />
              <span
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                  maxWidth: collapsed ? 0 : "160px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.15s ease, max-width 0.25s ease",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-border p-3">
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{
            gap: collapsed ? 0 : "10px",
            padding: collapsed ? "8px 0" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "padding 0.25s ease, gap 0.25s ease",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <User weight="duotone" className="w-[18px] h-[18px] text-primary" />
          </div>
          <span
            className="text-xs font-semibold text-muted-foreground"
            style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              maxWidth: collapsed ? 0 : "120px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s ease, max-width 0.25s ease",
            }}
          >
            Doctor Profile
          </span>
        </div>
      </div>
    </aside>
  );
}
