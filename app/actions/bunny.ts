"use server";

import { getSignedEmbedUrl as generateSignedUrl } from "@/lib/bunny";

/**
 * Server Action to get signed embed URL for Bunny Stream
 * Can be called from client components
 */
export async function getSignedEmbedUrl(
  videoId: string,
  libraryId: string
): Promise<{ embedUrl: string; expires: number }> {
  return generateSignedUrl(videoId, libraryId);
}

/**
 * Server Action to upload video file to Bunny Stream
 * Keeps the API key secure on the server
 */
export async function uploadVideoToBunny(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const videoId = formData.get("videoId") as string;
  const libraryId = formData.get("libraryId") as string;
  const file = formData.get("file") as File;

  if (!videoId || !libraryId || !file) {
    return { success: false, error: "Missing required fields" };
  }

  const apiKey = process.env.BUNNY_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BUNNY_API_KEY not configured" };
  }

  try {
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Bunny upload failed: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
