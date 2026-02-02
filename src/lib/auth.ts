import { auth } from "@clerk/nextjs/server";

/**
 * Get the Convex auth token for server-side queries.
 * Returns undefined if no token is available.
 */
export async function getAuthToken() {
  const authResult = await auth();

  if (!authResult.userId) {
    return undefined;
  }

  try {
    const token = await authResult.getToken({ template: "convex" });

    if (token) {
      return token;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return undefined;
  }
}
