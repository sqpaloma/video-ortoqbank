import { render, screen } from "@testing-library/react";
import RecentViews from "./recent-views";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Id } from "@/convex/_generated/dataModel";
import * as convexReact from "convex/react";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useCurrentUser
const mockUser = {
  _id: "user-123" as Id<"users">,
  clerkUserId: "clerk-123",
};
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock data that matches the expected return type
const mockRecentViewsData = [
  {
    _id: "view-1" as Id<"recentViews">,
    _creationTime: Date.now(),
    userId: "user-123" as Id<"users">,
    lessonId: "lesson-1" as Id<"lessons">,
    isCompleted: false,
    lesson: {
      _id: "lesson-1" as Id<"lessons">,
      title: "Test Lesson",
      thumbnailUrl: "https://example.com/thumb.jpg",
      categoryId: "cat-1" as Id<"categories">,
    },
    category: {
      _id: "cat-1" as Id<"categories">,
      title: "Test Category",
    },
  },
];

// Mock Convex hooks
const mockUseQuery = vi.fn();
const mockUsePreloadedQuery = vi.fn();

vi.mock("convex/react", async () => {
  const actual = await vi.importActual<typeof convexReact>("convex/react");
  return {
    ...actual,
    useQuery: () => mockUseQuery(),
    usePreloadedQuery: () => mockUsePreloadedQuery(),
    useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
  };
});

describe("RecentViews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with empty list when using runtime query", () => {
    mockUseQuery.mockReturnValue([]);
    render(<RecentViews preloadedRecentViews={null} />);
    expect(screen.getByText("Aulas Recentes")).toBeInTheDocument();
    expect(
      screen.getByText("Você ainda não assistiu nenhuma aula."),
    ).toBeInTheDocument();
  });

  it("should render with preloaded data", () => {
    mockUsePreloadedQuery.mockReturnValue(mockRecentViewsData);
    // For testing, we can pass a mock object as Preloaded data
    // The actual Preloaded type is opaque, but we just need a truthy value
    const mockPreloadedData = { _name: "preloaded" } as Preloaded<
      typeof api.recentViews.getRecentViewsWithDetails
    >;

    render(<RecentViews preloadedRecentViews={mockPreloadedData} />);

    expect(screen.getByText("Aulas Recentes")).toBeInTheDocument();
    expect(screen.getByText("Test Lesson")).toBeInTheDocument();
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("should render with empty preloaded data", () => {
    mockUsePreloadedQuery.mockReturnValue([]);
    const mockPreloadedData = { _name: "preloaded" } as Preloaded<
      typeof api.recentViews.getRecentViewsWithDetails
    >;

    render(<RecentViews preloadedRecentViews={mockPreloadedData} />);

    expect(screen.getByText("Aulas Recentes")).toBeInTheDocument();
    expect(
      screen.getByText("Você ainda não assistiu nenhuma aula."),
    ).toBeInTheDocument();
  });
});
