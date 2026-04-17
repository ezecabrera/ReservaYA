#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  ReservaYa — Upgrade metadata de venues demo
//  Enriquece config_json de los 20 venues demo con:
//    features[], ambience[], dietary[], price_tier, neighborhood,
//    gallery_urls[]
//  Sin cambios de schema (todo dentro de JSONB). Idempotente.
//
//  Uso:
//    pnpm upgrade:metadata
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DEMO_VENUES } from './demo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnv() {
  for (const file of ['.env.local', '.env', '.env.example'].map((f) => resolve(ROOT, f))) {
    if (!existsSync(file)) continue
    for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const k = line.slice(0, eq).trim()
      let v = line.slice(eq + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    }
  }
}
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const admin = createClient(URL, KEY, { auth: { persistSession: false } })

// ─── Metadata por cocina ──────────────────────────────────────────────────

const BY_CUISINE = {
  pastas: {
    ambience: ['romantic', 'quiet', 'family'],
    features: ['cards', 'wifi', 'vegetarian', 'wine_bar', 'accessible'],
    dietary:  ['vegetarian'],
    price_tier: 2,
  },
  carnes: {
    ambience: ['family', 'social', 'trendy'],
    features: ['cards', 'parking', 'bar', 'accessible', 'wine_bar'],
    dietary:  [],
    price_tier: 3,
  },
  pizza: {
    ambience: ['social', 'family', 'casual'],
    features: ['cards', 'wifi', 'vegetarian', 'kids', 'accessible'],
    dietary:  ['vegetarian'],
    price_tier: 1,
  },
  vegano: {
    ambience: ['trendy', 'quiet', 'casual'],
    features: ['cards', 'wifi', 'vegetarian', 'vegan', 'celiaco', 'outdoor'],
    dietary:  ['vegetarian', 'vegan', 'celiaco'],
    price_tier: 2,
  },
  sushi: {
    ambience: ['trendy', 'romantic', 'quiet'],
    features: ['cards', 'bar', 'accessible', 'wifi'],
    dietary:  [],
    price_tier: 3,
  },
}

// Overrides específicos por venue (para meter variedad)
const VENUE_OVERRIDES = {
  1:  { features_add: ['outdoor'] },                                  // Trattoria Sentori — patio
  4:  { features_add: ['outdoor', 'trendy'] },                        // Fuoco & Farina — terraza
  7:  { price_tier: 4 },                                              // Cortes del 9 — premium
  8:  { features_add: ['outdoor'] },                                  // Asador Don Ramiro — terraza
  14: { ambience_add: ['fast'] },                                     // Bowl Verde — rotación alta
  16: { features_add: ['bar'] },                                      // Crudo y Wok — barra
  17: { features_add: ['bar'] },                                      // Niko Sushi — barra
  18: { price_tier: 4, ambience_add: ['fine_dining'] },               // Omakase Kintaro — premium
  20: { ambience_add: ['social'] },                                   // Sushi & Ramen Ao
}

// Gallery: genera 4 URLs picsum variando el seed base del image_url
function buildGallery(seed) {
  if (!seed) return []
  return [
    `https://picsum.photos/seed/${seed}/1200/800`,
    `https://picsum.photos/seed/${seed}-interior/1200/800`,
    `https://picsum.photos/seed/${seed}-plato/1200/800`,
    `https://picsum.photos/seed/${seed}-ambiente/1200/800`,
  ]
}

