"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PencilIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LessonTreeItem } from "./lesson-tree-item";
import { UnitTreeItemProps } from "./types";

export function UnitTreeItem({
  unit,
  isExpanded,
  unitLessons,
  onToggle,
  onEdit,
  onEditLesson,
  onTogglePublishUnit,
  onTogglePublishLesson,
  isDraggingUnit,
  isDraggingLesson,
  sensors,
  onDragEndLessons,
  onDragStartLesson,
}: UnitTreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: unit._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-1",
        isItemDragging &&
          "opacity-50 ring-2 ring-primary rounded-lg shadow-lg z-50",
      )}
    >
      {/* Unit Header */}
      <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded shrink-0"
          title="Arraste para reordenar unidade"
        >
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => onToggle(unit._id)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{unit.title}</p>
            <p className="text-xs text-muted-foreground">
              {unitLessons.length} {unitLessons.length === 1 ? "aula" : "aulas"}
            </p>
          </div>
        </button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => onTogglePublishUnit(unit._id)}
          title={unit.isPublished ? "Despublicar" : "Publicar"}
          disabled={isDraggingUnit}
        >
          {unit.isPublished ? (
            <EyeIcon className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOffIcon className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => onEdit(unit)}
          title="Editar unidade"
          disabled={isDraggingUnit}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Lessons List */}
      {isExpanded && unitLessons.length > 0 && (
        <div className="ml-6 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEndLessons(unit._id)}
            onDragStart={onDragStartLesson}
          >
            <SortableContext
              items={unitLessons.map((lesson) => lesson._id)}
              strategy={verticalListSortingStrategy}
            >
              {unitLessons.map((lesson) => (
                <LessonTreeItem
                  key={lesson._id}
                  lesson={lesson}
                  onEdit={onEditLesson}
                  onTogglePublish={onTogglePublishLesson}
                  isDragging={isDraggingLesson}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
