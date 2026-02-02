import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnitTreeItem } from "./unit-tree-item";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Mock useSortable from @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  closestCenter: vi.fn(),
}));

// Mock the store
vi.mock("./store", () => ({
  useUnitsLessonsStore: () => ({
    expandedUnits: new Set(),
    toggleUnit: vi.fn(),
    editUnit: vi.fn(),
    isDraggingUnit: false,
    setIsDraggingLesson: vi.fn(),
  }),
}));

// Mock the context
vi.mock("./units-lessons-page", () => ({
  useUnitsLessonsPageContext: () => ({
    handleDeleteUnit: vi.fn(),
  }),
}));

// Mock use-tenant-convex
vi.mock("@/src/hooks/use-tenant-convex", () => ({
  useTenantMutation: () => vi.fn(() => Promise.resolve()),
  useTenantReady: () => true,
}));

// Mock use-toast
vi.mock("@/src/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock use-error-modal
vi.mock("@/src/hooks/use-error-modal", () => ({
  useErrorModal: () => ({
    showError: vi.fn(),
  }),
}));

// Mock LessonTreeItem
vi.mock("./lesson-tree-item", () => ({
  LessonTreeItem: () => <div data-testid="lesson-tree-item">Lesson</div>,
}));

describe("UnitTreeItem", () => {
  it("should render", () => {
    const unit = {
      _id: "1" as Id<"units">,
      title: "Test Unit",
      isPublished: true,
    } as Doc<"units">;
    const unitLessons: Array<Doc<"lessons">> = [];
    const onDragEndLessons = () => async () => {};

    const props = {
      unit,
      unitLessons,
      sensors: [],
      onDragEndLessons,
    };

    render(<UnitTreeItem {...props} />);
    expect(screen.getByText("Test Unit")).toBeInTheDocument();
  });
});
