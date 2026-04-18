/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Widget embebible: iframeable desde cualquier dominio (Instagram,
        // web del restaurante). CSP frame-ancestors * es lo que lo permite
        // en navegadores modernos; X-Frame-Options queda ausente a propósito.
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors *;" },
        ],
      },
      {
        // El script instalador se pide cross-origin: CORS abierto + cacheado.
        source: '/embed.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
