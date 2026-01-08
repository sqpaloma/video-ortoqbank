import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    // Trim whitespace from env vars to prevent signature mismatches
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
    const urlEndpoint = (
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
      process.env.IMAGEKIT_URL_ENDPOINT
    )?.trim();

    if (!privateKey) {
      console.error("[ImageKit Auth] Private key not configured");
      return NextResponse.json(
        { error: "ImageKit private key not configured" },
        { status: 500 },
      );
    }

    if (!publicKey) {
      console.error("[ImageKit Auth] Public key not configured");
      return NextResponse.json(
        { error: "ImageKit public key not configured" },
        { status: 500 },
      );
    }

    if (
      !urlEndpoint ||
      typeof urlEndpoint !== "string" ||
      urlEndpoint.trim() === ""
    ) {
      console.error("[ImageKit Auth] URL endpoint not configured");
      return NextResponse.json(
        {
          error:
            "ImageKit URL endpoint not configured. Please set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT or IMAGEKIT_URL_ENDPOINT environment variable.",
        },
        { status: 500 },
      );
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

    // ImageKit requires signature to be HMAC-SHA1(privateKey, token + expire.toString())
    // The expire must be converted to string for consistent signature generation
    const signaturePayload = token + expire.toString();
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(signaturePayload)
      .digest("hex");

    console.log("[ImageKit Auth] Generated auth params:", {
      token: token.substring(0, 8) + "...",
      expire,
      signatureLength: signature.length,
      publicKeyLength: publicKey.length,
      urlEndpoint,
    });

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint,
    });
  } catch (error) {
    console.error("[ImageKit Auth] Error generating auth:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication" },
      { status: 500 },
    );
  }
}
