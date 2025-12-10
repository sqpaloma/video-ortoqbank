import { render, screen } from "@testing-library/react";
import { LessonForm } from "./lesson-form";

describe("LessonForm", () => {
  it("should render", () => {
    render(<LessonForm modules={[]} />);
    expect(screen.getByText("Criar Nova Aula")).toBeInTheDocument();
    expect(screen.getByText("Módulo")).toBeInTheDocument();
    expect(screen.getByText("Título da Aula")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Número da Aula")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Video ID (opcional)")).toBeInTheDocument();
    expect(screen.getByText("Criar Aula")).toBeInTheDocument();
  });
});