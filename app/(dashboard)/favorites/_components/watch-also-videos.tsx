"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircleIcon, StarIcon, ClockIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

interface WatchAlsoVideosProps {
  watchAlsoVideos: Video[];
}

export function WatchAlsoVideos({ watchAlsoVideos }: WatchAlsoVideosProps) {
  const router = useRouter();
  const { user } = useUser();
  const addFavorite = useMutation(api.favorites.addFavorite);

  const handleVideoClick = (video: Video) => {
    if (video.categoryId) {
      router.push(`/units/${video.categoryId}`);
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
                  <StarIcon
                    size={20}
                    className="text-gray-400 hover:text-yellow-500"
                  />
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
  );
}
