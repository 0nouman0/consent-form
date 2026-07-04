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
  Coins,
  BookOpen,
} from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { href: "/dashboard",  label: "Dashboard",        icon: SquaresFour         },
  { href: "/generate",   label: "Generate Consent",  icon: FileText            },
  { href: "/templates",  label: "Templates",         icon: Columns             },
  { href: "/history",    label: "History",           icon: ClockCounterClockwise },
  { href: "/chat",       label: "Chat",              icon: ChatCircleText      },
  { href: "/credits",     label: "Buy Credits",       icon: Coins               },
  { href: "/regulations", label: "Regulations",        icon: BookOpen            },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    } else {
      // Auto-collapse on tablet (md → lg range)
      setCollapsed(window.innerWidth < 1024);
    }
  }, []);

  // Auto-collapse when viewport shrinks to tablet
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen overflow-hidden"
      style={{
        width: collapsed ? "68px" : "240px",
        minWidth: collapsed ? "68px" : "240px",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        background: "var(--sheet)",
        borderRight: "1px solid var(--rule)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{
          padding: collapsed ? "0" : "0 14px",
          height: "64px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid var(--rule)",
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
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: "var(--ink)" }}>
            <ShieldCheck weight="bold" className="w-[16px] h-[16px]" style={{ color: "var(--sheet)" }} />
          </div>
          <span className="font-serif font-semibold text-sm tracking-tight" style={{ color: "var(--ink)" }}>ConsentGen</span>
        </Link>

        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-all shrink-0 hover:bg-[var(--paper)]"
          style={{ color: "var(--ink-muted)" }}
        >
          {collapsed
            ? <CaretRight weight="bold" className="w-3.5 h-3.5" />
            : <CaretLeft weight="bold" className="w-3.5 h-3.5" />}
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
              className="flex items-center rounded-md font-medium transition-all text-sm group overflow-hidden"
              style={{
                gap: collapsed ? 0 : "12px",
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "padding 0.25s ease, gap 0.25s ease, background 0.15s ease, color 0.15s ease",
                backgroundColor: isActive ? "var(--ink)" : undefined,
                color: isActive ? "var(--sheet)" : "var(--ink-muted)",
              }}
            >
              <Icon
                weight={isActive ? "fill" : "duotone"}
                className="shrink-0"
                style={{ width: "18px", height: "18px", color: isActive ? "var(--sheet)" : "var(--ink-muted)" }}
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
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--rule)" }}>
        <Link
          href="/profile"
          className="flex items-center rounded-md font-medium transition-all text-xs group overflow-hidden"
          style={{
            gap: collapsed ? 0 : "10px",
            padding: collapsed ? "8px 0" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "padding 0.25s ease, gap 0.25s ease",
            color: "var(--ink-muted)",
          }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: "var(--paper)" }}>
            <User weight="duotone" className="w-[16px] h-[16px]" style={{ color: "var(--ink-muted)" }} />
          </div>
          <span
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
        </Link>
      </div>
    </aside>
  );
}
