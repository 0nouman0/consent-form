"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

interface ClayNavProps {
  links?: NavLink[];
  userEmail?: string | null;
  onSignOut?: () => void;
  showAuth?: boolean;
}

export default function ClayNav({
  links = [],
  userEmail,
  onSignOut,
  showAuth = true,
}: ClayNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-clay-base/80 backdrop-blur-md border-b border-clay-border/30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-clay-primary rounded-xl flex items-center justify-center shadow-clay-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-clay-text">
              ConsentGen
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-white/60 text-clay-primary shadow-clay-inner"
                      : "text-clay-text-muted hover:text-clay-text hover:bg-white/40"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {showAuth &&
              (userEmail ? (
                <>
                  <span className="text-xs text-clay-text-muted max-w-[120px] truncate">
                    {userEmail}
                  </span>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-clay-text-muted hover:text-clay-accent hover:bg-white/40 transition-all"
                    >
                      Sign out
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 bg-clay-primary text-white text-sm font-medium rounded-2xl shadow-[6px_6px_12px_rgba(109,179,166,0.35),-6px_-6px_12px_rgba(255,255,255,0.4)] hover:shadow-[8px_8px_18px_rgba(109,179,166,0.4),-8px_-8px_18px_rgba(255,255,255,0.5)] hover:bg-clay-primary-light transition-all"
                >
                  Sign in
                </Link>
              ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-clay-text"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-2 rounded-xl text-sm font-medium",
                    isActive
                      ? "bg-white/60 text-clay-primary"
                      : "text-clay-text-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {showAuth &&
              (userEmail ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onSignOut?.();
                  }}
                  className="block w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-clay-text-muted"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 rounded-xl text-sm font-medium text-clay-primary"
                >
                  Sign in
                </Link>
              ))}
          </div>
        )}
      </div>
    </nav>
  );
}
