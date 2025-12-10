import { render, screen } from "@testing-library/react";
import { CategoryForm } from "./category-form";

describe("CategoryForm", () => {
  it("should render", () => {
    render(<CategoryForm />);
    expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
    expect(screen.getByText("Limpar")).toBeInTheDocument();
    expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
  });
}); 