import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint =
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
      process.env.IMAGEKIT_URL_ENDPOINT;

    if (!privateKey) {
      return NextResponse.json(
        { error: "ImageKit private key not configured" },
        { status: 500 },
      );
    }

    if (!publicKey) {
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

    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint,
    });
  } catch (error) {
    console.error("Error generating ImageKit auth:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication" },
      { status: 500 },
    );
  }
}
