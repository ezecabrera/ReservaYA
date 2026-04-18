import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { buildGuestProfiles, guestsToCsv } from '@/lib/shared'
import type { GuestReservationRow } from '@/lib/shared/utils/crm'

/**
 * GET /api/crm/export
 * Descarga la base de comensales del venue como CSV.
 * Diferenciador clave vs competencia: los datos son del restaurante y los
 * puede llevarse en cualquier momento, sin fricción.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, venues(name)')
    .eq('id', user.id)
    .single() as { data: { venue_id: string; venues: { name: string } } | null }

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const { data: rows, error } = await admin
    .from('reservations')
    .select(`
      user_id, status, date, party_size, created_at,
      guest_name, guest_phone,
      users(name, phone)
    `)
    .eq('venue_id', staffUser.venue_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  const typed = (rows ?? []) as unknown as Row[]
  const flat: GuestReservationRow[] = typed.map((r) => ({
    user_id: r.user_id,
    user_name: r.users?.name ?? null,
    user_phone: r.users?.phone ?? null,
    guest_name: r.guest_name,
    guest_phone: r.guest_phone,
    status: r.status,
    date: r.date,
    party_size: r.party_size,
    created_at: r.created_at,
  }))

  const profiles = buildGuestProfiles(flat)
  const csv = guestsToCsv(profiles)

  const today = new Date().toISOString().slice(0, 10)
  const venueSlug = staffUser.venues.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `comensales-${venueSlug}-${today}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
