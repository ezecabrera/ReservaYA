/* UnToque · API venue images — patch & delete por id.
 *
 *   PATCH  /api/venue/images/:id  → { alt_text?, sort_order? }
 *   DELETE /api/venue/images/:id  → borra storage + fila DB
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'
import { UpdateVenueImageSchema, parseBody } from '@/lib/schemas'
import type { VenueImage } from '@/lib/shared/types/venue-image'

const BUCKET = 'venue-photos'

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return data?.venue_id ?? null
}

/* ─── PATCH ───────────────────────────────────────────────── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'venue.images.patch' })
  const { id } = await context.params

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

  const parsed = await parseBody(request, UpdateVenueImageSchema)
  if (!parsed.ok) return parsed.response

  const admin = createAdminClient()
  const { data: img, error: fetchErr } = await admin
    .from('venue_images')
    .select('id, venue_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) {
    log.error({ err: fetchErr.message, id }, 'fetch image failed')
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!img) {
    return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }
  if (img.venue_id !== venueId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const patch: Record<string, unknown> = {}
  if (parsed.data.alt_text !== undefined) patch.alt_text = parsed.data.alt_text
  if (parsed.data.sort_order !== undefined)
    patch.sort_order = parsed.data.sort_order

  const { data, error } = await admin
    .from('venue_images')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error({ err: error.message, id }, 'update failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  log.info({ id, venueId }, 'venue image patched')
  return NextResponse.json(data as VenueImage)
}

/* ─── DELETE ──────────────────────────────────────────────── */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'venue.images.delete' })
  const { id } = await context.params

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

  const admin = createAdminClient()
  const { data: img, error: fetchErr } = await admin
    .from('venue_images')
    .select('id, venue_id, storage_path, kind')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) {
    log.error({ err: fetchErr.message, id }, 'fetch image failed')
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!img) {
    return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }
  if (img.venue_id !== venueId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Storage primero (best-effort: si falla, igual borramos la fila DB)
  if (img.storage_path) {
    const { error: rmErr } = await admin.storage
      .from(BUCKET)
      .remove([img.storage_path])
    if (rmErr) {
      log.warn(
        { err: rmErr.message, id, storage_path: img.storage_path },
        'storage remove failed (continuing with DB delete)',
      )
    }
  }

  const { error: delErr } = await admin
    .from('venue_images')
    .delete()
    .eq('id', id)

  if (delErr) {
    log.error({ err: delErr.message, id }, 'db delete failed')
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  log.info({ id, venueId, kind: img.kind }, 'venue image deleted')
  return NextResponse.json({ ok: true })
}
