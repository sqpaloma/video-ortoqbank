import ProfileInner from "./_components/profile-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { requireVideoAccess } from "@/lib/access";

export default async function ProfilePage() {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  // Obter token de autenticação para Convex
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" }).catch((error) => {
    console.error("Failed to fetch Convex auth token:", error);
    return null;
  });

  // Pré-carregar queries que precisam de userId (se autenticado)
  const preloadedRecentViews = userId
    ? await preloadQuery(
        api.recentViews.getRecentViewsWithDetails,
        { userId, limit: 3 },
        token ? { token } : undefined,
      ).catch((error) => {
        console.error("Failed to preload recent views:", error);
        return null;
      })
    : null;

  // Return JSX outside of try-catch to follow React rules
  return <ProfileInner preloadedRecentViews={preloadedRecentViews} />;
}
