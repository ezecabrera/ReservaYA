import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/grupo/[token]/join
 * Body: { name: string }
 * Cualquiera puede unirse — no requiere cuenta.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('group_rooms')
    .select('id')
    .eq('link_token', params.token)
    .single()

  if (!room) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })

  const body = await request.json() as { name: string }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data: guest, error } = await supabase
    .from('group_guests')
    .insert({
      room_id: room.id,
      name: body.name.trim(),
      confirmed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(guest)
}
