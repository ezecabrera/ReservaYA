import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { buildGuestProfiles, guestKey } from '@/lib/shared'
import type {
  ManualReservationInput,
  ReservationSource,
  GuestTag,
} from '@/lib/shared'
import type { GuestReservationRow } from '@/lib/shared/utils/crm'
import { enqueueLifecycleById } from '@/lib/notifications/enqueue'
import { logReservationEvent } from '@/lib/audit/logReservationEvent'

/**
 * Orden de prioridad cuando un comensal tiene múltiples tags.
 * El primero que matchee es el que mostramos en la lista del día.
 */
const TAG_PRIORITY: GuestTag[] = [
  'no_show_previo',
  'vip',
  'habitue',
  'regular_reciente',
  'primera_vez',
]

function primaryTag(tags: GuestTag[]): GuestTag | null {
  for (const t of TAG_PRIORITY) {
    if (tags.includes(t)) return t
  }
  return null
}

/**
 * GET /api/reservas?date=YYYY-MM-DD
 * Devuelve reservas del venue para la fecha dada, con datos de mesa y usuario.
 * Incluye datos de walk-ins (guest_name / guest_phone) cuando la reserva no
 * tiene usuario registrado.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const date = request.nextUrl.searchParams.get('date')
    ?? new Date().toISOString().slice(0, 10)

  // Traemos dos sets en paralelo:
  //   1) reservas del día solicitado (lo que devolvemos al cliente)
  //   2) historial completo del venue para calcular tags del guest
  //
  // Las columnas `source, guest_name, guest_phone, notes` vienen de migration 006.
  // Si no están aplicadas, hacemos fallback al schema legacy (pre-006) así el
  // panel sigue siendo usable mientras el DBA corre las migrations.
  const WITH_NEW = `
    id, status, date, time_slot, party_size, qr_token, table_id,
    source, guest_name, guest_phone, notes, user_id,
    tables(label),
    users(name, phone)
  `
  const LEGACY = `
    id, status, date, time_slot, party_size, qr_token, table_id, user_id,
    tables(label),
    users(name, phone)
  `

  // Los tipos inferidos por Supabase cambian según la forma del SELECT, por
  // eso usamos un any genérico aquí — el mapping posterior hace los casts
  // explícitos con defaults para columnas que pueden faltar pre-migration-006.
  let todayResult: { data: unknown; error: { message?: string } | null } = await admin
    .from('reservations')
    .select(WITH_NEW)
    .eq('venue_id', staffUser.venue_id)
    .eq('date', date)
    .order('time_slot', { ascending: true })

  if (todayResult.error?.message?.includes('does not exist')) {
    todayResult = await admin
      .from('reservations')
      .select(LEGACY)
      .eq('venue_id', staffUser.venue_id)
      .eq('date', date)
      .order('time_slot', { ascending: true })
  }

  if (todayResult.error) {
    return NextResponse.json({ error: todayResult.error.message }, { status: 500 })
  }

  const HIST_WITH_NEW = `
    user_id, status, date, party_size, created_at,
    guest_name, guest_phone,
    users(name, phone)
  `
  const HIST_LEGACY = `
    user_id, status, date, party_size, created_at,
    users(name, phone)
  `
  let historyResult: { data: unknown; error: { message?: string } | null } = await admin
    .from('reservations')
    .select(HIST_WITH_NEW)
    .eq('venue_id', staffUser.venue_id)

  if (historyResult.error?.message?.includes('does not exist')) {
    historyResult = await admin
      .from('reservations')
      .select(HIST_LEGACY)
      .eq('venue_id', staffUser.venue_id)
  }

  type HistoryRow = {
    user_id: string | null
    status: GuestReservationRow['status']
    date: string
    party_size: number
    created_at: string
    guest_name: string | null
    guest_phone: string | null
    users: { name: string | null; phone: string | null } | null
  }

  const historyTyped = (historyResult.data ?? []) as unknown as HistoryRow[]
  const profiles = buildGuestProfiles(
    historyTyped.map((r) => ({
      user_id: r.user_id,
      user_name: r.users?.name ?? null,
      user_phone: r.users?.phone ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      status: r.status,
      date: r.date,
      party_size: r.party_size,
      created_at: r.created_at,
    })),
  )

  const tagByKey = new Map<string, GuestTag | null>(
    profiles.map((p) => [p.key, primaryTag(p.tags)]),
  )

  type TodayRow = {
    id: string
    status: GuestReservationRow['status']
    date: string
    time_slot: string
    party_size: number
    qr_token: string
    table_id: string
    source: string | null
    guest_name: string | null
    guest_phone: string | null
    notes: string | null
    user_id: string | null
    tables: { label: string } | null
    users: { name: string | null; phone: string | null } | null
  }

  const todayTyped = (todayResult.data ?? []) as unknown as TodayRow[]
  const enriched = todayTyped.map((r) => {
    const key = guestKey({
      user_id: r.user_id,
      user_name: r.users?.name ?? null,
      user_phone: r.users?.phone ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      status: r.status,
      date: r.date,
      party_size: r.party_size,
      created_at: '',
    })
    return {
      ...r,
      // Coerce fields opcionales de migration 006 a null si la DB no los tiene
      source: r.source ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      notes: r.notes ?? null,
      guest_tag: tagByKey.get(key) ?? null,
    }
  })

  return NextResponse.json(enriched)
}

/**
 * POST /api/reservas
 * Crea una reserva manual desde el panel (walk-in o llamada telefónica).
 * La reserva queda en status='confirmed' sin pasar por el flujo de pago.
 *
 * Body: ManualReservationInput
 *
 * Validaciones:
 * - Auth del staff + venue asociado
 * - Mesa pertenece al venue del staff
 * - No hay conflicto con reserva activa en misma mesa/fecha/slot
 * - party_size ≤ capacidad de la mesa
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue asociado' }, { status: 403 })

  let body: Partial<ManualReservationInput>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const {
    table_id,
    date,
    time_slot,
    party_size,
    guest_name,
    guest_phone,
    notes,
    source = 'panel',
    duration_minutes,
  } = body

  // Validación de campos mínimos
  if (!table_id || !date || !time_slot || !party_size || !guest_name) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: mesa, fecha, horario, personas, nombre del cliente' },
      { status: 400 },
    )
  }

  if (party_size < 1 || party_size > 40) {
    return NextResponse.json({ error: 'Cantidad de personas inválida' }, { status: 400 })
  }

  // Validación de duración (si viene). Si no viene, la DB usa su DEFAULT 90.
  if (duration_minutes !== undefined) {
    if (!Number.isInteger(duration_minutes) || duration_minutes < 15 || duration_minutes > 480) {
      return NextResponse.json(
        { error: 'Duración inválida (debe estar entre 15 y 480 minutos)' },
        { status: 400 },
      )
    }
  }

  const allowedSources: ReservationSource[] = ['panel', 'walkin', 'phone']
  if (!allowedSources.includes(source as ReservationSource)) {
    return NextResponse.json({ error: 'Canal de origen inválido' }, { status: 400 })
  }

  // Mesa válida y del mismo venue
  const { data: table } = await admin
    .from('tables')
    .select('id, venue_id, capacity, is_active')
    .eq('id', table_id)
    .single()

  if (!table || table.venue_id !== staffUser.venue_id) {
    return NextResponse.json({ error: 'Mesa inexistente' }, { status: 404 })
  }

  if (!table.is_active) {
    return NextResponse.json({ error: 'Mesa inactiva' }, { status: 400 })
  }

  if (party_size > table.capacity) {
    return NextResponse.json(
      { error: `La mesa acepta hasta ${table.capacity} personas` },
      { status: 400 },
    )
  }

  // Conflicto con reserva activa en misma mesa/fecha/slot
  const { data: conflict } = await admin
    .from('reservations')
    .select('id')
    .eq('table_id', table_id)
    .eq('date', date)
    .eq('time_slot', time_slot)
    .in('status', ['confirmed', 'checked_in', 'pending_payment'])
    .maybeSingle()

  if (conflict) {
    return NextResponse.json(
      { error: 'Ya existe una reserva activa en esa mesa y horario' },
      { status: 409 },
    )
  }

  // Crear la reserva en estado confirmed (sin flujo de pago).
  // duration_minutes sólo se manda si viene en el body; si no, la DB usa
  // DEFAULT 90. Si la columna no existe todavía (migration 012 pendiente),
  // reintentamos sin ese campo para no romper el flujo.
  const baseInsert = {
    venue_id: staffUser.venue_id,
    table_id,
    user_id: null,
    date,
    time_slot,
    party_size,
    status: 'confirmed',
    qr_token: '',
    source,
    guest_name: guest_name.trim(),
    guest_phone: guest_phone?.trim() || null,
    notes: notes?.trim() || null,
  }
  const insertPayload: Record<string, unknown> = { ...baseInsert }
  if (duration_minutes !== undefined) insertPayload.duration_minutes = duration_minutes

  let { data: reservation, error: insertError } = await admin
    .from('reservations')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError?.message?.includes('duration_minutes')) {
    const fallback = await admin
      .from('reservations')
      .insert(baseInsert)
      .select()
      .single()
    reservation = fallback.data
    insertError = fallback.error
  }

  if (insertError || !reservation) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Error al crear la reserva' },
      { status: 500 },
    )
  }

  // Outbox WhatsApp lifecycle — no bloquea el retorno al staff
  enqueueLifecycleById(reservation.id).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[api/reservas POST] enqueue fail', err)
  })

  // Audit trail: reserva creada desde el panel por este staff
  logReservationEvent(admin, {
    reservation_id: reservation.id,
    venue_id: staffUser.venue_id,
    event_type: 'created',
    actor_user_id: user.id,
    actor_role: 'staff',
    notes: `Walk-in/llamada · ${source}`,
  })
  logReservationEvent(admin, {
    reservation_id: reservation.id,
    venue_id: staffUser.venue_id,
    event_type: 'confirmed',
    actor_user_id: user.id,
    actor_role: 'staff',
  })

  return NextResponse.json(reservation, { status: 201 })
}
