import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/grupo/[token]/order
 *
 * Un guest guarda su decisión de menú:
 * - status='ordered' + items[] → confirma su pedido
 * - status='skipped' → decide no pedir nada
 *
 * Body:
 * {
 *   guest_id: string,
 *   status: 'ordered' | 'skipped',
 *   items?: Array<{ item_id: string; name: string; price: number; qty: number }>
 * }
 *
 * La security está en el token del grupo: quien tiene el link tiene acceso.
 * Degradación: si migration 006 no está aplicada, devuelve 503 amigable.
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

  const body = await request.json() as {
    guest_id: string
    status: 'ordered' | 'skipped'
    items?: Array<{ item_id: string; name: string; price: number; qty: number }>
  }

  if (!body.guest_id || !body.status) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (body.status !== 'ordered' && body.status !== 'skipped') {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }
  const items = body.status === 'ordered' ? (body.items ?? []) : []
  if (body.status === 'ordered' && items.length === 0) {
    return NextResponse.json({ error: 'Tenés que elegir al menos un ítem' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('group_guests')
    .update({
      menu_status: body.status,
      menu_items: items,
      menu_decided_at: new Date().toISOString(),
    })
    .eq('id', body.guest_id)
    .eq('room_id', room.id)
    .select('id, menu_status, menu_items, menu_decided_at')
    .single()

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('does not exist') || msg.includes('column')) {
      return NextResponse.json(
        { error: 'Feature todavía no activada. Aplicá la migration 006_group_menu_selections.sql.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
