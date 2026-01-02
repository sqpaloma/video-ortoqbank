import { render, screen } from "@testing-library/react";
import { UnitCard } from "./unit-card";

describe("UnitCard", () => {
  it("should render", () => {
    render(
      <UnitCard
        title="Test Unit"
        description="Test Description"
        totalLessons={10}
      />,
    );
    expect(screen.getByText("Test Unit")).toBeInTheDocument();
  });
});
