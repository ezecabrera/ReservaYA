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
      .select('status, venue_id, venues(name)')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'checked_in', 'no_show']),
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
  const favoriteVenue = Object.values(venueCounts).sort((a, b) => b.count - a.count)[0] ?? null

  return NextResponse.json({
    name: profile?.name ?? 'Usuario',
    phone: profile?.phone ?? user.phone ?? '',
    email: profile?.email ?? user.email ?? '',
    memberSince: profile?.created_at ?? user.created_at,
    stats: {
      total: reservations.length,
      checkedIn: reservations.filter(r => r.status === 'checked_in').length,
      favoriteVenue: favoriteVenue?.name ?? null,
    },
  })
}

/** PATCH /api/perfil — actualiza el nombre */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { name: string }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('users')
    .update({ name: body.name.trim() })
    .eq('id', user.id)
    .select('name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
