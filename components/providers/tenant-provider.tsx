"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  TENANT_COOKIE_NAME,
  getTenantConfig,
  DEFAULT_TENANT_SLUG,
  extractSubdomain,
  type TenantConfig,
} from "@/lib/tenant";


/**
 * ============================================================================
 * TENANT CONTEXT PROVIDER
 *
 * Provides tenant information to all components in the app.
 * The tenant is resolved from:
 * 1. Cookie set by middleware (primary)
 * 2. Subdomain from window.location (fallback)
 *
 * It merges:
 * - Dynamic data from Convex (tenantId, status)
 * - Static config from tenants.config.ts (branding, content)
 * ============================================================================
 */

interface TenantContextType {
  // Dynamic data from Convex
  tenantId: Id<"tenants"> | null;
  tenantSlug: string | null;
  tenantName: string | null;
  tenantDisplayName: string | null; // Display name shown next to logo
  tenantLogoUrl: string | null;
  tenantPrimaryColor: string | null;

  // Static config from tenants.config.ts
  config: TenantConfig | null;

  // Status
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | null>(null);



interface TenantProviderProps {
  children: ReactNode;
  /** Optional: Pass tenant slug directly (for SSR or testing) */
  tenantSlug?: string;
}

/**
 * Read tenant slug from cookie
 */
function getTenantSlugFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const name = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (name === TENANT_COOKIE_NAME) {
      return value || null;
    }
  }
  return null;
}

/**
 * Basic slug format validation (not checking static config)
 */
function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug.toLowerCase());
}

/**
 * Extract tenant slug from window.location (fallback)
 */
function getTenantSlugFromLocation(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT_SLUG;

  const hostname = window.location.hostname;

  // Check for tenant override in URL params (development only)
  if (process.env.NODE_ENV === "development") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("tenant");
    if (override && isValidSlugFormat(override)) {
      return override;
    }
  }

  // Try to extract subdomain
  const subdomain = extractSubdomain(hostname);
  if (subdomain && isValidSlugFormat(subdomain)) {
    return subdomain;
  }

  return DEFAULT_TENANT_SLUG;
}

export function TenantProvider({
  children,
  tenantSlug: propSlug,
}: TenantProviderProps) {
  const slug = useMemo<string | null>(() => {
    // Priority 1: Use prop if provided
    if (propSlug) {
      if (isValidSlugFormat(propSlug)) {
        return propSlug;
      }
      return DEFAULT_TENANT_SLUG;
    }

    // Priority 2: Try cookie first (set by middleware)
    const cookieSlug = getTenantSlugFromCookie();
    if (cookieSlug && isValidSlugFormat(cookieSlug)) {
      return cookieSlug;
    }

    // Priority 3: Fallback to location-based detection
    const locationSlug = getTenantSlugFromLocation();
    if (isValidSlugFormat(locationSlug)) {
      return locationSlug;
    }

    // Priority 4: Use default tenant
    return DEFAULT_TENANT_SLUG;
  }, [propSlug]);
  // Fetch tenant data from Convex (for tenantId)
  const tenant = useQuery(api.tenants.getBySlug, slug ? { slug } : "skip");

  // Derive error state from tenant query results
  const error =
    slug && tenant === null
      ? `Tenant "${slug}" not found`
      : tenant && tenant.status === "suspended"
        ? "This organization is suspended"
        : null;

  // Get static config for this tenant
  const staticConfig = slug ? getTenantConfig(slug) : null;

  // Resolve primary color from Convex or static config
  const resolvedPrimaryColor =
    tenant?.primaryColor || staticConfig?.branding.primaryColor || null;

  // Inject primary color as CSS variable when it changes
  useEffect(() => {
    if (resolvedPrimaryColor) {
      document.documentElement.style.setProperty(
        "--blue-brand",
        resolvedPrimaryColor,
      );
    }

    // Cleanup: reset to default when component unmounts or color is removed
    return () => {
      // Only reset if we had set a custom color
      if (resolvedPrimaryColor) {
        // Reset to the default blue-brand color
        document.documentElement.style.removeProperty("--blue-brand");
      }
    };
  }, [resolvedPrimaryColor]);

  const contextValue: TenantContextType = {
    // Dynamic data from Convex
    tenantId: tenant?._id || null,
    tenantSlug: slug,
    tenantName: tenant?.name || staticConfig?.branding.name || null,
    tenantDisplayName:
      tenant?.displayName || staticConfig?.branding.name || null,
    tenantLogoUrl: tenant?.logoUrl || staticConfig?.branding.logo || null,
    tenantPrimaryColor: resolvedPrimaryColor,

    // Static config
    config: staticConfig,

    // Status
    isLoading: tenant === undefined && slug !== null,
    error,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access full tenant context
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (context === undefined || context === null) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

/**
 * Hook to get tenant ID or throw if not available
 * Use this in components that require a tenant
 */
export function useTenantId(): Id<"tenants"> {
  const tenant = useTenant();
  if (!tenant) {
    throw new Error("Tenant is not available");
  }
  if (!tenant.tenantId) {
    throw new Error("Tenant ID is not available");
  }
  return tenant.tenantId;
}

/**
 * Hook to safely get tenant ID (returns null if not available)
 */
export function useTenantIdSafe(): Id<"tenants"> | null {
  const tenant = useTenant();
  if (!tenant) return null;
  return tenant.tenantId;
}

/** 
 * Hook to get tenant branding
 */
export function useTenantBranding() {
  const tenant = useTenant();
  if (!tenant) return null;
  return tenant.config?.branding || null;
}

/**
 * Hook to get tenant content labels
 */
export function useTenantLabels() {
  const tenant = useTenant();
  if (!tenant) return null;
  return tenant.config?.content.labels || null;
}
