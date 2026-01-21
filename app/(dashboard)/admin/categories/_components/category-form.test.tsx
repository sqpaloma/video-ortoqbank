import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryForm } from "./category-form";

// Mock Convex useMutation hook
const mockCreateCategory = vi.fn(() => Promise.resolve());

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockCreateCategory),
}));

// Mock useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useErrorModal hook
vi.mock("@/hooks/use-error-modal", () => ({
  useErrorModal: () => ({
    error: { isOpen: false, title: "", message: "" },
    showError: vi.fn(),
    hideError: vi.fn(),
  }),
}));

describe("CategoryForm", () => {
  it("should render", () => {
    render(<CategoryForm />);
    expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Limpar")).toBeInTheDocument();
  });
});
