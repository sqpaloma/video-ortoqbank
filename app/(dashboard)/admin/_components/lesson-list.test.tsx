import { render, screen } from "@testing-library/react";
import { LessonList } from "./lesson-list";

describe("LessonList", () => {
  it("should render", () => {
    render(<LessonList lessons={[]} />);
    expect(screen.getByText("Aulas Cadastradas")).toBeInTheDocument();
  });
});