// Centroides aproximados por barrio CABA — suficiente para ordenar
// por distancia en el piloto. Para producción real: geocodificar la
// address exacta con Mapbox/Google Geocoding.
const NEIGHBORHOOD_COORDS = {
  'Palermo':        { lat: -34.5880, lng: -58.4300 },
  'Palermo Soho':   { lat: -34.5880, lng: -58.4315 },
  'Palermo Hollywood': { lat: -34.5840, lng: -58.4440 },
  'Villa Crespo':   { lat: -34.5990, lng: -58.4430 },
  'Recoleta':       { lat: -34.5890, lng: -58.3930 },
  'San Telmo':      { lat: -34.6210, lng: -58.3710 },
  'Caballito':      { lat: -34.6180, lng: -58.4420 },
  'Belgrano':       { lat: -34.5610, lng: -58.4580 },
  'Núñez':          { lat: -34.5460, lng: -58.4590 },
  'Almagro':        { lat: -34.6100, lng: -58.4200 },
  'Boedo':          { lat: -34.6250, lng: -58.4150 },
  'Chacarita':      { lat: -34.5830, lng: -58.4540 },
  'Colegiales':     { lat: -34.5740, lng: -58.4480 },
  'Puerto Madero':  { lat: -34.6130, lng: -58.3640 },
  'Coghlan':        { lat: -34.5620, lng: -58.4790 },
  'Villa Urquiza':  { lat: -34.5720, lng: -58.4930 },
}

function coordsFor(hood) {
  // Match exacto o partial (ej. "Palermo Soho" busca en map primero)
  if (NEIGHBORHOOD_COORDS[hood]) return NEIGHBORHOOD_COORDS[hood]
  for (const key of Object.keys(NEIGHBORHOOD_COORDS)) {
    if (hood.includes(key) || key.includes(hood)) return NEIGHBORHOOD_COORDS[key]
  }
  // Fallback centro CABA
  return { lat: -34.6037, lng: -58.3816 }
}

// Jitter determinístico para que no caigan todos en el mismo pin
function jitter(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const dx = ((h & 0xff) - 128) / 10000           // ±0.013°
  const dy = (((h >> 8) & 0xff) - 128) / 10000
  return { dx, dy }
}

// ─── Run ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 Upgrade metadata — arrancando')
  console.log(`   Venues a enriquecer: ${DEMO_VENUES.length}\n`)

  for (let i = 0; i < DEMO_VENUES.length; i++) {
    const v = DEMO_VENUES[i]
    const n = i + 1
    const preset = BY_CUISINE[v.cuisine]
    if (!preset) {
      console.log(`  ${String(n).padStart(2, '0')} ${v.name.padEnd(28)} · skip (cocina desconocida)`)
      continue
    }
    const override = VENUE_OVERRIDES[n] ?? {}

    // Traigo el config_json actual para mergear sin pisar datos
    const { data: current, error: fetchErr } = await admin
      .from('venues')
      .select('config_json')
      .eq('id', v.id)
      .single()
    if (fetchErr || !current) {
      console.log(`  ${String(n).padStart(2, '0')} ${v.name.padEnd(28)} · ❌ no encontrado`)
      continue
    }

    const features = [...new Set([...(preset.features ?? []), ...(override.features_add ?? [])])]
    const ambience = [...new Set([...(preset.ambience ?? []), ...(override.ambience_add ?? [])])]
    const dietary  = [...new Set([...(preset.dietary  ?? []), ...(override.dietary_add  ?? [])])]
    const price_tier = override.price_tier ?? preset.price_tier
    const neighborhood = (v.address.match(/,\s*([^,]+),\s*CABA/i)?.[1] ?? '').trim()
    const base = coordsFor(neighborhood)
    const { dx, dy } = jitter(v.id)
    const coords = { lat: base.lat + dy, lng: base.lng + dx }

    const merged = {
      ...current.config_json,
      features,
      ambience,
      dietary,
      price_tier,
      neighborhood,
      gallery_urls: buildGallery(v.image_seed),
      coords,
    }

    const { error } = await admin
      .from('venues')
      .update({ config_json: merged })
      .eq('id', v.id)

    if (error) {
      console.log(`  ${String(n).padStart(2, '0')} ${v.name.padEnd(28)} · ❌ ${error.message}`)
      continue
    }
    console.log(
      `  ${String(n).padStart(2, '0')} ${v.name.padEnd(28)} · ` +
      `tier=${price_tier} · ${neighborhood.padEnd(14)} · lat=${coords.lat.toFixed(4)} lng=${coords.lng.toFixed(4)}`
    )
  }

  console.log('\n✅ Upgrade completo.')
}

main().catch((e) => {
  console.error('\n❌ Upgrade falló:', e.message)
  process.exit(1)
})
