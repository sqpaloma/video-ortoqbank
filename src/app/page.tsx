import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/convex/_generated/api";
import Header from "@/src/app/_components/header";
import Pricing from "@/src/app/_components/pricing";
import { getAuthToken } from "@/src/lib/auth";
import {
  extractSubdomain,
  isValidTenantSlug,
  isPlainLocalhost,
} from "@/src/lib/tenant";
export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  // Extract subdomain from hostname
  const subdomain = extractSubdomain(host);
  // If no valid tenant subdomain, redirect to main site
  // Exception: allow plain localhost for development
  if (!subdomain || !isValidTenantSlug(subdomain)) {
    if (!isPlainLocalhost(host)) {
      redirect("https://ortoclub.com");
    }
    // For localhost without subdomain, show a message or redirect
    redirect("https://ortoclub.com");
  }

  // Check if user is logged in
  const { userId } = await auth();

  // If user is logged in, check if they have access to this tenant
  if (userId) {
    const token = await getAuthToken();

    if (token) {
      // Get tenant from subdomain
      const tenant = await fetchQuery(
        api.tenants.getBySlug,
        { slug: subdomain },
        { token },
      ).catch(() => null);

      if (tenant) {
        // Check user's access in this specific tenant
        const accessCheck = await fetchQuery(
          api.tenants.checkUserAccess,
          { tenantId: tenant._id },
          { token },
        ).catch(() => null);

        // Only redirect if user has access to this tenant
        if (accessCheck?.hasAccess) {
          redirect("/categories");
        }
      }
    }
  }

  // Show pricing page for:
  // - Users not logged in
  // - Users logged in but without access to this tenant
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
