import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

/** The one "back to list" control used by every detail page (same position, size and style everywhere). */
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="no-print inline-flex items-center gap-2 py-1.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-70"
      style={{ color: "var(--ink)" }}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" weight="bold" />
      <span>{label}</span>
    </Link>
  );
}
