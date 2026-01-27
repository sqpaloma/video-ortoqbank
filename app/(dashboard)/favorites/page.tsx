import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { getTenantSlugFromHostname } from "@/lib/tenant";
import { requireVideoAccess } from "@/lib/access";
import { FavoritesClientPage } from "./_components/favorites-client";

export default async function FavoritesPage() {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  // Get tenant from hostname
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  // Get auth token for Convex
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" }).catch(() => null);

  // User must be authenticated (requireVideoAccess already checks this)
  if (!userId) {
    return null;
  }

  // Fetch tenant from Convex
  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    token ? { token } : undefined,
  ).catch((error) => {
    console.error("[Favorites Page] Failed to fetch tenant:", error);
    return null;
  });

  if (!tenant) {
    console.error(
      `[Favorites Page] Tenant "${tenantSlug}" not found in database (host: ${host})`,
    );
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            Configuração não encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, verifique o endereço ou entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Fetch initial favorites (first page)
  const initialFavoritesResult = await fetchQuery(
    api.favorites.getUserFavoriteLessons,
    {
      tenantId: tenant._id,
      userId,
      paginationOpts: { numItems: 20, cursor: null },
    },
    token ? { token } : undefined,
  ).catch((error) => {
    console.error("[Favorites Page] Failed to fetch favorites:", error);
    return { page: [], isDone: true, continueCursor: undefined };
  });

  return (
    <FavoritesClientPage
      initialFavorites={initialFavoritesResult.page}
      initialIsDone={initialFavoritesResult.isDone}
      userId={userId}
      tenantId={tenant._id}
    />
  );
}
