import ProfilePageComponent from "./_components/profile-page";
import { api } from "@/convex/_generated/api";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { requireVideoAccess } from "@/lib/access";
import { headers } from "next/headers";
import { getTenantSlugFromHostname } from "@/lib/tenant";

export default async function ProfilePage() {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  // Obter token de autenticação para Convex
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" }).catch((error) => {
    console.error("Failed to fetch Convex auth token:", error);
    return null;
  });

  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  // Fetch tenantId from Convex
  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    token ? { token } : undefined,
  ).catch((error) => {
    console.error("Failed to fetch tenant:", error);
    return null;
  });

  const tenantId = tenant?._id;

  // Pré-carregar queries que precisam de userId e tenantId (se autenticado)
  const preloadedRecentViews =
    userId && tenantId
      ? await preloadQuery(
          api.recentViews.getRecentViewsWithDetails,
          { userId, tenantId, limit: 3 },
          token ? { token } : undefined,
        ).catch((error) => {
          console.error("Failed to preload recent views:", error);
          return null;
        })
      : null;

  // Return JSX outside of try-catch to follow React rules
  return <ProfilePageComponent preloadedRecentViews={preloadedRecentViews} />;
}
