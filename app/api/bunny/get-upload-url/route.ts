import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * GET /api/bunny/get-upload-url?videoId={videoId}&libraryId={libraryId}
 * 
 * Retorna a URL e headers necessários para fazer upload direto do cliente para o Bunny
 * Isso evita timeouts do servidor Next.js em produção
 */
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    const libraryId = url.searchParams.get('libraryId');

    if (!videoId || !libraryId) {
      return NextResponse.json(
        { error: 'videoId and libraryId are required' },
        { status: 400 }
      );
    }

    const BUNNY_KEY = process.env.BUNNY_API_KEY;

    if (!BUNNY_KEY) {
      console.error('Missing BUNNY_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Retorna a URL de upload e o header necessário
    // O cliente fará o upload diretamente para o Bunny
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      // Não enviamos a API key diretamente - o upload será feito via servidor
      // Mas podemos retornar a URL para o cliente fazer upload direto
      // Na verdade, precisamos fazer via servidor por segurança
      message: 'Use the upload endpoint for secure upload',
    });
  } catch (error) {
    console.error('Error in get-upload-url:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

