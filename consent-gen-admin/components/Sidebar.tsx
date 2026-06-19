"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import {
  Layout,
  Users,
  FileText,
  CreditCard,
  ShieldCheck,
  SignOut,
  Sun,
  Moon,
  Coins
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Layout },
  { href: "/users", label: "Users", icon: Users },
  { href: "/generations", label: "Generations", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/audit-log", label: "Admin Logs", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col glass-card border-y-0 border-l-0 border-r border-card-border h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-card-border">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
          <Coins className="w-5 h-5 text-amber-500 animate-pulse" weight="fill" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight tracking-tight flex items-center gap-1.5">
            Luffy <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-500/15 text-amber-500 rounded-md">Ops</span>
          </h2>
          <p className="text-[10px] text-muted leading-none mt-1">ConsentGen Monitor</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20"
                  : "text-muted hover:text-foreground hover:bg-muted-bg border border-transparent"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="p-4 border-t border-card-border space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-muted-bg transition-all border border-card-border bg-transparent"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <><Moon className="w-4 h-4 text-amber-400" weight="fill" /> Dark Mode</>
            ) : (
              <><Sun className="w-4 h-4 text-amber-500" weight="fill" /> Light Mode</>
            )}
          </span>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted-bg text-muted border border-card-border">Toggle</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-red-500/10 bg-transparent"
        >
          <SignOut className="w-4 h-4" weight="bold" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
