import { create } from "zustand";
import { Doc, Id } from "@/convex/_generated/dataModel";
// Edit mode discriminated union
export type EditMode =
  | { type: "none" }
  | { type: "unit"; unit: Doc<"units"> }
  | { type: "lesson"; lesson: Doc<"lessons"> }
  | {
      type: "preview";
      lesson: Doc<"lessons">;
      savedData: { title: string; description: string; videoId?: string };
    };

interface UnitsLessonsState {
  // Category selection
  selectedCategoryId: Id<"categories"> | null;
  setSelectedCategoryId: (id: Id<"categories"> | null) => void;
  // Expanded units in tree view
  expandedUnits: Set<string>;
  toggleUnit: (unitId: string) => void;
  // Edit mode
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  editUnit: (unit: Doc<"units">) => void;
  editLesson: (lesson: Doc<"lessons">) => void;
  showLessonPreview: (
    lesson: Doc<"lessons">,
    savedData: { title: string; description: string; videoId?: string },
  ) => void;
  clearEditMode: () => void;

  // Create modals
  showCreateUnitModal: boolean;
  showCreateLessonModal: boolean;
  setShowCreateUnitModal: (show: boolean) => void;
  setShowCreateLessonModal: (show: boolean) => void;
  // Drag and drop state
  isDraggingUnit: boolean;
  isDraggingLesson: boolean;
  setIsDraggingUnit: (dragging: boolean) => void;
  setIsDraggingLesson: (dragging: boolean) => void;
  // Optimistic updates for drag reordering
  draggedUnits: Doc<"units">[] | null;
  draggedLessons: Record<string, Doc<"lessons">[]> | null;
  setDraggedUnits: (units: Doc<"units">[] | null) => void;
  setDraggedLessons: (lessons: Record<string, Doc<"lessons">[]> | null) => void;
  updateDraggedLessonsForUnit: (
    unitId: string,
    lessons: Doc<"lessons">[],
    currentLessons: Record<string, Doc<"lessons">[]>,
  ) => void;
  // Reset store (useful when changing categories)
  reset: () => void;
}
const initialState = {
  selectedCategoryId: null,
  expandedUnits: new Set<string>(),
  editMode: { type: "none" } as EditMode,
  showCreateUnitModal: false,
  showCreateLessonModal: false,
  isDraggingUnit: false,
  isDraggingLesson: false,
  draggedUnits: null,
  draggedLessons: null,
};
export const useUnitsLessonsStore = create<UnitsLessonsState>((set) => ({
  ...initialState,
  // Category selection
  setSelectedCategoryId: (id) =>
    set({
      selectedCategoryId: id,
      editMode: { type: "none" },
      expandedUnits: new Set(),
    }),
  // Expanded units
  toggleUnit: (unitId) =>
    set((state) => {
      const newSet = new Set(state.expandedUnits);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return { expandedUnits: newSet };
    }),
  // Edit mode
  setEditMode: (mode) => set({ editMode: mode }),
  editUnit: (unit) => set({ editMode: { type: "unit", unit } }),
  editLesson: (lesson) => set({ editMode: { type: "lesson", lesson } }),
  showLessonPreview: (lesson, savedData) =>
    set({ editMode: { type: "preview", lesson, savedData } }),
  clearEditMode: () => set({ editMode: { type: "none" } }),

  // Create modals
  setShowCreateUnitModal: (show) => set({ showCreateUnitModal: show }),
  setShowCreateLessonModal: (show) => set({ showCreateLessonModal: show }),
  // Drag and drop
  setIsDraggingUnit: (dragging) => set({ isDraggingUnit: dragging }),
  setIsDraggingLesson: (dragging) => set({ isDraggingLesson: dragging }),
  // Optimistic updates
  setDraggedUnits: (units) => set({ draggedUnits: units }),
  setDraggedLessons: (lessons) => set({ draggedLessons: lessons }),
  updateDraggedLessonsForUnit: (unitId, lessons, currentLessons) =>
    set((state) => ({
      draggedLessons: {
        ...(state.draggedLessons || currentLessons),
        [unitId]: lessons,
      },
    })),
  // Reset
  reset: () => set(initialState),
}));
