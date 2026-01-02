"use client";

import { SessionProvider } from "@/components/providers/session-provider";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileBottomNav } from "@/components/nav/mobile-bottom-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <SessionProvider>
        {/* Sidebar visible only on md and larger screens */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <main className="w-full `bg-gradient-to-b` from-slate-50 via-brand-blue/10 to-indigo-100 min-h-screen">
          {children}
        </main>

        {/* Mobile bottom nav visible only on screens smaller than md */}
        <MobileBottomNav />
      </SessionProvider>
    </SidebarProvider>
  );
}
