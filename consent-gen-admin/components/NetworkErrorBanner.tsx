"use client";

export function NetworkErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <div className="max-w-md">
        <h3 className="text-lg font-bold text-foreground mb-2">Database Connection Failed</h3>
        <p className="text-xs text-muted leading-relaxed mb-1">{message}</p>
        <p className="text-xs text-muted/60 leading-relaxed">
          This is usually caused by an ISP or DNS-level block on{" "}
          <code className="font-mono text-amber-400/80">*.supabase.co</code>.
          <br />
          Enable <strong>Secure DNS</strong> in your browser settings (Cloudflare or Google DNS) or use a VPN.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
      >
        Retry Connection
      </button>
    </div>
  );
}
