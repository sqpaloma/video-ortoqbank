'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Id } from '@/convex/_generated/dataModel';

interface PlayerHlsProps {
  videoId: string;
  lessonId: Id<'lessons'>;
  className?: string;
  autoSaveInterval?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

export default function PlayerHls({
  videoId,
  lessonId,
  className = '',
}: PlayerHlsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  // Buscar URL do vídeo
  useEffect(() => {
    if (!videoId) {
      setError('ID do vídeo não fornecido');
      setLoading(false);
      return;
    }

    console.log('Buscando URL para videoId:', videoId);

    fetch(`/api/bunny/play-token?videoId=${encodeURIComponent(videoId)}`)
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) throw new Error('Falha ao buscar URL');
        return res.json();
      })
      .then(data => {
        console.log('Dados recebidos completos:', data);
        
        if (data.hlsUrl) {
          console.log('✅ URL HLS encontrada:', data.hlsUrl);
          setHlsUrl(data.hlsUrl);
          setError(null);
        } else {
          console.error('❌ URL HLS não encontrada');
          console.error('Estrutura completa dos dados:', JSON.stringify(data, null, 2));
          throw new Error('URL HLS não encontrada na resposta');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar URL:', err);
        setError('Erro ao carregar URL do vídeo');
        setLoading(false);
      });
  }, [videoId]);

  // Configurar player quando temos a URL
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) {
      console.log('Aguardando URL ou elemento de vídeo...', { hlsUrl: !!hlsUrl, videoRef: !!videoRef.current });
      return;
    }

    console.log('Configurando player com URL:', hlsUrl);
    const video = videoRef.current;
    let hls: Hls | null = null;

    // Remover loading quando o vídeo estiver pronto
    const onCanPlay = () => {
      console.log('✅ Vídeo pronto para reproduzir');
      setLoading(false);
      setError(null);
    };

    const onError = () => {
      console.error('❌ Erro no elemento de vídeo');
      setLoading(false);
      setError('Erro ao carregar o vídeo');
    };

    // Timeout de segurança
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout: vídeo não carregou em 15s');
      setLoading(false);
    }, 15000);

    try {
      if (Hls.isSupported()) {
        console.log('✅ Usando HLS.js para browser');
        hls = new Hls({
          debug: true, // Ativar debug para ver o que acontece
          enableWorker: true,
        });

        console.log('Carregando source:', hlsUrl);
        hls.loadSource(hlsUrl);
        
        console.log('Anexando ao vídeo...');
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅✅✅ MANIFEST CARREGADO COM SUCESSO!');
          clearTimeout(timeout);
          setLoading(false);
          setError(null);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ Erro HLS:', {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            error: data.error,
            url: data.url,
          });
          
          if (data.fatal) {
            clearTimeout(timeout);
            setError(`Erro fatal: ${data.details}`);
            setLoading(false);
          }
        });

        // Outros eventos úteis
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log('✅ Nível HLS carregado');
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('✅ Usando HLS nativo (Safari)');
        video.src = hlsUrl;
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);
        video.addEventListener('loadedmetadata', () => {
          console.log('✅ Metadata carregada');
          clearTimeout(timeout);
          setLoading(false);
        });
      } else {
        console.error('❌ Navegador não suporta HLS');
        clearTimeout(timeout);
        setError('Seu navegador não suporta reprodução de vídeo');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Erro ao configurar player:', err);
      clearTimeout(timeout);
      setError('Erro ao configurar player');
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, loading]);

  return (
    <div className={`rounded-lg overflow-hidden relative ${className}`} style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
      {/* Sempre renderizar o vídeo */}
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        playsInline
        preload="auto"
      />
      
      {/* Overlay de loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-white">Carregando vídeo...</p>
            <p className="text-xs text-gray-300 mt-1">{videoId}</p>
          </div>
        </div>
      )}
      
      {/* Overlay de erro */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/90">
          <div className="text-center p-4">
            <p className="text-white font-medium mb-2">⚠️ {error}</p>
            <p className="text-xs text-gray-200 mb-4">VideoID: {videoId}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
