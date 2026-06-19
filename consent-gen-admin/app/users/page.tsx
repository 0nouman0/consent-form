"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { MagnifyingGlass, Funnel, CheckCircle, XCircle, ArrowSquareOut } from "@phosphor-icons/react";

export default function UsersList() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'deactivated'

  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("doctor_name", { ascending: true });

        if (data) {
          setUsers(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading users list:", err);
        setLoading(false);
      }
    }

    fetchUsers();
  }, [supabase]);

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const nameMatch = (user.doctor_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (user.hospital_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "active") {
      return nameMatch && user.is_active !== false;
    }
    if (statusFilter === "deactivated") {
      return nameMatch && user.is_active === false;
    }
    return nameMatch;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title="Doctors & Accounts" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by doctor or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-card-border outline-none focus:border-amber-500 transition-all text-foreground"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Funnel className="w-4 h-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 px-4 rounded-xl text-xs bg-white/5 border border-card-border outline-none text-foreground focus:border-amber-500"
              >
                <option value="all" className="bg-background">All Statuses</option>
                <option value="active" className="bg-background">Active Only</option>
                <option value="deactivated" className="bg-background">Deactivated Only</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="py-3 font-semibold">Doctor / Account Name</th>
                    <th className="py-3 font-semibold">Hospital Name</th>
                    <th className="py-3 font-semibold">Registration No.</th>
                    <th className="py-3 font-semibold text-center">Credits</th>
                    <th className="py-3 font-semibold text-center">Status</th>
                    <th className="py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="py-4 font-semibold text-foreground">
                        <div>
                          <p className="font-semibold text-sm">{user.doctor_name || "N/A"}</p>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            user.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/15"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                          }`}>
                            {user.role || "doctor"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-muted">{user.hospital_name || "N/A"}</td>
                      <td className="py-4 font-mono text-muted">{user.doctor_registration_no || "N/A"}</td>
                      <td className="py-4 font-mono font-bold text-center text-amber-500">{user.credits ?? 0}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.is_active !== false
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {user.is_active !== false ? (
                            <><CheckCircle weight="fill" /> Active</>
                          ) : (
                            <><XCircle weight="fill" /> Blocked</>
                          )}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/users/${user.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold transition-all border border-amber-500/15 cursor-pointer"
                        >
                          <span>Manage</span>
                          <ArrowSquareOut className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        No registered doctors found matching filters.
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
