import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getTenantSlugFromHostname } from "@/lib/tenant";

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
  const { userId, getToken } = await auth();

  // Redirect if not authenticated
  if (!userId) {
    redirect("/categories");
  }

  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  // Get Convex token
  const token = await getToken({ template: "convex" }).catch(() => null);

  // Token is required for authenticated Convex queries
  if (!token) {
    console.error("[Admin Layout] Failed to get Convex token");
    redirect("/categories");
  }

  // Get tenant ID from slug
  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    token ? { token } : undefined,
  ).catch(() => null);

  if (!tenant) {
    console.error(`[Admin Layout] Tenant "${tenantSlug}" not found`);
    redirect("/categories");
  }

  // Check user's access and role in this specific tenant
  const accessCheck = await fetchQuery(
    api.tenants.checkUserAccess,
    { tenantId: tenant._id },
    token ? { token } : undefined,
  ).catch(() => null);

  // User must have access AND be an admin (or superadmin) in this tenant
  const isAdmin =
    accessCheck?.hasAccess &&
    (accessCheck.role === "admin" || accessCheck.isSuperAdmin);

  if (!isAdmin) {
    console.log(
      `[Admin Layout] User ${userId} is not admin of tenant ${tenantSlug}`,
    );
    redirect("/categories");
  }

  // Only render content if user is authenticated AND is a tenant admin
  return <div className="space-y-6">{children}</div>;
}
