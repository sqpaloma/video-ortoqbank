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

// ============================================================================
// TENANT HOOKS MOCKS
// Use these to mock hooks from hooks/use-tenant-convex.ts
// ============================================================================

/**
 * Default mock for useTenantQuery - returns null by default
 * Override in tests: mockUseTenantQuery.mockReturnValue(yourData)
 */
export const mockUseTenantQuery = vi.fn(() => null);

/**
 * Default mock for useTenantMutation - returns a mock function
 * Override in tests: mockUseTenantMutation.mockReturnValue(yourMockFn)
 */
export const mockUseTenantMutation = vi.fn(() =>
  vi.fn(() => Promise.resolve()),
);

/**
 * Default mock for useTenantAction - returns a mock function
 */
export const mockUseTenantAction = vi.fn(() => vi.fn(() => Promise.resolve()));

/**
 * Default mock for useTenantReady - returns true by default
 */
export const mockUseTenantReady = vi.fn(() => true);

/**
 * Default mock for useCurrentTenantId - returns a mock tenant ID
 */
export const mockUseCurrentTenantId = vi.fn(
  () => "test-tenant-id" as Id<"tenants">,
);

/**
 * Default mock for useTenantPaginatedQuery
 */
export const mockUseTenantPaginatedQuery = vi.fn(() => ({
  results: [],
  status: "Exhausted" as const,
  loadMore: vi.fn(),
  isLoading: false,
}));

/**
 * Creates the mock object for vi.mock("@/hooks/use-tenant-convex")
 * Usage in test files:
 *
 * vi.mock("@/hooks/use-tenant-convex", () => createTenantHooksMock());
 *
 * Or with custom implementations:
 * vi.mock("@/hooks/use-tenant-convex", () => ({
 *   ...createTenantHooksMock(),
 *   useTenantQuery: vi.fn(() => myCustomData),
 * }));
 */
export const createTenantHooksMock = () => ({
  useTenantQuery: mockUseTenantQuery,
  useTenantMutation: mockUseTenantMutation,
  useTenantAction: mockUseTenantAction,
  useTenantReady: mockUseTenantReady,
  useCurrentTenantId: mockUseCurrentTenantId,
  useTenantPaginatedQuery: mockUseTenantPaginatedQuery,
});

// ============================================================================
// TENANT PROVIDER MOCKS
// Use these to mock hooks from components/providers/tenant-provider
// ============================================================================

/**
 * Default mock for useTenant - returns a complete tenant context
 */
export const mockUseTenant = vi.fn(() => ({
  tenantId: "test-tenant-id" as Id<"tenants">,
  tenantSlug: "test-tenant",
  tenantName: "Test Tenant",
  tenantDisplayName: "Test Tenant Display",
  tenantLogoUrl: null,
  tenantPrimaryColor: null,
  config: null,
  isLoading: false,
  error: null,
}));

/**
 * Creates the mock object for vi.mock("@/components/providers/tenant-provider")
 */
export const createTenantProviderMock = () => ({
  useTenant: mockUseTenant,
  useTenantId: vi.fn(() => "test-tenant-id" as Id<"tenants">),
  useTenantIdSafe: vi.fn(() => "test-tenant-id" as Id<"tenants">),
  useTenantBranding: vi.fn(() => null),
  useTenantLabels: vi.fn(() => null),
  TenantProvider: ({ children }: { children: ReactNode }) => children,
});

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
  // Tenant hooks mocks
  mockUseTenantQuery.mockClear();
  mockUseTenantMutation.mockClear();
  mockUseTenantAction.mockClear();
  mockUseTenantReady.mockClear();
  mockUseCurrentTenantId.mockClear();
  mockUseTenantPaginatedQuery.mockClear();
  mockUseTenant.mockClear();
}

// Re-export everything from testing-library
export * from "@testing-library/react";
