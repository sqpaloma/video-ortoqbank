"use server";

/**
 * Upload video file to Bunny
 * Server Action for secure video uploads
 */
export async function uploadVideoToBunny(formData: FormData) {
  try {
    const videoId = formData.get("videoId") as string;
    const libraryId = formData.get("libraryId") as string;
    const file = formData.get("file") as File;

    if (!videoId || !libraryId || !file) {
      return {
        success: false,
        error: "videoId, libraryId, and file are required",
      };
    }

    const apiKey = process.env.BUNNY_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "BUNNY_API_KEY not configured",
      };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Bunny
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
        },
        body: buffer,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: "Bunny upload failed",
        detail: errorText,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: "Video uploaded successfully",
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
