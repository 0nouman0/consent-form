"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour, FileText, Columns, ClockCounterClockwise,
  ChatCircleText, User,
} from "@phosphor-icons/react/dist/ssr";

const links = [
  { href: "/dashboard",  label: "Dashboard",        icon: SquaresFour           },
  { href: "/generate",   label: "Generate Consent",  icon: FileText              },
  { href: "/templates",  label: "Templates",         icon: Columns               },
  { href: "/history",    label: "History",           icon: ClockCounterClockwise },
  { href: "/chat",       label: "Chat",              icon: ChatCircleText        },
  { href: "/profile",    label: "Profile",           icon: User                  },
];

export default function SidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  if (isMobile) {
    return (
      <div className="flex items-center justify-around w-full">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                <Icon weight={isActive ? "fill" : "regular"} style={{ width: 20, height: 20 }} />
              </div>
              <span className="text-[10px] font-bold">{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${
              isActive
                ? "gradient-bg text-white shadow-btn/20 shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}>
            <Icon
              weight={isActive ? "fill" : "duotone"}
              style={{ width: 20, height: 20 }}
              className={isActive ? "text-white" : "text-muted-foreground"}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
