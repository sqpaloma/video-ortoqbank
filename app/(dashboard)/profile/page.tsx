import ProfileInner from "./_components/profile-inner";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  // Obter token de autenticação para Convex
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" }).catch(() => null);

  // Pré-carregar dados no servidor para melhorar performance
  const preloadedUserData = await preloadQuery(
    api.users.current,
    {},
    token ? { token } : undefined
  );
  
  const preloadedContentStats = await preloadQuery(
    api.contentStats.get,
    {},
    token ? { token } : undefined
  );

  // Pré-carregar queries que precisam de userId (se autenticado)
  const preloadedGlobalProgress = userId
    ? await preloadQuery(
        api.progress.getGlobalProgress,
        { userId },
        token ? { token } : undefined
      )
    : null;

  const preloadedCompletedCount = userId
    ? await preloadQuery(
        api.progress.getCompletedPublishedLessonsCount,
        { userId },
        token ? { token } : undefined
      )
    : null;

  const preloadedViewedCount = userId
    ? await preloadQuery(
        api.recentViews.getUniqueViewedLessonsCount,
        { userId },
        token ? { token } : undefined
      )
    : null;

  const preloadedRecentViews = userId
    ? await preloadQuery(
        api.recentViews.getRecentViewsWithDetails,
        { userId, limit: 3 },
        token ? { token } : undefined
      )
    : null;

  return (
    <ProfileInner
      preloadedUserData={preloadedUserData}
      preloadedContentStats={preloadedContentStats}
      preloadedGlobalProgress={preloadedGlobalProgress}
      preloadedCompletedCount={preloadedCompletedCount}
      preloadedViewedCount={preloadedViewedCount}
      preloadedRecentViews={preloadedRecentViews}
    />
  );
}

