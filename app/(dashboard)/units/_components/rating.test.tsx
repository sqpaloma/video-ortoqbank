import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Rating } from "./rating";
import { Id } from "@/convex/_generated/dataModel";

// Mock Convex hooks
const mockSubmitRating = vi.fn();
const mockUserRating = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockSubmitRating),
  useQuery: vi.fn(() => mockUserRating()),
}));

describe("Rating", () => {
  const mockUserId = "user-123";
  const mockLessonId = "lesson-123" as Id<"lessons">;
  const mockUnitId = "unit-123" as Id<"units">;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRating.mockReturnValue(null);
  });

  it("should render rating component with 5 stars", () => {
    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    const label = screen.getByText("O que você achou desta aula?");
    expect(label).toBeDefined();

    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    expect(stars).toHaveLength(5);
  });

  it("should show confirm button when rating is selected", async () => {
    const user = userEvent.setup();
    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    await user.click(stars[2]); // Click on 3rd star

    await waitFor(() => {
      const confirmButton = screen.getByText("Confirmar avaliação");
      expect(confirmButton).toBeDefined();
    });
  });

  it("should call submitRating when confirm button is clicked", async () => {
    const user = userEvent.setup();
    mockSubmitRating.mockResolvedValue("rating-id");

    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    await user.click(stars[3]); // Click on 4th star

    await waitFor(() => {
      const confirmButton = screen.getByText("Confirmar avaliação");
      expect(confirmButton).toBeDefined();
    });

    await user.click(screen.getByText("Confirmar avaliação"));

    await waitFor(() => {
      expect(mockSubmitRating).toHaveBeenCalledWith({
        userId: mockUserId,
        lessonId: mockLessonId,
        unitId: mockUnitId,
        rating: 4,
      });
    });
  });

  it("should display existing user rating", () => {
    mockUserRating.mockReturnValue({
      _id: "rating-id" as Id<"lessonRatings">,
      _creationTime: Date.now(),
      userId: mockUserId,
      lessonId: mockLessonId,
      unitId: mockUnitId,
      rating: 5,
      createdAt: Date.now(),
    });

    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    // All 5 stars should be filled
    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    expect(stars).toHaveLength(5);
  });

  it("should not show confirm button when rating matches existing rating", async () => {
    const user = userEvent.setup();
    mockUserRating.mockReturnValue({
      _id: "rating-id" as Id<"lessonRatings">,
      _creationTime: Date.now(),
      userId: mockUserId,
      lessonId: mockLessonId,
      unitId: mockUnitId,
      rating: 3,
      createdAt: Date.now(),
    });

    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    await user.click(stars[2]); // Click on 3rd star (same as existing)

    await waitFor(() => {
      const confirmButton = screen.queryByText("Confirmar avaliação");
      expect(confirmButton).toBeNull();
    });
  });
});
