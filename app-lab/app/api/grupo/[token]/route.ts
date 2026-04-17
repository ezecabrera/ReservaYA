import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/grupo/[token]
 * Devuelve los detalles del grupo para el link compartible (público).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('group_rooms')
    .select(`
      id, link_token,
      reservations (
        date, time_slot, party_size,
        venues ( name, address ),
        tables ( label ),
        users ( name )
      )
    `)
    .eq('link_token', params.token)
    .single()

  if (!room) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })

  const { data: guests } = await supabase
    .from('group_guests')
    .select('id, name, confirmed_at, created_at')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ room, guests: guests ?? [] })
}
