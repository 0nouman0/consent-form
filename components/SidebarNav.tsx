"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour, FileText, Columns, ClockCounterClockwise,
  ChatCircleText, BookOpen,
} from "@phosphor-icons/react/dist/ssr";

const links = [
  { href: "/dashboard",   label: "Dashboard",   icon: SquaresFour           },
  { href: "/generate",    label: "Generate",    icon: FileText              },
  { href: "/history",     label: "History",     icon: ClockCounterClockwise },
  { href: "/regulations", label: "Regulations", icon: BookOpen              },
  { href: "/chat",        label: "Chat",        icon: ChatCircleText        },
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
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-md transition-all">
              <div
                className="p-1.5 rounded-md transition-all"
                style={isActive ? { backgroundColor: "var(--ink)" } : {}}
              >
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  style={{ width: 18, height: 18, color: isActive ? "var(--sheet)" : "var(--ink-muted)" }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? "var(--ink)" : "var(--ink-muted)" }}
              >
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-all text-sm"
            style={{
              backgroundColor: isActive ? "var(--ink)" : undefined,
              color: isActive ? "var(--sheet)" : "var(--ink-muted)",
            }}>
            <Icon
              weight={isActive ? "fill" : "duotone"}
              style={{ width: 18, height: 18, color: isActive ? "var(--sheet)" : "var(--ink-muted)" }}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
