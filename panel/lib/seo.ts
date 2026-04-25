/**
 * SEO metadata utility for UnToque panel.
 *
 * Builds Next.js Metadata objects with consistent OG/Twitter cards, canonical
 * URLs, robots policy y theme-color por contexto.
 *
 * Usage:
 *   export const metadata = buildMetadata({
 *     title: 'Demo en vivo',
 *     description: '15 minutos. Sin compromiso.',
 *     path: '/demo',
 *     ogImage: '/og/og-demo.svg',
 *   })
 */

import type { Metadata } from 'next'

export const SITE_URL = 'https://deuntoque.com'
export const SITE_NAME = 'UnToque'
export const SITE_TAGLINE = 'El panel que pone el toque'
export const DEFAULT_OG = '/og/og-default.svg'

export type ThemeContext = 'panel' | 'app'

export interface BuildMetadataInput {
  /** Página title (sin sufijo). Si está vacío, usa SITE_NAME */
  title?: string
  /** Meta description corta (≤ 160 chars recomendado) */
  description: string
  /** Path absoluto sin host, ej "/demo" o "/" */
  path: string
  /** OG image absoluto desde /public, ej "/og/og-demo.svg" */
  ogImage?: string
  /** Theme context — panel = oscuro, app = claro */
  themeContext?: ThemeContext
  /** noindex por preview/staging. default false (production) */
  noindex?: boolean
  /** Locale, default es-AR */
  locale?: string
  /** Tipo OG, default website */
  ogType?: 'website' | 'article' | 'profile'
  /** Keywords meta opcional */
  keywords?: string[]
}

const THEME_COLORS: Record<ThemeContext, string> = {
  panel: '#1A1B21',
  app: '#FFFFFF',
}

/**
 * Build a Next.js Metadata object con defaults sensatos para UnToque.
 *
 * - Title con sufijo " · UnToque" (excepto landing principal)
 * - OG/Twitter completos (summary_large_image)
 * - Canonical = SITE_URL + path
 * - robots index/follow en prod, noindex en preview/dev
 * - locale es-AR
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    ogImage = DEFAULT_OG,
    themeContext = 'panel',
    noindex,
    locale = 'es_AR',
    ogType = 'website',
    keywords,
  } = input

  const isProd =
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

  // Auto-noindex en preview/dev a menos que se fuerce explícito
  const shouldNoindex = noindex ?? !isProd

  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    keywords,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: url,
    },
    robots: shouldNoindex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: ogType,
      locale,
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title ?? SITE_TAGLINE,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
      creator: '@untoque',
      site: '@untoque',
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    other: {
      'theme-color': THEME_COLORS[themeContext],
    },
  }
}

/**
 * Theme color helper para `viewport.themeColor`. Usalo en cada layout/page
 * que tenga `viewport` propia.
 */
export function themeColorFor(ctx: ThemeContext): string {
  return THEME_COLORS[ctx]
}
