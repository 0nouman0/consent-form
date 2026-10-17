"use client";

import { Warning } from "@phosphor-icons/react";

export function NetworkErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center font-body">
      <div
        className="w-14 h-14 rounded-md flex items-center justify-center"
        style={{ backgroundColor: "rgba(190, 61, 42, 0.1)", border: "1px solid rgba(190, 61, 42, 0.2)" }}
      >
        <Warning className="w-7 h-7" weight="fill" style={{ color: "var(--red)" }} />
      </div>

      <div
        className="max-w-md p-6 rounded-md"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
      >
        <h3 className="font-serif text-lg font-bold mb-2 tracking-tight" style={{ color: "var(--ink)" }}>
          Database Connection Issue
        </h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--ink-muted)" }}>
          {message}
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          This is typically caused by an ISP or network restriction on{" "}
          <code className="font-mono px-1 py-0.5 rounded bg-black/5" style={{ color: "var(--ink)" }}>
            *.supabase.co
          </code>
          . Ensure Secure DNS (Cloudflare 1.1.1.1 or Google DNS) is enabled.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-md text-xs font-medium cursor-pointer transition-opacity hover:opacity-90"
        style={{
          backgroundColor: "var(--ink)",
          color: "var(--sheet)",
        }}
      >
        Retry Connection
      </button>
    </div>
  );
}
