'use client'

import { useState } from 'react'
import { mutateFetch } from '@/lib/panelFetch'
import { TEMPLATE_REGISTRY } from '@/lib/shared'
import type { NotificationTemplateCode } from '@/lib/shared'

interface Props {
  venueName: string
}

const PREVIEWS: Record<NotificationTemplateCode, { title: string; body: string }> = {
  reservation_confirmed: {
    title: 'Al confirmar la reserva',
    body: 'Hola Martín, tu reserva en {VENUE} para el jueves 18/04 a las 21:00hs está confirmada.',
  },
  reminder_24h: {
    title: 'Recordatorio 24h antes',
    body: 'Mañana Martín tenés reserva en {VENUE} a las 21:00hs. Respondé CANCELAR si no podés ir.',
  },
  reminder_2h: {
    title: 'Recordatorio 2h antes',
    body: 'Tu reserva en {VENUE} es en 2 horas (21:00hs). Te esperan.',
  },
  cancelled_by_venue: {
    title: 'Si vos cancelás la reserva',
    body: 'Lamentamos avisarte: {VENUE} canceló tu reserva del jueves 18/04. Podés dejar reseña en reservaya.app.',
  },
  post_visit_review: {
    title: '22h después del check-in',
    body: 'Gracias por visitar {VENUE}. ¿Cómo fue tu experiencia? Calificá en reservaya.app.',
  },
}

const ORDER: NotificationTemplateCode[] = [
  'reservation_confirmed',
  'reminder_24h',
  'reminder_2h',
  'cancelled_by_venue',
  'post_visit_review',
]

export function WhatsAppSection({ venueName }: Props) {
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function sendTest() {
    if (!testPhone.trim() || sending) return
    setResult(null)
    setSending(true)
    const res = await mutateFetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testPhone.trim() }),
    })
    const body = await res.json().catch(() => ({}))
    setResult({
      ok: res.ok,
      message: res.ok
        ? `Enviado (id: ${body.external_id ?? 'dev'})`
        : body.error ?? 'No se pudo enviar',
    })
    setSending(false)
  }

  return (
    <div>
      <p className="text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.12em] mb-3">
        Mensajes automáticos (WhatsApp)
      </p>

      <div className="bg-ink-2 border border-ink-line rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-ink-text font-semibold text-[14px]">
            Así se ven los mensajes que tus clientes reciben
          </p>
          <p className="text-ink-text-2 text-[12.5px] leading-snug mt-1">
            Los textos son templates aprobados por Meta. {'{VENUE}'} se reemplaza por
            <span className="font-bold text-ink-text"> {venueName}</span>. Los reminders respetan la fecha real
            de cada reserva.
          </p>
        </div>

        {/* Previews */}
        <div className="space-y-2.5">
          {ORDER.map((code) => {
            const preview = PREVIEWS[code]
            const meta = TEMPLATE_REGISTRY[code]
            return (
              <div key={code} className="bg-ink border border-ink-line rounded-xl px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-ink-text-2 uppercase tracking-[0.12em]">
                    {preview.title}
                  </span>
                  <span className="text-[9.5px] font-mono text-ink-text-3">{meta.meta_name}</span>
                </div>
                <p className="text-ink-text/90 text-[13px] leading-snug">
                  {preview.body.replace('{VENUE}', venueName)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Test message */}
        <div className="pt-3 border-t border-ink-line">
          <span className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.12em] mb-1.5 block">
            Probar el envío
          </span>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+54 9 11…"
              className="flex-1 rounded-xl bg-ink border border-ink-line-2 px-3 py-2.5
                         text-[13px] text-ink-text placeholder:text-ink-text-3 outline-none
                         focus:border-olive/50 transition-colors"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={sending || !testPhone.trim()}
              className="px-4 rounded-xl bg-olive/25 border border-olive/45 text-olive text-[12.5px]
                         font-bold disabled:opacity-50
                         hover:bg-olive/35 transition-colors"
            >
              {sending ? 'Enviando…' : 'Probar'}
            </button>
          </div>
          {result && (
            <p className={`mt-2 text-[12px] ${result.ok ? 'text-olive' : 'text-wine-soft'}`}>
              {result.message}
            </p>
          )}
          <p className="mt-1.5 text-[10.5px] text-ink-text-3 leading-snug">
            Si todavía no configuraste credenciales de Meta, el envío hace no-op en dev y
            se registra con id sintético.
          </p>
        </div>
      </div>
    </div>
  )
}
