import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LessonTreeItem } from "./lesson-tree-item";
import { Doc } from "@/convex/_generated/dataModel";

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

describe("LessonTreeItem", () => {
  it("should render", () => {
    render(
      <LessonTreeItem
        lesson={
          { _id: "1", title: "Test Lesson", lessonNumber: 1 } as Doc<"lessons">
        }
        onEdit={() => {}}
        onTogglePublish={() => {}}
        onDelete={() => {}}
        isDragging={false}
      />,
    );
    expect(screen.getByText(/Test Lesson/)).toBeInTheDocument();
  });
});
