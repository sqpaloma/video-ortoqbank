import type { WebhookEvent } from "@clerk/backend";
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

// Import env variables to make sure they're available
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET_2;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Initialize the Clerk client
const clerk = CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: CLERK_SECRET_KEY })
  : undefined;

// Check for required environment variables
if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}
if (!CONVEX_DEPLOY_KEY) {
  console.error(
    "Missing CONVEX_DEPLOY_KEY environment variable - required for webhook authentication",
  );
}

// Configurable timeout for Convex requests (in milliseconds)
const CONVEX_REQUEST_TIMEOUT = 10000; // 10 seconds

// Helper function to call Convex internal mutations
async function callConvexMutation(
  functionName: string,
  args: Record<string, unknown>,
) {
  if (!CONVEX_URL || !CONVEX_DEPLOY_KEY) {
    throw new Error("Missing Convex configuration");
  }

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    CONVEX_REQUEST_TIMEOUT,
  );

  try {
    const response = await fetch(`${CONVEX_URL}/api/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Convex-Client": "npm-@0.0.0",
        Authorization: `Convex ${CONVEX_DEPLOY_KEY}`,
      },
      body: JSON.stringify({
        path: functionName,
        args: args, // Pass args as an object directly, not wrapped in an array
        format: "convex_encoded_json",
      }),
      signal: controller.signal,
    });

    // Clear timeout on successful completion
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Convex mutation failed: ${error}`);
    }

    return response.json();
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Check if the error is due to abort/timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Convex mutation timed out after ${CONVEX_REQUEST_TIMEOUT}ms`,
      );
    }

    throw error;
  }
}

// This is the main webhook handler for Clerk events
export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (pathname !== "/api/webhooks/clerk") {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    // Get the request body and headers
    const payload = await request.text();
    const headersList = request.headers;

    // Extract Svix headers
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // Log webhook receipt
    console.log(`[Clerk Webhook] Received webhook with ID: ${svix_id}`);

    // Validate headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("[Clerk Webhook] Missing required Svix headers");
      return NextResponse.json(
        { success: false, error: "Missing required Svix headers" },
        { status: 400 },
      );
    }

    // Check for webhook secret
    if (!CLERK_WEBHOOK_SECRET) {
      console.error(
        "[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET_2 environment variable",
      );
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Check for Clerk API key and client
    if (!CLERK_SECRET_KEY || !clerk) {
      console.error(
        "[Clerk Webhook] Missing CLERK_SECRET_KEY environment variable",
      );
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Verify webhook signature
    const svixHeaders = {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    };

    let event;
    try {
      const webhook = new Webhook(CLERK_WEBHOOK_SECRET);
      event = webhook.verify(payload, svixHeaders) as WebhookEvent;
      console.log(`[Clerk Webhook] Event verified: type=${event.type}`);
    } catch (error) {
      console.error("[Clerk Webhook] Webhook verification failed:", error);
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    // Process the event based on type
    if (event.type === "user.created" || event.type === "user.updated") {
      console.log(`[Clerk Webhook] Processing ${event.type} event for user`);

      if (!CONVEX_URL || !CONVEX_DEPLOY_KEY) {
        console.error(
          "[Clerk Webhook] Convex not configured - missing NEXT_PUBLIC_CONVEX_URL or CONVEX_DEPLOY_KEY",
        );
        return NextResponse.json(
          {
            received: true,
            error: "Server configuration error",
          },
          { status: 200 },
        );
      }

      try {
        // Call Convex internal mutation to upsert the user
        await callConvexMutation("users:upsertFromClerk", {
          data: event.data,
        });

        console.log(`[Clerk Webhook] Successfully synced user to Convex`);

        // Claim any pending paid orders for this user's email
        // This links the order to the user and triggers access provisioning
        const primaryEmailAddress = event.data.email_addresses?.find(
          (addr) => addr.id === event.data.primary_email_address_id,
        );
        const primaryEmail = primaryEmailAddress?.email_address;
        if (primaryEmail) {
          // Mask email for logging to protect PII (e.g., "jo***@example.com")
          const maskedEmail = primaryEmail.replace(
            /^(.{2})(.*)(@.*)$/,
            (_, start, middle, domain) => `${start}${"*".repeat(Math.min(middle.length, 3))}${domain}`,
          );
          console.log(
            `[Clerk Webhook] Attempting to claim orders for user ${event.data.id} (email: ${maskedEmail})`,
          );
          try {
            await callConvexMutation("payments:claimOrderByEmail", {
              email: primaryEmail,
              clerkUserId: event.data.id,
            });
            console.log(
              `[Clerk Webhook] Successfully processed order claim for user ${event.data.id}`,
            );
          } catch (claimError) {
            // Log but don't fail the webhook - order claiming is not critical for user creation
            console.warn(
              `[Clerk Webhook] Error claiming orders for user ${event.data.id}:`,
              claimError,
            );
          }
        }
      } catch (error) {
        console.error("[Clerk Webhook] Error syncing user to Convex:", error);

        // Still return success to acknowledge the webhook
        return NextResponse.json(
          {
            received: true,
            error: "Error syncing user but acknowledged",
          },
          { status: 200 },
        );
      }
    } else if (event.type === "user.deleted") {
      console.log(`[Clerk Webhook] Processing user.deleted event`);

      if (!CONVEX_URL || !CONVEX_DEPLOY_KEY) {
        console.error(
          "[Clerk Webhook] Convex not configured - missing NEXT_PUBLIC_CONVEX_URL or CONVEX_DEPLOY_KEY",
        );
        return NextResponse.json(
          {
            received: true,
            error: "Server configuration error",
          },
          { status: 200 },
        );
      }

      try {
        // Call Convex internal mutation to delete the user
        await callConvexMutation("users:deleteFromClerk", {
          clerkUserId: event.data.id!,
        });

        console.log(`[Clerk Webhook] Successfully deleted user from Convex`);
      } catch (error) {
        console.error(
          "[Clerk Webhook] Error deleting user from Convex:",
          error,
        );

        // Still return success to acknowledge the webhook
        return NextResponse.json(
          {
            received: true,
            error: "Error deleting user but acknowledged",
          },
          { status: 200 },
        );
      }
    } else if (event.type === "session.created") {
      const { user_id, id: newSessionId } = event.data;

      // Validate new session ID
      if (!newSessionId) {
        console.error(
          "[Clerk Webhook] Missing session ID in webhook data",
          event.data,
        );
        return NextResponse.json(
          { error: "Invalid webhook data: missing session ID" },
          { status: 400 },
        );
      }

      console.log(
        `[Clerk Webhook] Processing session.created event for user ${user_id}, new session ${newSessionId}`,
      );

      try {
        // Verify Clerk API key permissions
        console.log(
          `[Clerk Webhook] API Key: ${CLERK_SECRET_KEY ? "Present (partial: " + CLERK_SECRET_KEY.slice(0, 5) + "...)" : "Missing"}`,
        );

        // Get all user sessions using Clerk SDK
        console.log(`[Clerk Webhook] Fetching sessions for user ${user_id}`);

        // Get all active sessions for the user
        let activeSessions = [];

        try {
          // First try without status filter in case there's an issue with the status parameter
          const allSessionsResponse = await clerk.sessions.getSessionList({
            userId: user_id,
          });

          console.log(
            `[Clerk Webhook] Raw sessions response:`,
            JSON.stringify(allSessionsResponse, undefined, 2).slice(0, 500) +
              "...",
          );

          // Filter manually to avoid any type issues
          activeSessions = allSessionsResponse.data.filter(
            (session) => session.status === "active",
          );

          console.log(
            `[Clerk Webhook] Found ${activeSessions.length} active sessions out of ${allSessionsResponse.data.length} total`,
          );
        } catch (sessionFetchError) {
          console.error(
            "[Clerk Webhook] Error fetching sessions:",
            sessionFetchError,
          );
          throw sessionFetchError;
        }

        // Explicitly log all session IDs and the one we're keeping
        console.log(`[Clerk Webhook] New session ID to keep: ${newSessionId}`);
        console.log(
          `[Clerk Webhook] All active session IDs: ${JSON.stringify(activeSessions.map((s) => s.id))}`,
        );

        // Sessions to revoke are all active sessions except the current one from this webhook event
        const sessionsToRevoke = activeSessions.filter(
          (session) => session.id !== newSessionId,
        );

        console.log(
          `[Clerk Webhook] Found ${sessionsToRevoke.length} sessions to revoke out of ${activeSessions.length} active sessions`,
        );
        console.log(
          `[Clerk Webhook] Sessions to revoke: ${JSON.stringify(sessionsToRevoke.map((s) => s.id))}`,
        );

        let revokedCount = 0;
        let failedCount = 0;

        // Revoke all sessions except the current one
        if (sessionsToRevoke.length > 0) {
          for (const session of sessionsToRevoke) {
            console.log(
              `[Clerk Webhook] Revoking session ${session.id} (Status: ${session.status})`,
            );
            try {
              // Use the clerk.sessions.revokeSession method with detailed error logging
              const revokeResponse = await clerk.sessions.revokeSession(
                session.id,
              );
              console.log(
                `[Clerk Webhook] Revoke response:`,
                JSON.stringify(revokeResponse, undefined, 2).slice(0, 200) +
                  "...",
              );

              revokedCount++;
              console.log(
                `[Clerk Webhook] Successfully revoked session ${session.id}`,
              );
            } catch (revokeError) {
              failedCount++;
              console.error(
                `[Clerk Webhook] Error revoking session ${session.id}:`,
                revokeError,
                typeof revokeError === "object"
                  ? JSON.stringify(revokeError)
                  : "",
              );
            }
          }

          console.log(
            `[Clerk Webhook] Enforced single session policy for user ${user_id}: Revoked ${revokedCount} sessions, Failed to revoke ${failedCount} sessions`,
          );
        } else {
          console.log(
            `[Clerk Webhook] No other active sessions to revoke for user ${user_id}`,
          );
        }
      } catch (error) {
        console.error(
          "[Clerk Webhook] Error processing session.created event:",
          error,
          typeof error === "object" ? JSON.stringify(error) : "",
        );

        // Still return success to acknowledge the webhook
        return NextResponse.json(
          {
            received: true,
            error: "Error processing webhook but acknowledged",
          },
          { status: 200 },
        );
      }
    } else {
      console.log(`[Clerk Webhook] Skipping event of type: ${event.type}`);
    }

    // Always return success to acknowledge webhook receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Clerk Webhook] Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
