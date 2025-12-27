import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnitsLessonsPage } from "./units-lessons-page";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { renderWithProviders } from "@/__tests__/utils/test-utils";

// Mock Convex hooks
const mockUsePreloadedQuery = vi.fn(() => []);
const mockUseQuery = vi.fn(() => null);
const mockUseMutation = vi.fn(() => vi.fn(() => Promise.resolve()));

vi.mock("convex/react", () => ({
  usePreloadedQuery: (preloaded: any) => mockUsePreloadedQuery(preloaded),
  useQuery: (query: any, args?: any) => mockUseQuery(query, args),
  useMutation: (mutation: any) => mockUseMutation(mutation),
  Preloaded: {} as any,
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
        preloadedCategories={api.categories.list as unknown as Preloaded<typeof api.categories.list>}
      />
    );
    expect(screen.getByText("Selecione uma categoria para começar")).toBeInTheDocument();
  });
}); 