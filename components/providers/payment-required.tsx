'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { api } from '../../convex/_generated/api'; 

interface PaymentRequiredProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PaymentRequired({
  children,
  redirectTo = '/',
}: PaymentRequiredProps) {
  const router = useRouter();
  const isPaid = useQuery(api.userAccess.checkUserPaid);

  useEffect(() => {
    // Only redirect if we have a definitive result from the server
    if (isPaid === false) {
      router.push(`${redirectTo}?access=denied&reason=payment`);
    }
  }, [isPaid, router, redirectTo]);

  // Show nothing while we're checking payment status
  if (isPaid === undefined) {
    return <div>Verificando acesso...</div>;
  }

  // If not paid, show nothing (will redirect)
  if (isPaid === false) {
    return <></>;
  }

  // User has paid, show content
  return <>{children}</>;
}
