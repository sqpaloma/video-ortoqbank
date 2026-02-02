import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LessonTreeItem } from "./lesson-tree-item";
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

// Mock the store
vi.mock("./store", () => ({
  useUnitsLessonsStore: () => ({
    editLesson: vi.fn(),
    isDraggingLesson: false,
  }),
}));

// Mock the context
vi.mock("./units-lessons-page", () => ({
  useUnitsLessonsPageContext: () => ({
    handleDeleteLesson: vi.fn(),
  }),
}));

// Mock use-tenant-convex
vi.mock("@/src/hooks/use-tenant-convex", () => ({
  useTenantMutation: () => vi.fn(() => Promise.resolve()),
  useTenantReady: () => true,
}));

// Mock use-toast
vi.mock("@/hooks/use-toast", () => ({
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

describe("LessonTreeItem", () => {
  it("should render", () => {
    render(
      <LessonTreeItem
        lesson={
          {
            _id: "1" as Id<"lessons">,
            title: "Test Lesson",
            lessonNumber: 1,
            isPublished: true,
          } as Doc<"lessons">
        }
      />,
    );
    expect(screen.getByText(/Test Lesson/)).toBeInTheDocument();
  });
});
