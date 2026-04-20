import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/perfil — datos del usuario + stats */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [profileResult, statsResult] = await Promise.all([
    supabase
      .from('users')
      .select('name, phone, email, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('reservations')
      .select('status, venue_id, date, venues(name, config_json)')
      .eq('user_id', user.id)
      .in('status', ['pending_payment', 'confirmed', 'checked_in', 'no_show']),
  ])

  const profile = profileResult.data
  const reservations = statsResult.data ?? []

  // Venue más visitado
  const venueCounts: Record<string, { name: string; count: number }> = {}
  reservations.forEach(r => {
    if (!r.venue_id) return
    const name = (r.venues as unknown as { name: string } | null)?.name ?? ''
    if (!venueCounts[r.venue_id]) venueCounts[r.venue_id] = { name, count: 0 }
    venueCounts[r.venue_id].count++
  })
  const favoriteVenueEntry = Object.values(venueCounts).sort((a, b) => b.count - a.count)[0]
  const favoriteVenue = favoriteVenueEntry ?? null

  const meta = (user.user_metadata ?? {}) as { surname?: string; nickname?: string }

  // ── Rewards: tier + progreso + incentivo + rachas ──────────────────────
  const rewards = computeRewards(reservations, favoriteVenue)

  return NextResponse.json({
    name: profile?.name ?? 'Usuario',
    surname: meta.surname ?? '',
    nickname: meta.nickname ?? '',
    phone: profile?.phone ?? user.phone ?? '',
    email: profile?.email ?? user.email ?? '',
    memberSince: profile?.created_at ?? user.created_at,
    stats: {
      total: reservations.length,
      checkedIn: reservations.filter(r => r.status === 'checked_in').length,
      pending: reservations.filter(r => r.status === 'pending_payment').length,
      favoriteVenue: favoriteVenue?.name ?? null,
    },
    rewards,
  })
}

// ─── Rewards engine ───────────────────────────────────────────────────────

type Tier = 'bronce' | 'plata' | 'oro'
interface RewardsData {
  tier: Tier
  tierLabel: string
  reservationsThisMonth: number
  toNextTier: number | null          // cuántas más para subir (null si ya es oro)
  nextTierLabel: string | null
  incentive: string                   // mensajito motivacional corto
  streaks: Array<{ icon: string; title: string; subtitle: string }>
}

interface ResRow {
  status: string | null
  date: string | null
  venue_id: string | null
  venues: unknown
}

function computeRewards(
  reservations: ResRow[],
  favoriteVenue: { name: string; count: number } | null,
): RewardsData {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthCheckedIn = reservations.filter((r) =>
    r.status === 'checked_in' && typeof r.date === 'string' && r.date.startsWith(monthKey)
  )
  const reservationsThisMonth = thisMonthCheckedIn.length

  // Tiers
  let tier: Tier = 'bronce'
  let nextTierLabel: string | null = 'Plata'
  let toNextTier: number | null = 3 - reservationsThisMonth
  if (reservationsThisMonth >= 7) {
    tier = 'oro'; nextTierLabel = null; toNextTier = null
  } else if (reservationsThisMonth >= 3) {
    tier = 'plata'; nextTierLabel = 'Oro'; toNextTier = 7 - reservationsThisMonth
  }
  const tierLabel = tier === 'bronce' ? 'Bronce' : tier === 'plata' ? 'Plata' : 'Oro'

  // Rachas (streaks) derivadas de las reservas
  const streaks: RewardsData['streaks'] = []

  // a) Cocinas distintas este mes
  const cuisinesThisMonth = new Set<string>()
  for (const r of thisMonthCheckedIn) {
    const v = r.venues as { config_json?: { cuisine?: string } } | null
    const c = v?.config_json?.cuisine
    if (c) cuisinesThisMonth.add(c)
  }
  if (cuisinesThisMonth.size >= 3) {
    streaks.push({
      icon: '🍽️',
      title: `${cuisinesThisMonth.size} cocinas distintas este mes`,
      subtitle: 'Te gusta variar — seguí explorando',
    })
  }

  // b) Cliente frecuente de un venue
  if (favoriteVenue && favoriteVenue.count >= 3) {
    streaks.push({
      icon: '⭐',
      title: `${favoriteVenue.count} visitas a ${favoriteVenue.name}`,
      subtitle: 'Cliente frecuente — preguntá por beneficios al llegar',
    })
  }

  // c) Fines de semana seguidos con plan
  const weekendDates = thisMonthCheckedIn
    .filter((r) => r.date)
    .map((r) => new Date(r.date as string))
    .filter((d) => d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6)
    .sort((a, b) => a.getTime() - b.getTime())
  if (weekendDates.length >= 2) {
    streaks.push({
      icon: '🔥',
      title: `${weekendDates.length} finde con plan este mes`,
      subtitle: 'Racha caliente — no la cortes',
    })
  }

  // Incentivo — mensajito corto y motivacional (prioridad: cerca de subir de tier > racha)
  let incentive = 'Reservá una salida y arrancá a sumar beneficios.'
  if (reservationsThisMonth === 0) {
    incentive = '¿Empezamos el mes con un plan? La primera reserva desbloquea tu progreso.'
  } else if (toNextTier !== null && toNextTier === 1) {
    incentive = `¡Una reserva más y subís a ${nextTierLabel}! 🔥`
  } else if (toNextTier !== null && toNextTier <= 2) {
    incentive = `${toNextTier} reservas más para ${nextTierLabel} — estás cerca.`
  } else if (tier === 'oro') {
    incentive = 'Sos Oro este mes. Disfrutá los beneficios.'
  } else if (cuisinesThisMonth.size >= 3) {
    incentive = `Probaste ${cuisinesThisMonth.size} cocinas distintas este mes. Animate con otra.`
  }

  return {
    tier,
    tierLabel,
    reservationsThisMonth,
    toNextTier,
    nextTierLabel,
    incentive,
    streaks,
  }
}

/**
 * PATCH /api/perfil — actualiza nombre, apellido y sobrenombre.
 *
 * - `name` va a la tabla users (columna primaria pública)
 * - `surname` y `nickname` van a auth.user_metadata (sin migrar schema)
 *
 * Todos los campos son opcionales en el body: se actualiza solo lo que
 * venga presente.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { name?: string; surname?: string; nickname?: string }

  // Validaciones
  const name = typeof body.name === 'string' ? body.name.trim() : undefined
  const surname = typeof body.surname === 'string' ? body.surname.trim() : undefined
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : undefined

  if (name !== undefined && !name) {
    return NextResponse.json({ error: 'Nombre no puede estar vacío' }, { status: 400 })
  }

  // Actualizar users.name si vino
  if (name) {
    const { error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualizar user_metadata (merge — preserva otros campos)
  if (surname !== undefined || nickname !== undefined) {
    const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>
    const { error } = await supabase.auth.updateUser({
      data: {
        ...currentMeta,
        ...(surname !== undefined ? { surname } : {}),
        ...(nickname !== undefined ? { nickname } : {}),
      },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    name: name ?? user.user_metadata?.name ?? '',
    surname: surname ?? (user.user_metadata?.surname as string | undefined) ?? '',
    nickname: nickname ?? (user.user_metadata?.nickname as string | undefined) ?? '',
  })
}
