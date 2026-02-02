import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getTenantSlugFromHostname } from "@/src/lib/tenant";
import { getAuthToken } from "@/src/lib/auth";

// Force dynamic rendering for admin routes (requires authentication)
export const dynamic = "force-dynamic";

/**
 * Server-side admin layout with tenant-specific role-based authorization
 * This layout enforces that only tenant admins can access admin routes
 *
 * SECURITY: This runs on the server and validates the user's role
 * in the SPECIFIC TENANT before rendering any admin content
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Redirect if not authenticated
  if (!userId) {
    redirect("/categories");
  }

  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  // Get Convex token using the proper server-side auth helper

  const token = await getAuthToken();

  // Token is required for authenticated Convex queries
  if (!token) {
    redirect("/categories");
  }

  // Get tenant ID from slug (public query, but passing token anyway)

  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    { token },
  ).catch(() => {
    return null;
  });

  if (!tenant) {
    redirect("/categories");
  }

  const accessCheck = await fetchQuery(
    api.tenants.checkUserAccess,
    { tenantId: tenant._id },
    { token },
  ).catch(() => {
    return null;
  });

  // User must have access AND be an admin (or superadmin) in this tenant
  const isAdmin =
    accessCheck?.hasAccess &&
    (accessCheck.role === "admin" || accessCheck.isSuperAdmin);

  if (!isAdmin) {
    redirect("/categories");
  }

  // Only render content if user is authenticated AND is a tenant admin
  return <div className="space-y-6">{children}</div>;
}
