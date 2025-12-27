import { render, screen } from "@testing-library/react";
import RecentViews from "./recent-views";
import { api } from "@/convex/_generated/api";
import { Preloaded } from "convex/react";
import { describe, it, expect, vi } from "vitest";
import { Id } from "@/convex/_generated/dataModel";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock useCurrentUser
const mockUser = {
    _id: "user-123" as Id<"users"> | undefined,
    clerkUserId: "clerk-123",
};
vi.mock("@/hooks/useCurrentUser", () => ({
    useCurrentUser: () => ({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
    }),
}));

// Mock Convex hooks
vi.mock("convex/react", () => ({
    useQuery: vi.fn(() => []),
    usePreloadedQuery: vi.fn(() => []),
    useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
}));

describe("RecentViews", () => {
    it("should render with empty list", () => {
        render(<RecentViews preloadedRecentViews={null} />);
        expect(screen.getByText("Aulas Recentes")).toBeInTheDocument();
        expect(screen.getByText("Você ainda não assistiu nenhuma aula.")).toBeInTheDocument();
    });

    it("should render with preloaded data", () => {
        render(<RecentViews preloadedRecentViews={api.recentViews.getRecentViewsWithDetails as unknown as Preloaded<typeof api.recentViews.getRecentViewsWithDetails>} />);
        expect(screen.getByText("Aulas Recentes")).toBeInTheDocument();
    });
});     