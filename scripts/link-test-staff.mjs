#!/usr/bin/env node
/**
 * Vincula el user test@reservaya.test al primer venue activo como owner.
 * Sólo inserta/actualiza en staff_users — no requiere que las migrations
 * 006+ estén aplicadas (staff_users existe desde la migration 001).
 *
 * Uso:  node scripts/link-test-staff.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Cargar .env.local del panel (donde están las vars)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', 'panel', '.env.local')
const envText = readFileSync(envPath, 'utf8')
const envLines = envText.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
const env = Object.fromEntries(
  envLines.map((l) => {
    const idx = l.indexOf('=')
    return [l.slice(0, idx), l.slice(idx + 1)]
  }),
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en panel/.env.local')
  process.exit(1)
}

const USER_ID = '7a8e555f-17ec-4cb6-b036-0e511af07d74' // test@reservaya.test
const sb = createClient(URL, KEY)

const { data: venue, error: vErr } = await sb
  .from('venues')
  .select('id, name')
  .eq('is_active', true)
  .order('created_at', { ascending: true })
  .limit(1)
  .single()

if (vErr || !venue) {
  console.error('No encontré venues activos. Correr seed:demo primero.', vErr?.message)
  process.exit(1)
}

const { data, error } = await sb
  .from('staff_users')
  .upsert(
    {
      id: USER_ID,
      venue_id: venue.id,
      name: 'Test Admin',
      role: 'owner',
      email: 'test@reservaya.test',
    },
    { onConflict: 'id' },
  )
  .select()
  .single()

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log(`✓ Staff user ${data.id} vinculado a venue "${venue.name}" (${venue.id}) como owner`)
