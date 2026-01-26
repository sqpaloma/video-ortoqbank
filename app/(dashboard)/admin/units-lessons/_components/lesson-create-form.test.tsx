import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LessonForm } from "./lesson-create-form";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
  useAction: vi.fn(() => vi.fn(() => Promise.resolve())),
}));

// Mock Clerk useUser hook
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    },
    isLoaded: true,
    isSignedIn: true,
  }),
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

describe("LessonForm", () => {
  it("should render", () => {
    render(<LessonForm units={[]} />);
    expect(screen.getByText("Criar Aula")).toBeInTheDocument();
  });

  it("should render the unit select", () => {
    render(<LessonForm units={[]} />);
    expect(screen.getByLabelText("Unidade *")).toBeInTheDocument();
  });

  it("should render the title input", () => {
    render(<LessonForm units={[]} />);
    expect(screen.getByLabelText("Título *")).toBeInTheDocument();
  });

  it("should render the description textarea", () => {
    render(<LessonForm units={[]} />);
    expect(screen.getByLabelText("Descrição *")).toBeInTheDocument();
  });

  it("should render the submit button", () => {
    render(<LessonForm units={[]} />);
    expect(screen.getByText("Criar Aula")).toBeInTheDocument();
  });
});
