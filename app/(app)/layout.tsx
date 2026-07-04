import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SidebarNav from "@/components/SidebarNav";
import AppHeader from "@/components/AppHeader";
import UserMenu from "@/components/UserMenu";
import OfflineBanner from "@/components/OfflineBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: "var(--paper)" }}>
      <OfflineBanner />

      {/* Desktop collapsible sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 w-full relative pb-20 md:pb-0 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* AppHeader (Desktop top header) */}
        <AppHeader />

        {/* Mobile Header */}
        <header
          className="md:hidden fixed top-3 left-3 right-3 z-50 flex items-center justify-between px-4 py-2 rounded-md"
          style={{
            background: "var(--sheet)",
            boxShadow: "0 2px 16px rgba(23,20,16,0.08)",
            border: "1px solid var(--rule)",
          }}
        >
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <ShieldCheck className="w-3.5 h-3.5" weight="fill" style={{ color: "var(--sheet)" }} />
            </div>
            <span className="font-serif font-semibold text-sm tracking-tight" style={{ color: "var(--ink)" }}>
              ConsentGen
            </span>
          </Link>
          <UserMenu compact />
        </header>

        <div className="flex-1 flex flex-col min-h-0 min-w-0 pt-16 md:pt-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe pt-1"
        style={{ background: "rgba(252,251,247,0.98)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--rule)" }}
      >
        <SidebarNav isMobile />
      </nav>
    </div>
  );
}
