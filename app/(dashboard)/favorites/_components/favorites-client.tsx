"use client";

import { useMemo } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { FavoritesSection } from "./favorites-section";
import { useTenantPaginatedQuery } from "@/hooks/use-tenant-convex";
import { Video } from "./favorites-section";
import { Id } from "@/convex/_generated/dataModel";

// Generic types to handle Convex response flexibility
interface FavoriteLessonData {
  _id: string;
  lesson: {
    _id: string;
    title: string;
    description: string;
    durationSeconds: number;
    thumbnailUrl?: string | null;
  };
  unit: {
    title: string;
  };
  category: {
    _id: string;
    title: string;
  };
}

interface FavoritesClientPageProps {
  initialFavorites: FavoriteLessonData[];
  initialIsDone: boolean;
  userId: string;
  tenantId: Id<"tenants">;
}

// Transform favorite data to Video interface
function transformFavoriteToVideo(fav: FavoriteLessonData): Video {
  return {
    _id: fav._id, // favorite ID (for key)
    lessonId: fav.lesson._id, // lesson ID (for navigation and mutations)
    title: fav.lesson.title,
    description: fav.lesson.description,
    duration: formatDuration(fav.lesson.durationSeconds),
    level: "Básico" as const, // Default, can be updated if data exists
    categoryName: fav.category.title,
    subthemeName: fav.unit.title,
    categoryId: fav.category._id,
    thumbnailUrl: fav.lesson.thumbnailUrl || undefined,
  };
}

// Helper to format duration from seconds
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FavoritesClientPage({
  initialFavorites,
  initialIsDone,
  userId,
  tenantId,
}: FavoritesClientPageProps) {
  const { state } = useSidebar();

  // Use paginated query for real-time updates and load more
  const { results, status, loadMore } = useTenantPaginatedQuery(
    api.favorites.getUserFavoriteLessons,
    { userId },
    { initialNumItems: 20 },
  );

  // Determine if client query has taken over
  // usePaginatedQuery always returns results as an array (never undefined)
  // On initial load, results is empty with status === "LoadingFirstPage"
  // We only consider client ready after it finishes loading the first page
  const isClientReady = status !== "LoadingFirstPage";

  // Combine server-fetched data with client data
  // After hydration, the client query takes over with real-time updates
  const favoritesData = useMemo(() => {
    // If client query has finished loading first page, use those results (they're reactive)
    if (isClientReady) {
      return results as FavoriteLessonData[];
    }
    // Otherwise, use initial server data
    return initialFavorites;
  }, [isClientReady, results, initialFavorites]);

  // Compute effective status for pagination
  // During hydration, derive status from server's initialIsDone
  // After client takes over, use client's status
  const effectiveStatus = useMemo(() => {
    if (isClientReady) {
      return status;
    }
    // During hydration, map server state to client status type
    return initialIsDone ? "Exhausted" : "CanLoadMore";
  }, [isClientReady, status, initialIsDone]) as
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted";

  // Transform to Video interface
  const favorites = useMemo(
    () => favoritesData.map(transformFavoriteToVideo),
    [favoritesData],
  );

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-brand-blue hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Favoritos</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-24 md:pb-6">
        <FavoritesSection
          favorites={favorites}
          userId={userId}
          tenantId={tenantId}
          status={effectiveStatus}
          onLoadMore={() => loadMore(10)}
        />
      </div>
    </div>
  );
}
