"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { reportClientError, track } from "@/lib/analytics";

/** Mounted once in the root layout: page views, plus any uncaught browser error. Renders nothing. */
export default function Telemetry() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view");
  }, [pathname]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // A bare "Script error." (cross-origin script or browser extension) carries no information: not worth a report.
      if (!e.error && /^script error\.?$/i.test(e.message || "")) return;
      reportClientError(e.message || "Uncaught error", e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      reportClientError(r instanceof Error ? r.message : String(r ?? "Unhandled promise rejection"), r instanceof Error ? r.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
