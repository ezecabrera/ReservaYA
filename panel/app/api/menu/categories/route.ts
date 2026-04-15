import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** POST /api/menu/categories — crea una categoría */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { venue_id: string; name: string; sort_order: number }

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      venue_id: body.venue_id,
      name: body.name,
      sort_order: body.sort_order,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
