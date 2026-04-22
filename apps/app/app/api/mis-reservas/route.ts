import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/mis-reservas
 * Devuelve todas las reservas del usuario autenticado, con venue/mesa/pago.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, status, date, time_slot, party_size, qr_token,
      venues ( id, name, address ),
      tables ( label )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
