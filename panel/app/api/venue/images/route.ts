/* UnToque · API venue images — list & upload.
 *
 *   GET  /api/venue/images       → VenueImageBundle del venue del staff actual
 *   POST /api/venue/images       → multipart/form-data { kind, alt_text, file }
 *
 * Reglas:
 *   - logo: 1 max (reemplaza el existente)
 *   - cover: 1 max (reemplaza el existente)
 *   - gallery: 12 max
 *   - mime: image/jpeg | image/png | image/webp
 *   - size: ≤ 5MB
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'
import { VenueImageKindSchema } from '@/lib/schemas'
import type {
  VenueImage,
  VenueImageBundle,
  VenueImageKind,
} from '@/lib/shared/types/venue-image'

const BUCKET = 'venue-photos'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_GALLERY = 12
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return data?.venue_id ?? null
}

function bundleFromRows(rows: VenueImage[]): VenueImageBundle {
  const logo = rows.find((r) => r.kind === 'logo') ?? null
  const cover = rows.find((r) => r.kind === 'cover') ?? null
  const gallery = rows
    .filter((r) => r.kind === 'gallery')
    .sort((a, b) => a.sort_order - b.sort_order)
  return { logo, cover, gallery }
}

/* ─── GET ─────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const log = requestLogger(request).child({ endpoint: 'venue.images.list' })
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
  const { data, error } = await admin
    .from('venue_images')
    .select('*')
    .eq('venue_id', venueId)

  if (error) {
    log.error({ err: error.message, venueId }, 'list failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const bundle = bundleFromRows((data ?? []) as VenueImage[])
  return NextResponse.json(bundle)
}

/* ─── POST ────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const log = requestLogger(request).child({ endpoint: 'venue.images.upload' })
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

  // Parse FormData
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'multipart/form-data inválido' },
      { status: 400 },
    )
  }

  const rawKind = form.get('kind')
  const rawAlt = form.get('alt_text')
  const rawFile = form.get('file')

  const kindParse = VenueImageKindSchema.safeParse(rawKind)
  if (!kindParse.success) {
    return NextResponse.json(
      { error: 'kind inválido (logo|cover|gallery)' },
      { status: 400 },
    )
  }
  const kind: VenueImageKind = kindParse.data

  if (typeof rawAlt !== 'string' || rawAlt.trim().length === 0) {
    return NextResponse.json(
      { error: 'alt_text obligatorio (accesibilidad)' },
      { status: 400 },
    )
  }
  const altText = rawAlt.trim().slice(0, 200)

  if (!(rawFile instanceof File)) {
    return NextResponse.json(
      { error: 'file requerido' },
      { status: 400 },
    )
  }
  const file = rawFile

  // mime check
  const mime = file.type
  const ext = ALLOWED_MIME[mime]
  if (!ext) {
    return NextResponse.json(
      { error: 'Formato no soportado. Usá JPEG, PNG o WebP.' },
      { status: 415 },
    )
  }

  // size check
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Archivo > 5MB' },
      { status: 413 },
    )
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Reglas por kind: logo/cover reemplazan al existente; gallery max 12
  if (kind === 'logo' || kind === 'cover') {
    const { data: existing } = await admin
      .from('venue_images')
      .select('id, storage_path')
      .eq('venue_id', venueId)
      .eq('kind', kind)

    if (existing && existing.length > 0) {
      const paths = existing
        .map((r) => r.storage_path)
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
      if (paths.length > 0) {
        const { error: rmErr } = await admin.storage
          .from(BUCKET)
          .remove(paths)
        if (rmErr) {
          log.warn(
            { err: rmErr.message, kind, venueId },
            'storage remove existing failed (continuing)',
          )
        }
      }
      const { error: delErr } = await admin
        .from('venue_images')
        .delete()
        .eq('venue_id', venueId)
        .eq('kind', kind)
      if (delErr) {
        log.error(
          { err: delErr.message, kind, venueId },
          'db delete existing failed',
        )
        return NextResponse.json({ error: delErr.message }, { status: 500 })
      }
    }
  } else {
    // gallery
    const { count, error: countErr } = await admin
      .from('venue_images')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('kind', 'gallery')

    if (countErr) {
      log.error({ err: countErr.message, venueId }, 'gallery count failed')
      return NextResponse.json({ error: countErr.message }, { status: 500 })
    }
    if ((count ?? 0) >= MAX_GALLERY) {
      return NextResponse.json(
        { error: `Máximo ${MAX_GALLERY} imágenes en la galería` },
        { status: 400 },
      )
    }
  }

  // Upload to storage
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const storagePath = `${venueId}/${kind}/${uuid}.${ext}`

  const arrayBuf = await file.arrayBuffer()
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuf, {
      contentType: mime,
      upsert: false,
      cacheControl: '3600',
    })

  if (upErr) {
    log.error(
      { err: upErr.message, kind, storagePath, venueId },
      'storage upload failed',
    )
    return NextResponse.json(
      { error: `Upload falló: ${upErr.message}` },
      { status: 500 },
    )
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

  // sort_order para gallery: append al final
  let sortOrder = 0
  if (kind === 'gallery') {
    const { data: maxRow } = await admin
      .from('venue_images')
      .select('sort_order')
      .eq('venue_id', venueId)
      .eq('kind', 'gallery')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    sortOrder = (maxRow?.sort_order ?? -1) + 1
  }

  const { data: inserted, error: insErr } = await admin
    .from('venue_images')
    .insert({
      venue_id: venueId,
      kind,
      url: publicUrl,
      storage_path: storagePath,
      alt_text: altText,
      sort_order: sortOrder,
      width: null,
      height: null,
      bytes: file.size,
      mime_type: mime,
    })
    .select()
    .single()

  if (insErr || !inserted) {
    log.error(
      { err: insErr?.message, kind, storagePath, venueId },
      'db insert failed; rolling back storage',
    )
    // rollback storage
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json(
      { error: insErr?.message ?? 'Insert falló' },
      { status: 500 },
    )
  }

  log.info(
    { venueId, kind, image_id: inserted.id, bytes: file.size },
    'venue image uploaded',
  )

  return NextResponse.json(inserted as VenueImage, { status: 201 })
}
