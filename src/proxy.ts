import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  extractSubdomain,
  getTenantCookieOptions,
  isValidTenantSlug,
  TENANT_COOKIE_NAME,
  DEFAULT_TENANT_SLUG,
} from "@/src/lib/tenant";

/**
 * ============================================================================
 * MULTITENANCY PROXY (Next.js 16+)
 *
 * This proxy handles subdomain-based tenant resolution:
 * - tenant1.Ortoclub.com -> tenantSlug = "tenant1"
 * - app.Ortoclub.com -> tenantSlug = "app" (default tenant)
 * - localhost:3000 -> tenantSlug = "app" (development)
 * - demo.localhost:3000 -> tenantSlug = "demo" (development subdomain)
 *
 * The tenant slug is stored in a cookie for client-side access.
 * ============================================================================
 */

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/checkout(.*)",
  "/api/webhooks(.*)",
  "/purchase(.*)",
  "/test-client-auth", // Temporary: for auth debugging
]);

// Define webhook routes that should bypass authentication
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // ==========================================================================
  // TENANT DETECTION
  // Extract subdomain from hostname and set tenant cookie
  // ==========================================================================
  // Prefer forwarded host (Vercel/proxies), fall back to direct host.
  // Note: forwarded host can be a comma-separated list.
  const hostname = (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000"
  )
    .split(",")[0]
    .trim();
  const subdomain = extractSubdomain(hostname);

  // Determine the tenant slug
  const tenantSlug =
    subdomain && isValidTenantSlug(subdomain) ? subdomain : DEFAULT_TENANT_SLUG;

  // For development, allow tenant override via query parameter
  let finalTenantSlug = tenantSlug;
  const tenantOverride = req.nextUrl.searchParams.get("tenant");
  if (tenantOverride && process.env.NODE_ENV === "development") {
    finalTenantSlug = isValidTenantSlug(tenantOverride)
      ? tenantOverride
      : tenantSlug;
  }

  // Get existing tenant cookie
  const existingTenantCookie = req.cookies.get(TENANT_COOKIE_NAME);

  // ==========================================================================
  // WEBHOOK ROUTES - Skip authentication
  // ==========================================================================
  if (isWebhookRoute(req)) {
    const response = NextResponse.next();

    // Set tenant cookie if changed or not present
    if (existingTenantCookie?.value !== finalTenantSlug) {
      const cookieOptions = getTenantCookieOptions();
      response.cookies.set(TENANT_COOKIE_NAME, finalTenantSlug, {
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
      });
    }

    return response;
  }

  // ==========================================================================
  // PROTECTED ROUTES - Require authentication
  // ==========================================================================
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // ==========================================================================
  // SET TENANT COOKIE ON RESPONSE
  // ==========================================================================
  const response = NextResponse.next();

  // Set tenant cookie if changed or not present
  if (existingTenantCookie?.value !== finalTenantSlug) {
    const cookieOptions = getTenantCookieOptions();
    response.cookies.set(TENANT_COOKIE_NAME, finalTenantSlug, {
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
    });

    // Log tenant detection for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Tenant] Detected tenant: ${finalTenantSlug} (subdomain: ${subdomain || "none"}, host: ${hostname})`,
      );
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
