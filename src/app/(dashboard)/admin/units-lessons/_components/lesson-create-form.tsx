"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/src/hooks/use-toast";
import { useErrorModal } from "@/src/hooks/use-error-modal";
import { ErrorModal } from "@/src/components/ui/error-modal";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/src/components/ui/image-upload";
import { useUser } from "@clerk/nextjs";
import {
  useTenantMutation,
  useTenantReady,
  useTenantAction,
} from "@/src/hooks/use-tenant-convex";
import {
  SearchIcon,
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoIcon,
} from "lucide-react";

interface LessonFormProps {
  units: Doc<"units">[];
  onSuccess?: () => void;
}

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

export function LessonForm({ units, onSuccess }: LessonFormProps) {
  const isTenantReady = useTenantReady();
  const { user } = useUser();
  const createLesson = useTenantMutation(api.lessons.create);
  const fetchVideoInfo = useAction(api.bunny.videos.fetchVideoInfo);
  const registerExistingVideo = useTenantAction(
    api.bunny.videos.registerExistingVideo,
  );
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [unitId, setUnitId] = useState<string>(units[0]?._id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Video ID field states
  const [videoIdInput, setVideoIdInput] = useState("");
  const [videoId, setVideoId] = useState<string | undefined>(undefined);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
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
      setVideoInfo(info as VideoInfo);
      setVideoId(extractedId);

      // Auto-populate fields if empty (excluding thumbnail - must be uploaded via ImageKit)
      if (!title && info.title) {
        setTitle(info.title);
      }
      if (!description && info.description) {
        setDescription(info.description);
      }


      toast({
        title: "✅ Vídeo encontrado!",
        description: info.existsInDatabase
          ? "Vídeo já está registrado no sistema."
          : "Vídeo encontrado no Bunny. Será registrado ao criar a aula.",
      });
    } catch (err) {
      setVideoInfo(null);
      setVideoId(undefined);
      showError(
        err instanceof Error ? err.message : "Erro ao buscar vídeo",
        "Erro ao buscar vídeo",
      );
    } finally {
      setIsFetchingVideo(false);
    }
  };

  const handleClearVideo = () => {
    setVideoIdInput("");
    setVideoId(undefined);
    setVideoInfo(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTenantReady) {
      showError("Tenant not loaded", "Error");
      return;
    }
    setIsSubmitting(true);

    try {
      if (!unitId) {
        showError(
          "Selecione uma unidade antes de criar a aula",
          "Unidade não selecionada",
        );
        setIsSubmitting(false);
        return;
      }

      // If there's a video that's not in our database yet, register it first
      if (videoId && videoInfo && !videoInfo.existsInDatabase && user?.id) {
        await registerExistingVideo({
          videoId: videoId,
          createdBy: user.id,
        });
      }

      await createLesson({
        unitId: unitId as Id<"units">,
        title,
        description,
        videoId: videoId,
        thumbnailUrl: thumbnailUrl || undefined,
        durationSeconds: videoInfo?.duration || 0,
        isPublished: false,
      });

      toast({
        title: "✅ Aula criada com sucesso!",
        description: `${title} foi criada.`,
      });

      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setVideoIdInput("");
      setVideoId(undefined);
      setVideoInfo(null);
      setUnitId(units[0]?._id || "");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao criar aula",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-lesson-unit">Unidade *</Label>
          <Select
            value={unitId}
            onValueChange={setUnitId}
            disabled={isSubmitting}
          >
            <SelectTrigger id="create-lesson-unit">
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
          <Label htmlFor="create-lesson-title">Título *</Label>
          <Input
            id="create-lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
            placeholder="Nome da aula"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-lesson-description">Descrição *</Label>
          <Textarea
            id="create-lesson-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            required
            rows={4}
            placeholder="Descrição da aula"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-lesson-thumbnail">Thumbnail (Opcional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Imagem que aparecerá nos favoritos, vídeos relacionados e
            visualizações recentes
          </p>
          <ImageUpload
            id="create-lesson-thumbnail"
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            onRemove={() => setThumbnailUrl("")}
            disabled={isSubmitting}
            folder="/lessons"
            onUploadStateChange={setIsUploadingImage}
          />
        </div>

        {/* Video ID Field */}
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="create-lesson-video-id">
            <VideoIcon className="h-4 w-4 inline mr-2" />
            Vincular Vídeo Existente (Opcional)
          </Label>
          <p className="text-xs text-muted-foreground">
            Cole o ID ou URL do vídeo do Bunny para vincular automaticamente. O
            sistema buscará as informações do vídeo.
          </p>
          <div className="flex gap-2">
            <Input
              id="create-lesson-video-id"
              value={videoIdInput}
              onChange={(e) => setVideoIdInput(e.target.value)}
              disabled={isSubmitting || isFetchingVideo}
              placeholder="Ex: abc123-def456... ou URL do vídeo"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchVideoInfo}
              disabled={isSubmitting || isFetchingVideo || !videoIdInput.trim()}
            >
              {isFetchingVideo ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Video Info Display */}
          {videoInfo && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${videoInfo.status === "ready"
                ? "bg-green-50 border-green-200"
                : videoInfo.status === "processing"
                  ? "bg-yellow-50 border-yellow-200"
                  : videoInfo.status === "failed"
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
            >
              {videoInfo.status === "ready" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : videoInfo.status === "failed" ? (
                <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : (
                <LoaderIcon className="h-5 w-5 text-yellow-600 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {videoInfo.title || "Sem título"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  {videoInfo.status === "ready"
                    ? "Pronto"
                    : videoInfo.status === "processing"
                      ? "Processando"
                      : videoInfo.status === "uploading"
                        ? "Enviando"
                        : "Falhou"}
                  {videoInfo.duration &&
                    ` • ${Math.floor(videoInfo.duration / 60)}min`}
                  {!videoInfo.existsInDatabase && " • Novo no sistema"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearVideo}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !unitId || isUploadingImage}
          >
            {isSubmitting
              ? "Criando..."
              : isUploadingImage
                ? "Aguarde o upload..."
                : "Criar Aula"}
          </Button>
        </div>
      </form>

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </>
  );
}
