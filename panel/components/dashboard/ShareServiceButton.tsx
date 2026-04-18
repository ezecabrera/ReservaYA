'use client'

import { useState } from 'react'
import type { SplitReservation } from './SplitDashboard'
import { pushToast } from '@/lib/toast'

/**
 * Botón de "Mandar al equipo" en el ServiceHeader.
 *
 * Compone un resumen del servicio en texto plano (formato WhatsApp-friendly)
 * con: fecha + turno + stats agregados + lista de reservas del día ordenada
 * por hora. Usa navigator.share() si está disponible (mobile/tablet), y
 * cae a copy-to-clipboard con toast "Resumen copiado".
 *
 * Caso de uso: el dueño pre-servicio pasa el resumen al grupo del staff sin
 * screenshot ni foto-al-monitor.
 */

interface Props {
  venueName: string
  date: string
  shiftLabel: string | null
  reservations: SplitReservation[]
  displayName: (r: SplitReservation) => string
  tableLabelById: (id: string) => string | null
}

function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[dt.getDay()]} ${d} ${months[m - 1]}`
}

function buildSummary({
  venueName,
  date,
  shiftLabel,
  reservations,
  displayName,
  tableLabelById,
}: Props): string {
  const active = reservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'pending_payment',
  )
  const confirmed = active.length
  const totalGuests = active.reduce((acc, r) => acc + r.party_size, 0)
  const sorted = [...active].sort((a, b) => a.time_slot.localeCompare(b.time_slot))

  const lines: string[] = []
  lines.push(`📋 *${venueName}* · ${formatDateEs(date)}${shiftLabel ? ` · ${shiftLabel}` : ''}`)
  lines.push('')
  lines.push(`Reservas: *${confirmed}* · Cubiertos: *${totalGuests}*`)
  lines.push('')

  if (sorted.length === 0) {
    lines.push('Sin reservas cargadas para este turno.')
  } else {
    lines.push('─── agenda ───')
    for (const r of sorted) {
      const time = r.time_slot.slice(0, 5)
      const table = tableLabelById(r.table_id) ?? '?'
      const name = displayName(r)
      const party = r.party_size
      const tag = r.guest_tag === 'vip' ? ' ⭐'
        : r.guest_tag === 'habitue' ? ' 🔁'
        : r.guest_tag === 'no_show_previo' ? ' ⚠️'
        : ''
      const notes = r.notes ? ` — ${r.notes}` : ''
      lines.push(`${time} · ${table} · ${name} (${party}p)${tag}${notes}`)
    }
  }

  lines.push('')
  lines.push('_Enviado desde ReservaYA_')
  return lines.join('\n')
}

export function ShareServiceButton(props: Props) {
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    if (busy) return
    setBusy(true)
    const text = buildSummary(props)
    const title = `${props.venueName} · servicio del ${formatDateEs(props.date)}`

    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null
      if (nav && typeof nav.share === 'function') {
        await nav.share({ title, text })
        // Algunos browsers no consideran esto un "ok" claro — no mostramos
        // toast para no duplicar el feedback del share sheet nativo.
      } else if (nav && nav.clipboard) {
        await nav.clipboard.writeText(text)
        pushToast({
          tone: 'ok',
          text: 'Resumen copiado',
          hint: 'Pegalo en el grupo de WhatsApp del staff.',
        })
      } else {
        pushToast({
          tone: 'error',
          text: 'No se pudo compartir',
          hint: 'Tu navegador no soporta esta acción.',
        })
      }
    } catch (err) {
      // Si el user canceló el share nativo, navigator.share throwea AbortError.
      // No mostramos toast de error en ese caso.
      const aborted = err instanceof Error && err.name === 'AbortError'
      if (!aborted) {
        pushToast({ tone: 'error', text: 'No se pudo compartir el resumen' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label="Compartir resumen del servicio"
      className="group inline-flex items-center gap-1.5 h-8 px-3 rounded-full
                 bg-ink-2 border border-ink-line-2
                 text-[11.5px] font-semibold text-ink-text-2
                 hover:text-ink-text hover:border-wine/40 hover:bg-wine/8
                 transition-colors disabled:opacity-50"
    >
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        className="transition-transform group-hover:scale-110"
        aria-hidden
      >
        <path
          d="M4 12v8h16v-8M12 4v12M12 4l-4 4M12 4l4 4"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {busy ? 'Compartiendo…' : 'Mandar al equipo'}
    </button>
  )
}
