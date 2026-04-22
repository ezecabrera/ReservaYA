/**
 * Helper para obtener imágenes gastronómicas reales por venue.
 *
 * Usa LoremFlickr (https://loremflickr.com) que devuelve fotos de Flickr
 * filtradas por tags. El parámetro `lock=<seed>` fija la misma imagen para
 * el mismo seed, así el hero y la galería son consistentes entre cargas.
 *
 * La alternativa (Picsum seed-based) devuelve imágenes random sin relación
 * con la gastronomía. Este helper garantiza que los venues ficticios vean
 * platos, interiores y ambientes relacionados con su cocina.
 */

import type { Venue } from '@/lib/shared'

type Cuisine = 'pastas' | 'carnes' | 'pizza' | 'vegano' | 'sushi' | 'other'

interface CuisineTags {
  hero: string
  interior: string
  plato: string
  ambiente: string
}

// Tags específicos por cocina — combinados para que LoremFlickr traiga
// imágenes coherentes con cada tipo de restaurante.
const CUISINE_TAGS: Record<Cuisine, CuisineTags> = {
  pastas: {
    hero:     'pasta,italian,restaurant',
    interior: 'italian,restaurant,trattoria',
    plato:    'pasta,spaghetti,food',
    ambiente: 'trattoria,wine,dinner',
  },
  carnes: {
    hero:     'steak,grill,restaurant',
    interior: 'steakhouse,restaurant,meat',
    plato:    'steak,asado,meat',
    ambiente: 'grill,parrilla,bbq',
  },
  pizza: {
    hero:     'pizza,italian,restaurant',
    interior: 'pizzeria,oven,wood',
    plato:    'pizza,napoli,food',
    ambiente: 'pizzeria,kitchen,italian',
  },
  vegano: {
    hero:     'vegan,bowl,healthy',
    interior: 'salad,vegetarian,bright',
    plato:    'vegan,vegetables,bowl',
    ambiente: 'cafe,fresh,green',
  },
  sushi: {
    hero:     'sushi,japanese,restaurant',
    interior: 'sushibar,japanese,bar',
    plato:    'sushi,sashimi,japanese',
    ambiente: 'sushi,omakase,bar',
  },
  other: {
    hero:     'restaurant,food,dining',
    interior: 'restaurant,interior,table',
    plato:    'food,plate,gourmet',
    ambiente: 'restaurant,bar,dining',
  },
}

// Hash estable (no-crypto) para convertir strings a un int determinístico.
// Lo usamos como `lock` en LoremFlickr para que cada venue tenga imágenes
// distintas entre sí pero las mismas entre visitas.
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function venueCuisine(v: Venue): Cuisine {
  const c = (v.config_json as { cuisine?: string } | null)?.cuisine
  if (c === 'pastas' || c === 'carnes' || c === 'pizza' || c === 'vegano' || c === 'sushi') return c
  return 'other'
}

function seedOf(v: Venue): string {
  // Si el venue.image_url es una URL de picsum con seed, extraer el seed.
  // Si no, usar el id del venue.
  const m = v.image_url?.match(/\/seed\/([^/]+)/)
  return m ? m[1] : v.id
}

function flickrUrl(tags: string, lock: number, w = 1200, h = 800): string {
  return `https://loremflickr.com/${w}/${h}/${tags}/?lock=${lock}`
}

/**
 * Imagen principal del venue. Reemplaza `venue.image_url` (picsum) con una
 * foto real de la cocina correspondiente.
 */
export function getVenueHero(venue: Venue, width = 1200, height = 800): string {
  const c = venueCuisine(venue)
  const seed = seedOf(venue)
  return flickrUrl(CUISINE_TAGS[c].hero, hash(seed), width, height)
}

/**
 * Galería de 4 imágenes del venue (hero + interior + plato + ambiente).
 * Cada una con su lock derivado para que sean distintas pero estables.
 */
export function getVenueGallery(venue: Venue, width = 1200, height = 800): string[] {
  const c = venueCuisine(venue)
  const seed = seedOf(venue)
  const baseLock = hash(seed)
  const t = CUISINE_TAGS[c]
  return [
    flickrUrl(t.hero,     baseLock,            width, height),
    flickrUrl(t.interior, baseLock + 1,        width, height),
    flickrUrl(t.plato,    baseLock + 2,        width, height),
    flickrUrl(t.ambiente, baseLock + 3,        width, height),
  ]
}

/**
 * URLs para los guides editoriales del home (EditorialBand).
 * Cada guide tiene su imageSeed y un concepto (parrilla / aire libre / etc).
 */
const GUIDE_TAGS: Record<string, string> = {
  'guide-parrillas': 'steakhouse,meat,premium',
  'guide-nuevos':    'restaurant,modern,opening',
  'guide-terrazas':  'terrace,outdoor,restaurant',
  'guide-cita':      'romantic,candles,restaurant',
  'guide-parrilla':  'grill,asado,argentina',
}

export function getGuideImage(imageSeed: string, width = 520, height = 390): string {
  const tags = GUIDE_TAGS[imageSeed] ?? 'restaurant,food'
  return flickrUrl(tags, hash(imageSeed), width, height)
}
