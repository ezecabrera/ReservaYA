import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/** POST /api/menu/items — crea un ítem del menú */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as {
    category_id: string
    venue_id: string
    name: string
    price: number
    description?: string
    availability_status?: string
  }

  const admin = createAdminClient()

  // Colocar al final de la categoría: sort_order = max(category) + 1.
  // Si todavía no hay items (max = null) arranca en 0.
  const { data: maxRow } = await admin
    .from('menu_items')
    .select('sort_order')
    .eq('category_id', body.category_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSortOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0

  const { data, error } = await admin
    .from('menu_items')
    .insert({
      venue_id: body.venue_id,
      category_id: body.category_id,
      name: body.name,
      price: body.price,
      description: body.description ?? null,
      availability_status: body.availability_status ?? 'available',
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
