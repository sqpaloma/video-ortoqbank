import { render, screen } from "@testing-library/react";
import { LessonInfoSection } from "./lesson-info-section";

describe("LessonInfoSection", () => {
  it("should render the lesson info section", () => {
    render(<LessonInfoSection title="Test Title" description="Test Description" isCompleted={false} isFavorited={false} onMarkCompleted={() => {}} onToggleFavorite={() => {}} onNextLesson={() => {}} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });
});