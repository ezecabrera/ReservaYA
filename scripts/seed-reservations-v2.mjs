#!/usr/bin/env node
/**
 * Seed realista de reservas para el venue del test user (La Brasserie).
 *
 * Genera:
 *   - 60 reservas distribuidas entre -14 días pasados y +7 días futuros
 *   - 70% status=checked_in (ya visitaron), 10% no_show, 10% cancelled (la mitad unilateral),
 *     10% confirmed futuras
 *   - Tamaños de grupo variados, horarios de almuerzo/cena
 *   - Nombres argentinos variados (algunos repiten para generar habitués)
 *   - 30% con notas del host (cumpleaños, alergias, preferencias)
 *
 * Sólo toca data-plane (INSERT/UPDATE), no DDL. Funciona con schema 001-009
 * cuando estén aplicados. Si migration 006 no está aplicada, falla al escribir
 * guest_name — lo capturamos y reporteamos.
 *
 * Uso: node scripts/seed-reservations-v2.mjs
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
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx), l.slice(idx + 1)]
    }),
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(URL, KEY)

const TEST_USER_ID = '7a8e555f-17ec-4cb6-b036-0e511af07d74'

// Nombres argentinos — algunos van a repetirse para generar habitués
const NAMES = [
  'Martín Rodríguez', 'Sofía Gómez', 'Diego Fernández', 'Lucía Pérez',
  'Marcelo Álvarez', 'Camila López', 'Federico Rossi', 'Valentina Díaz',
  'Juan Pablo Torres', 'Agustina Castro', 'Nicolás Ruiz', 'Florencia Méndez',
  'Mariano Silva', 'Josefina Morales', 'Gastón Romero', 'Carolina Vega',
  // Habitués — van a repetirse
  'Alejandro Di Nápoli', 'Paula Bianchi', 'Rodrigo Ferrari', 'Mercedes Sabatini',
]

const HABITUE_CHANCE = 0.35 // 35% de las reservas son de un habitué

// Notas realistas
const NOTES = [
  'Cumpleaños 🎂',
  'Aniversario',
  'Mesa ventana si es posible',
  'Celíaco',
  'Vegetariana',
  'Llega con silla de ruedas',
  'Prefiere mesa tranquila',
  'VIP del dueño',
  'Cena de negocios',
  'Primera vez que viene',
  'Alergia a frutos secos',
]

const TIME_SLOTS = ['13:00', '13:30', '14:00', '14:30', '20:00', '20:30', '21:00', '21:30', '22:00']

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function chance(p) { return Math.random() < p }
function phoneAR() {
  const n = Math.floor(10000000 + Math.random() * 89999999)
  return `+54 9 11 ${String(n).slice(0, 4)}-${String(n).slice(4, 8)}`
}

// 1. Venue del test user
const { data: staff } = await sb
  .from('staff_users')
  .select('venue_id, venues(name)')
  .eq('id', TEST_USER_ID)
  .single()

if (!staff) {
  console.error('El staff_user test no existe. Correr link-test-staff.mjs primero.')
  process.exit(1)
}

const VENUE_ID = staff.venue_id
const venueName = staff.venues?.name ?? '(sin nombre)'
console.log(`Sembrando reservas en "${venueName}" (${VENUE_ID})…`)

// 2. Mesas del venue
const { data: tables } = await sb
  .from('tables')
  .select('id, capacity')
  .eq('venue_id', VENUE_ID)
  .eq('is_active', true)

if (!tables || tables.length === 0) {
  console.error('El venue no tiene mesas activas.')
  process.exit(1)
}

console.log(`${tables.length} mesas encontradas.`)

// 3. Limpiar reservas previas generadas por este script (source='panel' y guest_name prefijado)
// No borramos reservas reales del flujo normal.
await sb
  .from('reservations')
  .delete()
  .eq('venue_id', VENUE_ID)
  .like('guest_name', 'SEED:%')

// 4. Generar pool de habitués (10 nombres fijos que van a repetir)
const HABITUES = NAMES.slice(-4).map((name) => ({ name, phone: phoneAR() }))
const REGULAR = NAMES.slice(0, -4).map((name) => ({ name, phone: phoneAR() }))

// 5. Generar reservas
const now = new Date()
const rows = []

for (let i = 0; i < 60; i++) {
  // Fecha: -14 días a +7 días
  const dayOffset = Math.floor(Math.random() * 22) - 14
  const date = new Date(now)
  date.setDate(date.getDate() + dayOffset)
  const isPast = dayOffset < 0
  const isToday = dayOffset === 0
  const isFuture = dayOffset > 0

  // Status según tiempo
  let status
  if (isPast) {
    const roll = Math.random()
    if (roll < 0.7) status = 'checked_in'
    else if (roll < 0.82) status = 'no_show'
    else status = 'cancelled'
  } else if (isToday) {
    status = Math.random() < 0.5 ? 'checked_in' : 'confirmed'
  } else {
    status = 'confirmed'
  }

  const cancelledBy = status === 'cancelled'
    ? (Math.random() < 0.5 ? 'user' : 'venue')
    : null

  const timeSlot = pick(TIME_SLOTS)
  const partySize = pick([2, 2, 2, 3, 4, 4, 4, 5, 6, 8])
  const table = tables.find((t) => t.capacity >= partySize) ?? tables[0]

  // Elegir comensal: 35% habitué, resto aleatorio
  const person = chance(HABITUE_CHANCE) ? pick(HABITUES) : pick(REGULAR)

  const source = chance(0.4)
    ? pick(['phone', 'walkin', 'panel'])
    : 'app'

  const notes = chance(0.3) ? pick(NOTES) : null

  rows.push({
    venue_id: VENUE_ID,
    table_id: table.id,
    user_id: null,  // todas las seed son "guest" para no crear auth.users falsos
    date: toISODate(date),
    time_slot: timeSlot,
    party_size: partySize,
    status,
    qr_token: '',
    source,
    guest_name: `SEED: ${person.name}`,
    guest_phone: person.phone,
    notes,
    cancelled_by: cancelledBy,
  })
}

// 6. Insertar en batches
const BATCH = 20
let inserted = 0
let failed = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH)
  const { data, error } = await sb.from('reservations').insert(slice).select('id')
  if (error) {
    failed += slice.length
    console.warn(`batch ${i / BATCH + 1}:`, error.message)
  } else {
    inserted += data?.length ?? 0
  }
}

console.log(`✓ ${inserted} reservas creadas · ${failed} fallaron`)

// 7. Generar ratings — sólo para reservas checked_in (post-visita)
const { data: checkedIns } = await sb
  .from('reservations')
  .select('id')
  .eq('venue_id', VENUE_ID)
  .eq('status', 'checked_in')
  .like('guest_name', 'SEED:%')
  .limit(25)

if (checkedIns && checkedIns.length > 0) {
  const ratingRows = []

  // 80% de las checkedIn reciben rating user_to_venue (público)
  for (const r of checkedIns) {
    if (chance(0.8)) {
      // Distribución: mayoría 4-5 estrellas, unas pocas 3 y 2
      const rollStars = Math.random()
      const stars = rollStars < 0.1 ? 3 : rollStars < 0.15 ? 2 : rollStars < 0.55 ? 4 : 5
      const comment = chance(0.5) ? pick([
        'Excelente atención, volvemos seguro',
        'Comida impecable',
        'Espere 15 minutos con reserva',
        'El mozo muy atento',
        'Mi mesa estaba preparada',
        'Buen ambiente, volveremos',
        'El menú tiene buenas opciones',
        null,
      ]) : null
      ratingRows.push({
        reservation_id: r.id,
        venue_id: VENUE_ID,
        direction: 'user_to_venue',
        stars,
        comment,
        user_id: null,
      })
    }
    // 50% recibe rating interno venue_to_user
    if (chance(0.5)) {
      const stars = chance(0.2) ? 3 : chance(0.7) ? 5 : 4
      const comment = chance(0.4) ? pick([
        'Habitual viernes a la noche',
        'Muy amable',
        'Pidió seña pero pagó',
        'Llegó tarde pero avisó',
        'Grupo educado',
        null,
      ]) : null
      ratingRows.push({
        reservation_id: r.id,
        venue_id: VENUE_ID,
        direction: 'venue_to_user',
        stars,
        comment,
        user_id: null,
      })
    }
  }

  if (ratingRows.length > 0) {
    const { error: ratErr, count } = await sb
      .from('ratings')
      .insert(ratingRows, { count: 'exact' })
    if (ratErr) {
      console.warn('ratings:', ratErr.message)
    } else {
      console.log(`✓ ${count ?? ratingRows.length} ratings sembrados`)
    }
  }
}

// 8. Generar entries de waitlist
const waitlistRows = []
for (let i = 0; i < 4; i++) {
  const person = pick(REGULAR)
  const mins = [5, 12, 20, 35][i]
  waitlistRows.push({
    venue_id: VENUE_ID,
    guest_name: `SEED: ${person.name}`,
    guest_phone: person.phone,
    party_size: pick([2, 2, 3, 4]),
    status: i < 2 ? 'waiting' : 'notified',
    notes: chance(0.5) ? pick(['Prefiere afuera', 'Cumpleaños', null]) : null,
    created_at: new Date(Date.now() - mins * 60_000).toISOString(),
    notified_at: i >= 2 ? new Date(Date.now() - (mins - 10) * 60_000).toISOString() : null,
  })
}

// Borrar waitlist seed previos
await sb.from('waitlist_entries').delete().eq('venue_id', VENUE_ID).like('guest_name', 'SEED:%')

const { error: wErr } = await sb.from('waitlist_entries').insert(waitlistRows)
if (wErr) console.warn('waitlist:', wErr.message)
else console.log(`✓ ${waitlistRows.length} entries de waitlist sembrados`)

console.log('')
console.log('Demo list!')
console.log(`→ http://localhost:53662/dashboard`)
console.log(`→ http://localhost:53662/dashboard/reservas`)
console.log(`→ http://localhost:53662/dashboard/crm`)
console.log(`→ http://localhost:53662/dashboard/analytics`)
