import { auth } from "@clerk/nextjs/server";

/**
 * Get the Convex auth token for server-side queries.
 * Returns undefined if no token is available.
 */
export async function getAuthToken() {
  console.log("========== SERVER AUTH DEBUG (getAuthToken) ==========");
  console.log("[Server] NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
  console.log("[Server] CLERK_JWT_ISSUER_DOMAIN:", process.env.CLERK_JWT_ISSUER_DOMAIN);
  
  const authResult = await auth();
  console.log("[Server] Clerk auth() userId:", authResult.userId);
  
  if (!authResult.userId) {
    console.log("[Server] ❌ No userId from Clerk auth()");
    console.log("=========================================================");
    return undefined;
  }
  
  try {
    console.log("[Server] Attempting getToken({ template: 'convex' })...");
    const token = await authResult.getToken({ template: "convex" });
    
    if (token) {
      console.log("[Server] ✅ Token received from Clerk");
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("[Server] Token payload:", JSON.stringify(payload, null, 2));
        console.log("[Server] Token issuer (iss):", payload.iss);
        console.log("[Server] Token audience (aud):", payload.aud);
        console.log("[Server] Token subject (sub):", payload.sub);
        console.log("[Server] Token expires:", new Date(payload.exp * 1000).toISOString());
        console.log("[Server] Expected Convex auth.config domain: https://clerk.ortoclub.com");
        console.log("[Server] Match?", payload.iss === "https://clerk.ortoclub.com" ? "✅ YES" : "❌ NO");
      } catch (decodeErr) {
        console.error("[Server] Failed to decode token:", decodeErr);
      }
      console.log("=========================================================");
      return token;
    } else {
      console.error("[Server] ❌ getToken({ template: 'convex' }) returned NULL!");
      console.error("[Server] This means JWT template 'convex' might not exist in Clerk!");
      
      // Try default token
      console.log("[Server] Trying getToken() without template...");
      const defaultToken = await authResult.getToken();
      if (defaultToken) {
        const payload = JSON.parse(atob(defaultToken.split(".")[1]));
        console.log("[Server] Default token issuer:", payload.iss);
      }
      console.log("=========================================================");
      return undefined;
    }
  } catch (error) {
    console.error("[Server] ❌ Error getting token:", error);
    console.log("=========================================================");
    return undefined;
  }
}
