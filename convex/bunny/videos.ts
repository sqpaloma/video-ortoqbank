/**
 * Bunny Stream Video Management Actions
 *
 * Flow:
 * 1. Convex Action creates video in Bunny → returns videoId/libraryId
 * 2. Next.js Server Action uploads file to Bunny (keeps API key on server)
 * 3. Bunny processes and sends webhook
 * 4. Webhook updates Convex DB with video URLs
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Create a new video in Bunny Stream
 * Returns videoId and libraryId for the upload step
 */
export const createVideo = action({
  args: {
    title: v.string(),
    createdBy: v.string(),
  },
  returns: v.object({
    videoId: v.string(),
    libraryId: v.string(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      throw new Error(
        "Bunny credentials not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID)",
      );
    }

    // Create video slot in Bunny
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: args.title }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny API error: ${errorText}`);
    }

    const videoData = await response.json();
    const videoId = videoData.guid;

    // Save video record to Convex (status: uploading)
    await ctx.runMutation(api.videos.create, {
      videoId,
      libraryId,
      title: args.title,
      description: "",
      createdBy: args.createdBy,
      isPrivate: true,
      status: "uploading",
    });

    return { videoId, libraryId };
  },
});
