"use client";

import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { ListTreeIcon } from "lucide-react";
import { UnitTreeItem } from "./unit-tree-item";
import { UnitsTreeSidebarProps } from "./types";
import { Id } from "@/convex/_generated/dataModel";
import { useUnitsLessonsStore } from "./store";

interface MobileUnitsTreeSidebarProps extends UnitsTreeSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileUnitsTreeSidebar({
  units,
  lessons,
  sensors,
  onDragEndUnits,
  onDragEndLessons,
  isOpen,
  onOpenChange,
}: MobileUnitsTreeSidebarProps) {
  const { setIsDraggingUnit } = useUnitsLessonsStore();

  const getLessonsForUnit = (unitId: Id<"units">) => {
    return lessons[unitId] || [];
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Unidades e Aulas</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {units.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEndUnits}
              onDragStart={() => setIsDraggingUnit(true)}
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
                      unitLessons={getLessonsForUnit(unit._id)}
                      sensors={sensors}
                      onDragEndLessons={onDragEndLessons}
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
      </SheetContent>
    </Sheet>
  );
}

// Floating button to open the mobile sidebar
export function MobileSidebarTrigger({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className="lg:hidden fixed bottom-6 left-6 z-40 shadow-lg rounded-full h-14 w-14 p-0"
      title="Ver unidades e aulas"
    >
      <ListTreeIcon className="h-6 w-6" />
    </Button>
  );
}
