import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { buildGuestProfiles } from '@/lib/shared'
import type { GuestReservationRow } from '@/lib/shared/utils/crm'

/**
 * GET /api/crm/guests?search=texto
 * Devuelve todos los comensales del venue con sus stats y tags calculados.
 * Alimentación: reservas históricas del venue (cualquier estado).
 *
 * El cálculo se hace in-memory — a escala de venue (cientos o miles de
 * reservas por mes), el costo es trivial. Si llegamos a >100k filas por venue
 * moveremos esto a una vista materializada en Postgres.
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

  // Fallback a schema legacy si migration 006 no está aplicada
  let result: { data: unknown; error: { message?: string } | null } = await admin
    .from('reservations')
    .select(`
      user_id, status, date, party_size, created_at,
      guest_name, guest_phone,
      users(name, phone)
    `)
    .eq('venue_id', staffUser.venue_id)

  if (result.error?.message?.includes('does not exist')) {
    result = await admin
      .from('reservations')
      .select(`user_id, status, date, party_size, created_at, users(name, phone)`)
      .eq('venue_id', staffUser.venue_id)
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })

  type Row = {
    user_id: string | null
    status: GuestReservationRow['status']
    date: string
    party_size: number
    created_at: string
    guest_name: string | null
    guest_phone: string | null
    users: { name: string | null; phone: string | null } | null
  }

  const typed = (result.data ?? []) as unknown as Row[]

  const flat: GuestReservationRow[] = typed.map((r) => ({
    user_id: r.user_id,
    user_name: r.users?.name ?? null,
    user_phone: r.users?.phone ?? null,
    guest_name: r.guest_name ?? null,
    guest_phone: r.guest_phone ?? null,
    status: r.status,
    date: r.date,
    party_size: r.party_size,
    created_at: r.created_at,
  }))

  let profiles = buildGuestProfiles(flat)

  const search = request.nextUrl.searchParams.get('search')?.trim().toLowerCase()
  if (search) {
    profiles = profiles.filter((p) =>
      p.name.toLowerCase().includes(search) ||
      (p.phone ?? '').toLowerCase().includes(search)
    )
  }

  return NextResponse.json(profiles)
}
