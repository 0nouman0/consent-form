import { ShieldCheck, User } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SidebarNav from "@/components/SidebarNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-body" style={{ background: "hsl(var(--muted))" }}>

      {/* Desktop collapsible sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 w-full relative pb-20 md:pb-0 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" weight="fill" />
            </div>
            <span className="font-bold text-foreground">ConsentGen</span>
          </Link>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <User className="w-3.5 h-3.5 text-primary" weight="bold" />
          </div>
        </header>

        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 px-2 pb-safe pt-1">
        <SidebarNav isMobile />
      </nav>
    </div>
  );
}
