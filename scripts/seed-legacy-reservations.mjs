#!/usr/bin/env node
/**
 * Seed de reservas que funciona SIN migrations 006+.
 *
 * Usa user_id existente (busca el primer user disponible) y no escribe
 * ninguna columna que no exista en la migration 001. Así podemos ver el
 * panel con vida aunque la DB remota no tenga el schema actualizado.
 *
 * Cuando apliques migrations 006+, corré `seed-reservations-v2.mjs` que
 * arma reservas walk-in y ratings con mejor realismo.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', 'panel', '.env.local')
const envText = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] }),
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TEST_USER = '7a8e555f-17ec-4cb6-b036-0e511af07d74'
const TIME_SLOTS = ['13:00', '13:30', '14:00', '20:00', '20:30', '21:00', '21:30', '22:00']

function pick(a) { return a[Math.floor(Math.random() * a.length)] }
function chance(p) { return Math.random() < p }
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const { data: staff } = await sb
  .from('staff_users').select('venue_id, venues(name)').eq('id', TEST_USER).single()
if (!staff) { console.error('Staff test no existe'); process.exit(1) }
const VENUE = staff.venue_id
console.log(`Venue: "${staff.venues?.name}" ${VENUE}`)

const { data: tables } = await sb
  .from('tables').select('id, capacity').eq('venue_id', VENUE).eq('is_active', true)
if (!tables?.length) { console.error('Sin mesas'); process.exit(1) }

// Buscar users existentes para reutilizar como comensales
const { data: users } = await sb.from('users').select('id, name, phone').limit(50)
if (!users?.length) {
  console.error('No hay users en la DB. Correr seed-demo del repo base primero.')
  process.exit(1)
}
console.log(`${users.length} users disponibles como comensales`)

// Dedupe previas
await sb.from('reservations').delete().eq('venue_id', VENUE)
  .in('user_id', users.map((u) => u.id))

const now = new Date()
const rows = []

for (let i = 0; i < 50; i++) {
  const dayOffset = Math.floor(Math.random() * 22) - 14
  const date = new Date(now); date.setDate(date.getDate() + dayOffset)
  const isPast = dayOffset < 0
  const isToday = dayOffset === 0

  let status
  if (isPast) {
    const r = Math.random()
    if (r < 0.7) status = 'checked_in'
    else if (r < 0.82) status = 'no_show'
    else status = 'cancelled'
  } else if (isToday) {
    status = chance(0.5) ? 'checked_in' : 'confirmed'
  } else {
    status = 'confirmed'
  }

  const party = pick([2, 2, 2, 3, 4, 4, 5, 6, 8])
  const table = tables.find((t) => t.capacity >= party) ?? tables[0]
  const user = pick(users)

  rows.push({
    venue_id: VENUE,
    table_id: table.id,
    user_id: user.id,
    date: toISO(date),
    time_slot: pick(TIME_SLOTS),
    party_size: party,
    status,
    qr_token: '',
  })
}

const BATCH = 20
let ok = 0, fail = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const { data, error } = await sb.from('reservations')
    .insert(rows.slice(i, i + BATCH)).select('id')
  if (error) { fail += BATCH; console.warn(error.message) }
  else ok += data?.length ?? 0
}
console.log(`✓ ${ok} reservas · ${fail} fallaron`)
console.log(`→ http://localhost:53662/dashboard/reservas`)
