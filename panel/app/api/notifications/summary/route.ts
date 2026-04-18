import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET /api/notifications/summary
 * Devuelve conteos del outbox para el venue del staff:
 *   - pending: scheduled_at <= now, esperando envío (indica atraso del worker)
 *   - failed:  reintento agotado (>= 5 attempts), revisar manualmente
 *   - sent_today: volumen del día
 *
 * Fallback graceful: si migration 009 no está aplicada, devuelve ceros.
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

  const now = new Date().toISOString()
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)

  const [pendingRes, failedRes, sentTodayRes] = await Promise.all([
    admin.from('notifications').select('id', { count: 'exact', head: true })
      .eq('venue_id', staffUser.venue_id).eq('status', 'pending').lte('scheduled_at', now),
    admin.from('notifications').select('id', { count: 'exact', head: true })
      .eq('venue_id', staffUser.venue_id).eq('status', 'failed'),
    admin.from('notifications').select('id', { count: 'exact', head: true })
      .eq('venue_id', staffUser.venue_id).eq('status', 'sent').gte('sent_at', startOfDay.toISOString()),
  ])

  const anyError =
    (pendingRes.error && !pendingRes.error.message?.includes('does not exist')) ||
    (failedRes.error && !failedRes.error.message?.includes('does not exist')) ||
    (sentTodayRes.error && !sentTodayRes.error.message?.includes('does not exist'))

  if (anyError) {
    return NextResponse.json({
      pending: 0, failed: 0, sent_today: 0, available: false,
    })
  }

  return NextResponse.json({
    pending: pendingRes.count ?? 0,
    failed: failedRes.count ?? 0,
    sent_today: sentTodayRes.count ?? 0,
    available: !pendingRes.error && !failedRes.error && !sentTodayRes.error,
  })
}
