import { createHash } from "crypto";

/**
 * Generate signed embed URL for Bunny Stream
 * @see https://docs.bunny.net/docs/stream-embed-token-authentication
 *
 * IMPORTANT: Only use this on the server (Server Components, API routes, etc.)
 * Never expose BUNNY_EMBED_TOKEN_KEY to the client!
 */
export function getSignedEmbedUrl(
  videoId: string,
  libraryId: string,
  expiresInSeconds: number = 3600,
): { embedUrl: string; expires: number } {
  const tokenKey = process.env.BUNNY_EMBED_TOKEN_KEY;
  if (!tokenKey) {
    throw new Error("BUNNY_EMBED_TOKEN_KEY not configured");
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const token = createHash("sha256")
    .update(tokenKey + videoId + expires)
    .digest("hex");

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

  return { embedUrl, expires };
}
