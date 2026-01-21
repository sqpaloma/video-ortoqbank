import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionProvider } from "./session-provider";

// Mock Convex useQuery hook
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => null), // Returns null by default (no role)
}));

// Mock tenant provider
vi.mock("./tenant-provider", () => ({
  useTenant: vi.fn(() => ({ tenantId: null })),
}));

describe("SessionProvider", () => {
  it("should render", () => {
    render(
      <SessionProvider>
        <div>Test Children</div>
      </SessionProvider>,
    );
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });
});
