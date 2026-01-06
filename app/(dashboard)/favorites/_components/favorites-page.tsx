"use client";

import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { WatchAlsoVideos } from "./watch-also-videos";

interface Video {
  _id: string;
  title: string;
  description: string;
  duration: string;
  level: "Básico" | "Intermediário" | "Avançado";
  categoryName: string;
  subthemeName: string;
  categoryId?: string;
  thumbnailUrl?: string;
}

export function FavoritesInner({
  initialFavorites,
  watchAlsoVideos,
}: {
  initialFavorites: Video[];
  watchAlsoVideos: Video[];
}) {
  const router = useRouter();
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 3;
  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const { state } = useSidebar();

  // Mock pagination
  const totalPages = Math.ceil(initialFavorites.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const displayFavorites = initialFavorites.slice(startIndex, endIndex);

  const handleVideoClick = (video: Video) => {
    // Navigate to the units page for this category with the specific lesson
    if (video.categoryId) {
      router.push(`/units/${video.categoryId}?lesson=${video._id}`);
    }
  };

  const handleRemoveFavorite = async (
    e: React.MouseEvent,
    lessonId: string,
  ) => {
    e.stopPropagation();
    if (!user?.id) return;

    try {
      await removeFavorite({
        userId: user.id,
        lessonId: lessonId as Id<"lessons">,
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeftIcon size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Aulas Favoritas
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 pb-24 md:pb-6">
        {/* Favorites Section */}
        <section className="mb-2">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Meus Favoritos
            </h2>
          </div>

          {displayFavorites.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {displayFavorites.map((video) => (
                  <Card
                    key={video._id}
                    onClick={() => handleVideoClick(video)}
                    className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group relative overflow-hidden p-0"
                  >
                    <div className="w-full h-48 bg-linear-to-b from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative rounded-t-lg overflow-hidden">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <PlayCircleIcon size={40} className="text-primary/30" />
                      )}
                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white z-10"
                        onClick={(e) => handleRemoveFavorite(e, video._id)}
                      >
                        <StarIcon
                          size={18}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      </Button>
                    </div>

                    <div className="px-3 pt-2 pb-3">
                      <CardTitle className="text-sm font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </CardTitle>

                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {video.description}
                      </p>

                      <div className="text-xs text-gray-500 mb-3">
                        <p className="font-medium">{video.categoryName}</p>
                        <p>{video.subthemeName}</p>
                      </div>

                      <Button
                        className="w-full bg-blue-brand hover:bg-blue-brand-dark text-white"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(video);
                        }}
                      >
                        Assistir
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="border-gray-300"
                  >
                    <ChevronLeftIcon size={20} className="mr-2" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="border-gray-300"
                  >
                    Próxima
                    <ChevronRightIcon size={20} className="ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <StarIcon size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Você ainda não tem vídeos favoritos.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Adicione vídeos aos favoritos para encontrá-los facilmente aqui.
              </p>
            </div>
          )}
        </section>
        <WatchAlsoVideos watchAlsoVideos={watchAlsoVideos} />
      </div>
    </div>
  );
}
