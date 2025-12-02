import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Bunny webhook received:', body);

    // Bunny webhook structure varies, but typically includes:
    // - VideoGuid (or guid): the video ID
    // - Status: the current status
    // - ThumbnailFileName: thumbnail URL
    // - etc.

    const videoId = body.VideoGuid || body.guid || body.videoId;
    
    if (!videoId) {
      console.error('No videoId in webhook payload:', body);
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Determine status
    let status: 'uploading' | 'processing' | 'ready' | 'failed' = 'processing';
    
    if (body.Status === 4 || body.status === 'ready') {
      status = 'ready';
    } else if (body.Status === 5 || body.status === 'failed') {
      status = 'failed';
    } else if (body.Status === 3 || body.status === 'processing') {
      status = 'processing';
    } else if (body.Status === 2 || body.status === 'uploading') {
      status = 'uploading';
    }

    // Build thumbnail URL
    let thumbnailUrl: string | undefined;
    if (body.ThumbnailFileName) {
      const libraryId = process.env.BUNNY_LIBRARY_ID;
      thumbnailUrl = `https://vz-${libraryId}.b-cdn.net/${videoId}/${body.ThumbnailFileName}`;
    } else if (body.thumbnailUrl) {
      thumbnailUrl = body.thumbnailUrl;
    }

    // Build HLS URL
    let hlsUrl: string | undefined;
    if (status === 'ready') {
      const libraryId = process.env.BUNNY_LIBRARY_ID;
      hlsUrl = `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
    }

    // Build MP4 URLs if available
    let mp4Urls: Array<{ quality: string; url: string }> | undefined;
    if (body.AvailableResolutions) {
      const libraryId = process.env.BUNNY_LIBRARY_ID;
      mp4Urls = body.AvailableResolutions.split(',').map((res: string) => ({
        quality: res,
        url: `https://vz-${libraryId}.b-cdn.net/${videoId}/play_${res}.mp4`,
      }));
    }

    // Update video in Convex using public mutation
    try {
      await convex.mutation(api.videos.update, {
        videoId,
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(hlsUrl && { hlsUrl }),
        ...(mp4Urls && { mp4Urls }),
        status,
        metadata: body,
      });

      console.log(`Video ${videoId} updated successfully`);
    } catch (error) {
      console.error('Failed to update video in Convex:', error);
      // Don't fail the webhook, Bunny expects 200 OK
    }

    return NextResponse.json({ ok: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error in webhook:', error);
    // Return 200 OK even on error to prevent Bunny from retrying
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

