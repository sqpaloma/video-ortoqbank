import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LessonList } from "./lesson-list";
import { Id } from "@/convex/_generated/dataModel";

// Mock Convex useQuery hook
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => []), // Return empty array for lessons
}));

describe("LessonList", () => {
  it("should render unit title", () => {
    render(
      <LessonList
        unitId={"" as Id<"units">}
        unitTitle="Test Unit"
        totalLessons={10}
        isExpanded={false}
        currentLessonId={null}
        userProgress={[]}
        onToggle={() => {}}
        onLessonClick={() => {}}
      />,
    );
    expect(screen.getByText("Test Unit")).toBeInTheDocument();
  });
});
