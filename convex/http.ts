/**
 * Convex HTTP Router
 *
 * Only used for receiving webhooks from third parties.
 * For calling external APIs, use Convex actions instead.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { sha256Hex } from "./bunny/utils";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

// =============================================================================
// BUNNY STREAM WEBHOOK
// @see https://docs.bunny.net/docs/stream-webhook
// =============================================================================

type VideoStatus = "uploading" | "processing" | "ready" | "failed";

/**
 * Bunny Stream webhook status configuration
 * Single source of truth for status mapping
 */
const BUNNY_STATUS_CONFIG: Record<
  number,
  {
    name: string;
    status: VideoStatus;
    playable: boolean;
    skip?: boolean;
  }
> = {
  0: { name: "Queued", status: "processing", playable: false },
  1: { name: "Processing", status: "processing", playable: false },
  2: { name: "Encoding", status: "processing", playable: false },
  3: { name: "Finished", status: "ready", playable: true },
  4: { name: "Resolution Finished", status: "ready", playable: true },
  5: { name: "Failed", status: "failed", playable: false },
  6: { name: "Presigned Upload Started", status: "uploading", playable: false },
  7: {
    name: "Presigned Upload Finished",
    status: "processing",
    playable: false,
  },
  8: { name: "Presigned Upload Failed", status: "failed", playable: false },
  9: {
    name: "Captions Generated",
    status: "ready",
    playable: true,
    skip: true,
  },
  10: {
    name: "Title/Description Generated",
    status: "ready",
    playable: true,
    skip: true,
  },
};

const DEFAULT_STATUS = {
  name: "Unknown",
  status: "processing" as VideoStatus,
  playable: false,
};

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated": {
        try {
          // Prepare the data for Convex by ensuring proper types
          // Convert null to undefined for optional fields (Clerk uses null, Convex uses undefined)
          const userData = {
            id: event.data.id,
            first_name: event.data.first_name ?? undefined,
            last_name: event.data.last_name ?? undefined,
            email_addresses: event.data.email_addresses,
            image_url: event.data.image_url ?? undefined,
            public_metadata: {
              ...event.data.public_metadata,
              // Convert payment ID to string if it exists
              paymentId: event.data.public_metadata?.paymentId?.toString(),
            },
          };

          await ctx.runMutation(internal.users.upsertFromClerk, {
            data: userData,
          });

          // Handle claim token from invitation metadata or find by email
          if (
            event.type === "user.created" &&
            event.data.email_addresses?.[0]?.email_address
          ) {
            try {
              const email = event.data.email_addresses[0].email_address;
              console.log(`🔗 New user created: ${email}`);

              // Try to find and claim any paid orders for this email
              const result = await ctx.runMutation(
                internal.payments.claimOrderByEmail,
                {
                  email: email,
                  clerkUserId: event.data.id,
                },
              );

              console.log(`✅ Claim result:`, result);

              // Try to update email invitation status to accepted
              try {
                const invitation = await ctx.runQuery(
                  api.payments.findSentInvitationByEmail,
                  {
                    email: email,
                  },
                );

                if (invitation) {
                  await ctx.runMutation(
                    internal.payments.updateEmailInvitationAccepted,
                    {
                      invitationId: invitation._id,
                    },
                  );
                  console.log(
                    `✅ Updated invitation status to accepted for ${email}`,
                  );
                }
              } catch (invitationError) {
                console.error(
                  "Error updating invitation status:",
                  invitationError,
                );
                // Don't fail the webhook if this fails
              }
            } catch (linkError) {
              console.error("Error claiming order with token:", linkError);
              // Don't fail the whole webhook if linking fails
            }
          }
        } catch (error) {
          console.error("Error upserting user from Clerk", error);
        }

        break;
      }

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }

      default: {
        console.log("Ignored Clerk webhook event", event.type);
      }
    }

    return new Response(undefined, { status: 200 });
  }),
});

/**
 * Bunny Stream Webhook
 * Receives notifications when videos are processed
 *
 * Configure in Bunny Dashboard:
 * URL: https://{your-deployment}.convex.site/bunny-webhook
 */
