import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * ROTA DE TESTE - Verificar Token de Autenticação
 * 
 * GET /api/bunny/test-token?videoId=VIDEO_ID
 * 
 * Testa se o token de autenticação está funcionando
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    }

    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const securityKey = process.env.BUNNY_EMBED_SECRET;

    // Verificar configuração
    const config = {
      hasLibraryId: !!libraryId,
      hasSecurityKey: !!securityKey,
      libraryIdValue: libraryId ? `${libraryId.substring(0, 3)}...` : 'NOT SET',
      securityKeyValue: securityKey ? `${securityKey.substring(0, 8)}...` : 'NOT SET',
    };

    if (!libraryId || !securityKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing configuration',
        config,
        instructions: {
          step1: 'Add BUNNY_LIBRARY_ID to .env.local',
          step2: 'Add BUNNY_EMBED_SECRET to .env.local',
          step3: 'Enable Token Authentication in Bunny Dashboard',
          where: 'Stream → Video Library → Security → Enable Token Authentication',
        },
      }, { status: 500 });
    }

    // Gerar token
    const expires = Math.floor(Date.now() / 1000) + 60 * 10;
    const toSign = `${libraryId}${securityKey}${expires}${videoId}`;
    const token = crypto.createHash('sha256').update(toSign).digest('hex');

    // URLs
    const hlsUrl = `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
    const hlsUrlWithToken = `${hlsUrl}?token=${token}&expires=${expires}`;

    // Testar acesso SEM token
    let withoutTokenResult;
    try {
      const response = await fetch(hlsUrl, { method: 'HEAD' });
      withoutTokenResult = {
        status: response.status,
        ok: response.ok,
        accessible: response.ok,
        message: response.ok 
          ? '⚠️ WARNING: Video is accessible WITHOUT token! Token Auth might be disabled.'
          : 'Video requires authentication (expected)',
      };
    } catch (error) {
      withoutTokenResult = {
        error: 'Failed to fetch',
        message: 'Could not test - might be CORS issue',
      };
    }

    // Testar acesso COM token
    let withTokenResult;
    try {
      const response = await fetch(hlsUrlWithToken, { method: 'HEAD' });
      withTokenResult = {
        status: response.status,
        ok: response.ok,
        accessible: response.ok,
        message: response.ok 
          ? '✅ Video is accessible WITH token'
          : '❌ Token authentication failed - check security key',
      };
    } catch (error) {
      withTokenResult = {
        error: 'Failed to fetch',
        message: 'Could not test - might be CORS issue or wrong token',
      };
    }

    return NextResponse.json({
      success: true,
      config,
      videoId,
      token: {
        value: `${token.substring(0, 16)}...`,
        expires,
        expiresAt: new Date(expires * 1000).toISOString(),
        formula: 'SHA256(libraryId + securityKey + expires + videoId)',
      },
      urls: {
        base: hlsUrl,
        withToken: hlsUrlWithToken,
      },
      tests: {
        withoutToken: withoutTokenResult,
        withToken: withTokenResult,
      },
      diagnosis: getDiagnosis(withoutTokenResult, withTokenResult),
    });
  } catch (error) {
    console.error('Error in test-token:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getDiagnosis(withoutToken: any, withToken: any): {
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  action: string;
} {
  // Se acessível sem token = Token Auth desabilitado
  if (withoutToken.accessible) {
    return {
      status: 'WARNING',
      message: 'Token Authentication is DISABLED',
      action: 'Go to Bunny Dashboard → Stream → Video Library → Security → Enable Token Authentication',
    };
  }

  // Se não acessível com token = Token inválido
  if (!withToken.accessible) {
    return {
      status: 'ERROR',
      message: 'Token Authentication is enabled but token is INVALID',
      action: 'Check BUNNY_EMBED_SECRET in .env.local. Get correct Security Key from: Dashboard → Stream → Video Library → Security → Security Key',
    };
  }

  // Se acessível com token = Tudo OK
  return {
    status: 'OK',
    message: 'Token Authentication is working correctly!',
    action: 'No action needed. Everything is configured properly.',
  };
}

