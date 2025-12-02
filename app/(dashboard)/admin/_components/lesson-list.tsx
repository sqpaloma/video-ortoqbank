"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

interface LessonListProps {
  onEditLesson?: (lesson: any) => void;
}

export function LessonList({ onEditLesson }: LessonListProps) {
  const lessons = useQuery(api.lessons.list);
  const modules = useQuery(api.modules.list);
  const deleteLesson = useMutation(api.lessons.remove);
  const togglePublish = useMutation(api.lessons.togglePublish);
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
        description: error instanceof Error ? error.message : "Erro ao deletar aula",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (id: any, title: string, currentStatus: boolean) => {
    try {
      const newStatus = await togglePublish({ id });
      
      toast({
        title: "Sucesso",
        description: `Aula "${title}" ${newStatus ? "publicada" : "despublicada"} com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar aula",
        variant: "destructive",
      });
    }
  };

  const getModuleName = (moduleId: any) => {
    const module = modules?.find(m => m._id === moduleId);
    return module?.title || "Módulo desconhecido";
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            <p className="text-sm text-muted-foreground">Nenhuma aula cadastrada ainda.</p>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{lesson.title}</h3>
                    <Badge variant={lesson.isPublished ? "default" : "secondary"} className="shrink-0">
                      {lesson.isPublished ? "Publicada" : "Rascunho"}
                    </Badge>
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
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTogglePublish(lesson._id, lesson.title, lesson.isPublished)}
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
                    onClick={() => handleDelete(lesson._id, lesson.title)}
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

