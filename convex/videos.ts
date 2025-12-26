import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./users";

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get video by Bunny videoId
 */
export const getByVideoId = query({
  args: { videoId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("videos"),
      _creationTime: v.number(),
      videoId: v.string(),
      libraryId: v.string(),
      title: v.string(),
      description: v.string(),
      thumbnailUrl: v.optional(v.string()),
      hlsUrl: v.optional(v.string()),
      mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
      status: v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      ),
      createdBy: v.string(),
      isPrivate: v.boolean(),
      metadata: v.optional(v.object({
        duration: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        framerate: v.optional(v.number()),
        bitrate: v.optional(v.number()),
        extras: v.optional(v.record(v.string(), v.any())),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    return video;
  },
});

/**
 * Get video by ID
 */
export const getById = query({
  args: { id: v.id("videos") },
  returns: v.union(
    v.object({
      _id: v.id("videos"),
      _creationTime: v.number(),
      videoId: v.string(),
      libraryId: v.string(),
      title: v.string(),
      description: v.string(),
      thumbnailUrl: v.optional(v.string()),
      hlsUrl: v.optional(v.string()),
      mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
      status: v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      ),
      createdBy: v.string(),
      isPrivate: v.boolean(),
      metadata: v.optional(v.object({
        duration: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        framerate: v.optional(v.number()),
        bitrate: v.optional(v.number()),
        extras: v.optional(v.record(v.string(), v.any())),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List all videos created by a user
 */
export const listByUser = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("videos"),
      _creationTime: v.number(),
      videoId: v.string(),
      libraryId: v.string(),
      title: v.string(),
      description: v.string(),
      thumbnailUrl: v.optional(v.string()),
      hlsUrl: v.optional(v.string()),
      mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
      status: v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      ),
      createdBy: v.string(),
      isPrivate: v.boolean(),
      metadata: v.optional(v.object({
        duration: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        framerate: v.optional(v.number()),
        bitrate: v.optional(v.number()),
        extras: v.optional(v.record(v.string(), v.any())),
      })),
    })
  ),
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.userId))
      .collect();

    return videos;
  },
});

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Create a new video record (called after Bunny video creation)
 */
export const create = mutation({
  args: {
    videoId: v.string(),
    libraryId: v.string(),
    title: v.string(),
    description: v.string(),
    createdBy: v.string(),
    isPrivate: v.boolean(),
    status: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      )
    ),
    thumbnailUrl: v.optional(v.string()),
    hlsUrl: v.optional(v.string()),
    mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
    metadata: v.optional(v.object({
      duration: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      framerate: v.optional(v.number()),
      bitrate: v.optional(v.number()),
    })),
  },
  returns: v.id("videos"),
  handler: async (ctx, args) => {
    // Check if video already exists
    const existing = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (existing) {
      throw new Error("Vídeo já existe no banco de dados");
    }

    const videoId: Id<"videos"> = await ctx.db.insert("videos", {
      videoId: args.videoId,
      libraryId: args.libraryId,
      title: args.title,
      description: args.description,
      createdBy: args.createdBy,
      isPrivate: args.isPrivate,
      status: args.status || "uploading",
      thumbnailUrl: args.thumbnailUrl,
      hlsUrl: args.hlsUrl,
      mp4Urls: args.mp4Urls,
      metadata: args.metadata,
    });

    return videoId;
  },
});

/**
 * Update video information (e.g., from webhook)
 */
export const update = mutation({
  args: {
    videoId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    hlsUrl: v.optional(v.string()),
    mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
    status: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      )
    ),
    metadata: v.optional(v.object({
      duration: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      framerate: v.optional(v.number()),
      bitrate: v.optional(v.number()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      throw new Error("Vídeo não encontrado");
    }

    type VideoMetadata = {
      duration?: number;
      width?: number;
      height?: number;
      framerate?: number;
      bitrate?: number;
      extras?: Record<string, unknown>;
    };

    const updates: Partial<{
      title: string;
      description: string;
      thumbnailUrl: string;
      hlsUrl: string;
      mp4Urls: Array<{ quality: string; url: string }>;
      status: "uploading" | "processing" | "ready" | "failed";
      metadata: VideoMetadata;
    }> = {};

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.thumbnailUrl !== undefined) updates.thumbnailUrl = args.thumbnailUrl;
    if (args.hlsUrl !== undefined) updates.hlsUrl = args.hlsUrl;
    if (args.mp4Urls !== undefined) updates.mp4Urls = args.mp4Urls;
    if (args.status !== undefined) updates.status = args.status;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await ctx.db.patch(video._id, updates);
    return null;
  },
});

/**
 * Delete a video record
 */
export const remove = mutation({
  args: { videoId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      throw new Error("Vídeo não encontrado");
    }

    await ctx.db.delete(video._id);
    return null;
  },
});

