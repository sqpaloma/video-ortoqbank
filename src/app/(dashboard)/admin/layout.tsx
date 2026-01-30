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
  console.log("========== ADMIN LAYOUT DEBUG ==========");
  console.log("[Admin Layout] NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
  
  const { userId } = await auth();
  console.log("[Admin Layout] Clerk userId:", userId);

  // Redirect if not authenticated
  if (!userId) {
    console.log("[Admin Layout] ❌ No userId, redirecting to /categories");
    console.log("==========================================");
    redirect("/categories");
  }

  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);
  console.log("[Admin Layout] Host:", host, "-> tenantSlug:", tenantSlug);

  // Get Convex token using the proper server-side auth helper
  console.log("[Admin Layout] Calling getAuthToken()...");
  const token = await getAuthToken();

  // Token is required for authenticated Convex queries
  if (!token) {
    console.error("[Admin Layout] ❌ Failed to get Convex token, redirecting");
    console.log("==========================================");
    redirect("/categories");
  }
  console.log("[Admin Layout] ✅ Got token");

  // Get tenant ID from slug (public query, but passing token anyway)
  console.log("[Admin Layout] Calling fetchQuery(api.tenants.getBySlug)...");
  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    { token },
  ).catch((error) => {
    console.error("[Admin Layout] ❌ fetchQuery error:", error);
    return null;
  });

  if (!tenant) {
    console.error(`[Admin Layout] ❌ Tenant "${tenantSlug}" not found`);
    console.log("==========================================");
    redirect("/categories");
  }
  console.log("[Admin Layout] ✅ Tenant found:", tenant._id);

  // Check user's access and role in this specific tenant
  console.log("[Admin Layout] Calling fetchQuery(api.tenants.checkUserAccess)...");
  const accessCheck = await fetchQuery(
    api.tenants.checkUserAccess,
    { tenantId: tenant._id },
    { token },
  ).catch((error) => {
    console.error("[Admin Layout] ❌ checkUserAccess error:", error);
    return null;
  });
  console.log("[Admin Layout] accessCheck result:", accessCheck);

  // User must have access AND be an admin (or superadmin) in this tenant
  const isAdmin =
    accessCheck?.hasAccess &&
    (accessCheck.role === "admin" || accessCheck.isSuperAdmin);

  if (!isAdmin) {
    console.log(
      `[Admin Layout] ❌ User ${userId} is not admin of tenant ${tenantSlug}`,
    );
    console.log("==========================================");
    redirect("/categories");
  }

  console.log("[Admin Layout] ✅ User is admin, rendering content");
  console.log("==========================================");
  
  // Only render content if user is authenticated AND is a tenant admin
  return <div className="space-y-6">{children}</div>;
}
