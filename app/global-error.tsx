"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/analytics";

/** Last-resort screen when the root layout itself fails. Self-contained: it cannot rely on the app's CSS. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error.message || "Application error", error.stack, error.digest ? { reason: error.digest } : undefined);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F4F1E9", color: "#171410" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center", background: "#FCFBF7", border: "1px solid rgba(23,20,16,0.15)", borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>ConsentGen hit a problem</h1>
            <p style={{ fontSize: 14, color: "#7A7466", margin: "0 0 20px" }}>
              We have been notified. Your saved consent forms and credits are safe.
            </p>
            <button
              onClick={reset}
              style={{ background: "#171410", color: "#FCFBF7", border: 0, borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
