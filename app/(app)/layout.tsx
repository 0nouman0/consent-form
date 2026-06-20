import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SidebarNav from "@/components/SidebarNav";
import AppHeader from "@/components/AppHeader";
import UserMenu from "@/components/UserMenu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: "#ededed" }}>

      {/* Desktop collapsible sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 w-full relative pb-20 md:pb-0 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* AppHeader (Desktop top header) */}
        <AppHeader />

        {/* Mobile Header */}
        <header
          className="md:hidden fixed top-3 left-3 right-3 z-50 flex items-center justify-between px-4 py-2 rounded-full"
          style={{
            background: "#ffffff",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" weight="fill" />
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "#0b0f1a" }}>
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
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-black/[0.08] z-50 px-2 pb-safe pt-1"
        style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)" }}
      >
        <SidebarNav isMobile />
      </nav>
    </div>
  );
}
