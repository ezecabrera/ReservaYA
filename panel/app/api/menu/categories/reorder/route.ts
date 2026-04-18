import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * POST /api/menu/categories/reorder
 *
 * Recibe un array de { id, sort_order } y actualiza todas las filas en
 * una transacción lógica. Se usa tras un drag-reorder en el cliente —
 * mucho más barato que N PATCHes separados.
 *
 * Validación: todas las categorías deben pertenecer al venue del staff
 * autenticado. Si una no pertenece, se rechaza la operación entera.
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

  // Verificar que todas las categorías pertenezcan al venue
  const { data: existing } = await admin
    .from('menu_categories')
    .select('id, venue_id')
    .in('id', ids)

  if (!existing || existing.length !== ids.length) {
    return NextResponse.json({ error: 'Alguna categoría no existe' }, { status: 404 })
  }

  const foreign = existing.find((c) => c.venue_id !== staffUser.venue_id)
  if (foreign) {
    return NextResponse.json({ error: 'Categoría fuera de tu venue' }, { status: 403 })
  }

  // Actualizar en secuencia. PostgREST no tiene bulk-update con diferentes
  // valores en un solo request, pero son pocas categorías (< 20 típicamente).
  const results = await Promise.all(
    body.orders.map(({ id, sort_order }) =>
      admin
        .from('menu_categories')
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
