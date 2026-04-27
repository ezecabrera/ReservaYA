/* UnToque · API customer tag — update & delete.
 *
 *   PATCH  /api/customers/:phone/tags/:tagId   → edita value/notes
 *   DELETE /api/customers/:phone/tags/:tagId   → 204 No Content
 *
 * Ownership: tag.venue_id debe coincidir con staff_users.venue_id.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'
import { UpdateCustomerTagSchema, parseBody } from '@/lib/schemas'

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return (data?.venue_id as string | undefined) ?? null
}

async function loadTagOwnership(tagId: string): Promise<{
  id: string
  venue_id: string
} | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('customer_tags')
    .select('id, venue_id')
    .eq('id', tagId)
    .single()
  if (!data) return null
  return data as { id: string; venue_id: string }
}

/* ─── PATCH ───────────────────────────────────────────────── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ phone: string; tagId: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'customers.tags.update' })
  const { tagId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const venueId = await resolveStaffVenueId(user.id)
  if (!venueId) {
    return NextResponse.json(
      { error: 'No sos staff de ningún venue' },
      { status: 403 },
    )
  }

  const tag = await loadTagOwnership(tagId)
  if (!tag) {
    return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 })
  }
  if (tag.venue_id !== venueId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const parsed = await parseBody(request, UpdateCustomerTagSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const patch: Record<string, unknown> = {}
  if (body.value !== undefined) patch.value = body.value
  if (body.notes !== undefined) patch.notes = body.notes

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('customer_tags')
    .update(patch)
    .eq('id', tagId)
    .select('*')
    .single()

  if (error) {
    const code = (error as { code?: string }).code
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Ese tag ya existe para este cliente' },
        { status: 409 },
      )
    }
    log.error({ err: error.message, code, tagId }, 'update failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  log.info({ tag_id: tagId, venueId }, 'customer tag updated')
  return NextResponse.json(data)
}

/* ─── DELETE ──────────────────────────────────────────────── */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ phone: string; tagId: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'customers.tags.delete' })
  const { tagId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const venueId = await resolveStaffVenueId(user.id)
  if (!venueId) {
    return NextResponse.json(
      { error: 'No sos staff de ningún venue' },
      { status: 403 },
    )
  }

  const tag = await loadTagOwnership(tagId)
  if (!tag) {
    return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 })
  }
  if (tag.venue_id !== venueId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('customer_tags').delete().eq('id', tagId)

  if (error) {
    log.error({ err: error.message, tagId }, 'delete failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  log.info({ tag_id: tagId, venueId }, 'customer tag deleted')
  return new NextResponse(null, { status: 204 })
}
