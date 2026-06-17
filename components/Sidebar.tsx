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
      className="hidden md:flex flex-col sticky top-0 h-screen overflow-hidden"
      style={{
        width: collapsed ? "68px" : "240px",
        minWidth: collapsed ? "68px" : "240px",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{
          padding: collapsed ? "0" : "0 14px",
          height: "64px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: "#0b0f1a" }}>
            <ShieldCheck weight="bold" className="w-[16px] h-[16px] text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "#0b0f1a" }}>ConsentGen</span>
        </Link>

        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
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
              className={`flex items-center rounded-xl font-medium transition-all text-sm group overflow-hidden ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              style={{
                gap: collapsed ? 0 : "12px",
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "padding 0.25s ease, gap 0.25s ease, background 0.15s ease",
                backgroundColor: isActive ? "#0b0f1a" : undefined,
              }}
            >
              <Icon
                weight={isActive ? "fill" : "duotone"}
                className={`shrink-0 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-700"}`}
                style={{ width: "18px", height: "18px" }}
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
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <Link
          href="/profile"
          className="flex items-center rounded-xl font-medium transition-all text-xs group overflow-hidden text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          style={{
            gap: collapsed ? 0 : "10px",
            padding: collapsed ? "8px 0" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "padding 0.25s ease, gap 0.25s ease",
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-neutral-100 transition-colors group-hover:bg-neutral-200">
            <User weight="duotone" className="w-[16px] h-[16px] text-neutral-500 group-hover:text-neutral-700" />
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
