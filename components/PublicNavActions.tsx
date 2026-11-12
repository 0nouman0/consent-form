"use client";

/**
 * PublicNavActions
 * Used in public pages (regulations, privacy, terms) to show:
 *  - "Dashboard" if the user is already logged in
 *  - "Sign In" / "Practitioner Portal" if not
 * Avoids sending logged-in users back to /login.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const INK = "#171410";
const PAPER = "#F4F1E9";

interface Props {
  label?: string;         // button label (default: "Practitioner Portal")
  loggedInLabel?: string; // label when logged-in (default: "Dashboard")
  loggedInHref?: string;  // where to go when logged-in (default: "/dashboard")
}

export default function PublicNavActions({
  label = "Practitioner Portal",
  loggedInLabel = "Dashboard",
  loggedInHref = "/dashboard",
}: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loggedIn === null) {
    // placeholder width while loading to prevent layout shift
    return <span className="inline-block w-28 h-7 rounded animate-pulse" style={{ backgroundColor: "rgba(23,20,16,0.08)" }} />;
  }

  if (loggedIn) {
    return (
      <Link
        href={loggedInHref}
        className="px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] rounded"
        style={{ backgroundColor: INK, color: PAPER }}
      >
        {loggedInLabel}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] rounded"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      {label}
    </Link>
  );
}

