/* UnToque · API venue images — reorder galería.
 *
 *   POST /api/venue/images/reorder  → { ids: string[] }
 *
 * Sólo afecta filas con kind='gallery' del venue del staff.
 * Cada id se reasigna a sort_order = index del array.
 * Logo y cover se ignoran si vienen en el array.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'
import { ReorderVenueImagesSchema, parseBody } from '@/lib/schemas'

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return data?.venue_id ?? null
}

export async function POST(request: NextRequest) {
  const log = requestLogger(request).child({
    endpoint: 'venue.images.reorder',
  })

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

  const parsed = await parseBody(request, ReorderVenueImagesSchema)
  if (!parsed.ok) return parsed.response

  const { ids } = parsed.data

  const admin = createAdminClient()

  // Verificar ownership de TODAS las imágenes que vienen
  const { data: rows, error: fetchErr } = await admin
    .from('venue_images')
    .select('id, venue_id, kind')
    .in('id', ids)

  if (fetchErr) {
    log.error({ err: fetchErr.message }, 'fetch rows failed')
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!rows || rows.length !== ids.length) {
    return NextResponse.json(
      { error: 'Alguna imagen no existe' },
      { status: 404 },
    )
  }
  for (const r of rows) {
    if (r.venue_id !== venueId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  // Sólo reordenamos las que son gallery (logo/cover se ignoran)
  const galleryIds = rows
    .filter((r) => r.kind === 'gallery')
    .map((r) => r.id as string)
  const galleryIdSet = new Set(galleryIds)
  const ordered = ids.filter((id) => galleryIdSet.has(id))

  // UPDATE batch: por cada id, sort_order = index
  // (Supabase no tiene transactions desde JS client, hacemos updates secuenciales.
  // Si uno falla, devolvemos error pero los previos quedan aplicados —
  // riesgo aceptable para reorder visual; el cliente puede reintentar.)
  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i]
    const { error } = await admin
      .from('venue_images')
      .update({ sort_order: i })
      .eq('id', id)
      .eq('venue_id', venueId)
      .eq('kind', 'gallery')

    if (error) {
      log.error(
        { err: error.message, id, index: i },
        'reorder update failed',
      )
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  log.info(
    { venueId, count: ordered.length },
    'venue gallery reordered',
  )

  return NextResponse.json({ ok: true, order: ordered })
}
