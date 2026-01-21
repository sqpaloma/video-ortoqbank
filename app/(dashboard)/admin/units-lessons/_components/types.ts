import { Doc, Id } from "@/convex/_generated/dataModel";
import { DragEndEvent } from "@dnd-kit/core";
import { SensorDescriptor, SensorOptions } from "@dnd-kit/core";

// Re-export EditMode from store for backwards compatibility
export type { EditMode } from "./store";

// Simplified props - callbacks now come from store
export interface LessonTreeItemProps {
  lesson: Doc<"lessons">;
}

export interface UnitTreeItemProps {
  unit: Doc<"units">;
  unitLessons: Doc<"lessons">[];
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEndLessons: (unitId: string) => (event: DragEndEvent) => Promise<void>;
}

export interface UnitsTreeSidebarProps {
  units: Doc<"units">[];
  lessons: Record<string, Doc<"lessons">[]>;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEndUnits: (event: DragEndEvent) => Promise<void>;
  onDragEndLessons: (unitId: string) => (event: DragEndEvent) => Promise<void>;
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
    videoId?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
  }) => void;
  onCancel: () => void;
}