/**
 * Mark video as ready (admin only)
 * This is useful when videos are already processed in Bunny but status wasn't updated
 */
export const markAsReady = mutation({
  args: { videoId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      throw new Error("Vídeo não encontrado");
    }

    // Build HLS URL
    const libraryId = video.libraryId;
    const hlsUrl = `https://vz-${libraryId}.b-cdn.net/${args.videoId}/playlist.m3u8`;

    await ctx.db.patch(video._id, {
      status: "ready",
      hlsUrl: hlsUrl,
    });

    return null;
  },
});

/**
 * Get video status for polling
 * Returns just the status and basic info for UI updates
 */
export const getVideoStatus = query({
  args: { videoId: v.string() },
  returns: v.union(
    v.object({
      status: v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      ),
      hlsUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      return null;
    }

    return {
      status: video.status,
      hlsUrl: video.hlsUrl,
      thumbnailUrl: video.thumbnailUrl,
    };
  },
});

/**
 * Sync video info from Bunny manually (admin only)
 * Useful for debugging or if webhook fails
 */
export const syncFromBunny = mutation({
  args: { videoId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      throw new Error("Vídeo não encontrado no banco de dados");
    }

    const apiKey = process.env.BUNNY_API_KEY;
    if (!apiKey) {
      throw new Error("BUNNY_API_KEY não configurada");
    }

    // Fetch video info from Bunny API
    const response = await fetch(
      `https://video.bunnycdn.com/library/${video.libraryId}/videos/${args.videoId}`,
      {
        headers: {
          AccessKey: apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Falha ao buscar vídeo do Bunny: ${response.status}`);
    }

    const bunnyData = await response.json();

    // Map Bunny status to our schema
    let status: "uploading" | "processing" | "ready" | "failed" = "processing";
    if (bunnyData.status === 4) {
      status = "ready";
    } else if (bunnyData.status === 5) {
      status = "failed";
    }

    // Update video in database
    await ctx.db.patch(video._id, {
      status: status,
      hlsUrl:
        status === "ready"
          ? `https://vz-${video.libraryId}.b-cdn.net/${args.videoId}/playlist.m3u8`
          : undefined,
      thumbnailUrl: bunnyData.thumbnailFileName
        ? `https://vz-${video.libraryId}.b-cdn.net/${args.videoId}/${bunnyData.thumbnailFileName}`
        : undefined,
      metadata: {
        duration: bunnyData.length || undefined,
        width: bunnyData.width || undefined,
        height: bunnyData.height || undefined,
        framerate: bunnyData.framerate || undefined,
        bitrate: bunnyData.bitrate || undefined,
      },
    });

    return null;
  },
});

/**
 * List all videos (admin only)
 */
export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("videos"),
      _creationTime: v.number(),
      videoId: v.string(),
      libraryId: v.string(),
      title: v.string(),
      description: v.string(),
      thumbnailUrl: v.optional(v.string()),
      hlsUrl: v.optional(v.string()),
      mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
      status: v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      ),
      createdBy: v.string(),
      isPrivate: v.boolean(),
      metadata: v.optional(v.object({
        duration: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        framerate: v.optional(v.number()),
        bitrate: v.optional(v.number()),
        extras: v.optional(v.record(v.string(), v.any())),
      })),
    })
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("videos").take(100);
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for webhooks)
// ============================================================================

/**
 * Update video from webhook (internal only)
 */
export const updateFromWebhook = internalMutation({
  args: {
    videoId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    hlsUrl: v.optional(v.string()),
    mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
    status: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      )
    ),
    metadata: v.optional(v.object({
      duration: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      framerate: v.optional(v.number()),
      bitrate: v.optional(v.number()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .unique();

    if (!video) {
      console.warn(`Video ${args.videoId} not found in database`);
      return null;
    }

    type VideoMetadata = {
      duration?: number;
      width?: number;
      height?: number;
      framerate?: number;
      bitrate?: number;
      extras?: Record<string, unknown>;
    };

    const updates: Partial<{
      title: string;
      description: string;
      thumbnailUrl: string;
      hlsUrl: string;
      mp4Urls: Array<{ quality: string; url: string }>;
      status: "uploading" | "processing" | "ready" | "failed";
      metadata: VideoMetadata;
    }> = {};

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.thumbnailUrl !== undefined) updates.thumbnailUrl = args.thumbnailUrl;
    if (args.hlsUrl !== undefined) updates.hlsUrl = args.hlsUrl;
    if (args.mp4Urls !== undefined) updates.mp4Urls = args.mp4Urls;
    if (args.status !== undefined) updates.status = args.status;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await ctx.db.patch(video._id, updates);
    return null;
  },
});
