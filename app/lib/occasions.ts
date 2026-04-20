/**
 * Sistema de guías por ocasión — scoring determinístico sobre venues.
 *
 * Cada ocasión define una fórmula de score usando los campos que ya tenemos
 * en config_json y en la tabla venues. El cliente aplica la fórmula a todos
 * los venues activos, ordena desc por score y muestra los top N.
 *
 * Un venue que scorea < MIN_SCORE se considera que no aplica a la ocasión
 * y no aparece en la guía (evita rellenar con ruido).
 *
 * Cuando tengamos tabla `reviews` + rating real + ambience tags, este
 * módulo se reemplaza por un scoring más preciso sin cambiar callers.
 */

import type { Venue } from '@/lib/shared'

export interface OccasionGuide {
  slug: string
  eyebrow: string
  title: string
  lede: string
  imageSeed: string
}

export const GUIDES: OccasionGuide[] = [
  {
    slug: 'parrillas-cortes-premium',
    eyebrow: 'Guía curada',
    title: 'Parrillas con cortes premium',
    lede: 'Bodegones contemporáneos y steakhouses con carne madurada.',
    imageSeed: 'guide-parrillas',
  },
  {
    slug: 'nuevas-aperturas',
    eyebrow: 'Recién aterrizados',
    title: 'Nuevos en la ciudad',
    lede: 'Los restaurantes que abrieron hace menos de 3 meses.',
    imageSeed: 'guide-nuevos',
  },
  {
    slug: 'al-aire-libre',
    eyebrow: 'Para este finde',
    title: 'Al aire libre',
    lede: 'Terrazas, patios y veredas que valen la ocasión.',
    imageSeed: 'guide-terrazas',
  },
  {
    slug: 'para-cita',
    eyebrow: 'Escena romántica',
    title: 'Para una cita',
    lede: 'Luz tenue, cocina con autor y buena carta de vinos.',
    imageSeed: 'guide-cita',
  },
  {
    slug: 'grupo-grande',
    eyebrow: 'Cumpleaños, peña',
    title: 'Para ir en grupo',
    lede: 'Lugares con mesas para 6+ y ambiente distendido.',
    imageSeed: 'guide-parrilla',
  },
]

export const MIN_SCORE = 3

// Helpers de acceso a config_json
function cuisine(v: Venue): string | undefined {
  return (v.config_json as { cuisine?: string } | null)?.cuisine
}
function priceTier(v: Venue): number {
  const cfg = v.config_json as { price_tier?: number; deposit_amount?: number } | null
  if (cfg?.price_tier && cfg.price_tier >= 1 && cfg.price_tier <= 4) return cfg.price_tier
  const deposit = cfg?.deposit_amount ?? 2000
  if (deposit >= 4000) return 4
  if (deposit >= 2500) return 3
  if (deposit >= 1500) return 2
  return 1
}
function rating(v: Venue): number {
  // mock determinístico mientras no haya reviews reales
  let h = 0
  for (let i = 0; i < v.id.length; i++) h = (h * 31 + v.id.charCodeAt(i)) | 0
  return 3.8 + (Math.abs(h) % 12) / 10   // 3.8 – 4.9
}
function daysSinceCreated(v: Venue): number {
  try {
    const diff = Date.now() - new Date(v.created_at).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  } catch { return 9999 }
}

/**
 * Contexto opcional extra que el caller puede inyectar — ej. las zones del
 * venue (para "al aire libre") o la cantidad de mesas grandes ("grupo").
 * Si no se pasa, esas reglas scorean 0 y se basa sólo en config_json.
 */
export interface VenueExtra {
  hasOutdoorZone?: boolean
  hasPrivateZone?: boolean
  hasLargeTables?: boolean
}

export type OccasionSlug = typeof GUIDES[number]['slug']

export function scoreVenueForOccasion(
  venue: Venue,
  slug: OccasionSlug,
  extra: VenueExtra = {},
): number {
  const c = cuisine(venue)
  const price = priceTier(venue)
  const r = rating(venue)
  const age = daysSinceCreated(venue)

  switch (slug) {
    case 'parrillas-cortes-premium': {
      let s = 0
      if (c === 'carnes') s += 5
      if (price >= 3) s += 2
      if (r >= 4.5) s += 2
      return s
    }

    case 'nuevas-aperturas': {
      // Todos los que abrieron hace menos de 90 días; score decrece con edad.
      if (age > 90) return 0
      return Math.max(1, 10 - Math.floor(age / 10)) // 10 (hoy) → 1 (~90d)
    }

    case 'al-aire-libre': {
      let s = 0
      if (extra.hasOutdoorZone) s += 7
      // Heurística suave: venues con rating alto suelen tener buena terraza en BA
      if (extra.hasOutdoorZone && r >= 4.4) s += 2
      return s
    }

    case 'para-cita': {
      let s = 0
      if (price >= 3) s += 3                   // lugar especial
      if (r >= 4.5) s += 2                     // mejor reputación
      // Cocinas típicamente "date night" en BA
      if (c === 'sushi' || c === 'pastas') s += 3
      if (c === 'carnes' && price === 4) s += 2 // sólo carnes top
      // Venues con sector privado o ambiente íntimo suman
      if (extra.hasPrivateZone) s += 2
      return s
    }

    case 'grupo-grande': {
      let s = 0
      if (extra.hasLargeTables) s += 5         // mesas de 6+
      if (extra.hasPrivateZone) s += 3         // sector privado bump
      if (c === 'carnes' || c === 'pizza') s += 1 // cocinas grupo-friendly
      if (price <= 3) s += 1                    // precio accesible a varios
      return s
    }

    default:
      return 0
  }
}

/**
 * Aplica el scoring a todos los venues con el extra de context, filtra por
 * MIN_SCORE y devuelve los top N ordenados.
 */
export function rankVenuesForOccasion(
  venues: Venue[],
  slug: OccasionSlug,
  extras: Map<string, VenueExtra>,
  limit = 12,
): Array<{ venue: Venue; score: number }> {
  return venues
    .map((v) => ({ venue: v, score: scoreVenueForOccasion(v, slug, extras.get(v.id) ?? {}) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Helper: busca una guía por slug en el array GUIDES. */
export function findGuide(slug: string): OccasionGuide | null {
  return GUIDES.find((g) => g.slug === slug) ?? null
}
