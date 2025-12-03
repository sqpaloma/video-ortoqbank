import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

// Configurar timeout maior para uploads
// Vercel Pro: até 300s, Hobby: até 10s
export const maxDuration = 300; // 5 minutos (máximo permitido em algumas plataformas)
export const runtime = 'nodejs'; // Usar Node.js runtime para uploads grandes

// Para Vercel, também precisamos configurar no vercel.json ou usar edge runtime
// Mas edge runtime não suporta arrayBuffer, então usamos nodejs

export async function PUT(req: Request) {
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

    // Get the file from the request body
    const fileBuffer = await req.arrayBuffer();

    console.log('Upload request received:', {
      videoId,
      libraryId,
      fileSize: fileBuffer.byteLength,
      hasApiKey: !!BUNNY_KEY,
    });

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      console.error('No file provided or empty file');
      return NextResponse.json(
        { error: 'No file provided or file is empty' },
        { status: 400 }
      );
    }

    // Upload to Bunny
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
    
    console.log('Uploading to Bunny:', {
      url: uploadUrl,
      fileSize: fileBuffer.byteLength,
      fileSizeMB: (fileBuffer.byteLength / (1024 * 1024)).toFixed(2),
    });

    try {
      // Fazer upload com timeout maior e sem limite de tamanho
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos

      const bunnyResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_KEY,
        },
        body: fileBuffer,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Bunny upload response:', {
        status: bunnyResponse.status,
        statusText: bunnyResponse.statusText,
        ok: bunnyResponse.ok,
        headers: Object.fromEntries(bunnyResponse.headers.entries()),
        environment: process.env.NODE_ENV,
        fileSizeMB: (fileBuffer.byteLength / (1024 * 1024)).toFixed(2),
      });

      if (!bunnyResponse.ok) {
        const errorText = await bunnyResponse.text();
        console.error('Bunny upload failed:', {
          status: bunnyResponse.status,
          statusText: bunnyResponse.statusText,
          error: errorText,
          url: uploadUrl,
        });
        return NextResponse.json(
          {
            error: 'Failed to upload to Bunny',
            detail: errorText,
            status: bunnyResponse.status,
            statusText: bunnyResponse.statusText,
          },
          { status: bunnyResponse.status }
        );
      }

      let result;
      const contentType = bunnyResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await bunnyResponse.json();
      } else {
        const text = await bunnyResponse.text();
        result = { message: text || 'Upload successful' };
      }

      console.log('Upload successful:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Upload completed successfully',
        data: result,
      });
    } catch (fetchError) {
      console.error('Network error during upload:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        environment: process.env.NODE_ENV,
        fileSizeMB: fileBuffer.byteLength ? (fileBuffer.byteLength / (1024 * 1024)).toFixed(2) : 'unknown',
      });
      
      // Verificar se é timeout
      if (fetchError instanceof Error && (fetchError.name === 'AbortError' || fetchError.message.includes('timeout'))) {
        return NextResponse.json(
          {
            error: 'Upload timeout - arquivo muito grande para upload via servidor',
            detail: 'Em produção, arquivos grandes podem exceder o timeout. Tente um arquivo menor ou faça upload em desenvolvimento.',
            suggestion: 'Para arquivos grandes, considere fazer upload direto do cliente para o Bunny',
          },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        {
          error: 'Network error during upload',
          detail: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

