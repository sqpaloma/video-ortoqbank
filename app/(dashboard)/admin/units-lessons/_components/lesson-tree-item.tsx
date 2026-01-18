"use client";

import { Button } from "@/components/ui/button";
import {
  GripVerticalIcon,
  PencilIcon,
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { LessonTreeItemProps } from "./types";

export function LessonTreeItem({
  lesson,
  onEdit,
  onTogglePublish,
  onDelete,
  isDragging,
}: LessonTreeItemProps) {
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
        onClick={() => onTogglePublish(lesson._id)}
        title={lesson.isPublished ? "Despublicar" : "Publicar"}
        disabled={isDragging}
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
        onClick={() => onEdit(lesson)}
        title="Editar aula"
        disabled={isDragging}
      >
        <PencilIcon className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => onDelete(lesson._id)}
        title="Excluir aula"
        disabled={isDragging}
      >
        <Trash2Icon className="h-3 w-3" />
      </Button>
    </div>
  );
}
