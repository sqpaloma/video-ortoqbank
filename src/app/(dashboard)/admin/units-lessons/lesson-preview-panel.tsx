"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { LoaderIcon, PlayCircleIcon, PencilIcon } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { VideoPlayerWithWatermark } from "@/src/components/bunny/video-player-with-watermark";
import { getSignedEmbedUrl } from "@/src/app/actions/bunny";

interface LessonPreviewPanelProps {
    lesson: Doc<"lessons">;
    savedData: {
        title: string;
        description: string;
        videoId?: string;
    };
    onEdit: () => void;
}

export function LessonPreviewPanel({
    lesson,
    savedData,
    onEdit,
}: LessonPreviewPanelProps) {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!savedData.videoId) {
            setEmbedUrl(null);
            return;
        }

        const fetchEmbedUrl = async () => {
            setLoading(true);
            try {
                const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
                if (libraryId) {
                    const result = await getSignedEmbedUrl(savedData.videoId!, libraryId);
                    setEmbedUrl(result.embedUrl);
                }
            } catch (error) {
                console.error("Error fetching embed URL for preview:", error);
                setEmbedUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchEmbedUrl();
    }, [savedData.videoId]);

    return (
        <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-2">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Preview</h2>

                </div>

                {/* Video Player */}
                <div className="mb-6">
                    {savedData.videoId ? (
                        loading ? (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <LoaderIcon className="h-10 w-10 animate-spin text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm">
                                        Carregando preview do vídeo...
                                    </p>
                                </div>
                            </div>
                        ) : embedUrl ? (
                            <VideoPlayerWithWatermark
                                embedUrl={embedUrl}
                                watermarkId="PREVIEW"
                            />
                        ) : (
                            <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
                                <p className="text-red-600 text-sm">
                                    Erro ao carregar preview do vídeo
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <PlayCircleIcon className="h-16 w-16 text-white/50 mx-auto mb-2" />
                                <p className="text-white/70 text-sm">
                                    Nenhum vídeo vinculado a esta aula
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lesson Info (styled like user page) */}
                <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-3">{savedData.title}</h3>
                    <p className="text-base text-muted-foreground">
                        {savedData.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onEdit}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Continuar Editando
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
