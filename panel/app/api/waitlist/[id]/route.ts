import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { WaitlistStatus } from '@/lib/shared'

/**
 * PATCH /api/waitlist/[id]
 * Transiciona una entry de la waitlist: notified, seated, left, expired.
 * Registra timestamps en notified_at / seated_at según corresponda.
 */

const VALID_STATUSES: WaitlistStatus[] = [
  'waiting',
  'notified',
  'seated',
  'left',
  'expired',
]

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

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

  const { data: current } = await admin
    .from('waitlist_entries')
    .select('id, venue_id, status')
    .eq('id', id)
    .single()

  if (!current || current.venue_id !== staffUser.venue_id) {
    return NextResponse.json({ error: 'Entry no encontrada' }, { status: 404 })
  }

  let body: { status?: WaitlistStatus; notes?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.status) {
    update.status = body.status
    if (body.status === 'notified') update.notified_at = new Date().toISOString()
    if (body.status === 'seated')   update.seated_at   = new Date().toISOString()
  }
  if (body.notes !== undefined) update.notes = body.notes

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await admin
    .from('waitlist_entries')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
