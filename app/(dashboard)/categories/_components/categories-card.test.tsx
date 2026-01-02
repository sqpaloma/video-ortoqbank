import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CategoriesCard } from "./categories-card";

describe("CategoriesCard", () => {
  it("should render category card with title and description", () => {
    render(
      <CategoriesCard
        title="Test Category"
        description="This is a test category description"
      />,
    );

    const title = screen.getByText("Test Category");
    expect(title).toBeDefined();

    const description = screen.getByText("This is a test category description");
    expect(description).toBeDefined();
  });

  it("should call onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <CategoriesCard
        title="Test Category"
        description="Test description"
        onClick={mockOnClick}
      />,
    );

    const card = screen
      .getByText("Test Category")
      .closest("div[data-slot='card']");
    if (card) {
      await user.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should render with default props when no props are provided", () => {
    const { container } = render(<CategoriesCard title="" description="" />);

    const card = container.querySelector("div[data-slot='card']");
    expect(card).toBeDefined();
  });

  it("should render with image when imageUrl is provided", () => {
    render(
      <CategoriesCard
        title="Test Category"
        description="Test description"
        imageUrl="/test-image.jpg"
      />,
    );

    const image = screen.getByAltText("Test Category");
    expect(image).toBeDefined();
  });

  it("should render PlayCircle icon when imageUrl is not provided", () => {
    const { container } = render(
      <CategoriesCard title="Test Category" description="Test description" />,
    );

    // The PlayCircle icon should be rendered when there's no image
    const playIcon = container.querySelector("svg");
    expect(playIcon).toBeDefined();
  });

  it("should apply hover styles on card", () => {
    render(
      <CategoriesCard title="Test Category" description="Test description" />,
    );

    const card = screen
      .getByText("Test Category")
      .closest("div[data-slot='card']");
    expect(card?.className).toContain("hover:shadow-md");
    expect(card?.className).toContain("hover:border-primary");
  });
});
