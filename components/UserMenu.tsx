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
  admin:  { label: "Admin",   color: "#7c3aed", icon: Crown      },
  doctor: { label: "Doctor",  color: "#0b0f1a", icon: Stethoscope },
  viewer: { label: "Viewer",  color: "#2563eb", icon: Eye        },
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
          border: "1px solid rgba(0,0,0,0.14)",
          background: "#f4f4f5",
        }}
        aria-label="Open user menu"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: "#0b0f1a" }}
        >
          {initials}
        </div>

        {/* Name + role — hidden in compact mode */}
        {!compact && (
          <>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#0b0f1a" }}>
                {profile?.doctorName || "Account"}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: roleInfo.color }}>
                {roleInfo.label}
              </p>
            </div>
            <CaretDown
              className="w-3 h-3 text-neutral-400 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl z-[9999]"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.09)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: "#0b0f1a" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "#0b0f1a" }}>
                  {profile?.doctorName || "Doctor"}
                </p>
                <p className="text-xs text-neutral-400 truncate">{email}</p>
                {profile?.hospitalName && (
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{profile.hospitalName}</p>
                )}
              </div>
            </div>

            {/* Role badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  color: roleInfo.color,
                  backgroundColor: `${roleInfo.color}12`,
                  border: `1px solid ${roleInfo.color}28`,
                }}
              >
                <RoleIcon weight="fill" className="w-3.5 h-3.5" />
                {roleInfo.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-50"
                style={{ border: "1px solid rgba(0,128,0,0.15)" }}>
                <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <ChartBar weight="duotone" className="w-4 h-4 text-neutral-500" />
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <User weight="duotone" className="w-4 h-4 text-neutral-500" />
              Profile & Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-2" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
