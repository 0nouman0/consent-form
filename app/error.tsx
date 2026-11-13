"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/analytics";

/** Shown when a page crashes. The failure is reported (scrubbed) so it can be fixed. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error.message || "Page error", error.stack, error.digest ? { reason: error.digest } : undefined);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", boxShadow: "var(--shadow-dashboard)" }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.14em] mb-2" style={{ color: "var(--red)" }}>
          Something went wrong
        </p>
        <h1 className="font-serif text-2xl font-semibold mb-2" style={{ color: "var(--ink)" }}>
          This page hit a problem
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
          We have been notified. Your saved consent forms and credits are safe. You can try again, or go back to your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
