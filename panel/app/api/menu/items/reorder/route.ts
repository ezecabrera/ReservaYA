import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * POST /api/menu/items/reorder
 *
 * Reordena platos dentro de una misma categoría (drag-drop en panel).
 * Body: { orders: [{ id, sort_order }] }. Todos los items deben pertenecer
 * al venue del staff autenticado — si uno no lo hace, se rechaza todo.
 *
 * Nota: el endpoint no verifica que los items sean de la misma categoría —
 * el UI nunca mezcla drags entre categorías. Si en el futuro se permite
 * arrastrar entre categorías, agregar validación de category_id target.
 */

interface ReorderBody {
  orders: { id: string; sort_order: number }[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  let body: ReorderBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!Array.isArray(body.orders) || body.orders.length === 0) {
    return NextResponse.json({ error: 'Falta lista de orders' }, { status: 400 })
  }

  const ids = body.orders.map((o) => o.id)

  const { data: existing } = await admin
    .from('menu_items')
    .select('id, venue_id')
    .in('id', ids)

  if (!existing || existing.length !== ids.length) {
    return NextResponse.json({ error: 'Algún plato no existe' }, { status: 404 })
  }

  const foreign = existing.find((i) => i.venue_id !== staffUser.venue_id)
  if (foreign) {
    return NextResponse.json({ error: 'Plato fuera de tu venue' }, { status: 403 })
  }

  const results = await Promise.all(
    body.orders.map(({ id, sort_order }) =>
      admin
        .from('menu_items')
        .update({ sort_order })
        .eq('id', id),
    ),
  )

  const errored = results.find((r) => r.error)
  if (errored?.error) {
    return NextResponse.json(
      { error: errored.error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, count: body.orders.length })
}
