"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon, ClockIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";

interface Video {
  _id: string;
  title: string;
  description: string;
  duration: string;
  level: "Básico" | "Intermediário" | "Avançado";
  categoryName: string;
  subthemeName: string;
  thumbnailUrl?: string;
  categoryId?: string;
}

export function FavoritesInner({ initialFavorites, watchAlsoVideos }: { initialFavorites: Video[]; watchAlsoVideos: Video[] }) {
  const router = useRouter();
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 3;
  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const addFavorite = useMutation(api.favorites.addFavorite);

  // Mock pagination
  const totalPages = Math.ceil(initialFavorites.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const displayFavorites = initialFavorites.slice(startIndex, endIndex);

  const handleVideoClick = (video: Video) => {
    // Navigate to the modules page for this category
    if (video.categoryId) {
      router.push(`/modules/${video.categoryId}`);
    }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, lessonId: string) => {
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

  const handleAddFavorite = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    
    try {
      await addFavorite({
        userId: user.id,
        lessonId: lessonId as Id<"lessons">,
      });
    } catch (error) {
      console.error("Error adding favorite:", error);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="p-6 flex items-center gap-4">
          <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeftIcon size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vídeos Favoritos</h1>
            <p className="text-sm text-gray-600">Seus vídeos salvos para assistir depois</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Favorites Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Meus Favoritos</h2>
          </div>

          {displayFavorites.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {displayFavorites.map((video) => (
                  <Card
                    key={video._id}
                    onClick={() => handleVideoClick(video)}
                    className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group relative overflow-hidden"
                  >
                    {/* Thumbnail/Background */}
                    <div className="w-full h-40 bg-linear-to-b from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <PlayCircleIcon size={48} className="text-primary/30" />
                      )}
                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        onClick={(e) => handleRemoveFavorite(e, video._id)}
                      >
                        <StarIcon size={20} className="text-yellow-500 fill-yellow-500" />
                      </Button>
                    </div>

                    <div className="p-4">
                      <CardTitle className="text-base font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </CardTitle>

                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {video.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                        <Badge className="text-xs" variant="default">
                          {video.level}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <ClockIcon size={14} />
                          <span>{video.duration}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        <p className="font-medium">{video.categoryName}</p>
                        <p>{video.subthemeName}</p>
                      </div>
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

        {/* Watch Also Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assista Também</h2>
            <p className="text-sm text-gray-600">
              Vídeos que você ainda não assistiu - comece novos cursos
            </p>
          </div>

          {watchAlsoVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchAlsoVideos.map((video) => (
                <Card
                  key={video._id}
                  onClick={() => handleVideoClick(video)}
                  className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group relative overflow-hidden"
                >
                  {/* Thumbnail/Background */}
                  <div className="w-full h-40 bg-linear-to-br from-blue-500/20 via-blue-400/10 to-blue-300/5 flex items-center justify-center relative">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <PlayCircleIcon size={48} className="text-blue-500/30" />
                    )}
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={(e) => handleAddFavorite(e, video._id)}
                    >
                        <StarIcon size={20} className="text-gray-400 hover:text-yellow-500" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Novo curso
                      </Badge>
                    </div>

                    <CardTitle className="text-base font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </CardTitle>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                      <Badge className="text-xs" variant="default">
                        {video.level}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <ClockIcon size={14} />
                        <span>{video.duration}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <p className="font-medium">{video.categoryName}</p>
                      <p>{video.subthemeName}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <PlayCircleIcon size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Não há novos vídeos disponíveis no momento.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Você já assistiu o primeiro vídeo de todos os subtemas!
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
