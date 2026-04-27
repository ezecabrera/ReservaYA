/* UnToque · API customer tags — list & create.
 *
 *   GET  /api/customers/:phone/tags    → CustomerTag[] del venue actual
 *   POST /api/customers/:phone/tags    → crea tag (kind+value único por venue+phone)
 *
 * Auth: staff_users.venue_id del usuario logueado.
 * Errores: 401 sin auth, 403 sin venue, 400 body inválido,
 *          409 si UNIQUE (kind+value) colisiona, 500 DB.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'
import { NewCustomerTagSchema, parseBody } from '@/lib/schemas'

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return (data?.venue_id as string | undefined) ?? null
}

/* ─── GET ─────────────────────────────────────────────────── */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ phone: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'customers.tags.list' })
  const { phone: rawPhone } = await context.params
  const phone = decodeURIComponent(rawPhone).trim()

  if (!phone) {
    return NextResponse.json({ error: 'phone requerido' }, { status: 400 })
  }

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
    .from('customer_tags')
    .select('*')
    .eq('venue_id', venueId)
    .eq('customer_phone', phone)
    .order('kind', { ascending: true })
    .order('value', { ascending: true })

  if (error) {
    log.error({ err: error.message, venueId, phone }, 'list failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

/* ─── POST ────────────────────────────────────────────────── */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ phone: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'customers.tags.create' })
  const { phone: rawPhone } = await context.params
  const phone = decodeURIComponent(rawPhone).trim()

  if (!phone) {
    return NextResponse.json({ error: 'phone requerido' }, { status: 400 })
  }

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

  const parsed = await parseBody(request, NewCustomerTagSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  // El phone del path es la fuente de verdad — ignoramos el body.customer_phone
  // si difiere, pero lo aceptamos para conveniencia del cliente.
  if (body.customer_phone !== phone) {
    return NextResponse.json(
      { error: 'customer_phone del body no coincide con el del path' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('customer_tags')
    .insert({
      venue_id: venueId,
      customer_phone: phone,
      kind: body.kind,
      value: body.value,
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    // 23505 = unique_violation
    const code = (error as { code?: string }).code
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Ese tag ya existe para este cliente' },
        { status: 409 },
      )
    }
    log.error(
      { err: error.message, code, venueId, phone, kind: body.kind },
      'insert failed',
    )
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  log.info(
    { venueId, phone, tag_id: data?.id, kind: body.kind },
    'customer tag created',
  )
  return NextResponse.json(data, { status: 201 })
}
