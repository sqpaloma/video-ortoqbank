"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { UnitTreeItem } from "./unit-tree-item";
import { UnitsTreeSidebarProps } from "./types";
import { Id } from "@/convex/_generated/dataModel";

export function UnitsTreeSidebar({
  units,
  lessons,
  expandedUnits,
  isDraggingUnit,
  isDraggingLesson,
  sensors,
  onToggleUnit,
  onEditUnit,
  onEditLesson,
  onTogglePublishUnit,
  onTogglePublishLesson,
  onDeleteUnit,
  onDeleteLesson,
  onDragEndUnits,
  onDragEndLessons,
  onDragStartUnit,
  onDragStartLesson,
}: UnitsTreeSidebarProps) {
  const getLessonsForUnit = (unitId: Id<"units">) => {
    return lessons[unitId] || [];
  };

  return (
    <div className="hidden lg:block lg:w-[400px] overflow-y-auto border rounded-lg ">
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Visualização
        </h3>

        {units.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEndUnits}
            onDragStart={onDragStartUnit}
          >
            <SortableContext
              items={units.map((unit) => unit._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {units.map((unit) => (
                  <UnitTreeItem
                    key={unit._id}
                    unit={unit}
                    isExpanded={expandedUnits.has(unit._id)}
                    unitLessons={getLessonsForUnit(unit._id)}
                    onToggle={onToggleUnit}
                    onEdit={onEditUnit}
                    onEditLesson={onEditLesson}
                    onTogglePublishUnit={onTogglePublishUnit}
                    onTogglePublishLesson={onTogglePublishLesson}
                    onDeleteUnit={onDeleteUnit}
                    onDeleteLesson={onDeleteLesson}
                    isDraggingUnit={isDraggingUnit}
                    isDraggingLesson={isDraggingLesson}
                    sensors={sensors}
                    onDragEndLessons={onDragEndLessons}
                    onDragStartLesson={onDragStartLesson}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma unidade criada nesta categoria ainda
          </p>
        )}
      </div>
    </div>
  );
}
