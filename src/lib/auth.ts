import { auth } from "@clerk/nextjs/server";

/**
 * Get the Convex auth token for server-side queries.
 * Returns undefined if no token is available.
 */
export async function getAuthToken() {
  const token = (await (await auth()).getToken({ template: "convex" })) ?? undefined;
  
  // Debug: Log token info to help diagnose auth issues
  // TODO: Remove after fixing auth
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("[Auth Debug] Token issuer (iss):", payload.iss);
      console.log("[Auth Debug] Token audience (aud):", payload.aud);
      console.log("[Auth Debug] Expected CLERK_JWT_ISSUER_DOMAIN:", process.env.CLERK_JWT_ISSUER_DOMAIN);
    } catch {
      console.log("[Auth Debug] Could not decode token");
    }
  } else {
    console.log("[Auth Debug] No token returned from Clerk");
  }
  
  return token;
}
