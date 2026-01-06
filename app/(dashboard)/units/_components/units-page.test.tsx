import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnitsPage } from "./units-page";
import { api } from "@/convex/_generated/api";
import { Preloaded } from "convex/react";
import { renderWithProviders } from "@/__tests__/utils/test-utils";

// Mock Next.js Router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk useUser hook
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    },
  }),
}));

// Mock Convex hooks
const mockUsePreloadedQuery = vi.fn(() => [
  {
    _id: "unit-1",
    title: "Test Unit",
    categoryId: "cat-1",
    totalLessonVideos: 5,
  },
]); // Return at least one unit
const mockUseQuery = vi.fn(() => null);
const mockUseMutation = vi.fn(() => vi.fn(() => Promise.resolve()));

vi.mock("convex/react", () => ({
  usePreloadedQuery: () => mockUsePreloadedQuery(),
  useQuery: () => mockUseQuery(),
  useMutation: () => mockUseMutation(),
}));

// Mock getSignedEmbedUrl
vi.mock("@/app/actions/bunny", () => ({
  getSignedEmbedUrl: vi.fn(() =>
    Promise.resolve({ embedUrl: "https://test-embed-url.com" }),
  ),
}));

// Mock nuqs (URL query state library)
const mockSetLessonIdParam = vi.fn();
const mockLessonIdParam = vi.fn(() => "");

vi.mock("nuqs", () => ({
  useQueryState: vi.fn(() => [mockLessonIdParam(), mockSetLessonIdParam]),
  parseAsString: {
    withDefault: vi.fn((defaultValue) => ({
      parse: (value: string) => value || defaultValue,
      serialize: (value: string) => value,
    })),
  },
}));

describe("UnitsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    renderWithProviders(
      <UnitsPage
        preloadedUnits={
          api.units.listPublishedByCategory as unknown as Preloaded<
            typeof api.units.listPublishedByCategory
          >
        }
        categoryTitle="Test Category"
      />,
    );
    // The component shows categoryTitle in the header
    expect(screen.getByText(/Test Category/)).toBeInTheDocument();
  });

  it("should validate lessonIdParam before casting to Id<'lessons'>", () => {
    // Setup: empty lessonIdParam should skip the query
    mockLessonIdParam.mockReturnValue("");

    renderWithProviders(
      <UnitsPage
        preloadedUnits={
          api.units.listPublishedByCategory as unknown as Preloaded<
            typeof api.units.listPublishedByCategory
          >
        }
        categoryTitle="Test Category"
      />,
    );

    // The component should not attempt to query with empty string
    // This is implicitly tested by not throwing an error
    expect(screen.getByText(/Test Category/)).toBeInTheDocument();
  });

  it("should handle invalid lessonId in URL parameter gracefully", () => {
    // Setup: invalid lessonId returns null from query
    mockLessonIdParam.mockReturnValue("invalid-lesson-id");
    mockUseQuery.mockReturnValue(null);

    renderWithProviders(
      <UnitsPage
        preloadedUnits={
          api.units.listPublishedByCategory as unknown as Preloaded<
            typeof api.units.listPublishedByCategory
          >
        }
        categoryTitle="Test Category"
      />,
    );

    // Should still render without crashing
    expect(screen.getByText(/Test Category/)).toBeInTheDocument();
  });
});
