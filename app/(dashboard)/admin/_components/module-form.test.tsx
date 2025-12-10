import { render, screen } from "@testing-library/react";
import { ModuleForm } from "./module-form";

describe("ModuleForm", () => {
  it("should render", () => {
    render(<ModuleForm categories={[]} />);
    expect(screen.getByText("Módulo")).toBeInTheDocument();
    expect(screen.getByText("Categoria")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Criar Módulo")).toBeInTheDocument();
  });
});