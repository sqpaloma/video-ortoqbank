import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { getTenantSlugFromHostname } from "@/lib/tenant";
import { CategoriesClientPage } from "./_components/categories-client";
import { fetchQuery } from "convex/nextjs";

export default async function CategoriesPage() {
  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  // Get auth token for Convex
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" }).catch(() => null);

  // Fetch tenantId from Convex
  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    token ? { token } : undefined,
  ).catch((error) => {
    console.error("[Categories Page] Failed to fetch tenant:", error);
    return null;
  });

  if (!tenant) {
    console.error(
      `[Categories Page] Tenant "${tenantSlug}" not found in database`,
    );
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            Tenant &quot;{tenantSlug}&quot; not found
          </p>
          <p className="text-sm text-muted-foreground">Host: {host}</p>
        </div>
      </div>
    );
  }

  // Preload categories (main data)
  const preloadedCategories = await preloadQuery(
    api.categories.listPublished,
    { tenantId: tenant._id },
    token ? { token } : undefined,
  );

  // Preload aggregate stats (only if user is authenticated)
  const preloadedContentStats = userId
    ? await preloadQuery(
        api.aggregate.getByTenant,
        { tenantId: tenant._id },
        token ? { token } : undefined,
      ).catch(() => null)
    : null;

  // Preload completed count (only if user is authenticated)
  const preloadedCompletedCount =
    userId && tenant._id
      ? await preloadQuery(
          api.progress.queries.getCompletedPublishedLessonsCount,
          { userId, tenantId: tenant._id },
          token ? { token } : undefined,
        ).catch(() => null)
      : null;

  return (
    <CategoriesClientPage
      preloadedCategories={preloadedCategories}
      preloadedContentStats={preloadedContentStats}
      preloadedCompletedCount={preloadedCompletedCount}
    />
  );
}
