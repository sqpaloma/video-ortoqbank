import { auth } from "@clerk/nextjs/server";

/**
 * Get the Convex auth token for server-side queries.
 * Returns undefined if no token is available.
 */
export async function getAuthToken() {
  return (await (await auth()).getToken({ template: "convex" })) ?? undefined;
}
