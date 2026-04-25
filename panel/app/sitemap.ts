import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Sitemap dinámico para deuntoque.com (panel + landing público).
 * Next.js App Router file convention: app/sitemap.ts
 */

type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

interface Entry {
  path: string
  changeFrequency: ChangeFreq
  priority: number
}

const ENTRIES: Entry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/landing', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/demo', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/pilot', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/vs-thefork', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/vs-maxirest', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/vs-fudo', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/login', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/onboarding', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/ayuda', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ENTRIES.map((e) => ({
    url: `${SITE_URL}${e.path === '/' ? '' : e.path}`,
    lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }))
}
