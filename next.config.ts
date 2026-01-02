import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para uploads grandes via Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },

  // Configuração do ImageKit para exibir imagens
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
