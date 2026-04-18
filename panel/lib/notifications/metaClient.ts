import { payloadToVariables, TEMPLATE_REGISTRY } from '@/lib/shared'
import type {
  NotificationPayload,
  NotificationTemplateCode,
} from '@/lib/shared'

/**
 * Cliente muy fino sobre la Meta WhatsApp Cloud API v18.
 * Envía un HSM (template) a un número destino con variables posicionales.
 *
 * Modo DEV:
 *   - Si META_WHATSAPP_TOKEN o META_WHATSAPP_PHONE_NUMBER_ID no están seteados,
 *     hace no-op y devuelve un messageId sintético "dev-<timestamp>".
 *     Esto permite correr el worker en local sin mandar mensajes reales.
 *
 * La prod requiere setear:
 *   - META_WHATSAPP_TOKEN
 *   - META_WHATSAPP_PHONE_NUMBER_ID
 */

const META_API_BASE = 'https://graph.facebook.com/v18.0'

/** Normaliza "+54 9 11 1234-5678" → "5491112345678" (formato E.164 sin '+'). */
function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

interface SendResult {
  ok: boolean
  external_id: string | null
  error: string | null
}

export async function sendWhatsAppTemplate({
  to,
  templateCode,
  payload,
}: {
  to: string
  templateCode: NotificationTemplateCode
  payload: NotificationPayload
}): Promise<SendResult> {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID

  const meta = TEMPLATE_REGISTRY[templateCode]
  const variables = payloadToVariables(meta, payload)
  const normalizedTo = normalizePhone(to)

  // Modo DEV: sin creds, no-op con log
  if (!token || !phoneNumberId) {
    // eslint-disable-next-line no-console
    console.info('[whatsapp:dev]', meta.meta_name, '→', normalizedTo, variables)
    return { ok: true, external_id: `dev-${Date.now()}`, error: null }
  }

  try {
    const res = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'template',
        template: {
          name: meta.meta_name,
          language: { code: meta.language_code },
          components: [
            {
              type: 'body',
              parameters: variables.map((v) => ({ type: 'text', text: v })),
            },
          ],
        },
      }),
    })

    const json = await res.json().catch(() => ({})) as {
      messages?: Array<{ id: string }>
      error?: { message?: string; code?: number }
    }

    if (!res.ok || !json.messages?.[0]?.id) {
      const err = json.error?.message ?? `HTTP ${res.status}`
      return { ok: false, external_id: null, error: err }
    }

    return { ok: true, external_id: json.messages[0].id, error: null }
  } catch (err) {
    return {
      ok: false,
      external_id: null,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
