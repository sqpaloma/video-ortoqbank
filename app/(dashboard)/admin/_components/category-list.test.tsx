import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryList } from "./category-list";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
}));

describe("CategoryList", () => {
  it("should render", () => {
    render(<CategoryList categories={[]} />);
    expect(screen.getByText("Categorias Cadastradas")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma categoria cadastrada ainda."),
    ).toBeInTheDocument();
    expect(screen.getByText("Editar Ordem")).toBeInTheDocument();
  });
});
