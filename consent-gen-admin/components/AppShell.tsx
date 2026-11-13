"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "@phosphor-icons/react";
import Sidebar, { SidebarPanel } from "./Sidebar";
import Header from "./Header";
import ResponsiveTables from "./ResponsiveTables";

/**
 * The one page frame for every admin screen.
 *   ≥ 1024px : fixed sidebar + content
 *   < 1024px : top bar with a menu button; the sidebar slides in as a drawer
 * Pages only supply a title and their content, so spacing, header and navigation can no longer drift apart.
 */
export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);

  // close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes it; the page behind does not scroll while it is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen font-body transition-colors duration-150" style={{ backgroundColor: "var(--paper)" }}>
      <ResponsiveTables />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
        {children}
      </div>

      {/* Mobile / tablet navigation drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: "rgba(23,20,16,0.45)" }}
          onClick={close}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 w-[86%] max-w-[320px] p-3 transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="relative h-full">
            <SidebarPanel onNavigate={close} />
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation menu"
              className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: "var(--header-pill-bg)", border: "1px solid var(--header-pill-border)", color: "var(--ink)" }}
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
