/* UnToque · Cliente Web Push.
 *
 * Encapsula la configuración de VAPID y expone helpers para enviar push
 * notifications a subscribers de un venue. Requiere 3 env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (cliente + server)
 *   VAPID_PRIVATE_KEY             (solo server)
 *   VAPID_SUBJECT                 (solo server, ej. mailto:no-reply@deuntoque.com)
 *
 * Uso:
 *   import { sendPushToVenue } from '@/lib/web-push'
 *   await sendPushToVenue(venueId, { title, body, url })
 */

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server-admin'

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:no-reply@deuntoque.com'

  if (!publicKey || !privateKey) {
    console.warn('[web-push] VAPID keys no configuradas — push no se enviará')
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidInitialized = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  badge?: string
  icon?: string
}

interface SendResult {
  total: number
  sent: number
  failed: number
  expired: number
}

/**
 * Envía push a todos los subscribers del venue. Maneja subscriptions expiradas
 * borrándolas automáticamente. Retorna stats del envío.
 */
export async function sendPushToVenue(
  venueId: string,
  payload: PushPayload,
): Promise<SendResult> {
  const result: SendResult = { total: 0, sent: 0, failed: 0, expired: 0 }
  if (!ensureVapid()) return result

  const admin = createAdminClient()
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('venue_id', venueId)

  if (error || !subs || subs.length === 0) return result
  result.total = subs.length

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/dashboard',
    tag: payload.tag ?? 'untoque',
    badge: payload.badge,
    icon: payload.icon,
  })

  const expired: string[] = []

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          message,
          { TTL: 60 },
        )
        result.sent += 1
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expirada — borrar
          expired.push(s.id)
          result.expired += 1
        } else {
          result.failed += 1
        }
      }
    }),
  )

  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expired)
  }

  // Marcar last_used en los que sí recibieron
  if (result.sent > 0) {
    await admin
      .from('push_subscriptions')
      .update({ last_used: new Date().toISOString() })
      .eq('venue_id', venueId)
  }

  return result
}
