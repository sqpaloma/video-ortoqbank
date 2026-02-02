"use client";

import { Button } from "@/src/components/ui/button";
import {
  GripVerticalIcon,
  PencilIcon,
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/src/lib/utils";
import { LessonTreeItemProps } from "./types";
import { useUnitsLessonsStore } from "./store";
import { useUnitsLessonsPageContext } from "./units-lessons-page";
import {
  useTenantMutation,
  useTenantReady,
} from "@/src/hooks/use-tenant-convex";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/src/hooks/use-toast";
import { useErrorModal } from "@/src/hooks/use-error-modal";

export function LessonTreeItem({ lesson }: LessonTreeItemProps) {
  const { toast } = useToast();
  const { showError } = useErrorModal();
  const isTenantReady = useTenantReady();
  const togglePublishLesson = useTenantMutation(api.lessons.togglePublish);

  const { editLesson, isDraggingLesson } = useUnitsLessonsStore();
  const { handleDeleteLesson } = useUnitsLessonsPageContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTogglePublish = async () => {
    try {
      if (!isTenantReady) {
        throw new Error("Tenant not loaded");
      }
      await togglePublishLesson({ id: lesson._id });
      toast({
        title: "Sucesso",
        description: "Status de publicação da aula atualizado!",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar status",
        "Erro ao atualizar status",
      );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded bg-white border border-gray-200 transition-all",
        isItemDragging && "opacity-50 ring-2 ring-primary shadow-lg z-50",
        !isItemDragging && "hover:border-gray-300",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded shrink-0"
        title="Arraste para reordenar"
      >
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p
          className="text-sm truncate"
          title={`${lesson.lessonNumber}. ${lesson.title}`}
        >
          {lesson.lessonNumber}. {lesson.title}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={handleTogglePublish}
        title={lesson.isPublished ? "Despublicar" : "Publicar"}
        disabled={isDraggingLesson}
      >
        {lesson.isPublished ? (
          <EyeIcon className="h-3 w-3 text-green-600" />
        ) : (
          <EyeOffIcon className="h-3 w-3 text-gray-400" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => editLesson(lesson)}
        title="Editar aula"
        disabled={isDraggingLesson}
      >
        <PencilIcon className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 "
        onClick={() => handleDeleteLesson(lesson._id)}
        title="Excluir aula"
        aria-label="Excluir aula"
        disabled={isDraggingLesson}
      >
        <Trash2Icon className="h-3 w-3" />
      </Button>
    </div>
  );
}