http.route({
  path: "/bunny-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const signature = req.headers.get("X-Bunny-Signature");

      // Validate webhook signature if secret is configured
      const webhookSecret = process.env.BUNNY_WEBHOOK_SECRET;
      if (webhookSecret && signature) {
        const expectedSignature = await sha256Hex(
          webhookSecret + JSON.stringify(body),
        );
        if (signature !== expectedSignature) {
          return new Response(
            JSON.stringify({ error: "Invalid webhook signature" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }
      }

      const { VideoGuid, Status, VideoLibraryId } = body;
      const libraryId = String(VideoLibraryId);

      if (!VideoGuid || !VideoLibraryId) {
        return new Response(
          JSON.stringify({ error: "Missing VideoGuid or VideoLibraryId" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const config = BUNNY_STATUS_CONFIG[Status] ?? DEFAULT_STATUS;
      console.log(
        `[Bunny Webhook] Video ${VideoGuid}: ${config.name} (${Status})`,
      );

      // Skip non-critical status updates
      if (config.skip) {
        console.log(`[Bunny Webhook] ${config.name} - no update needed`);
        return new Response(
          JSON.stringify({ success: true, videoId: VideoGuid, skipped: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Fetch video details from Bunny API
      const apiKey = process.env.BUNNY_API_KEY;
      if (!apiKey) {
        throw new Error("BUNNY_API_KEY not configured");
      }

      const videoInfoResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${VideoGuid}`,
        {
          headers: {
            AccessKey: apiKey,
            Accept: "application/json",
          },
        },
      );

      if (videoInfoResponse.ok) {
        const videoInfo = await videoInfoResponse.json();

        await ctx.runMutation(internal.videos.updateFromWebhook, {
          videoId: VideoGuid,
          status: config.status,
          hlsUrl: config.playable
            ? `https://vz-${libraryId}.b-cdn.net/${VideoGuid}/playlist.m3u8`
            : undefined,
          metadata: {
            duration: videoInfo.length || undefined,
            width: videoInfo.width || undefined,
            height: videoInfo.height || undefined,
            framerate: videoInfo.framerate || undefined,
            bitrate: videoInfo.bitrate || undefined,
          },
        });
      } else {
        console.warn(`[Bunny Webhook] Could not fetch video details`);
        await ctx.runMutation(internal.videos.updateFromWebhook, {
          videoId: VideoGuid,
          status: config.status,
        });
      }

      console.log(
        `[Bunny Webhook] Updated video ${VideoGuid} → ${config.status}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          videoId: VideoGuid,
          status: config.status,
          bunnyStatus: config.name,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("[Bunny Webhook] Error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }),
});
// AsaaS webhook handler
http.route({
  path: "/webhooks/asaas",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get raw webhook body (but don't parse yet)
      const rawBody = await request.text();
      const timestamp = new Date().toISOString();

      // Validate webhook secret is configured
      const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error(
          "[AsaaS Webhook] Configuration error: ASAAS_WEBHOOK_SECRET not set",
          {
            timestamp,
            path: "/webhooks/asaas",
          },
        );
        return new Response("Server configuration error", { status: 500 });
      }

      // Validate webhook authentication using asaas-access-token header (AsaaS standard)
      const asaasAccessToken = request.headers.get("asaas-access-token");

      if (!asaasAccessToken) {
        console.error(
          "[AsaaS Webhook] Authentication failed: missing asaas-access-token header",
          {
            timestamp,
            path: "/webhooks/asaas",
          },
        );
        return new Response("Unauthorized - Missing authentication", {
          status: 401,
        });
      }

      // Strict validation: token must match exactly
      if (asaasAccessToken !== webhookSecret) {
        console.error("[AsaaS Webhook] Authentication failed: invalid token", {
          timestamp,
          path: "/webhooks/asaas",
          verified: false,
        });
        return new Response("Unauthorized - Invalid signature", {
          status: 401,
        });
      }

      console.log("[AsaaS Webhook] Authentication successful", {
        timestamp,
        path: "/webhooks/asaas",
        verified: true,
      });

      // Parse the body only after authentication is verified
      let body;
      let payment;
      try {
        body = JSON.parse(rawBody);
        payment = body.payment;
      } catch (parseError) {
        console.error("[AsaaS Webhook] JSON parsing error", {
          timestamp,
          error:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
        });
        return new Response("Invalid JSON payload", { status: 400 });
      }

      const { event, checkout } = body;

      // Log safe webhook metadata only (no PII/sensitive data)
      console.log("[AsaaS Webhook] Event received", {
        timestamp,
        event,
        paymentId: payment?.id,
        paymentStatus: payment?.status,
        checkoutId: checkout?.id,
      });

      // Process Asaas webhook events with switch case structure
      switch (event) {
        case "PAYMENT_CONFIRMED": // intentional fallthrough
        case "PAYMENT_RECEIVED": {
          try {
            console.log("[AsaaS Webhook] Processing payment event", {
              timestamp,
              event,
            });
            await ctx.runAction(internal.payments.processAsaasWebhook, {
              event,
              payment,
              rawWebhookData: body,
            });
          } catch (error) {
            console.error("[AsaaS Webhook] Payment processing error", {
              timestamp,
              event,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error; // Rethrow to propagate to outer catch for proper 500 response
          }
          break;
        }

        default: {
          console.log("[AsaaS Webhook] Event ignored", {
            timestamp,
            event,
          });
          return new Response("Event ignored", { status: 200 });
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[AsaaS Webhook] Processing error", {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

async function validateRequest(
  req: Request,
): Promise<WebhookEvent | undefined> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return undefined;
  }
}

export default http;
