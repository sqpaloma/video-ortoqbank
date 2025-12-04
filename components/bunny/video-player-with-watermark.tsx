"use client";

import { useEffect, useState, useMemo } from "react";

interface VideoPlayerWithWatermarkProps {
  videoId: string;
  libraryId: string;
  userName: string;
  userCpf: string;
}

export function VideoPlayerWithWatermark({
  videoId,
  libraryId,
  userName,
  userCpf,
}: VideoPlayerWithWatermarkProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate random position (10% to 80% to avoid edges)
  const randomPosition = useMemo(() => {
    const top = Math.floor(Math.random() * 70) + 10; // 10-80%
    const left = Math.floor(Math.random() * 70) + 10; // 10-80%
    return { top: `${top}%`, left: `${left}%` };
  }, [videoId]); // Regenerate when video changes

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
          ".convex.cloud",
          ".convex.site",
        );

        const response = await fetch(
          `${convexUrl}/bunny/embed-token?videoId=${videoId}&libraryId=${libraryId}`,
        );

        if (response.ok) {
          const data = await response.json();
          setEmbedUrl(data.embedUrl);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [videoId, libraryId]);

  if (loading) {
    return <div>Carregando vídeo...</div>;
  }

  if (!embedUrl) {
    return <div>Erro ao carregar vídeo</div>;
  }

  return (
    <div
      className="relative w-full"
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
      />

      {/* Watermark overlay - Random position */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          top: randomPosition.top,
          left: randomPosition.left,
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "white",
          fontFamily: "monospace",
          userSelect: "none",
        }}
      >
        <div>{userName}</div>
        <div style={{ opacity: 0.8 }}>CPF: {userCpf}</div>
      </div>
    </div>
  );
}
