import { render, screen } from "@testing-library/react";
import { ModuleCard } from "./module-card";

describe("ModuleCard", () => {
  it("should render the module card", () => {
    render(<ModuleCard title="Test Title" description="Test Description" totalLessons={10} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("10 aulas")).toBeInTheDocument();
  });
});