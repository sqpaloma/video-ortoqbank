"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { SessionProvider } from "@/src/components/providers/session-provider";
import {
  TenantProvider,
  useTenant,
} from "@/src/components/providers/tenant-provider";
import { AppSidebar } from "@/src/components/sidebar/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { MobileBottomNav } from "@/src/components/nav/mobile-bottom-nav";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useDashboardProtection } from "@/src/hooks/useVideoProtection";
import { api } from "@/convex/_generated/api";

// Inner component that uses useSidebar - must be inside SidebarProvider
function SidebarContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  return (
    <>
      {/* Sidebar visible only on md and larger screens */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <main className="via-brand-blue/10 min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-100">
        {/* Sidebar trigger - follows sidebar position */}
        <SidebarTrigger
          className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-black hover:text-black hover:bg-gray-100 transition-[left] duration-200 ease-linear z-10 ${
            state === "collapsed"
              ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
              : "left-[calc(var(--sidebar-width)+0.25rem)]"
          }`}
        />

        {/* Add padding-bottom for mobile nav, remove for desktop */}
        <div className="mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav visible only on screens smaller than md */}
      <MobileBottomNav />
    </>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading: isUserLoading, isAuthenticated } = useCurrentUser();
  const {
    isLoading: isTenantLoading,
    error: tenantError,
    tenantId,
  } = useTenant();

  // Enable dashboard-level protection (keyboard shortcuts blocking)
  useDashboardProtection();

  // Check user's access to this specific tenant
  const accessCheck = useQuery(
    api.tenants.checkUserAccess,
    tenantId ? { tenantId } : "skip",
  );

  const isAccessLoading = accessCheck === undefined && tenantId !== null;

  // Redirect to purchase if user doesn't have access to this tenant
  useEffect(() => {
    // Wait until all data is loaded
    if (isUserLoading || isTenantLoading || isAccessLoading) {
      return;
    }

    // If not authenticated, redirect to home (Clerk will handle sign-in)
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // If tenant is loaded and user doesn't have access, redirect to purchase
    if (tenantId && accessCheck && !accessCheck.hasAccess) {
      router.push("/purchase");
      return;
    }
  }, [
    isUserLoading,
    isTenantLoading,
    isAccessLoading,
    isAuthenticated,
    tenantId,
    accessCheck,
    router,
  ]);

  // Show loading while user, tenant, or access is being loaded
  if (isUserLoading || isTenantLoading || isAccessLoading) {
    return (
      <div className="from-brand-blue/10 flex min-h-screen items-center justify-center bg-gradient-to-br to-indigo-100">
        <div className="text-center">
          <div className="border-brand-blue mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show error if tenant not found
  if (tenantError) {
    return (
      <div className="from-brand-blue/10 flex min-h-screen items-center justify-center bg-gradient-to-br to-indigo-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-600">{tenantError}</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (user doesn't have access)
  if (tenantId && accessCheck && !accessCheck.hasAccess) {
    return (
      <div className="from-brand-blue/10 flex min-h-screen items-center justify-center bg-gradient-to-br to-indigo-100">
        <div className="text-center">
          <div className="border-brand-blue mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SessionProvider>
        <SidebarContent>{children}</SidebarContent>
      </SessionProvider>
    </SidebarProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <DashboardContent>{children}</DashboardContent>
    </TenantProvider>
  );
}
