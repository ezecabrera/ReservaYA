import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeVenueRatingStats } from '@/lib/shared'

/**
 * GET /api/venues/[id]/rating-stats (público)
 * Devuelve el agregado de rating + % cancelaciones unilaterales del venue.
 * Alimenta el perfil público en la app cliente.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const supabase = await createClient()

  // Traemos ratings visibles user_to_venue + muestras de reservas recientes
  const [ratingsResult, reservationsResult] = await Promise.all([
    supabase
      .from('ratings')
      .select('stars, hidden')
      .eq('venue_id', id)
      .eq('direction', 'user_to_venue')
      .eq('hidden', false)
      .eq('disputed', false),  // excluir disputadas de agregado público
    supabase
      .from('reservations')
      .select('status, cancelled_by, date')
      .eq('venue_id', id),
  ])

  if (ratingsResult.error || reservationsResult.error) {
    return NextResponse.json(
      { error: ratingsResult.error?.message ?? reservationsResult.error?.message },
      { status: 500 },
    )
  }

  const stats = computeVenueRatingStats(
    ratingsResult.data ?? [],
    reservationsResult.data ?? [],
  )

  return NextResponse.json(stats)
}
