"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircleIcon, StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useTenantMutation } from "@/hooks/use-tenant-convex";

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

interface WatchAlsoVideosProps {
  watchAlsoVideos: Video[];
}

export function WatchAlsoVideos({ watchAlsoVideos }: WatchAlsoVideosProps) {
  const router = useRouter();
  const { user } = useUser();
  const addFavorite = useTenantMutation(api.favorites.addFavorite);

  const handleVideoClick = (video: Video) => {
    if (video.categoryId) {
      router.push(`/units/${video.categoryId}?lesson=${video._id}`);
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

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Assista Também
        </h2>
      </div>

      {watchAlsoVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchAlsoVideos.slice(0, 3).map((video) => (
            <Card
              key={video._id}
              onClick={() => handleVideoClick(video)}
              className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group relative overflow-hidden p-0"
            >
              <div className="w-full h-48 bg-gradient-to-br from-blue-brand/20 via-blue-brand/10 to-blue-brand/5 flex items-center justify-center relative rounded-t-lg overflow-hidden">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <PlayCircleIcon size={40} className="text-blue-brand/30" />
                )}
                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white z-10"
                  onClick={(e) => handleAddFavorite(e, video._id)}
                >
                  <StarIcon
                    size={18}
                    className="text-gray-400 hover:text-yellow-500"
                  />
                </Button>
              </div>

              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className="text-xs py-0 bg-blue-brand/10 text-blue-brand hover:bg-blue-brand/10">
                    Novo curso
                  </Badge>
                </div>

                <CardTitle className="text-sm font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </CardTitle>

                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {video.description}
                </p>

                <div className="text-xs text-gray-500 mb-3">
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {video.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-3"></div>

                  <Button
                    className="w-full bg-blue-brand hover:bg-blue-brand/80 text-white"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(video);
                    }}
                  >
                    Assistir
                  </Button>
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
  );
}
