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

    console.log("Server Action received:", {
      videoId,
      libraryId,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!videoId || !libraryId || !file) {
      return {
        success: false,
        error: "videoId, libraryId, and file are required",
      };
    }

    if (!file.size || file.size === 0) {
      return {
        success: false,
        error: "File is empty or invalid",
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

    console.log("Uploading video to Bunny:", {
      videoId,
      libraryId,
      fileSize: buffer.length,
      fileName: file.name,
      fileType: file.type,
    });

    // Upload to Bunny with proper headers
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
          "Content-Length": buffer.length.toString(),
        },
        body: buffer,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bunny upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return {
        success: false,
        error: `Bunny upload failed: ${response.status} ${response.statusText}`,
        detail: errorText,
      };
    }

    // Bunny upload API returns success without body on successful upload
    console.log("Video uploaded successfully to Bunny:", {
      status: response.status,
      videoId,
      libraryId,
    });

    return {
      success: true,
      message: "Video uploaded successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
