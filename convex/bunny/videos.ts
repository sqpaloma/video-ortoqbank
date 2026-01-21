/**
 * Bunny Stream Video Management Actions
 *
 * Flow:
 * 1. Admin links existing Bunny video by ID
 * 2. fetchVideoInfo retrieves video info including duration
 * 3. registerExistingVideo saves video record in Convex DB
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Type for video info returned by fetchVideoInfo
type VideoInfoResult = {
  videoId: string;
  libraryId: string;
  title: string;
  description: string;
  status: "uploading" | "processing" | "ready" | "failed";
  hlsUrl: string | undefined;
  duration: number | undefined;
  thumbnailUrl: string;
  existsInDatabase: boolean;
  width?: number;
  height?: number;
  framerate?: number;
};

/**
 * Fetch video information from Bunny Stream by video ID
 * First checks if video exists in our database, then fetches from Bunny API
 * Returns video details that can be used to populate form fields
 */
export const fetchVideoInfo = action({
  args: {
    videoId: v.string(),
  },
  returns: v.object({
    videoId: v.string(),
    libraryId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    hlsUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    thumbnailUrl: v.string(),
    existsInDatabase: v.boolean(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    framerate: v.optional(v.number()),
  }),
  handler: async (ctx, args): Promise<VideoInfoResult> => {
    const apiKey = process.env.BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      throw new Error(
        "Bunny credentials not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID)",
      );
    }

    // First, check if video exists in our database
    const existingVideo = await ctx.runQuery(api.videos.getByVideoId, {
      videoId: args.videoId,
    });

    if (existingVideo) {
      // Return data from our database
      return {
        videoId: existingVideo.videoId,
        libraryId: existingVideo.libraryId,
        title: existingVideo.title,
        description: existingVideo.description,
        status: existingVideo.status,
        hlsUrl: existingVideo.hlsUrl,
        duration: existingVideo.metadata?.duration,
        thumbnailUrl: `https://vz-${existingVideo.libraryId}.b-cdn.net/${existingVideo.videoId}/thumbnail.jpg`,
        existsInDatabase: true,
      };
    }

    // Fetch video info from Bunny API
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${args.videoId}`,
      {
        headers: {
          AccessKey: apiKey,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Vídeo não encontrado no Bunny");
      }
      const errorText = await response.text();
      throw new Error(`Erro ao buscar vídeo do Bunny: ${errorText}`);
    }

    const bunnyData = await response.json();

    // Map Bunny status to our schema
    let status: "uploading" | "processing" | "ready" | "failed" = "processing";
    if (bunnyData.status === 4) {
      status = "ready";
    } else if (bunnyData.status === 5) {
      status = "failed";
    } else if (bunnyData.status === 0 || bunnyData.status === 1) {
      status = "uploading";
    }

    // Generate URLs
    const hlsUrl =
      status === "ready"
        ? `https://vz-${libraryId}.b-cdn.net/${args.videoId}/playlist.m3u8`
        : undefined;

    const thumbnailUrl = `https://vz-${libraryId}.b-cdn.net/${args.videoId}/thumbnail.jpg`;

    return {
      videoId: args.videoId,
      libraryId,
      title: bunnyData.title || "",
      description: bunnyData.description || "",
      status,
      hlsUrl,
      duration: bunnyData.length || undefined,
      thumbnailUrl,
      existsInDatabase: false,
      // Additional metadata from Bunny
      width: bunnyData.width,
      height: bunnyData.height,
      framerate: bunnyData.framerate,
    };
  },
});

/**
 * Register an existing Bunny video in our database
 * Used when linking a video by ID that doesn't exist in our database yet
 */
export const registerExistingVideo = action({
  args: {
    tenantId: v.id("tenants"),
    videoId: v.string(),
    createdBy: v.string(),
  },
  returns: v.object({
    videoId: v.string(),
    alreadyExists: v.boolean(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ videoId: string; alreadyExists: boolean }> => {
    const apiKey = process.env.BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      throw new Error(
        "Bunny credentials not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID)",
      );
    }

    // Check if video already exists in database
    const existingVideo = await ctx.runQuery(api.videos.getByVideoId, {
      videoId: args.videoId,
    });

    if (existingVideo) {
      // Video already exists, just return the videoId
      return { videoId: args.videoId, alreadyExists: true };
    }

    // Fetch video info from Bunny API
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${args.videoId}`,
      {
        headers: {
          AccessKey: apiKey,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Vídeo não encontrado no Bunny");
      }
      const errorText = await response.text();
      throw new Error(`Erro ao buscar vídeo do Bunny: ${errorText}`);
    }

    const bunnyData = await response.json();

    // Map Bunny status to our schema
    let status: "uploading" | "processing" | "ready" | "failed" = "processing";
    if (bunnyData.status === 4) {
      status = "ready";
    } else if (bunnyData.status === 5) {
      status = "failed";
    } else if (bunnyData.status === 0 || bunnyData.status === 1) {
      status = "uploading";
    }

    // Generate HLS URL if ready
    const hlsUrl =
      status === "ready"
        ? `https://vz-${libraryId}.b-cdn.net/${args.videoId}/playlist.m3u8`
        : undefined;

    // Create video record in our database
    await ctx.runMutation(api.videos.create, {
      tenantId: args.tenantId,
      videoId: args.videoId,
      libraryId,
      title: bunnyData.title || "",
      description: bunnyData.description || "",
      createdBy: args.createdBy,
      isPrivate: true,
      status,
      hlsUrl,
      metadata: {
        duration: bunnyData.length || undefined,
        width: bunnyData.width || undefined,
        height: bunnyData.height || undefined,
        framerate: bunnyData.framerate || undefined,
      },
    });

    return { videoId: args.videoId, alreadyExists: false };
  },
});

export const deleteVideo = action({
  args: {
    videoId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      throw new Error(
        "Bunny credentials not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID)",
      );
    }

    // Check if video exists in our database
    const video = await ctx.runQuery(api.videos.getByVideoId, {
      videoId: args.videoId,
    });

    if (!video) {
      // Video doesn't exist in our database, nothing to delete
      console.warn(`Video ${args.videoId} not found in database, skipping`);
      return null;
    }

    // Delete video from Bunny CDN
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${args.videoId}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: apiKey,
          Accept: "application/json",
        },
      },
    );

    // Bunny returns 200 on success, 404 if video doesn't exist
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Bunny API error deleting video: ${errorText}`);
    }

    // Remove the video record from Convex database
    await ctx.runMutation(api.videos.remove, {
      videoId: args.videoId,
    });

    return null;
  },
});
