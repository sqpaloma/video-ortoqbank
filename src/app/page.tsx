import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import Header from '@/src/app/_components/header';
import Pricing from '@/src/app/_components/pricing';
import {
  extractSubdomain,
  isValidTenantSlug,
  isPlainLocalhost,
} from '@/src/lib/tenant';

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(host);

  // If no valid tenant subdomain, redirect to main site
  // Exception: allow plain localhost for development
  if (!subdomain || !isValidTenantSlug(subdomain)) {
    if (!isPlainLocalhost(host)) {
      redirect('https://ortoclub.com');
    }
    // For localhost without subdomain, show a message or redirect
    redirect('https://ortoclub.com');
  }

  // If user is already logged in, redirect to admin categories
  const { userId } = await auth();
  if (userId) {
    redirect('/admin/categories');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main>
        <Pricing />
      </main>
      <footer className="bg-brand-blue mt-auto py-4 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 OrtoQBank. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}