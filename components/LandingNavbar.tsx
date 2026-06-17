"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowRight, SquaresFour } from "@phosphor-icons/react/dist/ssr";
import UserMenu from "@/components/UserMenu";

export default function LandingNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const supabase = createClient();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="fixed top-3 sm:top-4 left-0 right-0 z-[100] flex justify-center px-3 sm:px-4">
      <div
        className="flex items-center rounded-full pl-2 pr-2 py-2 w-full max-w-[760px]"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 pr-4">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center" style={{ backgroundColor: "#0b0f1a" }}>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:block" style={{ color: "#0b0f1a" }}>ConsentGen</span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-6 text-[14px] text-neutral-500">
          <a href="#" className="flex items-center gap-1 font-medium" style={{ color: "#0b0f1a" }}>
            Home
            <span className="w-1.5 h-1.5 rounded-full inline-block ml-1" style={{ backgroundColor: "#0b0f1a" }} />
          </a>
          <a href="#features" className="hover:text-neutral-800 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-neutral-800 transition-colors">How It Works</a>
          {/* Show Sign In link only when logged out */}
          {isLoggedIn === false && (
            <Link href="/login" className="hover:text-neutral-800 transition-colors">Sign In</Link>
          )}
        </div>

        {/* Right side — auth-aware */}
        <div className="ml-auto flex items-center gap-2">
          {/* Loading placeholder */}
          {isLoggedIn === null && (
            <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
          )}

          {/* Logged OUT */}
          {isLoggedIn === false && (
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-white transition-all pr-1.5 pl-4 py-1.5 sm:pl-5 hover:opacity-90"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <span className="flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )}

          {/* Logged IN */}
          {isLoggedIn === true && (
            <div className="flex items-center gap-2">
              {/* Dashboard quick link — desktop only */}
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-neutral-600 transition-all px-3 py-1.5 hover:text-neutral-900 hover:bg-neutral-100"
                style={{ border: "1px solid rgba(0,0,0,0.09)" }}
              >
                <SquaresFour className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              {/* User avatar + dropdown */}
              <UserMenu compact />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
