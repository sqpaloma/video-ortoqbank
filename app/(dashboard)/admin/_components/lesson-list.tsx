"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircleIcon,
  LoaderIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Id, Doc } from "@/convex/_generated/dataModel";
import AdminVideoUploader from "@/components/bunny/admin-video-uploader";

interface LessonListProps {
  lessons: Doc<"lessons">[];
  onEditLesson?: (lesson: any) => void;
}

function EditLessonForm({
  lesson,
  modules,
  onSuccess,
  onCancel,
}: {
  lesson: any;
  modules: any[];
  onSuccess: () => void;
  onCancel: () => void;
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
    durationSeconds: lesson.durationSeconds,
    orderIndex: lesson.order_index,
    lessonNumber: lesson.lessonNumber,
    tags: lesson.tags?.join(", ") || "",
  });

  const video = useQuery(
    api.videos.getByVideoId,
    currentVideoId ? { videoId: currentVideoId } : "skip"
  );

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const slug = generateSlug(formData.title);
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag: string | undefined) => tag?.trim())
            .filter(Boolean)
        : [];

      await updateLesson({
        id: lesson._id,
        moduleId: formData.moduleId,
        title: formData.title,
        slug,
        description: formData.description,
        durationSeconds: formData.durationSeconds,
        order_index: formData.orderIndex,
        lessonNumber: formData.lessonNumber,
        isPublished: lesson.isPublished,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: currentVideoId,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao atualizar aula",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!confirm("Tem certeza que deseja remover o vídeo desta aula?")) {
      return;
    }

    try {
      const slug = generateSlug(formData.title);
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
        slug,
        description: formData.description,
        durationSeconds: formData.durationSeconds,
        order_index: formData.orderIndex,
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
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao remover vídeo",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("video/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de vídeo",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5GB limit)
      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast({
          title: "Erro",
          description: "O arquivo é muito grande (máximo 5GB)",
          variant: "destructive",
        });
        return;
      }

      setUploadFile(selectedFile);
    }
  };

  const handleUploadVideo = async () => {
    if (!uploadFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de vídeo",
        variant: "destructive",
      });
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
      const slug = generateSlug(formData.title);
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
        slug,
        description: formData.description,
        durationSeconds: formData.durationSeconds,
        order_index: formData.orderIndex,
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
      toast({
        title: "Erro no upload",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
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
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-module">Módulo</Label>
        <Select
          value={formData.moduleId}
          onValueChange={(value) =>
            setFormData({ ...formData, moduleId: value })
          }
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
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-duration">Duração (segundos)</Label>
          <Input
            id="edit-duration"
            type="number"
            value={formData.durationSeconds}
            onChange={(e) =>
              setFormData({
                ...formData,
                durationSeconds: parseInt(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-order">Ordem</Label>
          <Input
            id="edit-order"
            type="number"
            value={formData.orderIndex}
            onChange={(e) =>
              setFormData({
                ...formData,
                orderIndex: parseInt(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-lesson-number">Número da Aula</Label>
          <Input
            id="edit-lesson-number"
            type="number"
            value={formData.lessonNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                lessonNumber: parseInt(e.target.value) || 1,
              })
            }
            required
          />
        </div>
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
            <div className="flex items-center gap-2 p-3 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Vídeo vinculado
                </p>
                {video && (
                  <p className="text-xs text-green-700">
                    Status: {video.status === "ready" ? "Pronto" : video.status === "processing" ? "Processando" : video.status}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveVideo}
              >
                <Trash2 className="h-4 w-4 mr-1" />
              </Button>
            </div>
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
                    <Upload className="h-4 w-4 mr-2" />
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
            <Upload className="h-4 w-4 mr-2" />
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
              <EyeOff className="h-4 w-4" />
              Despublicar
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
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

function LessonItem({
  lesson,
  modules,
  onEditLesson,
  onDelete,
  onTogglePublish,
  onMarkVideoAsReady,
  onCheckVideoStatus,
  onUploadVideo,
}: {
  lesson: any;
  modules: any[];
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
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircleIcon size={12} className="mr-1" />
            Vídeo Pronto
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <LoaderIcon size={12} className="mr-1 animate-spin" />
            Processando
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">
            <XCircleIcon size={12} className="mr-1" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
            <ClockIcon size={12} className="mr-1" />
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold truncate">{lesson.title}</h3>
          <Badge
            variant={lesson.isPublished ? "default" : "secondary"}
            className="shrink-0"
          >
            {lesson.isPublished ? "Publicada" : "Rascunho"}
          </Badge>
          {lesson.videoId && getVideoStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {lesson.description}
        </p>
        <div className="flex gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
          <span>Módulo: {getModuleName(lesson.moduleId)}</span>
          <span>Aula #{lesson.lessonNumber}</span>
          <span>Duração: {formatDuration(lesson.durationSeconds)}</span>
          {lesson.tags && lesson.tags.length > 0 && (
            <span>Tags: {lesson.tags.join(", ")}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap">
        {!lesson.videoId && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onUploadVideo(lesson)}
            title="Fazer upload de vídeo"
            className="text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload Vídeo
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEditLesson?.(lesson)}
          title="Editar aula"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            onTogglePublish(lesson._id, lesson.title, lesson.isPublished)
          }
          title={lesson.isPublished ? "Despublicar (Rascunho)" : "Publicar"}
        >
          {lesson.isPublished ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(lesson._id, lesson.title)}
          title="Deletar"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function LessonList({ lessons }: LessonListProps) {
  const modules = useQuery(api.modules.list);
  const deleteLesson = useMutation(api.lessons.remove);
  const togglePublish = useMutation(api.lessons.togglePublish);
  const markVideoAsReady = useMutation(api.videos.markAsReady);
  const updateLesson = useMutation(api.lessons.update);
  const { toast } = useToast();

  const [uploadingLesson, setUploadingLesson] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);

  const handleDelete = async (id: any, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar a aula "${title}"?`)) {
      return;
    }

    try {
      await deleteLesson({ id });

      toast({
        title: "Sucesso",
        description: "Aula deletada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao deletar aula",
        variant: "destructive",
      });
    }
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
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao atualizar aula",
        variant: "destructive",
      });
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
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao atualizar vídeo",
        variant: "destructive",
      });
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
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao verificar status do vídeo",
        variant: "destructive",
      });
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
        slug: uploadingLesson.slug,
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
      toast({
        title: "Erro ao vincular vídeo",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (modules === undefined) {
    return <div>Carregando módulos...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Aulas Cadastradas</CardTitle>
          <CardDescription>
            {lessons.length} {lessons.length === 1 ? "aula" : "aulas"} no
            sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma aula cadastrada ainda.
              </p>
            ) : (
              lessons.map((lesson) => (
                <LessonItem
                  key={lesson._id}
                  lesson={lesson}
                  modules={modules || []}
                  onEditLesson={handleEditLesson}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  onMarkVideoAsReady={handleMarkVideoAsReady}
                  onCheckVideoStatus={handleCheckVideoStatus}
                  onUploadVideo={handleUploadVideo}
                />
              ))
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
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
