"use client";

import { VideoPlayerWithWatermark } from "@/components/bunny/video-player-with-watermark";

export default function VideoPage() {
  const videoId = "4c275c9b-a3b6-438c-b342-fee511355628";
  const libraryId = "550336";

  // Mock user data (will come from Clerk/auth in production)
  const userName = "João Silva";
  const userCpf = "123.456.789-00";

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-bold text-white">
          Video Player com Watermark
        </h1>

        <VideoPlayerWithWatermark
          videoId={videoId}
          libraryId={libraryId}
          userName={userName}
          userCpf={userCpf}
        />

        <div className="mt-6 rounded-lg bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Informações do Teste
          </h2>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <strong>Usuário:</strong> {userName}
            </p>
            <p>
              <strong>CPF:</strong> {userCpf}
            </p>
            <p>
              <strong>Video ID:</strong> {videoId}
            </p>
            <p className="mt-4 text-xs text-zinc-500">
              💡 O watermark com nome e CPF aparece em uma posição aleatória
              sobre o vídeo (evita remoção por crop). Em produção, os dados
              virão do usuário autenticado via Clerk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
