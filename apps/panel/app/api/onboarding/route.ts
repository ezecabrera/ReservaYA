import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

interface TableInput {
  label: string
  capacity: number
}

interface ZoneInput {
  name: string
  prefix: string
  tables: TableInput[]
}

interface ServiceTurn {
  opens_at: string
  closes_at: string
}

interface OnboardingBody {
  staffName: string
  venue: {
    name: string
    address: string
    phone: string
    description: string
  }
  schedule: {
    days: number[]          // 0=Dom … 6=Sáb
    lunch: ServiceTurn | null
    dinner: ServiceTurn | null
  }
  zones: ZoneInput[]
  deposit: {
    amount: number
    cutOffMinutes: number
  }
}

/**
 * POST /api/onboarding
 * El usuario ya está autenticado (signUp hecho en el cliente).
 * Crea el venue, staff_users, zones y tables en una sola request.
 */
export async function POST(request: NextRequest) {
  // Rate limit — onboarding es más pesado (escribe ~6 tablas). Limitar a
  // 3 intentos por IP cada 10 min para frenar automatización.
  const ip = getClientIp(request)
  const rl = rateLimit(`onboarding:${ip}`, 3, 10 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    )
  }

  const supabase = await createClient()

  // Intentar auth por header Bearer primero (más confiable en onboarding),
  // con fallback a cookies de sesión
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  let user = null
  if (bearerToken) {
    const { data } = await supabase.auth.getUser(bearerToken)
    user = data.user
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que no tenga ya un venue
  const { data: existing } = await supabase
    .from('staff_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Ya tenés un venue configurado' }, { status: 400 })

  const body: OnboardingBody = await request.json()

  // ── Construir service_hours ──────────────────────────────────────────────
  const serviceHours: object[] = []
  for (const day of body.schedule.days) {
    if (body.schedule.lunch) {
      serviceHours.push({
        day_of_week: day,
        opens_at: body.schedule.lunch.opens_at,
        closes_at: body.schedule.lunch.closes_at,
        is_open: true,
      })
    }
    if (body.schedule.dinner) {
      serviceHours.push({
        day_of_week: day,
        opens_at: body.schedule.dinner.opens_at,
        closes_at: body.schedule.dinner.closes_at,
        is_open: true,
      })
    }
  }

  // ── Crear venue ──────────────────────────────────────────────────────────
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({
      name: body.venue.name,
      address: body.venue.address,
      phone: body.venue.phone || null,
      description: body.venue.description || null,
      cut_off_minutes: body.deposit.cutOffMinutes,
      config_json: {
        service_hours: serviceHours,
        cut_off_minutes: body.deposit.cutOffMinutes,
        deposit_type: 'fixed',
        deposit_amount: body.deposit.amount,
        cancellation_grace_hours: 2,
        cancellation_refund_percentage: 100,
        reminder_hours_before: 3,
        zones_enabled: body.zones.length > 1,
      },
    })
    .select()
    .single()

  if (venueError || !venue) {
    return NextResponse.json({ error: venueError?.message ?? 'Error creando venue' }, { status: 500 })
  }

  // ── Crear staff_users (owner) ────────────────────────────────────────────
  const { error: staffError } = await supabase
    .from('staff_users')
    .insert({
      id: user.id,
      venue_id: venue.id,
      name: body.staffName,
      role: 'owner',
      email: user.email ?? '',
    })

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 })
  }

  // ── Crear zonas y mesas ──────────────────────────────────────────────────
  let positionOrder = 1
  for (const zoneInput of body.zones) {
    const { data: zone, error: zoneError } = await supabase
      .from('zones')
      .insert({
        venue_id: venue.id,
        name: zoneInput.name,
        prefix: zoneInput.prefix,
      })
      .select()
      .single()

    if (zoneError || !zone) continue

    const tablesToInsert = zoneInput.tables.map(t => ({
      venue_id: venue.id,
      zone_id: zone.id,
      label: t.label,
      capacity: t.capacity,
      position_order: positionOrder++,
    }))

    if (tablesToInsert.length > 0) {
      await supabase.from('tables').insert(tablesToInsert)
    }
  }

  // ── Crear suscripción trial (30 días gratis) ────────────────────────────
  await supabase
    .from('venue_subscriptions')
    .insert({ venue_id: venue.id, status: 'trial' })

  return NextResponse.json({ ok: true, venueId: venue.id })
}
