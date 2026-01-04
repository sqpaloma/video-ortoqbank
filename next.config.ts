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

  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
