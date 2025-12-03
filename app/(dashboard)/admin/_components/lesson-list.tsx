"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

interface LessonListProps {
  onEditLesson?: (lesson: any) => void;
}

function LessonItem({
  lesson,
  modules,
  onEditLesson,
  onDelete,
  onTogglePublish,
  onMarkVideoAsReady,
  onCheckVideoStatus,
}: {
  lesson: any;
  modules: any[];
  onEditLesson?: (lesson: any) => void;
  onDelete: (id: any, title: string) => void;
  onTogglePublish: (id: any, title: string, currentStatus: boolean) => void;
  onMarkVideoAsReady: (videoId: string, lessonTitle: string) => void;
  onCheckVideoStatus: (videoId: string, lessonTitle: string) => Promise<void>;
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
        {lesson.videoId && video && video.status !== "ready" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckVideoStatus(lesson.videoId!, lesson.title)}
              title="Verificar status do vídeo no Bunny"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Verificar Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkVideoAsReady(lesson.videoId!, lesson.title)}
              title="Marcar vídeo como pronto manualmente"
              className="text-xs"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Marcar Pronto
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            onTogglePublish(lesson._id, lesson.title, lesson.isPublished)
          }
          title={lesson.isPublished ? "Despublicar" : "Publicar"}
        >
          {lesson.isPublished ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        {onEditLesson && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEditLesson(lesson)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
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

export function LessonList() {
  const lessons = useQuery(api.lessons.list);
  const modules = useQuery(api.modules.list);
  const deleteLesson = useMutation(api.lessons.remove);
  const togglePublish = useMutation(api.lessons.togglePublish);
  const markVideoAsReady = useMutation(api.videos.markAsReady);
  const { toast } = useToast();

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

  if (lessons === undefined || modules === undefined) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aulas Cadastradas</CardTitle>
        <CardDescription>
          {lessons.length} {lessons.length === 1 ? "aula" : "aulas"} no sistema
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
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onMarkVideoAsReady={handleMarkVideoAsReady}
                onCheckVideoStatus={handleCheckVideoStatus}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
