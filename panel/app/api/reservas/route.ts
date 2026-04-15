import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reservas?date=YYYY-MM-DD
 * Devuelve reservas del venue para la fecha dada, con datos de mesa y usuario.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const date = request.nextUrl.searchParams.get('date')
    ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, status, date, time_slot, party_size, qr_token,
      tables(label),
      users(name)
    `)
    .eq('venue_id', staffUser.venue_id)
    .eq('date', date)
    .order('time_slot', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
