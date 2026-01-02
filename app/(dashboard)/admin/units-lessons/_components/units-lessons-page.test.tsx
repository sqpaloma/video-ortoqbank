import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnitsLessonsPage } from "./units-lessons-page";
import { Preloaded, FunctionReference } from "convex/react";
import { api } from "@/convex/_generated/api";
import { renderWithProviders } from "@/__tests__/utils/test-utils";

// Mock Convex hooks
const mockUsePreloadedQuery = vi.fn(() => []);
const mockUseQuery = vi.fn(() => null);
const mockUseMutation = vi.fn(() => vi.fn(() => Promise.resolve()));

vi.mock("convex/react", () => ({
  usePreloadedQuery: <Query extends FunctionReference<"query">>(
    preloaded: Preloaded<Query>,
  ) => mockUsePreloadedQuery(preloaded),
  useQuery: <Query extends FunctionReference<"query">>(
    query: Query,
    args?: Record<string, unknown>,
  ) => mockUseQuery(query, args),
  useMutation: <Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
  ) => mockUseMutation(mutation),
  Preloaded: {} as unknown,
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

describe("UnitsLessonsPage", () => {
  it("should render", () => {
    renderWithProviders(
      <UnitsLessonsPage
        preloadedCategories={
          api.categories.list as unknown as Preloaded<
            typeof api.categories.list
          >
        }
      />,
    );
    expect(
      screen.getByText("Selecione uma categoria para começar"),
    ).toBeInTheDocument();
  });
});
