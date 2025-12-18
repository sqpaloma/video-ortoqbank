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
  const [error, setError] = useState<string | null>(null);

  // Generate random position once (10% to 80% to avoid edges)
  const randomPosition = useMemo(() => {
    const top = Math.floor(Math.random() * 70) + 10; // 10-80%
    const left = Math.floor(Math.random() * 70) + 10; // 10-80%
    return { top: `${top}%`, left: `${left}%` };
  }, []); // Generate once per component mount

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
          ".convex.cloud",
          ".convex.site",
        );

        if (!convexUrl) {
          setError("NEXT_PUBLIC_CONVEX_URL não configurada");
          console.error("NEXT_PUBLIC_CONVEX_URL não está configurada");
          return;
        }

        console.log("Buscando token para vídeo:", {
          videoId,
          libraryId,
          url: `${convexUrl}/bunny/embed-token?videoId=${videoId}&libraryId=${libraryId}`,
        });

        const response = await fetch(
          `${convexUrl}/bunny/embed-token?videoId=${videoId}&libraryId=${libraryId}`,
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Token recebido com sucesso:", data);
          setEmbedUrl(data.embedUrl);
        } else {
          const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
          console.error("Erro ao buscar token:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setError(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Erro ao buscar signed URL:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [videoId, libraryId]);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error || !embedUrl) {
    return (
      <div className="bg-red-50 rounded-lg aspect-video flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-900 font-semibold mb-2">Erro ao carregar vídeo</p>
          <p className="text-red-700 text-sm mb-4">{error || "Token não recebido"}</p>
          <details className="text-left bg-white p-3 rounded border border-red-200">
            <summary className="cursor-pointer text-xs text-red-600 font-medium">
              Detalhes técnicos
            </summary>
            <pre className="text-xs mt-2 text-gray-600">
              {JSON.stringify({ videoId, libraryId, error }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
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
