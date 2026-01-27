/**
 * Tenant/Multi-tenancy utility functions.
 *
 * This module provides utilities for:
 * - Extracting subdomain from hostname
 * - Detecting localhost development subdomains
 * - Managing tenant cookies
 * - Getting tenant configuration
 */

import {
  DEFAULT_TENANT_SLUG,
  getTenantConfig,
  type TenantConfig,
} from "@/config/tenants.config";

/** Cookie name for storing the current tenant slug */
export const TENANT_COOKIE_NAME = "x-tenant-slug";

/** Cookie max age in seconds (1 year) */
export const TENANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Extract the subdomain from a hostname.
 *
 * Examples:
 * - "app1.localhost" -> "app1"
 * - "app1.localhost:3000" -> "app1"
 * - "teot.Ortoclub.com" -> "teot"
 * - "localhost:3000" -> null
 * - "Ortoclub.com" -> null
 * - "www.Ortoclub.com" -> null (www is treated as main domain)
 *
 * @param hostname - The full hostname (e.g., "app1.localhost:3000")
 * @returns The subdomain or null if none detected
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(":")[0]?.toLowerCase() ?? "";

  // Handle localhost subdomains (e.g., "app1.localhost")
  if (hostWithoutPort.endsWith(".localhost")) {
    const subdomain = hostWithoutPort.replace(".localhost", "");
    return subdomain || null;
  }

  // Handle production domains (e.g., "teot.Ortoclub.com")
  const parts = hostWithoutPort.split(".");

  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Skip common non-tenant subdomains
    if (subdomain === "www" || subdomain === "api") {
      return null;
    }

    return subdomain;
  }

  return null;
}

/**
 * Validate that a string *could* be a tenant slug.
 *
 * IMPORTANT:
 * - This does NOT check whether the tenant exists in Convex or in static config.
 * - This is used for cookie/subdomain resolution where tenants can be dynamic.
 */
export function isValidTenantSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();

  // Reserved / non-tenant subdomains
  if (normalized === "www" || normalized === "api") return false;

  // Basic slug constraints: lowercase, numbers, hyphen; 1..50 chars; no leading/trailing hyphen
  // Examples: "video1", "demo", "tenant-123"
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(normalized);
}

/**
 * Check if the hostname is a localhost subdomain.
 *
 * @param hostname - The full hostname
 * @returns True if it's a *.localhost subdomain
 */
export function isLocalhostSubdomain(hostname: string): boolean {
  const hostWithoutPort = hostname.split(":")[0];
  return hostWithoutPort.endsWith(".localhost");
}

/**
 * Check if the hostname is plain localhost (no subdomain).
 *
 * @param hostname - The full hostname
 * @returns True if it's just "localhost" or "localhost:port"
 */
export function isPlainLocalhost(hostname: string): boolean {
  const hostWithoutPort = hostname.split(":")[0];
  return hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1";
}

/**
 * Get the tenant slug from a hostname.
 * Returns the subdomain if found, otherwise falls back to default tenant.
 *
 * Note: This returns the actual subdomain from the hostname, even if it's not
 * in the static config. The static config is only used for UI branding fallbacks.
 * Tenant existence should be validated by querying the Convex database.
 *
 * @param hostname - The full hostname
 * @returns The tenant slug (subdomain or default)
 */
export function getTenantSlugFromHostname(hostname: string): string {
  const subdomain = extractSubdomain(hostname);

  // Return the subdomain if it exists and looks valid (basic validation only)
  if (subdomain && /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(subdomain)) {
    return subdomain;
  }

  return DEFAULT_TENANT_SLUG;
}

/**
 * Get full tenant context from hostname.
 * Includes both the slug and the static configuration.
 *
 * Note: The slug may be a dynamic tenant not in the static config.
 * The config will fall back to the default tenant's config in that case.
 *
 * @param hostname - The full hostname
 * @returns Object with slug and config
 */
export function getTenantFromHostname(hostname: string): {
  slug: string;
  config: TenantConfig;
  isDefault: boolean;
} {
  const subdomain = extractSubdomain(hostname);
  const isValidSlug = subdomain && isValidTenantSlug(subdomain);
  const slug = isValidSlug ? subdomain : DEFAULT_TENANT_SLUG;

  return {
    slug,
    config: getTenantConfig(slug),
    isDefault: !isValidSlug,
  };
}

/**
 * Build the tenant cookie options for setting the cookie.
 */
export function getTenantCookieOptions(): {
  name: string;
  maxAge: number;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
} {
  return {
    name: TENANT_COOKIE_NAME,
    maxAge: TENANT_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    // Secure only in production
    secure: process.env.NODE_ENV === "production",
  };
}

// Re-export types and functions from config for convenience
export {
  DEFAULT_TENANT_SLUG,
  getAllTenantSlugs,
  getTenantConfig,
  type TenantBranding,
  type TenantConfig,
  type TenantContent,
  type TenantSlug,
} from "@/config/tenants.config";
