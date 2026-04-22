import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/venues — Lista de venues activos para el Home */
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address, description, image_url, config_json, cut_off_minutes')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
