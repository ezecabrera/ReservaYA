import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/venues/[id] — Detalle del venue con mesas y zonas */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()

  const [venueResult, tablesResult, zonesResult] = await Promise.all([
    supabase
      .from('venues')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('tables')
      .select('*')
      .eq('venue_id', params.id)
      .eq('is_active', true)
      .order('position_order'),
    supabase
      .from('zones')
      .select('*')
      .eq('venue_id', params.id)
      .order('name'),
  ])

  if (venueResult.error || !venueResult.data) {
    return NextResponse.json({ error: 'Venue no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    venue: venueResult.data,
    tables: tablesResult.data ?? [],
    zones: zonesResult.data ?? [],
  })
}
