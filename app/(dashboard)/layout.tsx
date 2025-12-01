'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


import { SessionProvider } from '@/components/providers/session-provider';
import { TermsProvider } from '@/components/providers/terms-provider';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MobileBottomNav } from '@/components/nav/mobile-bottom-nav';


export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isLoading, isAuthenticated } = useCurrentUser();
  
  

  // Redirect to sign-in if not authenticated using Next.js navigation
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsRedirecting(true);
      router.replace('/sign-in');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while user is being stored
  if (isLoading) {
    return (
      <div className="min-h-screen `bg-gradient-to-br` from-brand-blue/10 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show loading placeholder while redirecting to sign-in
  if (!isAuthenticated || isRedirecting) {
    return null;
  }

  return (
    <SidebarProvider>
      <SessionProvider>
        {/* Sidebar visible only on md and larger screens */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <main className="w-full `bg-gradient-to-b` from-slate-50 via-brand-blue/10 to-indigo-100 min-h-screen">
          {/* Sidebar trigger visible only on md and larger screens */}
          <div className="hidden md:block">
            <SidebarTrigger />
          </div>
          
          {/* Add padding-bottom for mobile nav, remove for desktop */}
          <div className="mx-auto max-w-5xl px-2 pb-20 pt-4 md:px-6 md:py-6">
            <TermsProvider>{children}</TermsProvider>
          </div>
        </main>
        
        {/* Mobile bottom nav visible only on screens smaller than md */}
        <MobileBottomNav />
      </SessionProvider>
    </SidebarProvider>
  );
}
