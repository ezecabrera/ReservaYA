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
 *     og: 'demo',
 *   })
 */

import type { Metadata } from 'next'

/**
 * Host del panel — donde vive este Next.js project.
 * Las páginas legales /terms /privacy /cookies viven en otro dominio
 * (deuntoque.com root) y se referencian con URL absoluta desde el footer.
 */
export const SITE_URL = 'https://panel.deuntoque.com'
export const SITE_NAME = 'UnToque'
export const SITE_TAGLINE = 'El panel que pone el toque'

/**
 * OG slugs supported by the dynamic /og/[slug] endpoint.
 * Each slug renders a 1200×630 PNG via next/og at build time
 * (Facebook/Twitter crawlers reject SVG og:images).
 */
export type OgSlug = 'default' | 'landing' | 'demo' | 'pilot' | 'vs'

export const DEFAULT_OG_SLUG: OgSlug = 'default'

/** Build the canonical /og/<slug> path served by the dynamic endpoint. */
export function ogPath(slug: OgSlug): string {
  return `/og/${slug}`
}

/** Legacy alias kept for compatibility — points at the dynamic default endpoint. */
export const DEFAULT_OG = ogPath(DEFAULT_OG_SLUG)

export type ThemeContext = 'panel' | 'app'

export interface BuildMetadataInput {
  /** Página title (sin sufijo). Si está vacío, usa SITE_NAME */
  title?: string
  /** Meta description corta (≤ 160 chars recomendado) */
  description: string
  /** Path absoluto sin host, ej "/demo" o "/" */
  path: string
  /**
   * OG image slug — referencia al endpoint dinámico /og/<slug>.
   * Default: 'default'. Aceptamos override absoluto via `ogImage` para casos legacy.
   */
  og?: OgSlug
  /**
   * Override absoluto de OG image (escape hatch). Preferí `og: '<slug>'`.
   * Se mantiene para compat con llamadas legacy.
   */
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
    og,
    ogImage,
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

  // OG image resolution: prefer typed `og` slug → dynamic endpoint.
  // Fallback: legacy `ogImage` absolute, mapping any /og/og-<slug>.svg to the
  // new endpoint so existing call sites keep working without code changes.
  const resolvedOgPath = (() => {
    if (og) return ogPath(og)
    if (!ogImage) return ogPath(DEFAULT_OG_SLUG)
    if (ogImage.startsWith('http')) return ogImage
    const legacyMatch = ogImage.match(/\/og\/og-([a-z]+)\.svg$/)
    if (legacyMatch) {
      const slug = legacyMatch[1] as OgSlug
      return ogPath(slug)
    }
    return ogImage
  })()
  const ogImageUrl = resolvedOgPath.startsWith('http')
    ? resolvedOgPath
    : `${SITE_URL}${resolvedOgPath}`

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
