import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
  it("should render", () => {
    render(<ProgressBar totalLessons={10} completedLessons={5} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should render with default props", () => {
    render(<ProgressBar totalLessons={0} completedLessons={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should render with custom props", () => {
    render(<ProgressBar totalLessons={20} completedLessons={10} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
