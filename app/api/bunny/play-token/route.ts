import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has access (payment/subscription)
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Convex URL' },
        { status: 500 }
      );
    }
    const convex = new ConvexHttpClient(convexUrl);
    
    try {
      // Check access by Clerk user ID
      const hasAccess = await convex.query(
        api.userAccess.checkUserHasVideoAccessByClerkId,
        { clerkUserId: clerkUser.id }
      );
      
      if (!hasAccess) {
        // In development, log but allow access for testing
        // In production, strictly deny access
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Access denied. You need an active subscription.' },
            { status: 403 }
          );
        } else {
          console.warn(`Access denied for user ${clerkUser.id}, but allowing in development mode`);
        }
      }
    } catch (accessError) {
      console.error('Error checking access:', accessError);
      // In development, allow access if query fails (user might not exist yet)
      // In production, deny access on error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Failed to verify access' },
          { status: 500 }
        );
      } else {
        console.warn('Access check failed, allowing in development mode');
      }
    }

    // Get environment variables
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const securityKey = process.env.BUNNY_EMBED_SECRET;

    if (!libraryId || !securityKey) {
      console.error('Missing Bunny environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate token with expiration (10 minutes)
    const expires = Math.floor(Date.now() / 1000) + 60 * 10;

    // According to Bunny Stream docs, the token format is:
    // SHA256(libraryId + securityKey + expires + videoId)
    const toSign = `${libraryId}${securityKey}${expires}${videoId}`;
    const token = crypto.createHash('sha256').update(toSign).digest('hex');

    // Build the signed URLs
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
    const hlsUrl = `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8?token=${token}&expires=${expires}`;

    return NextResponse.json({
      success: true,
      embedUrl,
      hlsUrl,
      expires,
      expiresAt: new Date(expires * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error in play-token:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

