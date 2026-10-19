"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/fetchWithTimeout";
import {
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users,
  Coins,
  ShieldCheck,
  Crown,
} from "@phosphor-icons/react";

export default function UsersList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await withTimeout(
        supabase.from("profiles").select("*").order("doctor_name", { ascending: true })
      );
      if (data) setUsers(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading users list:", err);
      setError(err?.message || "Failed to connect to the database.");
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Key user aggregates
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.is_active !== false).length;
  const deactivatedCount = users.filter((u) => u.is_active === false).length;
  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (user.doctor_name || "").toLowerCase().includes(q) ||
        (user.hospital_name || "").toLowerCase().includes(q) ||
        (user.doctor_registration_no || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active !== false) ||
        (statusFilter === "deactivated" && user.is_active === false);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "doctor" && (user.role === "doctor" || !user.role)) ||
        (roleFilter === "admin" && user.role === "admin");

      const userPlan = (user.subscription_tier || "free").toLowerCase();
      const matchesPlan =
        planFilter === "all" || userPlan === planFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole && matchesPlan;
    });
  }, [users, searchTerm, statusFilter, roleFilter, planFilter]);

  if (loading || error) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Doctors & Accounts" />
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
              />
              <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                Loading Doctor Directory...
              </p>
            </div>
          ) : (
            <NetworkErrorBanner message={error!} onRetry={fetchUsers} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body transition-colors duration-150" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title="Doctors & Accounts" subtitle="Practitioner Management & KYC Directory" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Top Page Banner */}
          <div
            className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>
                Registry
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Doctor <span style={{ color: "var(--red)" }}>accounts</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
                Verify practitioner registration numbers, audit circulating credits, and manage account statuses.
              </p>
            </div>
          </div>

          {/* Top KPI Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-dark-bg)" }}
              >
                <Users weight="duotone" className="w-5 h-5" style={{ color: "var(--badge-dark-text)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Registered Doctors
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  {totalUsers}
                </p>
              </div>
            </div>

            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <CheckCircle weight="duotone" className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Active Accounts
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5 text-emerald-500">
                  {activeCount}
                </p>
              </div>
            </div>

            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <XCircle weight="duotone" className="w-5 h-5" style={{ color: "var(--red)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Deactivated
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--red)" }}>
                  {deactivatedCount}
                </p>
              </div>
            </div>

            <div
              className="rounded-md p-5 flex items-center gap-4 transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: "var(--badge-light-bg)", border: "1px solid var(--rule)" }}
              >
                <Coins weight="duotone" className="w-5 h-5" style={{ color: "var(--ink)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                  Circulating Credits
                </p>
                <p className="font-serif text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink)" }}>
                  {totalCredits}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div
            className="rounded-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              <input
                type="text"
                placeholder="Search by doctor, hospital, or reg no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-md text-xs outline-none transition-all"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
              >
                <Funnel className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--input-text)" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="deactivated">Deactivated Only</option>
                </select>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--input-text)" }}
                >
                  <option value="all">All Roles</option>
                  <option value="doctor">Doctors Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em]"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
              >
                <Crown className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs cursor-pointer font-sans"
                  style={{ color: "var(--input-text)" }}
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free Tier</option>
                  <option value="starter">Starter</option>
                  <option value="standard">Standard</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div
            className="rounded-md overflow-hidden transition-colors"
            style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Doctor Name</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Hospital / Institution</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em]">Registration No.</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Plan</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Credits</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-center">Status</th>
                    <th className="py-3.5 px-6 font-mono uppercase tracking-[0.08em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const planTier = (user.subscription_tier || "free").toLowerCase();
                    const subStatus = (user.subscription_status || "active").toLowerCase();

                    return (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--rule-soft)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--row-hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td className="py-4 px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center font-serif font-bold text-xs shrink-0 transition-colors"
                            style={{
                              backgroundColor: "var(--badge-light-bg)",
                              border: "1px solid var(--rule)",
                              color: "var(--ink)",
                            }}
                          >
                            {user.doctor_name?.charAt(0).toUpperCase() || "D"}
                          </div>
                          <div>
                            <p className="font-serif font-bold text-sm leading-tight transition-colors" style={{ color: "var(--ink)" }}>
                              {user.doctor_name || "Doctor Name Unset"}
                            </p>
                            <span
                              className="inline-block text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-1"
                              style={{
                                backgroundColor: user.role === "admin" ? "var(--badge-dark-bg)" : "var(--badge-light-bg)",
                                color: user.role === "admin" ? "var(--badge-dark-text)" : "var(--ink)",
                                border: "1px solid var(--rule)",
                              }}
                            >
                              {user.role || "doctor"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-medium" style={{ color: "var(--ink-soft)" }}>
                        {user.hospital_name || <span className="italic opacity-60">Unassigned</span>}
                      </td>

                      <td className="py-4 px-6 font-mono" style={{ color: "var(--ink-muted)" }}>
                        {user.doctor_registration_no || <span className="italic opacity-50">N/A</span>}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] uppercase font-bold tracking-wider"
                            style={{
                              backgroundColor:
                                planTier === "enterprise"
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : planTier === "professional"
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : planTier === "standard"
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : planTier === "starter"
                                  ? "rgba(59, 130, 246, 0.15)"
                                  : "var(--badge-light-bg)",
                              color:
                                planTier === "enterprise"
                                  ? "#d97706"
                                  : planTier === "professional"
                                  ? "#7c3aed"
                                  : planTier === "standard"
                                  ? "#059669"
                                  : planTier === "starter"
                                  ? "#2563eb"
                                  : "var(--ink-muted)",
                              border: `1px solid ${
                                planTier === "enterprise"
                                  ? "rgba(245, 158, 11, 0.3)"
                                  : planTier === "professional"
                                  ? "rgba(139, 92, 246, 0.3)"
                                  : planTier === "standard"
                                  ? "rgba(16, 185, 129, 0.3)"
                                  : planTier === "starter"
                                  ? "rgba(59, 130, 246, 0.3)"
                                  : "var(--rule)"
                              }`,
                            }}
                          >
                            <Crown weight={planTier !== "free" ? "fill" : "regular"} className="w-3 h-3" />
                            <span>{planTier}</span>
                          </span>
                          {subStatus !== "active" && (
                            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                              {subStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-center text-sm" style={{ color: "var(--ink)" }}>
                        {user.credits ?? 0}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-[0.08em] font-semibold"
                          style={{
                            backgroundColor: user.is_active !== false ? "var(--status-success-bg)" : "var(--status-fail-bg)",
                            color: user.is_active !== false ? "var(--status-success-text)" : "var(--status-fail-text)",
                            border: `1px solid ${user.is_active !== false ? "var(--status-success-border)" : "var(--status-fail-border)"}`,
                          }}
                        >
                          {user.is_active !== false ? (
                            <>
                              <CheckCircle weight="fill" className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle weight="fill" className="w-3 h-3" /> Deactivated
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/users/${user.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-85"
                          style={{
                            backgroundColor: "var(--btn-primary-bg)",
                            color: "var(--btn-primary-text)",
                          }}
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" weight="bold" />
                        </Link>
                      </td>
                    </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs" style={{ color: "var(--ink-muted)" }}>
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-serif font-bold text-sm" style={{ color: "var(--ink)" }}>No doctors found matching filters</p>
                        <p className="text-xs mt-1">Try resetting your search query or status filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
