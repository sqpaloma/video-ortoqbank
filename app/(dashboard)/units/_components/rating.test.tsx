import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Rating } from "./rating";
import { Id } from "@/convex/_generated/dataModel";

// Mock tenant hooks
const mockSubmitRating = vi.fn();
const mockUserRating = vi.fn();

vi.mock("@/hooks/use-tenant-convex", () => ({
  useTenantMutation: vi.fn(() => mockSubmitRating),
  useTenantQuery: vi.fn(() => mockUserRating()),
  useTenantReady: vi.fn(() => true),
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

  it("should call submitRating when star is clicked", async () => {
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
      expect(mockSubmitRating).toHaveBeenCalledWith({
        userId: mockUserId,
        lessonId: mockLessonId,
        unitId: mockUnitId,
        rating: 4,
      });
    });
  });

  it("should display existing user rating", () => {
    // API returns just the rating number (1-5), not the full document
    mockUserRating.mockReturnValue(5);

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

  it("should not call submitRating when clicking same rating as existing", async () => {
    const user = userEvent.setup();
    // API returns just the rating number (1-5), not the full document
    mockUserRating.mockReturnValue(3);

    render(
      <Rating
        userId={mockUserId}
        lessonId={mockLessonId}
        unitId={mockUnitId}
      />,
    );

    const stars = screen.getAllByRole("button", { name: /avaliar com/i });
    await user.click(stars[2]); // Click on 3rd star (same as existing)

    // Should not call submitRating since it's the same rating
    expect(mockSubmitRating).not.toHaveBeenCalled();
  });
});
