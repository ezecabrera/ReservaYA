import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * robots.txt dinámico.
 * - production → allow all + sitemap
 * - preview/dev → disallow all (evitamos indexar URLs efímeras)
 */
export default function robots(): MetadataRoute.Robots {
  const isProd =
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

  if (!isProd) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/check-in/',
          '/onboarding/',
          '/preview/',
          '/handoff/',
          '/migration/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/landing', '/demo', '/pilot', '/ayuda'],
        disallow: ['/api/', '/dashboard/', '/check-in/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
