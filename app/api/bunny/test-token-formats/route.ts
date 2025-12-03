import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Testa TODOS os formatos possíveis de token do Bunny
 * 
 * O Bunny Stream tem diferentes formatos dependendo da configuração
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    }

    const libraryId = process.env.BUNNY_LIBRARY_ID!;
    const securityKey = process.env.BUNNY_EMBED_SECRET!;
    const expires = Math.floor(Date.now() / 1000) + 60 * 10;

    // Testar TODOS os formatos possíveis
    const formats = [
      {
        name: 'Format 1: libraryId + securityKey + expires + videoId',
        toSign: `${libraryId}${securityKey}${expires}${videoId}`,
      },
      {
        name: 'Format 2: securityKey + expires + videoId (no libraryId)',
        toSign: `${securityKey}${expires}${videoId}`,
      },
      {
        name: 'Format 3: securityKey + libraryId + expires + videoId',
        toSign: `${securityKey}${libraryId}${expires}${videoId}`,
      },
      {
        name: 'Format 4: videoId + securityKey + expires',
        toSign: `${videoId}${securityKey}${expires}`,
      },
      {
        name: 'Format 5: videoId + expires + securityKey',
        toSign: `${videoId}${expires}${securityKey}`,
      },
      {
        name: 'Format 6: expires + videoId + securityKey',
        toSign: `${expires}${videoId}${securityKey}`,
      },
    ];

    const results = await Promise.all(
      formats.map(async (format) => {
        const token = crypto.createHash('sha256').update(format.toSign).digest('hex');
        const testUrl = `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8?token=${token}&expires=${expires}`;

        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          return {
            format: format.name,
            token: token.substring(0, 20) + '...',
            status: response.status,
            works: response.ok,
            url: testUrl,
          };
        } catch (error) {
          return {
            format: format.name,
            token: token.substring(0, 20) + '...',
            status: 'ERROR',
            works: false,
            error: 'Fetch failed',
          };
        }
      })
    );

    const workingFormat = results.find((r) => r.works);

    return NextResponse.json({
      success: true,
      videoId,
      expires,
      libraryId,
      results,
      recommendation: workingFormat
        ? {
            status: 'FOUND',
            message: `✅ Found working format: ${workingFormat.format}`,
            format: workingFormat.format,
            token: workingFormat.token,
          }
        : {
            status: 'NOT_FOUND',
            message: '❌ None of the formats worked. Possible issues:',
            issues: [
              '1. Security Key is incorrect',
              '2. Token Authentication is not properly configured',
              '3. Video does not exist or is still processing',
              '4. Library ID is incorrect',
            ],
            nextSteps: [
              'Re-generate Security Key in Bunny Dashboard',
              'Copy the ENTIRE key (no spaces)',
              'Update BUNNY_EMBED_SECRET in .env.local',
              'Restart server',
            ],
          },
    });
  } catch (error) {
    console.error('Error in test-token-formats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

