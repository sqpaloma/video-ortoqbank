import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { processBunnyWebhook } from "./bunny/webhookHandler";

const http = httpRouter();

/**
 * Generate SHA256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Generate signed embed URL for Bunny Stream with token authentication
 * @see https://docs.bunny.net/docs/stream-embed-token-authentication
 *
 * Usage: GET /bunny/embed-token?videoId=xxx&libraryId=xxx
 */

// OPTIONS handler for CORS preflight
http.route({
  path: "/bunny/embed-token",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

http.route({
  path: "/bunny/embed-token",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const videoId = url.searchParams.get("videoId");
    const libraryId = url.searchParams.get("libraryId");

    if (!videoId || !libraryId) {
      return new Response(
        JSON.stringify({ error: "videoId and libraryId are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const tokenSecurityKey = process.env.BUNNY_EMBED_SECRET;
    if (!tokenSecurityKey) {
      return new Response(
        JSON.stringify({ error: "BUNNY_EMBED_SECRET not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    try {
      // Token expires in 1 hour
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;

      // Generate token: SHA256(token_security_key + video_id + expiration)
      const signatureString = tokenSecurityKey + videoId + expirationTime;
      const token = await sha256(signatureString);

      // Build signed embed URL
      const embedUrl = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expirationTime}`;

      return new Response(
        JSON.stringify({
          embedUrl,
          token,
          expires: expirationTime,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }),
});

/**
 * Create video in Bunny library
 * Usage: POST /bunny/create-video
 * Body: { title: string, createdBy: string }
 */
http.route({
  path: "/bunny/create-video",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { title, createdBy } = body;

      if (!title || !createdBy) {
        return new Response(
          JSON.stringify({ error: "Title and createdBy are required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const apiKey = process.env.BUNNY_API_KEY;
      const libraryId = process.env.BUNNY_LIBRARY_ID;

      if (!apiKey || !libraryId) {
        return new Response(
          JSON.stringify({ error: "Bunny credentials not configured" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Create video in Bunny
      const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
          method: "POST",
          headers: {
            AccessKey: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: "Bunny API error", detail: errorText }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const videoData = await response.json();
      const videoId = videoData.guid;

      // Save video to Convex database
      try {
        await ctx.runMutation(api.videos.create, {
          videoId: videoId,
          libraryId: libraryId,
          title: title,
          description: "",
          createdBy: createdBy,
          isPrivate: true,
          status: "uploading",
        });
      } catch (dbError) {
        console.error("Failed to save video to database:", dbError);
        // Video is created in Bunny but not saved in DB
        // Return success anyway so upload can proceed
      }

      return new Response(
        JSON.stringify({
          videoId: videoId,
          libraryId,
          title,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }),
});

// OPTIONS for CORS preflight
http.route({
  path: "/bunny/create-video",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

/**
 * Bunny Stream Webhook
 * Receives notifications when videos are processed
 * @see https://docs.bunny.net/docs/stream-webhooks
 * 
 * Configure in Bunny Dashboard:
 * URL: https://{your-deployment}.convex.site/bunny/webhook
 * Events: video.uploaded, video.encoded, video.failed
 */
http.route({
  path: "/bunny-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const signature = req.headers.get("X-Bunny-Signature");

      const result = await processBunnyWebhook(ctx, body, signature);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: error instanceof Error && error.message.includes("signature")
            ? 401
            : 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

export default http;
