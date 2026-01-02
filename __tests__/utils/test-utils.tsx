import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Id } from "@/convex/_generated/dataModel";

// Mock Next.js Router functions - can be used in vi.mock() calls
export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();
export const mockForward = vi.fn();
export const mockRefresh = vi.fn();
export const mockPrefetch = vi.fn();

export const createMockRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
  prefetch: mockPrefetch,
  pathname: "/",
  query: {},
  asPath: "/",
});

// Default mock implementations for use in vi.mock() calls
export const defaultMockUseQuery = vi.fn(() => null);
export const defaultMockUseMutation = vi.fn(() =>
  vi.fn(() => Promise.resolve()),
);
export const defaultMockUseConvexAuth = vi.fn(() => ({
  isLoading: false,
  isAuthenticated: true,
}));

export const defaultMockUseUser = vi.fn(() => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: "test-user-id",
    firstName: "Test",
    lastName: "User",
    fullName: "Test User",
    emailAddresses: [{ emailAddress: "test@example.com" }],
    primaryEmailAddress: { emailAddress: "test@example.com" },
  },
}));

export const defaultMockUseCurrentUser = vi.fn(() => ({
  isLoading: false,
  isAuthenticated: true,
  user: {
    _id: "user-123" as Id<"users">,
    clerkUserId: "clerk-123",
    name: "Test User",
    email: "test@example.com",
  },
}));

// Test Providers Component - wraps with SidebarProvider
// Other providers should be mocked at the hook level in test files
interface TestProvidersProps {
  children: ReactNode;
  sidebarDefaultOpen?: boolean;
}

export function TestProviders({
  children,
  sidebarDefaultOpen = true,
}: TestProvidersProps) {
  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      {children}
    </SidebarProvider>
  );
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  sidebarDefaultOpen?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { sidebarDefaultOpen, ...renderOptions }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders sidebarDefaultOpen={sidebarDefaultOpen}>
        {children}
      </TestProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Helper to reset all mocks
export function resetAllMocks() {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockBack.mockClear();
  mockForward.mockClear();
  mockRefresh.mockClear();
  mockPrefetch.mockClear();
  defaultMockUseQuery.mockClear();
  defaultMockUseMutation.mockClear();
  defaultMockUseConvexAuth.mockClear();
  defaultMockUseUser.mockClear();
  defaultMockUseCurrentUser.mockClear();
}

// Re-export everything from testing-library
export * from "@testing-library/react";
