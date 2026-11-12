"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#F4F1E9", color: "#171410", fontFamily: "sans-serif", margin: 0, padding: "2rem" }}>
        <div style={{ maxWidth: "500px", margin: "4rem auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>System Notice</h2>
          <p style={{ color: "#7A7466", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {error?.message || "An unexpected error occurred while loading this view."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "#171410",
              color: "#FCFBF7",
              border: "none",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
