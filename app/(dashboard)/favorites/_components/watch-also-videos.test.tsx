import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WatchAlsoVideos } from "./watch-also-videos";

// Mock Next.js Router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
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

// Mock Convex useMutation hook
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
}));

describe("WatchAlsoVideos", () => {
  it("should render the watch also videos", () => {
    render(<WatchAlsoVideos watchAlsoVideos={[]} />);
    expect(screen.getByText("Assista Também")).toBeInTheDocument();
    expect(
      screen.getByText("Não há novos vídeos disponíveis no momento."),
    ).toBeInTheDocument();
  });

  it("should render the watch also videos with data", () => {
    const mockVideos = [
      {
        _id: "video-1",
        title: "Test Video",
        description: "Test Description",
        duration: "10:00",
        level: "Básico" as const,
        categoryName: "Test Category",
        subthemeName: "Test Subtheme",
      },
    ];
    render(<WatchAlsoVideos watchAlsoVideos={mockVideos} />);
    expect(screen.getByText("Assista Também")).toBeInTheDocument();
    expect(screen.getByText("Test Video")).toBeInTheDocument();
  });

  it("should render the watch also videos with multiple videos", () => {
    const mockVideos = [
      {
        _id: "video-1",
        title: "Test Video 1",
        description: "Test Description 1",
        duration: "10:00",
        level: "Básico" as const,
        categoryName: "Test Category",
        subthemeName: "Test Subtheme",
      },
      {
        _id: "video-2",
        title: "Test Video 2",
        description: "Test Description 2",
        duration: "20:00",
        level: "Intermediário" as const,
        categoryName: "Test Category 2",
        subthemeName: "Test Subtheme 2",
      },
    ];
    render(<WatchAlsoVideos watchAlsoVideos={mockVideos} />);
    expect(screen.getByText("Test Video 1")).toBeInTheDocument();
    expect(screen.getByText("Test Video 2")).toBeInTheDocument();
  });
});
