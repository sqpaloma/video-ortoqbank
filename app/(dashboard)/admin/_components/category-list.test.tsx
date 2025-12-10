import { render, screen } from "@testing-library/react";
import { CategoryList } from "./category-list";

describe("CategoryList", () => {
  it("should render", () => {
    render(<CategoryList categories={[]} />);
    expect(screen.getByText("Categorias")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
  });
});