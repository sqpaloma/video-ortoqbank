import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para uploads grandes via Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
