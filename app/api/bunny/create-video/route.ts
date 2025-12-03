import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, description, isPrivate = true } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const BUNNY_KEY = process.env.BUNNY_API_KEY;
    const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

    if (!BUNNY_KEY || !LIBRARY_ID) {
      console.error('Missing Bunny environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const createUrl = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`;

    const payload = {
      title,
      ...(description && { description }),
      // ⚡ Otimizações para processamento mais rápido
      videoCodec: 'h264', // H.264 processa mais rápido que H.265
      quality: 'medium',   // Qualidade média = mais rápido
    };

    // Create video object in Bunny
    const bunnyResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': BUNNY_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!bunnyResponse.ok) {
      const errorText = await bunnyResponse.text();
      console.error('Bunny create failed:', {
        status: bunnyResponse.status,
        statusText: bunnyResponse.statusText,
        error: errorText,
        url: createUrl,
        payload,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create video in Bunny', 
          detail: errorText,
          status: bunnyResponse.status,
          statusText: bunnyResponse.statusText,
        },
        { status: bunnyResponse.status }
      );
    }

    const bunnyData = await bunnyResponse.json();
    console.log('Bunny video created:', bunnyData);

    // Save to Convex
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
      // Continue anyway - the video exists in Bunny
      return NextResponse.json({
        success: true,
        videoId: bunnyData.guid,
        libraryId: LIBRARY_ID,
        data: bunnyData,
        warning: 'Video created but not saved to database (missing Convex URL)',
      });
    }
    const convex = new ConvexHttpClient(convexUrl);
    
    try {
      await convex.mutation(api.videos.create, {
        videoId: bunnyData.guid,
        libraryId: LIBRARY_ID,
        title,
        description: description || '',
        createdBy: user.id,
        isPrivate,
        status: 'uploading',
      });
    } catch (convexError) {
      console.error('Failed to save video to Convex:', convexError);
      // Continue anyway - the video exists in Bunny
    }

    return NextResponse.json({
      success: true,
      videoId: bunnyData.guid,
      libraryId: LIBRARY_ID,
      data: bunnyData,
    });
  } catch (error) {
    console.error('Error in create-video:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

