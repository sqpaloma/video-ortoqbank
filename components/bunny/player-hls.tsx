'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface PlayerHlsProps {
  videoId: string;
  lessonId: Id<'lessons'>;
  className?: string;
  autoSaveInterval?: number; // seconds between auto-saves (default 15)
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

export default function PlayerHls({
  videoId,
  lessonId,
  className = '',
  autoSaveInterval = 15,
  onProgress,
  onComplete,
}: PlayerHlsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check video status from Convex
  const videoInfo = useQuery(
    api.videos.getByVideoId,
    videoId ? { videoId } : 'skip'
  );

  // Check video status before attempting to load
  useEffect(() => {
    if (videoInfo && videoInfo.status !== 'ready') {
      const statusMessages: Record<string, string> = {
        uploading: 'Vídeo ainda está sendo enviado. Aguarde...',
        processing: 'Vídeo ainda está sendo processado. Aguarde...',
        failed: 'Erro ao processar o vídeo. Por favor, tente novamente mais tarde.',
      };
      setError(statusMessages[videoInfo.status] || 'Vídeo não está pronto para reprodução');
      setLoading(false);
      return;
    }
  }, [videoInfo]);

  // Fetch HLS URL with token
  useEffect(() => {
    if (!videoId) return;
    
    // Don't try to load if video is not ready
    if (videoInfo && videoInfo.status !== 'ready') {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/bunny/play-token?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => {
        if (!r.ok) {
          return r.json().then((data) => {
            throw new Error(data.error || 'Failed to load video');
          });
        }
        return r.json();
      })
      .then((data) => {
        console.log('Play token response:', {
          success: data.success,
          hasHlsUrl: !!data.hlsUrl,
          hasEmbedUrl: !!data.embedUrl,
          expires: data.expires,
        });
        
        if (data.hlsUrl) {
          // Validate URL format
          try {
            const url = new URL(data.hlsUrl);
            if (!url.pathname.endsWith('.m3u8')) {
              console.warn('HLS URL does not end with .m3u8:', data.hlsUrl);
            }
            console.log('Setting HLS URL:', data.hlsUrl);
            setHlsUrl(data.hlsUrl);
          } catch (urlError) {
            console.error('Invalid HLS URL format:', data.hlsUrl, urlError);
            throw new Error('URL de vídeo inválida recebida do servidor');
          }
        } else {
          throw new Error('No HLS URL received');
        }
      })
      .catch((err) => {
        console.error('Error loading video:', err);
        console.error('Video ID:', videoId);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
        });
        setError(err.message || 'Não foi possível carregar o vídeo');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [videoId, videoInfo]);

  // Setup HLS player and progress tracking
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;

    const saveProgress = async () => {
      if (!video.duration || !lessonId) return;

      try {
        await fetch('/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            currentTimeSec: Math.floor(video.currentTime),
            durationSec: Math.floor(video.duration),
          }),
        });
      } catch (e) {
        console.error('Failed to save progress:', e);
      }
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;

      const currentTime = Math.floor(video.currentTime);
      const duration = Math.floor(video.duration);
      const progressPercent = video.currentTime / video.duration;

      // Call onProgress callback
      if (onProgress) {
        onProgress(currentTime, duration);
      }

      // Auto-save at intervals
      if (currentTime > 0 && currentTime % autoSaveInterval === 0) {
        const now = Date.now();
        // Prevent double-saving in the same second
        if (now - lastSaveTimeRef.current > 900) {
          lastSaveTimeRef.current = now;
          saveProgress();
        }
      }

      // Mark as completed when reaching 90%
      if (progressPercent >= 0.9 && !completedRef.current) {
        completedRef.current = true;
        saveProgress();
        if (onComplete) {
          onComplete();
        }
      }
    };

    const onPause = () => {
      // Save progress when user pauses
      saveProgress();
    };

    const onEnded = () => {
      // Save progress when video ends
      saveProgress();
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    };

    // Add error handlers for video element
    const onVideoError = (e: Event) => {
      console.error('Video element error:', e);
      const videoError = (e.target as HTMLVideoElement)?.error;
      const videoElement = e.target as HTMLVideoElement;
      
      if (videoError) {
        let errorMsg = 'Erro ao carregar vídeo';
        let suggestion = '';
        
        switch (videoError.code) {
          case videoError.MEDIA_ERR_ABORTED:
            errorMsg = 'Reprodução abortada';
            break;
          case videoError.MEDIA_ERR_NETWORK:
            errorMsg = 'Erro de rede ao carregar vídeo';
            suggestion = 'Verifique sua conexão com a internet';
            break;
          case videoError.MEDIA_ERR_DECODE:
            errorMsg = 'Erro ao decodificar vídeo';
            suggestion = 'O vídeo pode estar corrompido ou em formato não suportado';
            break;
          case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Formato de vídeo não suportado ou vídeo não disponível';
            suggestion = 'O vídeo pode ainda estar sendo processado. Verifique se o vídeo está pronto no Bunny Stream.';
            console.error('Video source URL:', videoElement?.src);
            console.error('HLS URL attempted:', hlsUrl);
            // Try to fetch the URL to see if it's accessible
            if (hlsUrl) {
              fetch(hlsUrl, { method: 'HEAD' })
                .then((response) => {
                  console.log('HLS URL accessibility check:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                  });
                })
                .catch((fetchError) => {
                  console.error('HLS URL fetch error:', fetchError);
                });
            }
            break;
        }
        
        console.error('Video error details:', {
          code: videoError.code,
          message: errorMsg,
          videoSrc: videoElement?.src,
          hlsUrl: hlsUrl,
          networkState: videoElement?.networkState,
          readyState: videoElement?.readyState,
        });
        
        setError(suggestion ? `${errorMsg}. ${suggestion}` : errorMsg);
      } else {
        console.error('Video error event but no error object available');
        setError('Erro desconhecido ao carregar vídeo');
      }
    };

    const onVideoLoadedMetadata = () => {
      console.log('Video metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
    };

    // Validate HLS URL before attempting to load
    if (!hlsUrl || !hlsUrl.includes('.m3u8')) {
      console.error('Invalid HLS URL:', hlsUrl);
      setError('URL de vídeo inválida');
      return;
    }

    console.log('Setting up HLS playback with URL:', hlsUrl);
    console.log('Browser HLS support:', {
      nativeHLS: video.canPlayType('application/vnd.apple.mpegurl'),
      hlsJsSupported: Hls.isSupported(),
    });

    // Setup HLS or native playback
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('Using native HLS playback');
      video.src = hlsUrl;
      video.addEventListener('error', onVideoError);
      video.addEventListener('loadedmetadata', onVideoLoadedMetadata);
      
      // Also add loadstart and canplay events for debugging
      video.addEventListener('loadstart', () => {
        console.log('Video loadstart event fired');
      });
      video.addEventListener('canplay', () => {
        console.log('Video canplay event fired');
      });
    } else if (Hls.isSupported()) {
      // Use hls.js for other browsers
      console.log('Using hls.js for playback');
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        debug: false,
        xhrSetup: (xhr, url) => {
          // Log requests for debugging
          console.log('HLS requesting:', url);
        },
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      
      // Add HLS event listeners for debugging
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
      });
      
      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('HLS level loaded:', data);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', {
          type: data.type,
          fatal: data.fatal,
          details: data.details,
          error: data.error,
          url: hlsUrl,
        });
        
        if (data.fatal) {
          setError(`Erro ao reproduzir vídeo: ${data.details || 'Erro desconhecido'}`);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...');
              try {
                hls?.startLoad();
              } catch (e) {
                console.error('Failed to recover from network error:', e);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...');
              try {
                hls?.recoverMediaError();
              } catch (e) {
                console.error('Failed to recover from media error:', e);
              }
              break;
            default:
              console.error('Fatal error, destroying HLS instance');
              hls?.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      setError('Seu navegador não suporta reprodução de vídeo HLS');
      return;
    }

    // Attach event listeners
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    
    // Add error handler for non-native HLS
    if (!video.canPlayType('application/vnd.apple.mpegurl')) {
      video.addEventListener('error', onVideoError);
      video.addEventListener('loadedmetadata', onVideoLoadedMetadata);
    }

    // Cleanup
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onVideoError);
      video.removeEventListener('loadedmetadata', onVideoLoadedMetadata);
      
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, lessonId, autoSaveInterval, onProgress, onComplete]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width: '100%', aspectRatio: '16/9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 rounded-lg ${className}`} style={{ width: '100%', aspectRatio: '16/9' }}>
        <div className="text-center p-4">
          <p className="text-destructive font-medium mb-2">Erro ao carregar vídeo</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">Verifique o console do navegador para mais detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        playsInline
        preload="metadata"
      />
    </div>
  );
}

