"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SquaresFour, User, SignOut, CaretDown } from "@phosphor-icons/react";
import type { UserRole } from "@/lib/rbac";

interface ProfileInfo {
  doctorName: string;
  hospitalName: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  viewer: "Viewer",
};

export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);

      const { data: p } = await supabase
        .from("profiles")
        .select("doctor_name, hospital_name, role")
        .eq("id", user.id)
        .single();

      setProfile({
        doctorName: p?.doctor_name || "",
        hospitalName: p?.hospital_name || "",
        role: (p?.role as UserRole) ?? "doctor",
      });
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("consentgen_doctor_profile");
      document.cookie = "consentgen_onboarded=; path=/; max-age=0; SameSite=Lax";
    } catch {}
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-md bg-neutral-200 animate-pulse" />;
  }

  if (!email) return null;

  const initials = profile?.doctorName
    ? profile.doctorName
        .replace(/^Dr\.?\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email[0].toUpperCase();

  const roleLabel = ROLE_LABELS[profile?.role ?? "doctor"];

  return (
    <div className={`relative ${open ? "z-50" : ""}`} ref={menuRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md transition-colors hover:bg-[var(--sheet)] focus:outline-none"
        style={{
          padding: compact ? "3px" : "4px 10px 4px 4px",
          border: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
        aria-label="Open user menu"
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
        >
          {initials}
        </div>

        {!compact && (
          <>
            <div className="text-left hidden sm:block max-w-[140px]">
              <p className="font-serif font-semibold text-xs leading-tight truncate" style={{ color: "var(--ink)" }}>
                {profile?.doctorName || "Account"}
              </p>
              <p className="text-xs leading-tight truncate" style={{ color: "var(--ink-muted)" }}>
                {profile?.hospitalName || roleLabel}
              </p>
            </div>
            <CaretDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ color: "var(--ink-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl z-[9999]"
          style={{
            background: "var(--sheet)",
            border: "1px solid var(--rule)",
            boxShadow: "0 16px 40px -4px rgba(23,20,16,0.18), 0 4px 16px -2px rgba(23,20,16,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Account Summary */}
          <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif font-semibold text-sm truncate" style={{ color: "var(--ink)" }}>
                  {profile?.doctorName || "Doctor Account"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>
                  {email}
                </p>
              </div>
            </div>
            <div
              className="mt-2.5 pt-2 flex items-center justify-between text-xs font-mono uppercase tracking-[0.08em]"
              style={{ borderTop: "1px solid rgba(23,20,16,0.07)", color: "var(--ink-muted)" }}
            >
              <span>{profile?.hospitalName || "No hospital set"}</span>
              <span style={{ color: "var(--ink-soft)" }}>{roleLabel}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-1.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-[var(--paper)]"
              style={{ color: "var(--ink-soft)" }}
            >
              <SquaresFour className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-[var(--paper)]"
              style={{ color: "var(--ink-soft)" }}
            >
              <User className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              Profile &amp; Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="p-1.5" style={{ borderTop: "1px solid var(--rule)" }}>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-[rgba(190,61,42,0.06)]"
              style={{ color: "var(--red)" }}
            >
              <SignOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
