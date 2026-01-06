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
import { useBunnyUpload } from "@/hooks/use-bunny-upload";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { LessonEditPanelProps } from "./types";
import { useUser } from "@clerk/nextjs";
import { ImageUpload } from "@/components/ui/image-upload";

export function LessonEditPanel({
  lesson,
  units,
  onSave,
  onCancel,
}: LessonEditPanelProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();
  const updateLesson = useMutation(api.lessons.update);
  const { uploadVideo, isUploading } = useBunnyUpload();

  const [unitId, setUnitId] = useState<string>(lesson.unitId);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [thumbnailUrl, setThumbnailUrl] = useState(lesson.thumbnailUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Video upload states
  const [showUploader, setShowUploader] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(lesson.videoId);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVideo = () => {
    showConfirm(
      "Tem certeza que deseja remover o vídeo desta aula?",
      async () => {
        try {
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
          toast({
            title: "Sucesso",
            description: "Vídeo removido da aula com sucesso!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao remover vídeo",
            "Erro ao remover vídeo",
          );
        }
      },
      "Remover vídeo",
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        showError(
          "Por favor, selecione um arquivo de vídeo",
          "Arquivo inválido",
        );
        return;
      }

      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showError(
          "O arquivo é muito grande (máximo 5GB)",
          "Arquivo muito grande",
        );
        return;
      }

      setUploadFile(selectedFile);
    }
  };

  const handleUploadVideo = async () => {
    // Validar apenas arquivo e usuário
    if (!uploadFile) {
      showError("Selecione um arquivo de vídeo", "Arquivo não selecionado");
      return;
    }

    if (!user?.id) {
      showError("Usuário não autenticado", "Erro de autenticação");
      return;
    }

    try {
      // Upload para o Bunny
      const { videoId } = await uploadVideo(
        uploadFile,
        title || lesson.title,
        user.id,
      );

      // Atualiza o videoId local (o usuário salvará a edição depois)
      setCurrentVideoId(videoId);
      setShowUploader(false);
      setUploadFile(null);

      toast({
        title: "✅ Vídeo enviado!",
        description:
          "Vídeo pronto! Clique em 'Salvar Alterações' para confirmar.",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro no upload",
      );
    }
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
                disabled={isSubmitting || isUploading}
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
                disabled={isSubmitting || isUploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-description">Descrição *</Label>
              <Textarea
                id="edit-lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting || isUploading}
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
                disabled={isSubmitting || isUploading}
                folder="/lessons"
                onUploadStateChange={setIsUploadingImage}
              />
            </div>

            {/* Video Management Section */}
            <div className="space-y-3 pt-4 ">
              <Label>Gerenciar Vídeo</Label>
              {currentVideoId && !showUploader ? (
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
              ) : showUploader ? (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Upload de Vídeo</h4>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground">
                        {uploadFile.name} (
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleUploadVideo}
                      disabled={isUploading || !uploadFile}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Fazer Upload
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowUploader(false);
                        setUploadFile(null);
                      }}
                      disabled={isUploading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploader(true)}
                  className="w-full"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Fazer Upload de Vídeo
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isUploading || isUploadingImage}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || isUploadingImage}
            >
              {isUploadingImage
                ? "Aguarde o upload da imagem..."
                : isUploading
                  ? "Aguarde o upload do vídeo..."
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
