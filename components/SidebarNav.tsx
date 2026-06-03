"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, LayoutTemplate, History, User } from "lucide-react";

export default function SidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/generate", label: "Generate Consent", icon: FileText },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/history", label: "History", icon: History },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (isMobile) {
    return (
      <div className="flex items-center justify-around w-full">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? "text-nq-purple"
                  : "text-nq-text-muted hover:text-nq-text"
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? "bg-nq-purple-soft" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1.5">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              isActive
                ? "bg-nq-purple text-white shadow-md shadow-nq-purple/20"
                : "text-nq-text-muted hover:bg-slate-50 hover:text-nq-text"
            }`}
          >
            <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-nq-text-light"}`} />
            <span className="text-sm">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
