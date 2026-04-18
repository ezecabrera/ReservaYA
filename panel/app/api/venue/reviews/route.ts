import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET /api/venue/reviews
 * Ratings user_to_venue del venue del staff, ordenadas por más recientes.
 * Incluye campo `disputed` para que el panel sepa cuáles apelar.
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

  const { data, error } = await admin
    .from('ratings')
    .select('id, stars, comment, created_at, disputed, dispute_reason')
    .eq('venue_id', staffUser.venue_id)
    .eq('direction', 'user_to_venue')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    // Graceful: si migration 008 no aplicada, devolvemos array vacío
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
