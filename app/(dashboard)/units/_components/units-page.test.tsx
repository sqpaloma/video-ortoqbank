import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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
  { _id: "unit-1", title: "Test Unit" },
]); // Return at least one unit
const mockUseQuery = vi.fn(() => null);
const mockUseMutation = vi.fn(() => vi.fn(() => Promise.resolve()));

vi.mock("convex/react", () => ({
  usePreloadedQuery: (preloaded: unknown) => mockUsePreloadedQuery(preloaded),
  useQuery: (query: unknown, args?: unknown) => mockUseQuery(query, args),
  useMutation: (mutation: unknown) => mockUseMutation(mutation),
}));

// Mock getSignedEmbedUrl
vi.mock("@/app/actions/bunny", () => ({
  getSignedEmbedUrl: vi.fn(() => Promise.resolve("https://test-embed-url.com")),
}));

describe("UnitsPage", () => {
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
});
