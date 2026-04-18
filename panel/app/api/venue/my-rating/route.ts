import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { computeVenueRatingStats } from '@/lib/shared'

/**
 * GET /api/venue/my-rating
 * Devuelve el agregado del venue del staff autenticado, incluyendo el
 * % de cancelaciones unilaterales. Alimenta el dashboard de analytics y
 * el pitch interno: "así te ve tu público".
 */
export async function GET() {
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

  const [ratingsResult, reservationsResult] = await Promise.all([
    admin
      .from('ratings')
      .select('stars, hidden')
      .eq('venue_id', staffUser.venue_id)
      .eq('direction', 'user_to_venue')
      .eq('hidden', false)
      .eq('disputed', false),
    admin
      .from('reservations')
      .select('status, cancelled_by, date')
      .eq('venue_id', staffUser.venue_id),
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
