"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour, FileText, Columns, ClockCounterClockwise,
  ChatCircleText,
} from "@phosphor-icons/react/dist/ssr";

const links = [
  { href: "/dashboard",  label: "Dashboard",  icon: SquaresFour           },
  { href: "/generate",   label: "Generate",   icon: FileText              },
  { href: "/templates",  label: "Templates",  icon: Columns               },
  { href: "/history",    label: "History",    icon: ClockCounterClockwise },
  { href: "/chat",       label: "Chat",       icon: ChatCircleText        },
];

export default function SidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  if (isMobile) {
    return (
      <div className="flex items-center justify-around w-full py-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all">
              <div
                className="p-1.5 rounded-xl transition-all"
                style={isActive ? { backgroundColor: "#0b0f1a" } : {}}
              >
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  style={{ width: 18, height: 18, color: isActive ? "#fff" : "#9ca3af" }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-neutral-800" : "text-neutral-400"}`}>
                {link.label}
              </span>
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
                ? "text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            }`}
            style={isActive ? { backgroundColor: "#0b0f1a" } : {}}>
            <Icon
              weight={isActive ? "fill" : "duotone"}
              style={{ width: 18, height: 18 }}
              className={isActive ? "text-white" : "text-neutral-400"}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
