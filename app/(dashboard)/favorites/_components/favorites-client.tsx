"use client";

import { useMemo } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { WatchAlsoVideos } from "./watch-also-videos";
import { FavoritesSection, Video } from "./favorites-section";
import { useTenantPaginatedQuery } from "@/hooks/use-tenant-convex";

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

interface WatchAlsoLessonData {
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
  initialWatchAlso: WatchAlsoLessonData[];
  userId: string;
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Transform favorite data to Video interface
function transformFavoriteToVideo(fav: FavoriteLessonData): Video {
  return {
    _id: fav.lesson._id,
    title: fav.lesson.title,
    description: fav.lesson.description,
    duration: formatDuration(fav.lesson.durationSeconds),
    level: "Básico" as const,
    categoryName: fav.category.title,
    subthemeName: fav.unit.title,
    categoryId: fav.category._id,
    thumbnailUrl: fav.lesson.thumbnailUrl ?? undefined,
  };
}

// Transform watch also data to Video interface
function transformWatchAlsoToVideo(item: WatchAlsoLessonData): Video {
  return {
    _id: item.lesson._id,
    title: item.lesson.title,
    description: item.lesson.description,
    duration: formatDuration(item.lesson.durationSeconds),
    level: "Básico" as const,
    categoryName: item.category.title,
    subthemeName: item.unit.title,
    categoryId: item.category._id,
    thumbnailUrl: item.lesson.thumbnailUrl ?? undefined,
  };
}

export function FavoritesClientPage({
  initialFavorites,
  initialWatchAlso,
  userId,
}: FavoritesClientPageProps) {
  const { state } = useSidebar();

  // Use paginated query for real-time updates and load more
  const { results, status, loadMore } = useTenantPaginatedQuery(
    api.favorites.getUserFavoriteLessons,
    { userId },
    { initialNumItems: 20 },
  );

  // Combine server-fetched data with client data
  // After hydration, the client query takes over with real-time updates
  const favoritesData = useMemo(() => {
    // If client query has returned results, use those (they're reactive)
    // Check for undefined/null to distinguish "not yet loaded" from "empty"
    if (results !== undefined) {
      return results as FavoriteLessonData[];
    }
    // Otherwise, use initial server data
    return initialFavorites;
  }, [results, initialFavorites]);

  // Transform to Video interface
  const favorites = useMemo(
    () => favoritesData.map(transformFavoriteToVideo),
    [favoritesData],
  );

  const watchAlso = useMemo(
    () => initialWatchAlso.map(transformWatchAlsoToVideo),
    [initialWatchAlso],
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

      <div className="max-w-7xl mx-auto p-8 pb-24 md:pb-6">
        <FavoritesSection
          favorites={favorites}
          userId={userId}
          status={status}
          onLoadMore={() => loadMore(10)}
        />

        <WatchAlsoVideos watchAlsoVideos={watchAlso} />
      </div>
    </div>
  );
}
