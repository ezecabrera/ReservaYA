import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

/**
 * POST /api/campaigns/:id/send — envía la campaña a su audience.
 *
 * En MVP: crea registros en campaign_sends con status 'pending' y marca la
 * campaña como 'sent'. El envío real a Meta WhatsApp se hace en un job aparte
 * (placeholder — a implementar con el token META_WHATSAPP_TOKEN en Sprint 12).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Rate limit: 5 envíos de campaña por minuto por usuario
  const rl = await rateLimit(request, {
    key: 'campaign-send',
    limit: 5,
    windowSec: 60,
    identifier: user.id,
  })
  if (!rl.ok) return tooManyRequests(rl)

  const admin = createAdminClient()
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()
  if (!campaign) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { data: staff } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()
  if (!staff || staff.venue_id !== campaign.venue_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Resolver audience — usa RFM para segmentos. Si 'all', toma todos los guests únicos.
  const { data: reservas } = await admin
    .from('reservations')
    .select('guest_phone, guest_name, date, status')
    .eq('venue_id', campaign.venue_id)
    .not('guest_phone', 'is', null)

  // Fase 1: filtrado base por audience (implementación simplificada)
  const audienceRows = filterByAudience(reservas ?? [], campaign.audience)

  // Dedupe por phone
  const byPhone = new Map<string, { phone: string; name: string | null }>()
  for (const r of audienceRows) {
    if (!r.guest_phone) continue
    if (!byPhone.has(r.guest_phone)) {
      byPhone.set(r.guest_phone, { phone: r.guest_phone, name: r.guest_name })
    }
  }

  const recipients = Array.from(byPhone.values())

  // Pre-cargar variables del template como array ordenado {{1}}, {{2}}, …
  // template_vars: { "1": "{{first_name}}", "2": "10% off" } — soporta tokens
  // dinámicos como {{first_name}} reemplazados por el nombre del guest.
  const templateVars = (campaign.template_vars ?? {}) as Record<string, string>
  const orderedKeys = Object.keys(templateVars).sort((a, b) => Number(a) - Number(b))

  let sentCount = 0
  let failedCount = 0

  if (recipients.length > 0) {
    // Insert iniciales como pending
    await admin.from('campaign_sends').insert(
      recipients.map((r) => ({
        campaign_id: id,
        guest_phone: r.phone,
        guest_name: r.name,
        status: 'pending',
      })),
    )

    // Marcar campaña como 'sending'
    await admin.from('campaigns').update({ status: 'sending' }).eq('id', id)

    // Importación dinámica para evitar carga del módulo en routes que no lo usan
    const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')

    // Throttle: max 5 envíos en paralelo para no superar rate limits de Meta
    const BATCH = 5
    for (let i = 0; i < recipients.length; i += BATCH) {
      const slice = recipients.slice(i, i + BATCH)
      await Promise.allSettled(
        slice.map(async (r) => {
          // Reemplazar {{first_name}} con el nombre del guest si está en vars
          const vars = orderedKeys.map((k) => {
            const raw = templateVars[k] ?? ''
            return raw.replace('{{first_name}}', (r.name ?? '').split(' ')[0] || 'Hola')
          })
          const result = await sendWhatsAppTemplate({
            to: r.phone,
            template: campaign.template_id,
            language: 'es_AR',
            variables: vars,
          })
          if (result.ok) {
            sentCount += 1
            await admin
              .from('campaign_sends')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('campaign_id', id)
              .eq('guest_phone', r.phone)
          } else {
            failedCount += 1
            await admin
              .from('campaign_sends')
              .update({ status: 'failed', error: result.error ?? 'unknown' })
              .eq('campaign_id', id)
              .eq('guest_phone', r.phone)
          }
        }),
      )
    }
  }

  await admin
    .from('campaigns')
    .update({
      status: 'sent',
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({
    ok: true,
    recipients_count: recipients.length,
    sent: sentCount,
    failed: failedCount,
    dry_run: !process.env.META_WHATSAPP_TOKEN,
  })
}

interface ReservationRow {
  guest_phone: string | null
  guest_name: string | null
  date: string
  status: string
}

function filterByAudience(rows: ReservationRow[], audience: string): ReservationRow[] {
  const now = Date.now()
  const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString().slice(0, 10)

  if (audience === 'all') return rows

  if (audience === 'vip') {
    // 6+ visitas en últimos 90d
    const cutoff = daysAgo(90)
    const counts = new Map<string, number>()
    for (const r of rows) {
      if (r.date >= cutoff && (r.status === 'checked_in' || r.status === 'finished') && r.guest_phone) {
        counts.set(r.guest_phone, (counts.get(r.guest_phone) ?? 0) + 1)
      }
    }
    return rows.filter((r) => r.guest_phone && (counts.get(r.guest_phone) ?? 0) >= 6)
  }

  if (audience === 'dormant') {
    // Última visita hace >180d
    const cutoff = daysAgo(180)
    const lastVisit = new Map<string, string>()
    for (const r of rows) {
      if ((r.status === 'checked_in' || r.status === 'finished') && r.guest_phone) {
        const prev = lastVisit.get(r.guest_phone)
        if (!prev || r.date > prev) lastVisit.set(r.guest_phone, r.date)
      }
    }
    return rows.filter((r) => {
      const last = lastVisit.get(r.guest_phone ?? '')
      return last && last < cutoff
    })
  }

  if (audience === 'risky') {
    // 2+ no-shows en últimos 90d
    const cutoff = daysAgo(90)
    const noShows = new Map<string, number>()
    for (const r of rows) {
      if (r.status === 'no_show' && r.date >= cutoff && r.guest_phone) {
        noShows.set(r.guest_phone, (noShows.get(r.guest_phone) ?? 0) + 1)
      }
    }
    return rows.filter((r) => r.guest_phone && (noShows.get(r.guest_phone) ?? 0) >= 2)
  }

  // new / loyal / at_risk → heuristic simple, delegamos a RFM en iteración
  return rows
}
