"use client";

/**
 * PublicCTA – Auth-aware "Start Generating Today" button.
 * Logged-in users → /generate
 * Logged-out users → /login?redirect=/generate
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const INK = "#171410";
const PAPER = "#F4F1E9";

interface Props {
  label?: string;
}

export default function PublicCTA({ label = "Start Generating Today" }: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const href = loggedIn ? "/generate" : "/login?redirect=/generate";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider font-semibold rounded"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <span>{label}</span>
      <span>→</span>
    </Link>
  );
}

