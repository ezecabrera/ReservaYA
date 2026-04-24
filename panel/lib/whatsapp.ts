/* UnToque · Cliente Meta WhatsApp Cloud API.
 *
 * Envía templates HSM aprobados con variables dinámicas. Requiere:
 *   META_WHATSAPP_TOKEN              — access token permanente del WA Business Account
 *   META_WHATSAPP_PHONE_NUMBER_ID    — ID del número de teléfono registrado
 *
 * Sin estas env vars el sender corre en modo "dry-run" — guarda el send con
 * status='pending' pero no llama a Meta (útil en dev/staging).
 *
 * Templates deben estar registrados y aprobados en Meta Business Manager
 * antes de poder enviarse. El idioma se asume es_AR.
 */

import { logger } from '@/lib/logger'

const META_TOKEN = process.env.META_WHATSAPP_TOKEN
const META_PHONE_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID
const META_API_VERSION = process.env.META_WHATSAPP_API_VERSION ?? 'v21.0'

export interface SendTemplateInput {
  /** Teléfono destino en E.164 sin + (ej. 5491155667788) */
  to: string
  /** Nombre del template HSM (ej. ry_winback_01) */
  template: string
  /** Código de idioma (default es_AR) */
  language?: string
  /** Variables del body en orden — se mapean a {{1}}, {{2}}... */
  variables?: string[]
}

export interface SendTemplateResult {
  ok: boolean
  message_id?: string
  error?: string
  /** True si se hizo dry-run por falta de token */
  skipped?: boolean
}

/**
 * Envía un template HSM. Si falta token, retorna `skipped: true` sin error.
 */
export async function sendWhatsAppTemplate(
  input: SendTemplateInput,
): Promise<SendTemplateResult> {
  if (!META_TOKEN || !META_PHONE_ID) {
    logger.warn(
      { template: input.template, to: maskPhone(input.to) },
      'whatsapp dry-run: missing META_WHATSAPP_TOKEN or PHONE_NUMBER_ID',
    )
    return { ok: true, skipped: true }
  }

  const phone = normalizePhoneE164(input.to)
  if (!phone) {
    return { ok: false, error: 'Teléfono inválido' }
  }

  const components = input.variables && input.variables.length > 0
    ? [
        {
          type: 'body',
          parameters: input.variables.map((value) => ({
            type: 'text',
            text: String(value),
          })),
        },
      ]
    : undefined

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: input.template,
      language: { code: input.language ?? 'es_AR' },
      ...(components ? { components } : {}),
    },
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      },
    )

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      logger.error(
        {
          status: res.status,
          template: input.template,
          to: maskPhone(phone),
          err: errBody.slice(0, 500),
        },
        'whatsapp send failed',
      )
      return {
        ok: false,
        error: `Meta API ${res.status}: ${errBody.slice(0, 200)}`,
      }
    }

    const data = (await res.json()) as {
      messages?: Array<{ id?: string }>
    }
    const messageId = data.messages?.[0]?.id
    logger.info({ message_id: messageId, template: input.template }, 'whatsapp sent')
    return { ok: true, message_id: messageId }
  } catch (err) {
    logger.error({ err: String(err) }, 'whatsapp send exception')
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}

/**
 * Normaliza un teléfono argentino a E.164 sin +. Tolera formatos:
 *   "+54 11 5566 7788"  → 5491155667788 (agrega 9 si falta)
 *   "1155667788"        → 5491155667788
 *   "01155667788"       → 5491155667788
 */
export function normalizePhoneE164(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, '')
  if (digits.length < 8) return null

  // Strip 0 inicial AR
  if (digits.startsWith('0')) digits = digits.slice(1)

  // Si ya empieza con 54, ok. Si no, prefix.
  if (!digits.startsWith('54')) digits = '54' + digits

  // Insertar 9 después de 54 para móvil AR si falta (Meta lo requiere)
  // 54 + 11 + ... → 54 + 9 + 11 + ...
  // Pero solo si no está ya: 549...
  const after54 = digits.slice(2)
  if (!after54.startsWith('9') && after54.length >= 10) {
    digits = '549' + after54
  }

  return digits
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`
}
