import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      venue_id: body.venue_id,
      category_id: body.category_id,
      name: body.name,
      price: body.price,
      description: body.description ?? null,
      availability_status: body.availability_status ?? 'available',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
