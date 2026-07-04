"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User, SignOut, ChartBar, ShieldCheck,
  Crown, Eye, Stethoscope, CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import type { UserRole } from "@/lib/rbac";

interface ProfileInfo {
  doctorName: string;
  hospitalName: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin:  { label: "Admin",   color: "#BE3D2A", icon: Crown      },
  doctor: { label: "Doctor",  color: "#171410", icon: Stethoscope },
  viewer: { label: "Viewer",  color: "#7A7466", icon: Eye        },
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
      if (!user) { setLoading(false); return; }
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
  }, []);

  // Close on outside click
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
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
    );
  }

  if (!email) return null; // Not logged in — parent handles fallback

  const initials = profile?.doctorName
    ? profile.doctorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : email[0].toUpperCase();

  const roleInfo = ROLE_LABELS[profile?.role ?? "doctor"];
  const RoleIcon = roleInfo.icon;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full transition-all hover:opacity-90 focus:outline-none"
        style={{
          padding: compact ? "3px" : "3px 10px 3px 3px",
          border: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
        aria-label="Open user menu"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
        >
          {initials}
        </div>

        {/* Name + role — hidden in compact mode */}
        {!compact && (
          <>
            <div className="text-left hidden sm:block">
              <p className="font-serif font-semibold text-xs leading-tight" style={{ color: "var(--ink)" }}>
                {profile?.doctorName || "Account"}
              </p>
              <p className="text-[10px] leading-tight font-mono uppercase tracking-[0.06em]" style={{ color: roleInfo.color }}>
                {roleInfo.label}
              </p>
            </div>
            <CaretDown
              className="w-3 h-3 transition-transform"
              style={{ color: "var(--ink-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-md z-[9999]"
          style={{
            background: "var(--sheet)",
            border: "1px solid var(--rule)",
            boxShadow: "0 16px 48px rgba(23,20,16,0.14), 0 4px 12px rgba(23,20,16,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-serif font-semibold text-sm truncate" style={{ color: "var(--ink)" }}>
                  {profile?.doctorName || "Doctor"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>{email}</p>
                {profile?.hospitalName && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--ink-muted)" }}>{profile.hospitalName}</p>
                )}
              </div>
            </div>

            {/* Role badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                style={{
                  color: roleInfo.color,
                  backgroundColor: `${roleInfo.color}12`,
                  border: `1px solid ${roleInfo.color}28`,
                }}
              >
                <RoleIcon weight="fill" className="w-3.5 h-3.5" />
                {roleInfo.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] font-semibold"
                style={{ color: "#3f7a4e", backgroundColor: "rgba(63,122,78,0.08)", border: "1px solid rgba(63,122,78,0.2)" }}>
                <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-[var(--paper)]"
              style={{ color: "var(--ink-soft)" }}
            >
              <ChartBar weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-[var(--paper)]"
              style={{ color: "var(--ink-soft)" }}
            >
              <User weight="duotone" className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              Profile & Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-2" style={{ borderTop: "1px solid var(--rule)" }}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-[rgba(190,61,42,0.08)]"
              style={{ color: "var(--red)" }}
            >
              <SignOut weight="bold" className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
