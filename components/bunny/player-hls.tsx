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
  autoSaveInterval?: number;
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

  // Check video status from Convex
  const videoInfo = useQuery(
    api.videos.getByVideoId,
    videoId ? { videoId } : 'skip'
  );

  // Fetch HLS URL with token
  useEffect(() => {
    if (!videoId) return;
    if (videoInfo && videoInfo.status !== 'ready') return;

    fetch(`/api/bunny/play-token?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.hlsUrl) {
          setHlsUrl(data.hlsUrl);
        }
      })
      .catch((err) => {
        console.error('Error loading video:', err);
      });
  }, [videoId, videoInfo]);

  // Setup HLS player
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;
    let timeoutId: NodeJS.Timeout;

    // Safety: remove loading after 10 seconds max
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    // Fallback: remove loading when video can play
    const handleCanPlay = () => {
      clearTimeout(timeoutId);
      setLoading(false);
    };
    const handleLoadedData = () => {
      clearTimeout(timeoutId);
      setLoading(false);
    };

    // Setup HLS playback
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
    }

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Progress tracking
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
        // Silent fail
      }
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;

      const currentTime = Math.floor(video.currentTime);
      const duration = Math.floor(video.duration);
      const progressPercent = video.currentTime / video.duration;

      if (onProgress) {
        onProgress(currentTime, duration);
      }

      if (currentTime > 0 && currentTime % autoSaveInterval === 0) {
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 900) {
          lastSaveTimeRef.current = now;
          saveProgress();
        }
      }

      if (progressPercent >= 0.9 && !completedRef.current) {
        completedRef.current = true;
        saveProgress();
        if (onComplete) {
          onComplete();
        }
      }
    };

    const handleEnded = () => {
      saveProgress();
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', saveProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', saveProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
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

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        playsInline
        preload="auto"
      />
    </div>
  );
}
