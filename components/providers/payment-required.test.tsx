import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PaymentRequired } from "./payment-required";

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

// Mock Convex useQuery hook
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => true), // Return true (paid) by default
}));

describe("PaymentRequired", () => {
  it("should render with default props", () => {
    render(
      <PaymentRequired>
        <div>Test Children</div>
      </PaymentRequired>,
    );
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });

  it("should render with custom props", () => {
    render(
      <PaymentRequired redirectTo="/custom">
        <div>Test Children</div>
      </PaymentRequired>,
    );
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });
});
