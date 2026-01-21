"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  Trash2Icon,
  SearchIcon,
  LinkIcon,
} from "lucide-react";
import { LessonEditPanelProps } from "./types";
import { useUser } from "@clerk/nextjs";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  useTenantMutation,
  useTenantReady,
  useTenantAction,
} from "@/hooks/use-tenant-convex";

interface VideoInfo {
  videoId: string;
  libraryId: string;
  title: string;
  description: string;
  status: "uploading" | "processing" | "ready" | "failed";
  hlsUrl?: string;
  duration?: number;
  thumbnailUrl: string;
  existsInDatabase: boolean;
}

export function LessonEditPanel({
  lesson,
  units,
  onSave,
  onCancel,
}: LessonEditPanelProps) {
  const isTenantReady = useTenantReady();
  const { user } = useUser();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();
  const updateLesson = useTenantMutation(api.lessons.update);
  const deleteVideoFromBunny = useAction(api.bunny.videos.deleteVideo);
  const fetchVideoInfo = useAction(api.bunny.videos.fetchVideoInfo);
  const registerExistingVideo = useTenantAction(
    api.bunny.videos.registerExistingVideo,
  );

  const [unitId, setUnitId] = useState<string>(lesson.unitId);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [thumbnailUrl, setThumbnailUrl] = useState(lesson.thumbnailUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Video states
  const [currentVideoId, setCurrentVideoId] = useState(lesson.videoId);
  const [linkedVideoDuration, setLinkedVideoDuration] = useState<
    number | undefined
  >(undefined);

  // Video ID lookup states
  const [showVideoIdInput, setShowVideoIdInput] = useState(false);
  const [videoIdInput, setVideoIdInput] = useState("");
  const [fetchedVideoInfo, setFetchedVideoInfo] = useState<VideoInfo | null>(
    null,
  );
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);

  // Extract video ID from URL or direct ID
  const extractVideoId = (input: string): string => {
    // If it's a URL, try to extract the video ID
    if (input.includes("/")) {
      // Match patterns like: /video-id/ or /video-id.m3u8 or video-id at end
      const match = input.match(/\/([a-f0-9-]{36})(?:\/|\.m3u8|$)/i);
      if (match) {
        return match[1];
      }
    }
    // Return as-is if it looks like a GUID
    return input.trim();
  };

  const handleFetchVideoInfo = async () => {
    if (!videoIdInput.trim()) {
      showError("Insira um ID ou URL do vídeo", "Campo vazio");
      return;
    }

    const extractedId = extractVideoId(videoIdInput);
    setIsFetchingVideo(true);

    try {
      const info = await fetchVideoInfo({ videoId: extractedId });
      setFetchedVideoInfo(info as VideoInfo);

      toast({
        title: "✅ Vídeo encontrado!",
        description: info.existsInDatabase
          ? "Vídeo já está registrado no sistema."
          : "Vídeo encontrado no Bunny. Será registrado ao salvar.",
      });
    } catch (err) {
      setFetchedVideoInfo(null);
      showError(
        err instanceof Error ? err.message : "Erro ao buscar vídeo",
        "Erro ao buscar vídeo",
      );
    } finally {
      setIsFetchingVideo(false);
    }
  };

  const handleLinkVideo = async () => {
    if (!fetchedVideoInfo || !user?.id) return;

    try {
      // If video is not in database, register it
      if (!fetchedVideoInfo.existsInDatabase) {
        await registerExistingVideo({
          videoId: fetchedVideoInfo.videoId,
          createdBy: user.id,
        });
      }

      setCurrentVideoId(fetchedVideoInfo.videoId);
      // Store the video duration to pass when saving
      setLinkedVideoDuration(fetchedVideoInfo.duration);
      setShowVideoIdInput(false);
      setVideoIdInput("");
      setFetchedVideoInfo(null);

      toast({
        title: "✅ Vídeo vinculado!",
        description: "Clique em 'Salvar Alterações' para confirmar.",
      });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Erro ao vincular vídeo",
        "Erro ao vincular vídeo",
      );
    }
  };

  const handleCancelVideoIdInput = () => {
    setShowVideoIdInput(false);
    setVideoIdInput("");
    setFetchedVideoInfo(null);
  };

  const video = useQuery(
    api.videos.getByVideoId,
    currentVideoId ? { videoId: currentVideoId } : "skip",
  );

  // Update form values when lesson changes
  useEffect(() => {
    console.log("📝 Carregando aula no editor:", {
      title: lesson.title,
      thumbnailUrl: lesson.thumbnailUrl,
    });

    setUnitId(lesson.unitId);
    setTitle(lesson.title);
    setDescription(lesson.description);
    setThumbnailUrl(lesson.thumbnailUrl || "");
    setCurrentVideoId(lesson.videoId);
    setLinkedVideoDuration(undefined);
    // Reset video ID input states
    setShowVideoIdInput(false);
    setVideoIdInput("");
    setFetchedVideoInfo(null);
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log("📸 Thumbnail URL ao salvar edição:", thumbnailUrl);

      await onSave({
        unitId: unitId as Id<"units">,
        title,
        description,
        videoId: currentVideoId,
        thumbnailUrl: thumbnailUrl || undefined,
        durationSeconds: linkedVideoDuration,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVideo = () => {
    showConfirm(
      "Tem certeza que deseja remover o vídeo desta aula? O vídeo será permanentemente excluído do sistema.",
      async () => {
        try {
          if (!isTenantReady) {
            throw new Error("Tenant not loaded");
          }

          // First, delete video from Bunny CDN and Convex database
          if (currentVideoId) {
            await deleteVideoFromBunny({ videoId: currentVideoId });
          }

          // Then, update the lesson to clear the videoId reference
          await updateLesson({
            id: lesson._id,
            unitId: unitId as Id<"units">,
            title,
            description,
            thumbnailUrl: thumbnailUrl || undefined,
            durationSeconds: lesson.durationSeconds,
            order_index: lesson.order_index,
            isPublished: lesson.isPublished,
            videoId: undefined,
          });

          setCurrentVideoId(undefined);
          setLinkedVideoDuration(undefined);
          toast({
            title: "Sucesso",
            description: "Vídeo excluído permanentemente com sucesso!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao remover vídeo",
            "Erro ao remover vídeo",
          );
        }
      },
      "Excluir vídeo",
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Editar Aula</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lesson-unit">Unidade *</Label>
              <Select
                value={unitId}
                onValueChange={setUnitId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="edit-lesson-unit">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit._id} value={unit._id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-title">Título *</Label>
              <Input
                id="edit-lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-description">Descrição *</Label>
              <Textarea
                id="edit-lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-thumbnail">
                Thumbnail (Opcional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Imagem que aparecerá nos favoritos, vídeos relacionados e
                visualizações recentes
              </p>
              <ImageUpload
                id="edit-lesson-thumbnail"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                onRemove={() => setThumbnailUrl("")}
                disabled={isSubmitting}
                folder="/lessons"
                onUploadStateChange={setIsUploadingImage}
              />
            </div>

            {/* Video Management Section */}
            <div className="space-y-3 pt-4 ">
              <Label>Gerenciar Vídeo</Label>
              {currentVideoId && !showVideoIdInput ? (
                <div className="space-y-2">
                  {video === undefined ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                      <LoaderIcon className="h-5 w-5 text-gray-600 animate-spin" />
                      <p className="text-sm text-gray-700">
                        Carregando informações do vídeo...
                      </p>
                    </div>
                  ) : video === null ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <XCircleIcon className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                          Vídeo não encontrado
                        </p>
                        <p className="text-xs text-yellow-700">
                          O vídeo foi deletado ou não existe mais no sistema
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                        title="Remover referência"
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Vídeo vinculado
                        </p>
                        <p className="text-xs text-green-700">
                          Status:{" "}
                          {video.status === "ready"
                            ? "Pronto"
                            : video.status === "processing"
                              ? "Processando"
                              : video.status}
                          {video.metadata?.duration &&
                            ` • ${Math.floor(video.metadata.duration / 60)}min`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : showVideoIdInput ? (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Vincular Vídeo por ID
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Cole o ID ou URL do vídeo do Bunny para vincular
                      automaticamente.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={videoIdInput}
                      onChange={(e) => setVideoIdInput(e.target.value)}
                      disabled={isFetchingVideo}
                      placeholder="Ex: abc123-def456... ou URL do vídeo"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFetchVideoInfo}
                      disabled={isFetchingVideo || !videoIdInput.trim()}
                    >
                      {isFetchingVideo ? (
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <SearchIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Fetched Video Info Display */}
                  {fetchedVideoInfo && (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        fetchedVideoInfo.status === "ready"
                          ? "bg-green-50 border-green-200"
                          : fetchedVideoInfo.status === "processing"
                            ? "bg-yellow-50 border-yellow-200"
                            : fetchedVideoInfo.status === "failed"
                              ? "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {fetchedVideoInfo.status === "ready" ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : fetchedVideoInfo.status === "failed" ? (
                        <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <LoaderIcon className="h-5 w-5 text-yellow-600 animate-spin flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fetchedVideoInfo.title || "Sem título"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status:{" "}
                          {fetchedVideoInfo.status === "ready"
                            ? "Pronto"
                            : fetchedVideoInfo.status === "processing"
                              ? "Processando"
                              : fetchedVideoInfo.status === "uploading"
                                ? "Enviando"
                                : "Falhou"}
                          {fetchedVideoInfo.duration &&
                            ` • ${Math.floor(fetchedVideoInfo.duration / 60)}min`}
                          {!fetchedVideoInfo.existsInDatabase &&
                            " • Novo no sistema"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {fetchedVideoInfo && (
                      <Button
                        type="button"
                        onClick={handleLinkVideo}
                        className="flex-1"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Vincular Este Vídeo
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelVideoIdInput}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVideoIdInput(true)}
                  className="w-full"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Vincular Vídeo por ID
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isUploadingImage}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {isUploadingImage
                ? "Aguarde o upload da imagem..."
                : isSubmitting
                  ? "Salvando..."
                  : "Salvar Alterações"}
            </Button>
          </div>
        </form>

        {/* Modals */}
        <ErrorModal
          open={error.isOpen}
          onOpenChange={hideError}
          title={error.title}
          message={error.message}
        />

        <ConfirmModal
          open={confirm.isOpen}
          onOpenChange={hideConfirm}
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
        />
      </CardContent>
    </Card>
  );
}
