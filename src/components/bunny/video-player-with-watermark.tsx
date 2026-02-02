"use client";

import { useState, useEffect, useRef } from "react";
import { EyeOff, Shield } from "lucide-react";
import {
  useVideoProtection,
  useBlockContextMenu,
  type ProtectionReason,
} from "@/src/hooks/useVideoProtection";

interface VideoPlayerWithWatermarkProps {
  embedUrl: string;
  /**
   * Pre-computed watermark identifier.
   * This should be fetched from the server using the `api.watermark.generateWatermarkId`
   * query, which computes an HMAC-SHA256 hash of the user's CPF with a server-side secret.
   *
   * The watermark ID is:
   * - Non-reversible: Cannot be used to recover the original CPF
   * - Cryptographically secure: Uses HMAC-SHA256 with a secret key
   * - Resistant to brute force: Secret key prevents offline attacks
   */
  watermarkId: string | undefined;
  speed?: number; // Movement speed (pixels per frame), default 0.5
  /** Enable video protection (default: true) */
  enableProtection?: boolean;
}

function getProtectionMessage(reason: ProtectionReason): string {
  switch (reason) {
    case "tab_hidden":
      return "Volte para a aba para continuar assistindo";
    case "window_blur":
      return "Clique na janela para continuar assistindo";
    case "devtools_open":
      return "Feche as ferramentas de desenvolvedor para continuar";
    default:
      return "Vídeo pausado por segurança";
  }
}

export function VideoPlayerWithWatermark({
  embedUrl,
  watermarkId,
  speed = 0.5,
  enableProtection = true,
}: VideoPlayerWithWatermarkProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: speed, y: speed * 0.7 }); // Slightly different speeds for natural movement

  // Video protection hooks
  const { isHidden, reason } = useVideoProtection({
    detectTabVisibility: enableProtection,
    detectWindowBlur: enableProtection,
    detectDevTools: enableProtection,
  });

  // Block right-click on video container
  useBlockContextMenu(
    enableProtection
      ? (containerRef as React.RefObject<HTMLElement | null>)
      : undefined,
  );

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
      {mounted && watermarkId && (
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
          <div>{watermarkId}</div>
        </div>
      )}

      {/* Protection overlay - shown when video should be hidden */}
      {isHidden && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95"
          style={{ position: "absolute" }}
        >
          <div className="flex flex-col items-center gap-4 text-white">
            {reason === "devtools_open" ? (
              <Shield className="h-16 w-16 text-yellow-400" />
            ) : (
              <EyeOff className="h-16 w-16 text-gray-400" />
            )}
            <p className="text-lg font-medium text-center px-4">
              {getProtectionMessage(reason)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
