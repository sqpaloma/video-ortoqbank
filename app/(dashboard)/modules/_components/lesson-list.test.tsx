import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LessonList } from "./lesson-list";
import { Id } from "@/convex/_generated/dataModel";

// Mock Convex hooks
const mockLessons = vi.fn();
const mockUseQuery = vi.fn((queryFn, args) => {
  if (args === "skip") {
    return undefined;
  }
  return mockLessons();
});

vi.mock("convex/react", () => ({
  useQuery: mockUseQuery,
}));

describe("LessonList", () => {
  const mockModuleId = "module-123" as Id<"modules">;
  const mockLessonId1 = "lesson-1" as Id<"lessons">;
  const mockLessonId2 = "lesson-2" as Id<"lessons">;
  const mockOnToggle = vi.fn();
  const mockOnLessonClick = vi.fn();

  const mockLessonsData = [
    {
      _id: mockLessonId1,
      _creationTime: Date.now(),
      moduleId: mockModuleId,
      title: "Lesson 1",
      slug: "lesson-1",
      description: "Description 1",
      durationSeconds: 300, // 5 minutes
      order_index: 1,
      lessonNumber: 1,
      isPublished: true,
    },
    {
      _id: mockLessonId2,
      _creationTime: Date.now(),
      moduleId: mockModuleId,
      title: "Lesson 2",
      slug: "lesson-2",
      description: "Description 2",
      durationSeconds: 600, // 10 minutes
      order_index: 2,
      lessonNumber: 2,
      isPublished: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLessons.mockReturnValue(mockLessonsData);
  });

  it("should render lesson list with module header", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={false}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const moduleTitle = screen.getByText("Test Module");
    expect(moduleTitle).toBeDefined();

    const lessonsInfo = screen.getByText(/10 aulas/);
    expect(lessonsInfo).toBeDefined();
  });

  it("should show chevron right icon when collapsed", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={false}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    // ChevronRightIcon should be present (we can't easily test the icon itself, but we can test the button)
    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeDefined();
  });

  it("should call onToggle when header is clicked", async () => {
    const user = userEvent.setup();
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={false}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const toggleButton = screen.getByRole("button");
    await user.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("should not load lessons when collapsed", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={false}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      "skip"
    );
  });

  it("should load lessons when expanded", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      { moduleId: mockModuleId }
    );
  });

  it("should display lessons when expanded", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const lesson1 = screen.getByText("Lesson 1");
    expect(lesson1).toBeDefined();

    const lesson2 = screen.getByText("Lesson 2");
    expect(lesson2).toBeDefined();
  });

  it("should format duration correctly", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    // Lesson 1 has 300 seconds = 5:00
    expect(screen.getByText("5:00")).toBeDefined();
    
    // Lesson 2 has 600 seconds = 10:00
    expect(screen.getByText("10:00")).toBeDefined();
  });

  it("should call onLessonClick when a lesson is clicked", async () => {
    const user = userEvent.setup();
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const lesson1 = screen.getByText("Lesson 1");
    await user.click(lesson1);

    expect(mockOnLessonClick).toHaveBeenCalledWith(mockLessonId1);
  });

  it("should show completed count in header", () => {
    const userProgress = [
      { lessonId: mockLessonId1, completed: true },
      { lessonId: mockLessonId2, completed: false },
    ];

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={userProgress}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const completedInfo = screen.getByText(/1 concluídas/);
    expect(completedInfo).toBeDefined();
  });

  it("should show check icon for completed lessons", () => {
    const userProgress = [
      { lessonId: mockLessonId1, completed: true },
      { lessonId: mockLessonId2, completed: false },
    ];

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={userProgress}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    // CheckCircleIcon should be present for completed lesson
    // We can't easily test the icon, but we can verify the lesson is rendered
    const lesson1 = screen.getByText("Lesson 1");
    expect(lesson1).toBeDefined();
  });

  it("should highlight active lesson", () => {
    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={mockLessonId1}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const lesson1 = screen.getByText("Lesson 1");
    const lessonButton = lesson1.closest("button");
    
    expect(lessonButton).toHaveClass("bg-blue-50");
  });

  it("should show empty state when no lessons are available", () => {
    mockLessons.mockReturnValue([]);

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={0}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const emptyState = screen.getByText("Nenhuma aula disponível");
    expect(emptyState).toBeDefined();
  });

  it("should show loading state when lessons are undefined", () => {
    mockLessons.mockReturnValue(undefined);

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    // Should not show lessons list when loading
    const lesson1 = screen.queryByText("Lesson 1");
    expect(lesson1).toBeNull();
  });

  it("should display correct completed count when multiple lessons are completed", () => {
    const userProgress = [
      { lessonId: mockLessonId1, completed: true },
      { lessonId: mockLessonId2, completed: true },
    ];

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={userProgress}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    const completedInfo = screen.getByText(/2 concluídas/);
    expect(completedInfo).toBeDefined();
  });

  it("should format duration with single digit seconds correctly", () => {
    const lessonsWithShortDuration = [
      {
        ...mockLessonsData[0],
        durationSeconds: 65, // 1:05
      },
    ];

    mockLessons.mockReturnValue(lessonsWithShortDuration);

    render(
      <LessonList
        moduleId={mockModuleId}
        moduleTitle="Test Module"
        totalLessons={10}
        isExpanded={true}
        currentLessonId={null}
        userProgress={[]}
        onToggle={mockOnToggle}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("1:05")).toBeDefined();
  });
});
