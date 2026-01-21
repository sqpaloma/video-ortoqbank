"use client";

import { useState, useMemo } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlayCircleIcon,
    StarIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTenantMutation } from "@/hooks/use-tenant-convex";

export interface Video {
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

interface FavoritesSectionProps {
    favorites: Video[];
    userId: string;
    status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
    onLoadMore: () => void;
}

export function FavoritesSection({
    favorites,
    userId,
    status,
    onLoadMore,
}: FavoritesSectionProps) {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 3;

    const removeFavorite = useTenantMutation(api.favorites.removeFavorite);

    // Client-side pagination with derived safe page
    const totalPages = Math.ceil(favorites.length / pageSize);
    const maxPage = Math.max(0, totalPages - 1);
    const safePage = useMemo(() => Math.min(currentPage, maxPage), [currentPage, maxPage]);
    const startIndex = safePage * pageSize;
    const endIndex = startIndex + pageSize;
    const displayFavorites = favorites.slice(startIndex, endIndex);


    const handleVideoClick = (video: Video) => {
        if (video.categoryId) {
            router.push(`/units/${video.categoryId}?lesson=${video._id}`);
        }
    };

    const handleRemoveFavorite = async (
        e: React.MouseEvent,
        lessonId: string,
    ) => {
        e.stopPropagation();

        try {
            await removeFavorite({
                userId,
                lessonId: lessonId as Id<"lessons">,
            });
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };

    const handleNextPage = () => {
        if (safePage < totalPages - 1) {
            setCurrentPage(safePage + 1);
        }
    };

    const handlePrevPage = () => {
        if (safePage > 0) {
            setCurrentPage(safePage - 1);
        }
    };

    return (
        <section className="mb-2">
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Meus Favoritos</h2>
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
                                <div className="w-full h-48 bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative rounded-t-lg overflow-hidden">
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
                            </Card>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handlePrevPage}
                                disabled={safePage === 0}
                                className="border-gray-300"
                            >
                                <ChevronLeftIcon size={20} className="mr-2" />
                                Anterior
                            </Button>
                            <span className="text-sm text-gray-600">
                                Página {safePage + 1} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={handleNextPage}
                                disabled={safePage >= totalPages - 1}
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
                    <p className="text-gray-500">Você ainda não tem vídeos favoritos.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Adicione vídeos aos favoritos para encontrá-los facilmente aqui.
                    </p>
                </div>
            )}

            {/* Load More Button */}
            {status === "CanLoadMore" && (
                <div className="flex items-center justify-center mt-6">
                    <Button
                        onClick={onLoadMore}
                        variant="outline"
                        size="lg"
                        className="min-w-[200px]"
                    >
                        Carregar mais favoritos
                    </Button>
                </div>
            )}

            {status === "LoadingMore" && (
                <div className="flex items-center justify-center mt-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando...</p>
                    </div>
                </div>
            )}
        </section>
    );
}

