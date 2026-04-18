import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { WaitlistInput } from '@/lib/shared'

/**
 * GET /api/waitlist
 * Devuelve las entries activas (status waiting|notified) del venue del staff,
 * ordenadas por llegada. Incluye resueltas del día en modo ?include=all.
 */
export async function GET(request: NextRequest) {
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

  const includeResolved = request.nextUrl.searchParams.get('include') === 'all'
  const activeStatuses = ['waiting', 'notified']

  let query = admin
    .from('waitlist_entries')
    .select('*')
    .eq('venue_id', staffUser.venue_id)
    .order('created_at', { ascending: true })

  if (!includeResolved) {
    query = query.in('status', activeStatuses)
  } else {
    // Todos los del día (para historial de ese día operativo)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    query = query.gte('created_at', todayStart.toISOString())
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/**
 * POST /api/waitlist
 * Agrega una entry a la lista de espera.
 * Body: WaitlistInput
 */
export async function POST(request: NextRequest) {
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

  let body: Partial<WaitlistInput>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { guest_name, guest_phone, party_size, notes, requested_date, requested_time } = body

  if (!guest_name || !party_size) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: nombre y personas' },
      { status: 400 },
    )
  }
  if (party_size < 1 || party_size > 40) {
    return NextResponse.json({ error: 'Cantidad de personas inválida' }, { status: 400 })
  }

  const { data: entry, error: insertError } = await admin
    .from('waitlist_entries')
    .insert({
      venue_id: staffUser.venue_id,
      guest_name: guest_name.trim(),
      guest_phone: guest_phone?.trim() || null,
      party_size,
      requested_date: requested_date || null,
      requested_time: requested_time || null,
      notes: notes?.trim() || null,
      status: 'waiting',
    })
    .select()
    .single()

  if (insertError || !entry) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Error al agregar a la espera' },
      { status: 500 },
    )
  }

  return NextResponse.json(entry, { status: 201 })
}
