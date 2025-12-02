'use client';

import { useQuery } from 'convex/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';

interface AccessControlProps {
  children: React.ReactNode;
}

/**
 * Access Control Component
 * Checks if user has paid and hasActiveYearAccess before allowing access to content
 * Redirects to /access-pending if user doesn't have access
 */
export function AccessControl({ children }: AccessControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const accessDetails = useQuery(api.userAccess.getVideoAccessDetails);

  useEffect(() => {
    // Skip check while loading
    if (accessDetails === undefined) {
      return;
    }

    // Allow access to admin pages regardless (admin has its own protection)
    if (pathname?.startsWith('/admin')) {
      return;
    }

    // Allow access to profile page (users need to see their status)
    if (pathname === '/profile') {
      return;
    }

    // If user doesn't have access, redirect to access-pending page
    if (!accessDetails.hasAccess) {
      router.push('/access-pending');
    }
  }, [accessDetails, router, pathname]);

  // Show loading while checking access
  if (accessDetails === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Allow admin routes and profile to pass through
  if (pathname?.startsWith('/admin') || pathname === '/profile') {
    return <>{children}</>;
  }

  // If user doesn't have access, show nothing (will redirect)
  if (!accessDetails.hasAccess) {
    return null;
  }

  // User has access, show content
  return <>{children}</>;
}

