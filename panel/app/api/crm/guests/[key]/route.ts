import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { buildGuestProfiles, guestKey } from '@/lib/shared'
import type { GuestReservationRow } from '@/lib/shared/utils/crm'

/**
 * GET /api/crm/guests/[key]
 * Devuelve el perfil completo de un comensal identificado por su `key`:
 *   - stats + tags (igual que el listado)
 *   - historial completo de reservas (fecha, estado, mesa, notas, source)
 *   - ratings internos recibidos (venue_to_user) para este comensal
 *
 * La key se construye client-side desde el row del listado (ej: "user:<uuid>"
 * o "phone:+5491112345678") y se URL-encodea.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key: rawKey } = await ctx.params
  const key = decodeURIComponent(rawKey)

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

  // Fallback a legacy si migration 006 no está aplicada
  let result: { data: unknown; error: { message?: string } | null } = await admin
    .from('reservations')
    .select(`
      id, user_id, status, date, time_slot, party_size, created_at,
      guest_name, guest_phone, notes, source, cancelled_by,
      tables(label),
      users(name, phone)
    `)
    .eq('venue_id', staffUser.venue_id)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false })

  if (result.error?.message?.includes('does not exist')) {
    result = await admin
      .from('reservations')
      .select(`
        id, user_id, status, date, time_slot, party_size, created_at,
        tables(label),
        users(name, phone)
      `)
      .eq('venue_id', staffUser.venue_id)
      .order('date', { ascending: false })
      .order('time_slot', { ascending: false })
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })

  type Row = {
    id: string
    user_id: string | null
    status: GuestReservationRow['status']
    date: string
    time_slot: string
    party_size: number
    created_at: string
    guest_name: string | null
    guest_phone: string | null
    notes: string | null
    source: string | null
    cancelled_by: string | null
    tables: { label: string } | null
    users: { name: string | null; phone: string | null } | null
  }

  const typed = (result.data ?? []) as unknown as Row[]

  // Filtrar las filas de este comensal
  const matches = typed.filter((r) =>
    guestKey({
      user_id: r.user_id,
      user_name: r.users?.name ?? null,
      user_phone: r.users?.phone ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      status: r.status,
      date: r.date,
      party_size: r.party_size,
      created_at: r.created_at,
    }) === key,
  )

  if (matches.length === 0) {
    return NextResponse.json({ error: 'Comensal no encontrado' }, { status: 404 })
  }

  // Rebuild del profile usando el mismo algoritmo del listado
  const profile = buildGuestProfiles(
    matches.map((r) => ({
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
  )[0]

  // Historial con datos relacionales para la UI
  const history = matches.map((r) => ({
    id: r.id,
    date: r.date,
    time_slot: r.time_slot,
    party_size: r.party_size,
    status: r.status,
    source: r.source ?? null,
    cancelled_by: r.cancelled_by ?? null,
    notes: r.notes ?? null,
    table_label: r.tables?.label ?? null,
  }))

  // Ratings internos — si la tabla no existe (migration 008 no aplicada),
  // devolvemos array vacío en lugar de fallar.
  const reservationIds = matches.map((r) => r.id)
  const ratingsRes = await admin
    .from('ratings')
    .select('id, stars, comment, created_at, reservation_id')
    .eq('venue_id', staffUser.venue_id)
    .eq('direction', 'venue_to_user')
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: false })

  const ratings = ratingsRes.error ? [] : (ratingsRes.data ?? [])

  // Audit trail de este comensal — fallback si migration 011 no aplicada
  const eventsRes = await admin
    .from('reservation_events')
    .select('id, reservation_id, event_type, actor_role, notes, diff_json, created_at')
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: false })
    .limit(50)

  const events = eventsRes.error ? [] : (eventsRes.data ?? [])

  return NextResponse.json({
    profile,
    history,
    ratings,
    events,
  })
}
