"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="max-w-md w-full p-8 rounded-md" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>Application Notice</h2>
        <p className="text-xs mb-6" style={{ color: "var(--ink-muted)" }}>
          {error?.message || "A network or rendering error occurred. Please try again."}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
