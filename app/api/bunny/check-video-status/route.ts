import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { createBunnyUrlBuilder } from '@/lib/bunny-urls';

/**
 * POST /api/bunny/check-video-status
 * 
 * Verifica o status de um vídeo diretamente no Bunny e atualiza no Convex
 * Útil quando o webhook não foi chamado ou falhou
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoId, libraryId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    const libId = libraryId || process.env.BUNNY_LIBRARY_ID;
    if (!libId) {
      return NextResponse.json(
        { error: 'libraryId is required' },
        { status: 400 }
      );
    }

    const BUNNY_KEY = process.env.BUNNY_API_KEY;
    if (!BUNNY_KEY) {
      return NextResponse.json(
        { error: 'BUNNY_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Buscar status do vídeo no Bunny
    const infoUrl = `https://video.bunnycdn.com/library/${libId}/videos/${videoId}`;
    
    console.log('Checking video status from Bunny:', infoUrl);
    
    const bunnyResponse = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'AccessKey': BUNNY_KEY,
      },
    });
    
    if (!bunnyResponse.ok) {
      const errorText = await bunnyResponse.text();
      console.error('Bunny API error:', {
        status: bunnyResponse.status,
        error: errorText,
      });
      return NextResponse.json(
        { 
          error: 'Failed to get video info from Bunny', 
          detail: errorText,
        },
        { status: bunnyResponse.status }
      );
    }
    
    const videoInfo = await bunnyResponse.json();
    
    console.log('Video status from Bunny:', {
      videoId: videoInfo.guid,
      status: videoInfo.status,
      length: videoInfo.length,
    });

    // Converter status do Bunny para nosso formato
    // Status do Bunny: 0=queued, 1=processing, 2=encoding, 3=finished, 4=resolution finished (ready), 5=failed
    let status: 'uploading' | 'processing' | 'ready' | 'failed' = 'processing';
    
    if (videoInfo.status === 4) {
      status = 'ready';
    } else if (videoInfo.status === 5) {
      status = 'failed';
    } else if (videoInfo.status >= 1 && videoInfo.status <= 3) {
      status = 'processing';
    } else if (videoInfo.status === 0) {
      status = 'uploading';
    }

    // Construir URLs
    const urlBuilder = createBunnyUrlBuilder(libId);
    const thumbnailUrl = videoInfo.thumbnailFileName
      ? urlBuilder.getThumbnailUrl(videoId, videoInfo.thumbnailFileName)
      : undefined;
    
    const hlsUrl = status === 'ready' 
      ? urlBuilder.getHlsUrl(videoId)
      : undefined;

    const mp4Urls = videoInfo.availableResolutions
      ? urlBuilder.getMp4Urls(videoId, videoInfo.availableResolutions)
      : undefined;

    // Atualizar no Convex
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_CONVEX_URL not configured' },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    try {
      await convex.mutation(api.videos.update, {
        videoId,
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(hlsUrl && { hlsUrl }),
        ...(mp4Urls && { mp4Urls }),
        status,
        metadata: videoInfo,
      });

      console.log(`Video ${videoId} status updated to: ${status}`);

      return NextResponse.json({
        success: true,
        videoId,
        status,
        message: `Status atualizado para: ${status}`,
      });
    } catch (error) {
      console.error('Failed to update video in Convex:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update video in Convex',
          detail: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check video status',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

