import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@reservaya/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Mejora de performance en App Router
    optimisticClientCache: true,
  },
}

export default nextConfig
