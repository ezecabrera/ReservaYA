import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/grupo/[token]
 * Devuelve los detalles del grupo para el link compartible (público).
 *
 * Incluye:
 * - Datos de la reserva (venue, fecha, mesa, organizador)
 * - Lista de guests con su estado de pedido (menu_status + menu_items)
 * - Menú del venue (categorías + items) para que cada guest elija
 * - Flag isOrganizer: true si el user logueado es el dueño de la reserva
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('group_rooms')
    .select(`
      id, link_token, reservation_id,
      reservations (
        user_id, venue_id, date, time_slot, party_size,
        venues ( name, address ),
        tables ( label ),
        users ( name )
      )
    `)
    .eq('link_token', params.token)
    .single()

  if (!room) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })

  // Guests con menu info. Si la columna aún no existe (migration 006 no
  // aplicada), fallback al select básico de 001.
  let guests: Array<{
    id: string; name: string; confirmed_at: string | null; created_at: string
    menu_status?: 'pending' | 'ordered' | 'skipped'
    menu_items?: Array<{ item_id: string; name: string; price: number; qty: number }>
    menu_decided_at?: string | null
  }> = []
  {
    const { data, error } = await supabase
      .from('group_guests')
      .select('id, name, confirmed_at, created_at, menu_status, menu_items, menu_decided_at')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
    if (error && error.message?.toLowerCase().includes('does not exist')) {
      const fallback = await supabase
        .from('group_guests')
        .select('id, name, confirmed_at, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
      guests = (fallback.data ?? []).map((g) => ({ ...g, menu_status: 'pending' as const, menu_items: [] }))
    } else {
      guests = data ?? []
    }
  }

  // Organizer flag
  const { data: { user } } = await supabase.auth.getUser()
  const reservation = (room as unknown as { reservations?: { user_id?: string } }).reservations
  const isOrganizer = !!user && !!reservation?.user_id && user.id === reservation.user_id

  // Menú del venue (admin client para bypass RLS — mismo patrón que /[venueId])
  const venueId = (room as unknown as { reservations?: { venue_id?: string } }).reservations?.venue_id
  let menu: Array<{ name: string; items: Array<{ id: string; name: string; price: number; description: string | null }> }> = []
  if (venueId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    )
    const [{ data: cats }, { data: items }] = await Promise.all([
      admin.from('menu_categories').select('id, name, sort_order').eq('venue_id', venueId).order('sort_order'),
      admin.from('menu_items').select('id, category_id, name, price, description').eq('venue_id', venueId).eq('availability_status', 'available'),
    ])
    menu = (cats ?? []).map((c) => ({
      name: c.name,
      items: (items ?? [])
        .filter((it) => it.category_id === c.id)
        .map((it) => ({ id: it.id, name: it.name, price: Number(it.price), description: it.description })),
    })).filter((c) => c.items.length > 0)
  }

  return NextResponse.json({ room, guests, menu, isOrganizer })
}
