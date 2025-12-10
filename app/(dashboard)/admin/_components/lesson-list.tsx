"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EditIcon, Trash2Icon, EyeIcon, EyeOffIcon, CheckCircleIcon, LoaderIcon, XCircleIcon, ClockIcon, RefreshCwIcon, UploadIcon, GripVerticalIcon, XIcon, CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Doc } from "@/convex/_generated/dataModel";
import AdminVideoUploader from "@/components/bunny/admin-video-uploader";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface LessonListProps {
  lessons: Doc<"lessons">[];
  onEditLesson?: (lesson: any) => void;
}

function EditLessonForm({
  lesson,
  modules,
  onSuccess,
  onCancel,
  onShowError,
  onShowConfirm,
}: {
  lesson: any;
  modules: any[];
  onSuccess: () => void;
  onCancel: () => void;
  onShowError: (message: string, title?: string) => void;
  onShowConfirm: (message: string, onConfirm: () => void | Promise<void>, title?: string) => void;
}) {
  const updateLesson = useMutation(api.lessons.update);
  const togglePublish = useMutation(api.lessons.togglePublish);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(lesson.videoId);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    moduleId: lesson.moduleId,
    title: lesson.title,
    description: lesson.description,
    lessonNumber: lesson.lessonNumber,
    tags: lesson.tags?.join(", ") || "",
  });

  const video = useQuery(
    api.videos.getByVideoId,
    currentVideoId ? { videoId: currentVideoId } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];

      await updateLesson({
        id: lesson._id,
        moduleId: formData.moduleId,
        title: formData.title,
        description: formData.description,
        durationSeconds: lesson.durationSeconds,
        order_index: lesson.order_index,
        lessonNumber: formData.lessonNumber,
        isPublished: lesson.isPublished,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: currentVideoId,
      });

      onSuccess();
    } catch (error) {
      onShowError(
        error instanceof Error ? error.message : "Erro ao atualizar aula",
        "Erro ao atualizar aula"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVideo = () => {
    onShowConfirm(
      "Tem certeza que deseja remover o vídeo desta aula?",
      async () => {
        try {
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];

      await updateLesson({
        id: lesson._id,
        moduleId: formData.moduleId,
        title: formData.title,
        description: formData.description,
        durationSeconds: lesson.durationSeconds,
        order_index: lesson.order_index,
        lessonNumber: formData.lessonNumber,
        isPublished: lesson.isPublished,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: undefined,
      });

      setCurrentVideoId(undefined);
      toast({
        title: "Sucesso",
        description: "Vídeo removido da aula com sucesso!",
      });
        } catch (error) {
          onShowError(
            error instanceof Error ? error.message : "Erro ao remover vídeo",
            "Erro ao remover vídeo"
          );
        }
      },
      "Remover vídeo"
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        onShowError("Por favor, selecione um arquivo de vídeo", "Arquivo inválido");
        return;
      }

      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        onShowError("O arquivo é muito grande (máximo 5GB)", "Arquivo muito grande");
        return;
      }

      setUploadFile(selectedFile);
    }
  };

  const handleUploadVideo = async () => {
    if (!uploadFile) {
      onShowError("Selecione um arquivo de vídeo", "Arquivo não selecionado");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create video in Bunny
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
        ".convex.cloud",
        ".convex.site"
      );

      const createResponse = await fetch(`${convexUrl}/bunny/create-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: "",
          isPrivate: true,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Falha ao criar vídeo");
      }

      const { videoId, libraryId } = await createResponse.json();

      // Step 2: Upload file via Server Action
      const uploadFormData = new FormData();
      uploadFormData.append("videoId", videoId);
      uploadFormData.append("libraryId", libraryId);
      uploadFormData.append("file", uploadFile);

      const { uploadVideoToBunny } = await import("@/app/actions/bunny");
      const uploadResult = await uploadVideoToBunny(uploadFormData);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Falha no upload");
      }

      // Step 3: Update lesson with videoId
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];

      await updateLesson({
        id: lesson._id,
        moduleId: formData.moduleId,
        title: formData.title,
        description: formData.description,
        durationSeconds: lesson.durationSeconds,
        order_index: lesson.order_index,
        lessonNumber: formData.lessonNumber,
        isPublished: lesson.isPublished,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: videoId,
      });

      setCurrentVideoId(videoId);
      setShowUploader(false);
      setUploadFile(null);
      
      toast({
        title: "✅ Vídeo enviado!",
        description: "Vídeo associado à aula com sucesso!",
      });
    } catch (error) {
      onShowError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro no upload"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const newStatus = await togglePublish({ id: lesson._id });
      toast({
        title: "Sucesso",
        description: `Aula ${newStatus ? "publicada" : "despublicada"} com sucesso!`,
      });
      onSuccess();
    } catch (error) {
      onShowError(
        error instanceof Error ? error.message : "Erro ao atualizar status",
        "Erro ao atualizar status"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-module">Módulo</Label>
        <Select
          value={formData.moduleId}
          onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
        >
          <SelectTrigger id="edit-module">
            <SelectValue placeholder="Selecione um módulo" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((module) => (
              <SelectItem key={module._id} value={module._id}>
                {module.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-title">Título da Aula</Label>
        <Input
          id="edit-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>



      <div className="space-y-2">
        <Label htmlFor="edit-lesson-number">Número da Aula</Label>
        <Input
          id="edit-lesson-number"
          type="number"
          value={formData.lessonNumber}
          onChange={(e) => setFormData({
            ...formData,
            lessonNumber: parseInt(e.target.value) || 1,
          })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
        <Input
          id="edit-tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="ortopedia, medicina, traumatologia"
        />
      </div>

      {/* Video Management Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label>Gerenciar Vídeo</Label>
        {currentVideoId && !showUploader ? (
          <div className="space-y-2">
            {video === undefined ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100">
                <LoaderIcon className="h-5 w-5 text-gray-600 animate-spin" />
                <p className="text-sm text-gray-700">Carregando informações do vídeo...</p>
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
                    Status: {video.status === "ready" ? "Pronto" : video.status === "processing" ? "Processando" : video.status}
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
              <p className="text-xs text-muted-foreground">
                Selecione o arquivo de vídeo para: <strong>{formData.title}</strong>
              </p>
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
                  📁 {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
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

      <div className="flex items-center gap-2 pt-4 border-t">
        <Button
          type="button"
          variant={lesson.isPublished ? "outline" : "default"}
          onClick={handleTogglePublish}
          className="flex items-center gap-2"
        >
          {lesson.isPublished ? (
            <>
              <EyeOffIcon className="h-4 w-4" />
              Despublicar
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              Publicar
            </>
          )}
        </Button>
        <Badge variant={lesson.isPublished ? "default" : "secondary"}>
          {lesson.isPublished ? "Publicada" : "Rascunho"}
        </Badge>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}

function SortableLessonItem({
  lesson,
  modules,
  isEditOrderMode,
  onEditLesson,
  onDelete,
  onTogglePublish,
  onMarkVideoAsReady,
  onCheckVideoStatus,
  onUploadVideo,
}: {
  lesson: any;
  modules: any[];
  isEditOrderMode: boolean;
  onEditLesson?: (lesson: any) => void;
  onDelete: (id: any, title: string) => void;
  onTogglePublish: (id: any, title: string, currentStatus: boolean) => void;
  onMarkVideoAsReady: (videoId: string, lessonTitle: string) => void;
  onCheckVideoStatus: (videoId: string, lessonTitle: string) => Promise<void>;
  onUploadVideo: (lesson: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditOrderMode ? { ...attributes, ...listeners } : {})}
      className={cn(
        isEditOrderMode && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <LessonItem
        lesson={lesson}
        modules={modules}
        isEditOrderMode={isEditOrderMode}
        onEditLesson={onEditLesson}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onMarkVideoAsReady={onMarkVideoAsReady}
        onCheckVideoStatus={onCheckVideoStatus}
        onUploadVideo={onUploadVideo}
      />
    </div>
  );
}

function LessonItem({
  lesson,
  modules,
  isEditOrderMode,
  onEditLesson,
  onDelete,
  onTogglePublish,
  onMarkVideoAsReady,
  onCheckVideoStatus,
  onUploadVideo,
}: {
  lesson: any;
  modules: any[];
  isEditOrderMode?: boolean;
  onEditLesson?: (lesson: any) => void;
  onDelete: (id: any, title: string) => void;
  onTogglePublish: (id: any, title: string, currentStatus: boolean) => void;
  onMarkVideoAsReady: (videoId: string, lessonTitle: string) => void;
  onCheckVideoStatus: (videoId: string, lessonTitle: string) => Promise<void>;
  onUploadVideo: (lesson: any) => void;
}) {
  const video = useQuery(
    api.videos.getByVideoId,
    lesson.videoId ? { videoId: lesson.videoId } : "skip",
  );

  const getVideoStatusBadge = () => {
    if (!video) return null;

    switch (video.status) {
      case "ready":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] h-4 px-1.5">
            <CheckCircleIcon size={10} className="mr-0.5" />
            Pronto
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] h-4 px-1.5">
            <LoaderIcon size={10} className="mr-0.5 animate-spin" />
            Processando
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] h-4 px-1.5">
            <XCircleIcon size={10} className="mr-0.5" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white text-[10px] h-4 px-1.5">
            <ClockIcon size={10} className="mr-0.5" />
            Enviando
          </Badge>
        );
    }
  };

  const getModuleName = (moduleId: any) => {
    const module = modules?.find((m) => m._id === moduleId);
    return module?.title || "Módulo desconhecido";
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 transition-colors">
      {isEditOrderMode && (
        <div className="p-0.5 shrink-0">
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h3 className="text-sm font-semibold truncate">{lesson.title}</h3>
          <Badge
            variant={lesson.isPublished ? "default" : "secondary"}
            className="shrink-0 text-[10px] h-4 px-1.5"
          >
            {lesson.isPublished ? "Publicada" : "Rascunho"}
          </Badge>
          {lesson.videoId && getVideoStatusBadge()}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {lesson.description}
        </p>
        <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
          <span>Módulo: {getModuleName(lesson.moduleId)}</span>
          <span>Aula #{lesson.lessonNumber}</span>
          <span>Duração: {formatDuration(lesson.durationSeconds)}</span>
          {lesson.tags && lesson.tags.length > 0 && (
            <span>Tags: {lesson.tags.join(", ")}</span>
          )}
        </div>
      </div>
      {!isEditOrderMode && (
        <div className="flex flex-col gap-1.5 shrink-0">
          {!lesson.videoId && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onUploadVideo(lesson)}
              title="Fazer upload de vídeo"
              className="text-[10px] h-7 px-2 w-full"
            >
              <UploadIcon className="h-3 w-3 mr-1" />
              Upload
            </Button>
          )}
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEditLesson?.(lesson)}
              title="Editar aula"
            >
              <EditIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                onTogglePublish(lesson._id, lesson.title, lesson.isPublished)
              }
              title={lesson.isPublished ? "Despublicar (Rascunho)" : "Publicar"}
            >
              {lesson.isPublished ? (
                <EyeIcon className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOffIcon className="h-3 w-3 text-gray-400" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(lesson._id, lesson.title)}
              title="Deletar"
            >
                <Trash2Icon className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LessonList({ lessons }: LessonListProps) {
  const modules = useQuery(api.modules.list);
  const categories = useQuery(api.categories.list);
  const deleteLesson = useMutation(api.lessons.remove);
  const togglePublish = useMutation(api.lessons.togglePublish);
  const markVideoAsReady = useMutation(api.videos.markAsReady);
  const updateLesson = useMutation(api.lessons.update);
  const reorderLessons = useMutation(api.lessons.reorder);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();

  // Separate modal state for EditLessonForm to avoid nesting
  const { error: editError, showError: showEditError, hideError: hideEditError } = useErrorModal();
  const { confirm: editConfirm, showConfirm: showEditConfirm, hideConfirm: hideEditConfirm } = useConfirmModal();

  const [uploadingLesson, setUploadingLesson] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  
  // Edit order mode state
  const [isEditOrderMode, setIsEditOrderMode] = useState(false);
  const [orderedLessonsByModule, setOrderedLessonsByModule] = useState<Record<string, any[]>>({});
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group lessons by module and update when lessons or modules change
  useEffect(() => {
    if (!modules) return;
    
    const grouped: Record<string, any[]> = {};
    
    // Group lessons by module
    lessons.forEach(lesson => {
      if (!grouped[lesson.moduleId]) {
        grouped[lesson.moduleId] = [];
      }
      grouped[lesson.moduleId].push(lesson);
    });
    
    // Sort lessons within each module by order_index
    Object.keys(grouped).forEach(moduleId => {
      grouped[moduleId].sort((a, b) => a.order_index - b.order_index);
    });
    
    setOrderedLessonsByModule(grouped);
  }, [lessons, modules]);

  const handleDelete = (id: any, title: string) => {
    showConfirm(
      `Tem certeza que deseja deletar a aula "${title}"?`,
      async () => {
        try {
          await deleteLesson({ id });
          toast({
            title: "Sucesso",
            description: "Aula deletada com sucesso!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao deletar aula",
            "Erro ao deletar aula"
          );
        }
      },
      "Deletar aula"
    );
  };

  const handleTogglePublish = async (
    id: any,
    title: string,
    currentStatus: boolean,
  ) => {
    try {
      const newStatus = await togglePublish({ id });
      toast({
        title: "Sucesso",
        description: `Aula "${title}" ${newStatus ? "publicada" : "despublicada"} com sucesso!`,
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar aula",
        "Erro ao atualizar aula"
      );
    }
  };

  const handleMarkVideoAsReady = async (
    videoId: string,
    lessonTitle: string,
  ) => {
    try {
      await markVideoAsReady({ videoId });
      toast({
        title: "Sucesso",
        description: `Vídeo da aula "${lessonTitle}" marcado como pronto!`,
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar vídeo",
        "Erro ao atualizar vídeo"
      );
    }
  };

  const handleCheckVideoStatus = async (
    videoId: string,
    lessonTitle: string,
  ) => {
    try {
      const response = await fetch("/api/bunny/check-video-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar status");
      }

      toast({
        title: "Status Verificado",
        description: `Status do vídeo "${lessonTitle}" atualizado para: ${data.status}`,
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao verificar status do vídeo",
        "Erro ao verificar status"
      );
    }
  };

  const handleUploadVideo = (lesson: any) => {
    setUploadingLesson(lesson);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
  };

  const handleVideoUploadSuccess = async (videoData: {
    videoId: string;
    libraryId: string;
  }) => {
    if (!uploadingLesson) return;

    try {
      await updateLesson({
        id: uploadingLesson._id,
        moduleId: uploadingLesson.moduleId,
        title: uploadingLesson.title,
        description: uploadingLesson.description,
        durationSeconds: uploadingLesson.durationSeconds,
        order_index: uploadingLesson.order_index,
        lessonNumber: uploadingLesson.lessonNumber,
        isPublished: uploadingLesson.isPublished,
        tags: uploadingLesson.tags,
        videoId: videoData.videoId,
      });

      toast({
        title: "✅ Vídeo vinculado!",
        description: `Vídeo associado à aula "${uploadingLesson.title}"`,
      });

      setUploadingLesson(null);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao vincular vídeo"
      );
    }
  };

  const handleDragEnd = (moduleId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedLessonsByModule((prev) => {
        const moduleLessons = prev[moduleId] || [];
        const oldIndex = moduleLessons.findIndex((item) => item._id === active.id);
        const newIndex = moduleLessons.findIndex((item) => item._id === over.id);

        return {
          ...prev,
          [moduleId]: arrayMove(moduleLessons, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Create updates array with new order_index for all lessons
      const updates: { id: any; order_index: number }[] = [];
      
      Object.entries(orderedLessonsByModule).forEach(([moduleId, moduleLessons]) => {
        moduleLessons.forEach((lesson, index) => {
          updates.push({
            id: lesson._id,
            order_index: index,
          });
        });
      });

      await reorderLessons({ updates });

      toast({
        title: "Sucesso",
        description: "Ordem das aulas atualizada!",
      });

      setIsEditOrderMode(false);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao salvar ordem",
        "Erro ao salvar ordem"
      );
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    // Rebuild the grouped structure from original lessons
    const grouped: Record<string, any[]> = {};
    
    lessons.forEach(lesson => {
      if (!grouped[lesson.moduleId]) {
        grouped[lesson.moduleId] = [];
      }
      grouped[lesson.moduleId].push(lesson);
    });
    
    Object.keys(grouped).forEach(moduleId => {
      grouped[moduleId].sort((a, b) => a.order_index - b.order_index);
    });
    
    setOrderedLessonsByModule(grouped);
    setIsEditOrderMode(false);
  };

  if (modules === undefined || categories === undefined) {
    return <div>Carregando módulos e categorias...</div>;
  }

  // Group modules by category, then sort both categories and modules by their order fields
  const categoriesWithModules = (categories || [])
    .sort((a, b) => a.position - b.position) // Categories use 'position'
    .map(category => ({
      category,
      modules: (modules || [])
        .filter(module => 
          module.categoryId === category._id && 
          orderedLessonsByModule[module._id]?.length > 0
        )
        .sort((a, b) => a.order_index - b.order_index) // Modules use 'order_index'
    }))
    .filter(group => group.modules.length > 0);

  // Modules without a category
  const uncategorizedModules = (modules || [])
    .filter(module => 
      !module.categoryId && 
      orderedLessonsByModule[module._id]?.length > 0
    )
    .sort((a, b) => a.order_index - b.order_index);

  const getModuleName = (moduleId: string) => {
    const module = modules?.find(m => m._id === moduleId);
    return module?.title || "Módulo desconhecido";
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
          <CardTitle>Aulas Cadastradas</CardTitle>
            </div>
            <div className="flex gap-2">
              {!isEditOrderMode ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditOrderMode(true)}
                  disabled={lessons.length === 0}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Editar Ordem
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isSavingOrder}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isSavingOrder ? "Salvando..." : "Salvar Ordem"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma aula cadastrada ainda.
              </p>
            ) : (
              <>
                {categoriesWithModules.map((group) => (
                  <div key={group.category._id} className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 pt-2">
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        {group.category.title}
                      </h2>
                      <div className="flex-1 h-[2px] bg-border" />
                    </div>

                    {/* Modules within this category */}
                    {group.modules.map((module) => {
                      const moduleLessons = orderedLessonsByModule[module._id] || [];
                      
                      return (
                        <div key={module._id} className="space-y-1.5 pl-2">
                          {/* Module Header */}
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
                              {module.title}
                            </h3>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          
                          {/* Lessons for this module */}
                          {isEditOrderMode ? (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd(module._id)}
                            >
                              <SortableContext
                                items={moduleLessons.map(lesson => lesson._id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-1.5">
                                  {moduleLessons.map((lesson) => (
                                    <SortableLessonItem
                                      key={lesson._id}
                                      lesson={lesson}
                                      modules={modules || []}
                                      isEditOrderMode={isEditOrderMode}
                                      onEditLesson={handleEditLesson}
                                      onDelete={handleDelete}
                                      onTogglePublish={handleTogglePublish}
                                      onMarkVideoAsReady={handleMarkVideoAsReady}
                                      onCheckVideoStatus={handleCheckVideoStatus}
                                      onUploadVideo={handleUploadVideo}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="space-y-1.5">
                              {moduleLessons.map((lesson) => (
                                <LessonItem
                                  key={lesson._id}
                                  lesson={lesson}
                                  modules={modules || []}
                                  isEditOrderMode={isEditOrderMode}
                                  onEditLesson={handleEditLesson}
                                  onDelete={handleDelete}
                                  onTogglePublish={handleTogglePublish}
                                  onMarkVideoAsReady={handleMarkVideoAsReady}
                                  onCheckVideoStatus={handleCheckVideoStatus}
                                  onUploadVideo={handleUploadVideo}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Uncategorized Modules Section */}
                {uncategorizedModules.length > 0 && (
                  <div className="space-y-3">
                    {/* Uncategorized Header */}
                    <div className="flex items-center gap-2 pt-2">
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Sem Categoria
                      </h2>
                      <div className="flex-1 h-[2px] bg-border" />
                    </div>

                    {/* Uncategorized Modules */}
                    {uncategorizedModules.map((module) => {
                      const moduleLessons = orderedLessonsByModule[module._id] || [];
                      
                      return (
                        <div key={module._id} className="space-y-1.5 pl-2">
                          {/* Module Header */}
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
                              {module.title}
                            </h3>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          
                          {/* Lessons for this module */}
                          {isEditOrderMode ? (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd(module._id)}
                            >
                              <SortableContext
                                items={moduleLessons.map(lesson => lesson._id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-1.5">
                                  {moduleLessons.map((lesson) => (
                                    <SortableLessonItem
                                      key={lesson._id}
                                      lesson={lesson}
                                      modules={modules || []}
                                      isEditOrderMode={isEditOrderMode}
                                      onEditLesson={handleEditLesson}
                                      onDelete={handleDelete}
                                      onTogglePublish={handleTogglePublish}
                                      onMarkVideoAsReady={handleMarkVideoAsReady}
                                      onCheckVideoStatus={handleCheckVideoStatus}
                                      onUploadVideo={handleUploadVideo}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="space-y-1.5">
                              {moduleLessons.map((lesson) => (
                                <LessonItem
                                  key={lesson._id}
                                  lesson={lesson}
                                  modules={modules || []}
                                  isEditOrderMode={isEditOrderMode}
                                  onEditLesson={handleEditLesson}
                                  onDelete={handleDelete}
                                  onTogglePublish={handleTogglePublish}
                                  onMarkVideoAsReady={handleMarkVideoAsReady}
                                  onCheckVideoStatus={handleCheckVideoStatus}
                                  onUploadVideo={handleUploadVideo}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Upload Dialog */}
      <Dialog
        open={!!uploadingLesson}
        onOpenChange={(open) => !open && setUploadingLesson(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload de Vídeo</DialogTitle>
            <DialogDescription>
              Faça upload do vídeo para a aula
            </DialogDescription>
          </DialogHeader>
          <AdminVideoUploader
            lessonTitle={uploadingLesson?.title || ""}
            onSuccess={handleVideoUploadSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog
        open={!!editingLesson}
        onOpenChange={(open) => !open && setEditingLesson(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Edite as informações da aula "{editingLesson?.title}"
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <EditLessonForm
              lesson={editingLesson}
              modules={modules || []}
              onSuccess={() => {
                setEditingLesson(null);
                toast({
                  title: "Sucesso",
                  description: "Aula atualizada com sucesso!",
                });
              }}
              onCancel={() => setEditingLesson(null)}
              onShowError={showEditError}
              onShowConfirm={showEditConfirm}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* LessonList modals */}
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

      {/* EditLessonForm modals - rendered at same level to avoid nesting */}
      <ErrorModal
        open={editError.isOpen}
        onOpenChange={hideEditError}
        title={editError.title}
        message={editError.message}
      />

      <ConfirmModal
        open={editConfirm.isOpen}
        onOpenChange={hideEditConfirm}
        title={editConfirm.title}
        message={editConfirm.message}
        onConfirm={editConfirm.onConfirm}
      />
    </>
  );
}
