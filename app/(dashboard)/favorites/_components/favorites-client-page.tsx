"use client";

import { FavoritesInner } from "./favorites-page";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function FavoritesClientPage() {
  const { user } = useUser();

  // Get user's favorites with full lesson details
  const favoritesData = useQuery(
    api.favorites.getUserFavoriteLessons,
    user?.id ? { userId: user.id } : "skip",
  );

  // Get some random lessons for "Watch Also" section
  // (lessons that are published but not favorited by the user)
  const allPublishedLessons = useQuery(api.lessons.list);

  if (
    !user ||
    favoritesData === undefined ||
    allPublishedLessons === undefined
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Transform favorites data to match the Video interface
  const favorites = favoritesData.map((fav) => ({
    _id: fav.lesson._id,
    title: fav.lesson.title,
    description: fav.lesson.description,
    duration: formatDuration(fav.lesson.durationSeconds),
    level: "Básico" as const, // Could be added to lesson schema later
    categoryName: fav.category.title,
    subthemeName: fav.unit.title,
    thumbnailUrl: fav.lesson.thumbnailUrl,
    categoryId: fav.category._id,
  }));

  // Get lessons that user hasn't favorited (for "Watch Also" section)
  const favoritedIds = new Set(favorites.map((f) => f._id));
  const watchAlso = allPublishedLessons
    .filter((lesson) => lesson.isPublished && !favoritedIds.has(lesson._id))
    .slice(0, 6)
    .map((lesson) => ({
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      duration: formatDuration(lesson.durationSeconds),
      level: "Básico" as const,
      categoryName: "Categoria", // Will need to fetch if needed
      subthemeName: "Módulo",
      thumbnailUrl: lesson.thumbnailUrl,
    }));

  return (
    <FavoritesInner initialFavorites={favorites} watchAlsoVideos={watchAlso} />
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
