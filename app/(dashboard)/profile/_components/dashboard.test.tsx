import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "./dashboard";

// Mock useCurrentUser hook
const mockUseCurrentUser = vi.fn();
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Mock Convex useQuery hook
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (query: unknown, args?: unknown) => mockUseQuery(query, args),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default data", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { clerkUserId: "test-user" },
      isLoading: false,
      isAuthenticated: true,
    });
    mockUseQuery
      .mockReturnValueOnce({ totalLessons: 10 }) // contentStats
      .mockReturnValueOnce(5) // completedCountResult
      .mockReturnValueOnce(3); // viewedCountResult

    render(<Dashboard />);
    expect(screen.getByText("Aulas Concluídas")).toBeInTheDocument();
    expect(screen.getByText("Progresso Geral")).toBeInTheDocument();
    expect(screen.getByText("Aulas Visualizadas")).toBeInTheDocument();
  });

  it("should render with custom props", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { clerkUserId: "test-user" },
      isLoading: false,
      isAuthenticated: true,
    });
    mockUseQuery
      .mockReturnValueOnce({ totalLessons: 20 }) // totalLessons
      .mockReturnValueOnce(10) // completedCountResult
      .mockReturnValueOnce(5); // viewedCountResult

    render(<Dashboard />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should render with loading state", () => {
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });
    mockUseQuery.mockReturnValue(undefined); // Loading state

    render(<Dashboard />);
    expect(screen.getByText("Aulas Concluídas")).toBeInTheDocument();
    expect(screen.getByText("Progresso Geral")).toBeInTheDocument();
    expect(screen.getByText("Aulas Visualizadas")).toBeInTheDocument();
  });
});
