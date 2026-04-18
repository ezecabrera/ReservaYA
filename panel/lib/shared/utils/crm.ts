import type { GuestProfile, GuestStats, GuestTag } from '../types/crm'

/**
 * Row mínima que esperamos para alimentar el cálculo de perfiles.
 * Se obtiene con un SELECT sobre reservations + joins a users cuando hay.
 */
export interface GuestReservationRow {
  user_id: string | null
  user_name: string | null
  user_phone: string | null
  guest_name: string | null
  guest_phone: string | null
  status:
    | 'pending_payment'
    | 'confirmed'
    | 'checked_in'
    | 'cancelled'
    | 'no_show'
  date: string         // YYYY-MM-DD
  party_size: number
  created_at: string
}

/**
 * Devuelve la clave de identidad de un comensal.
 * Prioridad: user_id > teléfono > (nombre + índice).
 *
 * Si dos filas comparten user_id son el mismo comensal.
 * Si dos filas comparten un teléfono no-null son el mismo comensal.
 * Si no hay ni user_id ni teléfono, se usa el nombre — dos "Juan P" caen
 * en el mismo bucket, pero es lo mejor que podemos hacer sin más data.
 */
export function guestKey(row: GuestReservationRow): string {
  if (row.user_id) return `user:${row.user_id}`
  const phone = (row.guest_phone ?? row.user_phone ?? '').trim()
  if (phone) return `phone:${phone}`
  const name = (row.guest_name ?? row.user_name ?? '').trim().toLowerCase()
  return `anon:${name || 'sin_nombre'}`
}

function parseISODate(iso: string): Date {
  // iso = 'YYYY-MM-DD' → date local sin UTC drift
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysAgo(iso: string, from: Date = new Date()): number {
  const target = parseISODate(iso)
  const diff = from.getTime() - target.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Calcula las tags para un comensal según sus stats.
 * Importante: `primera_vez` se devuelve sola cuando no hay visitas previas.
 */
export function computeGuestTags(stats: GuestStats, recentVisits60d: number, recentNoShows90d: number): GuestTag[] {
  const tags: GuestTag[] = []

  if (stats.visits_completed === 0) {
    tags.push('primera_vez')
    // Aun así puede tener un no-show previo sin haber visitado nunca
    if (recentNoShows90d > 0) tags.push('no_show_previo')
    return tags
  }

  if (stats.visits_completed >= 6 || stats.avg_party_size >= 6) {
    tags.push('vip')
  } else if (stats.visits_completed >= 3) {
    tags.push('habitue')
  }

  if (recentVisits60d >= 2 && !tags.includes('vip') && !tags.includes('habitue')) {
    tags.push('regular_reciente')
  }

  if (recentNoShows90d > 0) {
    tags.push('no_show_previo')
  }

  return tags
}

/**
 * Agrupa un listado plano de reservas por comensal y devuelve un perfil
 * con stats + tags para cada uno. Ordenado por visits_completed desc.
 */
export function buildGuestProfiles(
  rows: GuestReservationRow[],
  now: Date = new Date(),
): GuestProfile[] {
  const groups = new Map<string, GuestReservationRow[]>()
  for (const row of rows) {
    const key = guestKey(row)
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  const profiles: GuestProfile[] = []
  for (const [key, items] of groups) {
    // Sort by date asc para first_seen, luego usar max para last_visit
    items.sort((a, b) => a.date.localeCompare(b.date))

    const completed = items.filter((r) => r.status === 'checked_in')
    const noShows = items.filter((r) => r.status === 'no_show')
    const cancellations = items.filter((r) => r.status === 'cancelled')

    const lastVisit = completed.length > 0
      ? completed[completed.length - 1].date
      : null

    const sumParty = items.reduce((acc, r) => acc + r.party_size, 0)
    const avgParty = items.length > 0 ? sumParty / items.length : 0

    const stats: GuestStats = {
      total_reservations: items.length,
      visits_completed: completed.length,
      no_shows: noShows.length,
      cancellations: cancellations.length,
      last_visit_date: lastVisit,
      avg_party_size: Math.round(avgParty * 10) / 10,
    }

    const recentVisits60d = completed.filter((r) => daysAgo(r.date, now) <= 60).length
    const recentNoShows90d = noShows.filter((r) => daysAgo(r.date, now) <= 90).length

    const tags = computeGuestTags(stats, recentVisits60d, recentNoShows90d)

    // Preferimos los datos más recientes no vacíos
    const sample = [...items].reverse().find((r) =>
      (r.user_name ?? r.guest_name) && (r.user_name ?? r.guest_name)!.trim() !== ''
    ) ?? items[items.length - 1]

    profiles.push({
      key,
      user_id: sample.user_id,
      name: (sample.user_name ?? sample.guest_name ?? 'Sin nombre').trim(),
      phone: (sample.user_phone ?? sample.guest_phone ?? null)?.trim() || null,
      stats,
      tags,
      first_seen_date: items[0].date,
    })
  }

  profiles.sort((a, b) => {
    if (b.stats.visits_completed !== a.stats.visits_completed) {
      return b.stats.visits_completed - a.stats.visits_completed
    }
    return (b.stats.last_visit_date ?? '').localeCompare(a.stats.last_visit_date ?? '')
  })

  return profiles
}

/**
 * Serializa un array de perfiles a CSV compatible con Excel y Google Sheets
 * (BOM UTF-8 inicial para que se vea bien con acentos en Excel de Windows).
 */
export function guestsToCsv(profiles: GuestProfile[]): string {
  const headers = [
    'nombre',
    'telefono',
    'primera_visita',
    'ultima_visita',
    'total_reservas',
    'visitas_completadas',
    'no_shows',
    'cancelaciones',
    'promedio_personas',
    'tags',
  ]

  const escape = (v: string | number | null): string => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const lines = [headers.join(',')]
  for (const p of profiles) {
    lines.push([
      escape(p.name),
      escape(p.phone),
      escape(p.first_seen_date),
      escape(p.stats.last_visit_date),
      escape(p.stats.total_reservations),
      escape(p.stats.visits_completed),
      escape(p.stats.no_shows),
      escape(p.stats.cancellations),
      escape(p.stats.avg_party_size),
      escape(p.tags.join(' ')),
    ].join(','))
  }

  return '\ufeff' + lines.join('\n')
}
