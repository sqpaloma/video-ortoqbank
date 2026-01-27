"use client";

import { useState } from "react";
import { PlayCircle, StarIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";

export interface Video {
  _id: string; // favorite ID (for key)
  lessonId: string; // lesson ID (for navigation and mutations)
  title: string;
  description: string;
  duration: string;
  level: "Básico" | "Intermediário" | "Avançado";
  categoryName: string;
  subthemeName: string;
  categoryId?: string;
  thumbnailUrl?: string;
}

interface FavoritesSectionProps {
  favorites: Video[];
  userId: string;
  tenantId: Id<"tenants">;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  onLoadMore: () => void;
}

const ITEMS_PER_PAGE = 14; // 7 per column x 2 columns

export function FavoritesSection({
  favorites,
  userId,
  tenantId,
  status,
  onLoadMore,
}: FavoritesSectionProps) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const removeFavoriteMutation = useMutation(api.favorites.removeFavorite);

  const handleVideoClick = (video: Video) => {
    if (video.categoryId) {
      router.push(`/units/${video.categoryId}?lesson=${video.lessonId}`);
    }
  };

  const handleRemoveFavorite = async (
    e: React.MouseEvent,
    lessonId: string,
  ) => {
    e.stopPropagation();

    try {
      await removeFavoriteMutation({
        tenantId,
        userId,
        lessonId: lessonId as Id<"lessons">,
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleShowMore = () => {
    // If we need more data from the server, load it
    if (visibleCount >= favorites.length && status === "CanLoadMore") {
      onLoadMore();
    }
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Items to display (limited by visibleCount)
  const displayedFavorites = favorites.slice(0, visibleCount);

  // Check if there are more items to show
  const hasMoreToShow =
    visibleCount < favorites.length || status === "CanLoadMore";

  return (
    <>
      {favorites.length > 0 ? (
        <div>
          {/* Two column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-8">
            {displayedFavorites.map((video) => (
              <div
                key={video._id}
                onClick={() => handleVideoClick(video)}
                className="flex items-center gap-4 p-3 rounded-lg bg-white border hover:bg-white transition-colors cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded bg-muted flex items-center justify-center relative overflow-hidden shrink-0">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <PlayCircle className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-blue-600 group-hover:text-blue-700">
                    {video.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {video.categoryName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {video.subthemeName}
                  </p>
                </div>

                {/* Star / Trash button - star by default, trash on hover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 relative"
                  onClick={(e) => handleRemoveFavorite(e, video.lessonId)}
                  title="Remover dos favoritos"
                >
                  {/* Star - visible by default, hidden on hover */}
                  <StarIcon
                    size={18}
                    className="text-yellow-500 fill-yellow-500 group-hover:opacity-0 transition-opacity absolute"
                  />
                  {/* Trash - hidden by default, visible on hover */}
                  <Trash2Icon
                    size={18}
                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Button>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreToShow && (
            <div className="flex items-center justify-center mt-6">
              <Button
                onClick={handleShowMore}
                variant="outline"
                size="sm"
                disabled={status === "LoadingMore"}
              >
                {status === "LoadingMore" ? "Carregando..." : "Ver mais"}
              </Button>
            </div>
          )}

          {status === "LoadingMore" && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <StarIcon size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Você ainda não tem vídeos favoritos.</p>
          <p className="text-sm text-gray-400 mt-2">
            Adicione vídeos aos favoritos para encontrá-los facilmente aqui.
          </p>
          <Button
            variant="default"
            className="mt-4"
            onClick={() => router.push("/categories")}
          >
            Explorar Aulas
          </Button>
        </div>
      )}
    </>
  );
}
