import { Doc, Id } from "@/convex/_generated/dataModel";
import { DragEndEvent } from "@dnd-kit/core";
import { SensorDescriptor, SensorOptions } from "@dnd-kit/core";

export type EditMode =
  | { type: "none" }
  | { type: "unit"; unit: Doc<"units"> }
  | { type: "lesson"; lesson: Doc<"lessons"> };

export interface LessonTreeItemProps {
  lesson: Doc<"lessons">;
  onEdit: (lesson: Doc<"lessons">) => void;
  onTogglePublish: (lessonId: Id<"lessons">) => void;
  isDragging: boolean;
}

export interface UnitTreeItemProps {
  unit: Doc<"units">;
  isExpanded: boolean;
  unitLessons: Doc<"lessons">[];
  onToggle: (unitId: string) => void;
  onEdit: (unit: Doc<"units">) => void;
  onEditLesson: (lesson: Doc<"lessons">) => void;
  onTogglePublishUnit: (unitId: Id<"units">) => void;
  onTogglePublishLesson: (lessonId: Id<"lessons">) => void;
  isDraggingUnit: boolean;
  isDraggingLesson: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEndLessons: (unitId: string) => (event: DragEndEvent) => Promise<void>;
  onDragStartLesson: () => void;
}

export interface UnitsTreeSidebarProps {
  units: Doc<"units">[];
  lessons: Record<string, Doc<"lessons">[]>;
  expandedUnits: Set<string>;
  isDraggingUnit: boolean;
  isDraggingLesson: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onToggleUnit: (unitId: string) => void;
  onEditUnit: (unit: Doc<"units">) => void;
  onEditLesson: (lesson: Doc<"lessons">) => void;
  onTogglePublishUnit: (unitId: Id<"units">) => void;
  onTogglePublishLesson: (lessonId: Id<"lessons">) => void;
  onDragEndUnits: (event: DragEndEvent) => Promise<void>;
  onDragEndLessons: (unitId: string) => (event: DragEndEvent) => Promise<void>;
  onDragStartUnit: () => void;
  onDragStartLesson: () => void;
}

export interface UnitEditPanelProps {
  unit: Doc<"units">;
  categories: Doc<"categories">[];
  onSave: (data: {
    categoryId: Id<"categories">;
    title: string;
    description: string;
  }) => void;
  onCancel: () => void;
}

export interface LessonEditPanelProps {
  lesson: Doc<"lessons">;
  units: Doc<"units">[];
  onSave: (data: {
    unitId: Id<"units">;
    title: string;
    description: string;
    lessonNumber: number;
    tags?: string[];
    videoId?: string;
  }) => void;
  onCancel: () => void;
}
