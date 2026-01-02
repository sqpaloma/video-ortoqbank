import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { renderWithProviders } from "@/__tests__/utils/test-utils";

// Mock Next.js usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("MobileBottomNav", () => {
  it("should render", () => {
    renderWithProviders(<MobileBottomNav />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Cursos")).toBeInTheDocument();
    expect(screen.getByText("Favoritos")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
  });
});
