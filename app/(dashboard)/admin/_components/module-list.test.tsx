import { render, screen } from "@testing-library/react";
import { ModuleList } from "./module-list";

describe("ModuleList", () => {
  it("should render", () => {
    render(<ModuleList modules={[]} categories={[]} />);
    expect(screen.getByText("Módulos")).toBeInTheDocument();
  });
});