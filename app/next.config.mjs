import nextPwa from 'next-pwa'

const withPWA = nextPwa({
  dest: 'public',
  // Disable en dev para que HMR funcione sin interferencia del SW
  disable: process.env.NODE_ENV !== 'production',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline', // fallback cuando el user pierde red en navegación
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita instrumentation.ts (requerido en Next 14 para Sentry SDK).
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withPWA(nextConfig)
