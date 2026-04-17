import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface OrderItemInput {
  menu_item_id: string
  qty: number
  unit_price: number
}

/**
 * POST /api/orders
 * Body: { reservation_id: string; items: OrderItemInput[] }
 * Crea la orden con sus ítems asociados a la reserva.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { reservation_id: string; items: OrderItemInput[] }
  if (!body.reservation_id || !body.items?.length) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verificar que la reserva pertenece al usuario
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id')
    .eq('id', body.reservation_id)
    .eq('user_id', user.id)
    .single()

  if (!reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const total = body.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0)

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ reservation_id: body.reservation_id, status: 'pending', total })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  // Crear ítems de la orden
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      body.items.map(i => ({
        order_id: order.id,
        menu_item_id: i.menu_item_id,
        qty: i.qty,
        unit_price: i.unit_price,
      }))
    )

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  return NextResponse.json({ id: order.id, total })
}
