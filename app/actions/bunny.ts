"use server";

import { getSignedEmbedUrl as generateSignedUrl } from "@/lib/bunny";

/**
 * Server Action to get signed embed URL for Bunny Stream
 * Can be called from client components
 */
export async function getSignedEmbedUrl(
  videoId: string,
  libraryId: string,
): Promise<{ embedUrl: string; expires: number }> {
  return generateSignedUrl(videoId, libraryId);
}
