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
  console.log("========== SERVER AUTH DEBUG (getCurrentUserServer) ==========");
  console.log("[getCurrentUserServer] NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
  
  const { userId, getToken } = await auth();
  console.log("[getCurrentUserServer] Clerk userId:", userId);

  if (!userId) {
    console.log("[getCurrentUserServer] ❌ No userId from Clerk");
    console.log("==============================================================");
    return null;
  }

  try {
    // Get the Clerk token for Convex authentication
    console.log("[getCurrentUserServer] Getting token with template: 'convex'...");
    const token = await getToken({ template: "convex" });

    if (!token) {
      console.error("[getCurrentUserServer] ❌ Failed to get Clerk token for Convex");
      console.log("==============================================================");
      return null;
    }

    // Decode and log token
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("[getCurrentUserServer] ✅ Token received");
      console.log("[getCurrentUserServer] Token issuer:", payload.iss);
      console.log("[getCurrentUserServer] Token audience:", payload.aud);
    } catch {
      console.log("[getCurrentUserServer] Could not decode token");
    }

    // Use preloadQuery with authentication token
    console.log("[getCurrentUserServer] Calling preloadQuery(api.users.current)...");
    const preloaded = await preloadQuery(api.users.current, {}, { token });
    console.log("[getCurrentUserServer] ✅ preloadQuery completed");

    const user = preloaded._valueJSON as unknown as AuthUser;

    if (!user) {
      console.log("[getCurrentUserServer] ⚠️ User not found in Convex (null)");
      console.log("==============================================================");
      return null;
    }

    console.log("[getCurrentUserServer] ✅ User found:", user.email);
    console.log("==============================================================");
    return user as AuthUser;
  } catch (error) {
    console.error("[getCurrentUserServer] ❌ Error fetching user from Convex:", error);
    console.log("==============================================================");
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
