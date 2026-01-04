"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Type declaration for playerjs library (loaded dynamically from Bunny CDN)
declare global {
  interface Window {
    playerjs?: {
      Player: new (element: HTMLIFrameElement) => PlayerJSPlayer;
    };
  }
}

interface PlayerJSPlayer {
  on(event: "ready", callback: () => void): void;
  on(event: "ended", callback: () => void): void;
  on(
    event: "timeupdate",
    callback: (data: { seconds: number; duration: number }) => void,
  ): void;
  off(event: string): void;
}

interface VideoPlayerWithWatermarkProps {
  embedUrl: string;
  userCpf: string;
  speed?: number; // Movement speed (pixels per frame), default 0.5
  onVideoEnd?: () => void; // Called when video ends
}

export function VideoPlayerWithWatermark({
  embedUrl,
  userCpf,
  speed = 0.5,
  onVideoEnd,
}: VideoPlayerWithWatermarkProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerJSPlayer | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: speed, y: speed * 0.7 }); // Slightly different speeds for natural movement
  const onVideoEndRef = useRef(onVideoEnd);

  // Keep onVideoEnd ref updated to avoid stale closures
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);

  // Initialize playerjs when iframe is ready
  const initializePlayer = useCallback(() => {
    if (!iframeRef.current || !window.playerjs || playerRef.current) return;

    const player = new window.playerjs.Player(iframeRef.current);
    playerRef.current = player;

    player.on("ready", () => {
      player.on("ended", () => {
        onVideoEndRef.current?.();
      });
    });
  }, []);

  // Load playerjs script and initialize player
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="playerjs-latest.min.js"]',
    );

    if (existingScript) {
      // Script already loaded, just initialize
      initializePlayer();
      return;
    }

    // Load playerjs script from Bunny CDN
    const script = document.createElement("script");
    script.src = "//assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.async = true;
    script.onload = () => {
      initializePlayer();
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup player reference
      if (playerRef.current) {
        playerRef.current.off("ended");
        playerRef.current = null;
      }
    };
  }, [initializePlayer]);

  // Re-initialize player when embedUrl changes (new video)
  useEffect(() => {
    // Reset player when URL changes
    if (playerRef.current) {
      playerRef.current.off("ended");
      playerRef.current = null;
    }

    // Small delay to ensure iframe has loaded
    const timeout = setTimeout(() => {
      if (window.playerjs) {
        initializePlayer();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [embedUrl, initializePlayer]);

  useEffect(() => {
    // Initialize position randomly
    const initPosition = () => {
      if (containerRef.current && watermarkRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const watermark = watermarkRef.current.getBoundingClientRect();
        positionRef.current = {
          x: Math.random() * (container.width - watermark.width),
          y: Math.random() * (container.height - watermark.height),
        };
      }
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      if (containerRef.current && watermarkRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const watermark = watermarkRef.current.getBoundingClientRect();

        const maxX = container.width - watermark.width;
        const maxY = container.height - watermark.height;

        // Update position
        positionRef.current.x += velocityRef.current.x;
        positionRef.current.y += velocityRef.current.y;

        // Bounce off edges
        if (positionRef.current.x <= 0 || positionRef.current.x >= maxX) {
          velocityRef.current.x *= -1;
          positionRef.current.x = Math.max(
            0,
            Math.min(maxX, positionRef.current.x),
          );
        }
        if (positionRef.current.y <= 0 || positionRef.current.y >= maxY) {
          velocityRef.current.y *= -1;
          positionRef.current.y = Math.max(
            0,
            Math.min(maxY, positionRef.current.y),
          );
        }

        // Apply position
        watermarkRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    // Start after a short delay to ensure refs are ready
    const timeout = setTimeout(() => {
      setMounted(true);
      initPosition();
      animationId = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationId);
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ position: "relative", paddingTop: "56.25%" }}
    >
      {/* Video iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        loading="lazy"
        style={{
          border: "none",
          position: "absolute",
          top: 0,
          height: "100%",
          width: "100%",
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        referrerPolicy="no-referrer"
      />

      {/* Watermark overlay - Continuous slow movement */}
      {mounted && (
        <div
          ref={watermarkRef}
          className="absolute pointer-events-none z-10"
          style={{
            top: 0,
            left: 0,
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            color: "white",
            fontFamily: "monospace",
            userSelect: "none",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            willChange: "transform",
          }}
        >
          <div>{userCpf}</div>
        </div>
      )}
    </div>
  );
}
