import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Server-side authorization utilities
 * Use these in Server Components, Server Actions, and middleware
 */

export type UserRole = "user" | "admin";

export interface AuthUser {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  imageUrl?: string;
  hasActiveYearAccess: boolean;
  paid: boolean;
}

/**
 * Get the current authenticated user from Convex (server-side)
 * Returns null if not authenticated or user not found
 *
 * SECURITY: Uses preloadQuery with Clerk auth token to properly authenticate
 * the Convex query. This ensures ctx.auth.getUserIdentity() works correctly.
 */
export async function getCurrentUserServer(): Promise<AuthUser | null> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  try {
    // Get the Clerk token for Convex authentication
    const token = await getToken({ template: "convex" });

    if (!token) {
      console.error("Failed to get Clerk token for Convex");
      return null;
    }

    // Use preloadQuery with authentication token
    // This properly passes the Clerk auth context to Convex
    const preloaded = await preloadQuery(api.users.current, {}, { token });

    const user = preloaded._valueJSON as unknown as AuthUser;

    if (!user) {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error("Error fetching user from Convex:", error);
    return null;
  }
}

/**
 * Check if the current user has admin role (server-side)
 * Use this in Server Components and Server Actions
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserServer();
  return user?.role === "admin";
}

/**
 * Require admin role or throw error (server-side)
 * Use this at the top of admin-only Server Components
 *
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdminServer(): Promise<AuthUser> {
  const user = await getCurrentUserServer();

  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }

  if (user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/**
 * Check if user has required role
 */
export async function hasRequiredRole(
  requiredRole: UserRole,
): Promise<boolean> {
  const user = await getCurrentUserServer();

  if (!user) {
    return false;
  }

  // Admin has access to everything
  if (user.role === "admin") {
    return true;
  }

  return user.role === requiredRole;
}
