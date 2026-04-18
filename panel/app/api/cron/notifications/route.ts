import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { sendWhatsAppTemplate } from '@/lib/notifications/metaClient'
import type {
  NotificationPayload,
  NotificationStatus,
  NotificationTemplateCode,
  NotificationChannel,
} from '@/lib/shared'

/**
 * GET /api/cron/notifications
 * Worker: procesa filas pending cuya `scheduled_at` ya venció.
 *
 * Configuración Vercel Cron en vercel.json → corre cada minuto.
 *
 * Autenticación:
 *   - En producción, Vercel Cron setea el header Authorization: Bearer <CRON_SECRET>.
 *     Si CRON_SECRET está seteado en env, verificamos coincidencia antes de correr.
 *   - En dev/staging sin CRON_SECRET, se permite invocación directa (útil para test).
 *
 * Límite defensivo: procesamos hasta 50 notificaciones por corrida para no
 * saturar la Meta API con ráfagas grandes. El próximo tick toma el resto.
 *
 * Estados finales:
 *   - sent: entregado a Meta (tenemos message_id)
 *   - failed: después de 5 intentos; no reintentamos más.
 *   - skipped: la reserva ya no cumple condiciones (ej: cancelled antes del reminder).
 */

const BATCH_SIZE = 50
const MAX_ATTEMPTS = 5

interface PendingRow {
  id: string
  reservation_id: string
  template_code: NotificationTemplateCode
  channel: NotificationChannel
  to_phone: string | null
  to_email: string | null
  payload_json: NotificationPayload
  attempts: number
}

export async function GET(request: NextRequest) {
  // Auth opcional: si CRON_SECRET está en env, validamos
  const expected = process.env.CRON_SECRET
  if (expected) {
    const header = request.headers.get('authorization')
    if (header !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: pending, error } = await admin
    .from('notifications')
    .select('id, reservation_id, template_code, channel, to_phone, to_email, payload_json, attempts')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (pending ?? []) as PendingRow[]
  const results = { sent: 0, failed: 0, skipped: 0 }

  for (const row of rows) {
    // Pre-check: la reserva todavía debe tener un estado consistente con el template
    const shouldSkip = await shouldSkipNotification(admin, row)
    if (shouldSkip) {
      await admin
        .from('notifications')
        .update({ status: 'skipped' as NotificationStatus, error: shouldSkip })
        .eq('id', row.id)
      results.skipped++
      continue
    }

    // Canal: hoy sólo WhatsApp. Email queda como TODO V2.
    if (row.channel !== 'whatsapp' || !row.to_phone) {
      await admin
        .from('notifications')
        .update({ status: 'skipped' as NotificationStatus, error: 'canal no soportado en V1' })
        .eq('id', row.id)
      results.skipped++
      continue
    }

    const result = await sendWhatsAppTemplate({
      to: row.to_phone,
      templateCode: row.template_code,
      payload: row.payload_json,
    })

    const nextAttempts = row.attempts + 1

    if (result.ok) {
      await admin
        .from('notifications')
        .update({
          status: 'sent' as NotificationStatus,
          sent_at: new Date().toISOString(),
          external_id: result.external_id,
          attempts: nextAttempts,
          error: null,
        })
        .eq('id', row.id)
      results.sent++
    } else {
      const finalStatus: NotificationStatus = nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending'
      await admin
        .from('notifications')
        .update({
          status: finalStatus,
          attempts: nextAttempts,
          error: result.error,
        })
        .eq('id', row.id)
      if (finalStatus === 'failed') results.failed++
    }
  }

  return NextResponse.json({
    processed: rows.length,
    ...results,
    timestamp: now,
  })
}

/**
 * Saltea el envío si la reserva cambió de estado de forma incompatible con
 * el template. Ej: si reservation está cancelled, no mandamos reminder_2h.
 */
async function shouldSkipNotification(
  admin: ReturnType<typeof createAdminClient>,
  row: PendingRow,
): Promise<string | null> {
  const { data: r } = await admin
    .from('reservations')
    .select('status')
    .eq('id', row.reservation_id)
    .single()

  if (!r) return 'reserva no existe'

  const status = r.status as string

  // Reminders sólo para reservas activas
  if (
    (row.template_code === 'reminder_24h' || row.template_code === 'reminder_2h')
    && status !== 'confirmed'
  ) {
    return `reserva en estado ${status}, no tiene sentido recordar`
  }

  // Post-visit review sólo si efectivamente visitó
  if (row.template_code === 'post_visit_review' && status !== 'checked_in') {
    return `reserva en estado ${status}, no visitó`
  }

  return null
}
