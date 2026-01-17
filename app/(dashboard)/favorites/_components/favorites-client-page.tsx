"use client";

import { FavoritesInner } from "./favorites-page";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function FavoritesClientPage() {
  const { user } = useUser();

  // Get user's favorites with full lesson details (PAGINATED)
  const { results, status, loadMore } = usePaginatedQuery(
    api.favorites.getUserFavoriteLessons,
    user?.id ? { userId: user.id } : "skip",
    { initialNumItems: 20 },
  );

  // Get some random lessons with full details for "Watch Also" section
  const watchAlsoData = useQuery(
    api.favorites.getWatchAlsoLessons,
    user?.id ? { userId: user.id, limit: 6 } : "skip",
  );

  if (!user || status === "LoadingFirstPage" || watchAlsoData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const favoritesData = results;

  // Transform favorites data to match the Video interface
  const favorites = favoritesData.map((fav) => ({
    _id: fav.lesson._id,
    title: fav.lesson.title,
    description: fav.lesson.description,
    duration: formatDuration(fav.lesson.durationSeconds),
    level: "Básico" as const, // Could be added to lesson schema later
    categoryName: fav.category.title,
    subthemeName: fav.unit.title,
    categoryId: fav.category._id,
    thumbnailUrl: fav.lesson.thumbnailUrl,
  }));

  // Transform watch also data
  const watchAlso = watchAlsoData.map((item) => ({
    _id: item.lesson._id,
    title: item.lesson.title,
    description: item.lesson.description,
    duration: formatDuration(item.lesson.durationSeconds),
    level: "Básico" as const,
    categoryName: item.category.title,
    subthemeName: item.unit.title,
    categoryId: item.category._id,
    thumbnailUrl: item.lesson.thumbnailUrl,
  }));

  return (
    <div className="space-y-6">
      <FavoritesInner
        initialFavorites={favorites}
        watchAlsoVideos={watchAlso}
      />

      {/* Load More Button */}
      {status === "CanLoadMore" && (
        <div className="flex items-center justify-center pb-8">
          <Button
            onClick={() => loadMore(10)}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Carregar mais 10 favoritos
          </Button>
        </div>
      )}

      {status === "LoadingMore" && (
        <div className="flex items-center justify-center pb-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
