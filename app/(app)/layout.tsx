import Link from "next/link";
import { headers } from "next/headers";
import { Shield, LayoutDashboard, FileText, LayoutTemplate, History, User } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import ChatAssistant from "@/components/ChatAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nq-bg flex font-inter">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-nq-border bg-white sticky top-0 h-screen">
        <div className="p-6 border-b border-nq-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}
            >
              <Shield className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <span className="text-[17px] font-bold text-nq-text tracking-tight">ConsentGen</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>

        <div className="p-4 border-t border-nq-border">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-nq-purple-soft flex items-center justify-center">
              <User className="w-4 h-4 text-nq-purple" />
            </div>
            <div className="text-xs font-semibold text-nq-text-muted">Doctor Profile</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative pb-20 md:pb-0 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-nq-border bg-white sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-nq-text">ConsentGen</span>
          </Link>
          <div className="w-7 h-7 rounded-full bg-nq-purple-soft flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-nq-purple" />
          </div>
        </header>

        <div className="h-full">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-nq-border z-50 px-2 pb-safe pt-1">
        <SidebarNav isMobile />
      </nav>

      {/* Floating Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
