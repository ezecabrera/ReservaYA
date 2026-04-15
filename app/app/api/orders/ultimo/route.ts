import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/orders/ultimo?venue_id=xxx
 * Devuelve los ítems del último pedido del usuario en este venue,
 * para la funcionalidad "Lo de siempre".
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const venueId = request.nextUrl.searchParams.get('venue_id')
  if (!venueId) return NextResponse.json([], { status: 200 })

  // Buscar el último pedido del usuario en este venue
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .in('status', ['confirmed', 'checked_in'])
    .order('date', { ascending: false })
    .limit(5)

  if (!reservations?.length) return NextResponse.json([])

  const reservationIds = reservations.map(r => r.id)

  // Buscar la última orden con ítems
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!order) return NextResponse.json([])

  // Traer los ítems con datos del menú
  const { data: items } = await supabase
    .from('order_items')
    .select(`
      menu_item_id, qty, unit_price,
      menu_items ( name, availability_status )
    `)
    .eq('order_id', order.id)

  return NextResponse.json(
    (items ?? [])
      .filter(i => (i.menu_items as { availability_status: string } | null)?.availability_status !== 'unavailable')
      .map(i => ({
        menu_item_id: i.menu_item_id,
        name: (i.menu_items as { name: string } | null)?.name ?? '',
        qty: i.qty,
        unit_price: i.unit_price,
      }))
  )
}
