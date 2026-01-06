import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserInfos from "./user-infos";

// Mock Convex useQuery hook
const mockUseQuery = vi.fn();
const mockUseUser = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown, args?: unknown) => mockUseQuery(query, args),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => mockUseUser(),
}));

describe("UserInfos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        fullName: "Test User",
        imageUrl: null,
        primaryEmailAddress: { emailAddress: "test@example.com" },
      },
    });
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
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
    });
    mockUseQuery.mockReturnValue(undefined);
    render(<UserInfos />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("should render with custom props", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        fullName: "Custom User",
        imageUrl: null,
        primaryEmailAddress: { emailAddress: "custom@example.com" },
      },
    });
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
