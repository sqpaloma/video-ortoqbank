import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserInfos from "./user-infos";

// Mock Convex useQuery hook
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown, args?: unknown) => mockUseQuery(query, args),
}));

describe("UserInfos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    mockUseQuery.mockReturnValue({
      _id: "user-123",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      role: "user",
    });
    render(<UserInfos />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should render with loading state", () => {
    // Mock useQuery to return undefined (loading state)
    mockUseQuery.mockReturnValue(undefined);
    render(<UserInfos />);
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("should render with custom props", () => {
    mockUseQuery.mockReturnValue({
      _id: "user-456",
      firstName: "Custom",
      lastName: "User",
      email: "custom@example.com",
      role: "admin",
    });
    render(<UserInfos />);
    expect(screen.getByText("Custom User")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });
});
