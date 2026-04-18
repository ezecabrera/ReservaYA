import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET /api/tables
 * Devuelve las mesas activas del venue del staff autenticado.
 * Se usa desde el panel para selectors (crear reserva manual, etc.).
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
    .from('tables')
    .select('id, label, capacity, zone_id')
    .eq('venue_id', staffUser.venue_id)
    .eq('is_active', true)
    .order('position_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
