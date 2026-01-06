import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Server-side watermark ID generation using HMAC-SHA256.
 *
 * Security properties:
 * - Non-reversible: HMAC is a one-way function
 * - Salted: Uses a server-side secret key as HMAC key
 * - Resistant to rainbow tables: The secret key prevents precomputation attacks
 * - Resistant to brute force: CPFs have limited entropy (~10^11 values),
 *   but the secret key prevents offline attacks
 *
 * The secret key WATERMARK_SECRET must be set in Convex environment variables.
 * Generate it with: openssl rand -hex 32
 */
export const generateWatermarkId = query({
  args: {
    cpf: v.string(),
  },
  handler: async (_ctx, args) => {
    const secret = process.env.WATERMARK_SECRET;

    if (!secret) {
      console.error(
        "WATERMARK_SECRET environment variable is not set. " +
          "Generate one with: openssl rand -hex 32",
      );
      // Return a fallback that indicates the issue without exposing details
      // This allows the app to work in development while flagging the issue
      throw new Error("Watermark configuration error");
    }

    // Clean CPF: remove all non-numeric characters for consistency
    const cleanedCpf = args.cpf.replace(/\D/g, "");

    // Validate CPF format (should be 11 digits)
    if (cleanedCpf.length !== 11) {
      // For invalid CPFs, still generate a deterministic ID but log the issue
      console.warn(`Invalid CPF length: ${cleanedCpf.length} digits`);
    }

    // Generate HMAC-SHA256 using Web Crypto API (works in Convex V8 runtime)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(cleanedCpf);

    // Import the secret as HMAC key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Sign the CPF with HMAC-SHA256
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Return first 8 characters (32 bits of entropy from the hash)
    // This provides ~4 billion unique values, sufficient for watermark identification
    // while keeping the display compact
    return hashHex.slice(0, 8).toUpperCase();
  },
});
