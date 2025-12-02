import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { lessonId, currentTimeSec, durationSec } = await req.json();

    if (!lessonId || currentTimeSec === undefined || durationSec === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, currentTimeSec, durationSec' },
        { status: 400 }
      );
    }

    // Validate values
    if (currentTimeSec < 0 || durationSec <= 0) {
      return NextResponse.json(
        { error: 'Invalid time values' },
        { status: 400 }
      );
    }

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
      await convex.mutation(api.progress.saveVideoProgress, {
        userId: user.id,
        lessonId: lessonId as Id<'lessons'>,
        currentTimeSec: Math.floor(currentTimeSec),
        durationSec: Math.floor(durationSec),
      });

      return NextResponse.json({ success: true, message: 'Progress saved' });
    } catch (error) {
      console.error('Failed to save progress:', error);
      return NextResponse.json(
        { error: 'Failed to save progress', detail: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in save progress:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

