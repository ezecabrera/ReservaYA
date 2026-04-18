/**
 * ServiceHeader — signature editorial del panel.
 *
 * El header que hace que el dueño screenshot-ee el panel y lo mande al grupo.
 * Tipografía: Fraunces display para el título "Servicio del [día]",
 * JetBrains mono para números, small caps para el kicker de turno.
 *
 * Diseño: fondo tinta cálida (warm-black, no navy frío), line divider editorial
 * abajo, acento vino tinto para LIVE indicator.
 */

import { NumericText } from './NumericText'

interface ServiceHeaderProps {
  /** Fecha en ISO YYYY-MM-DD del día operativo */
  date: string
  /** Modo actual del venue */
  mode: 'pre_service' | 'active_service' | 'closed'
  shiftLabel?: string | null
  venueName: string
  /** Slot derecha para acciones (LIVE toggle, date picker, etc) */
  actions?: React.ReactNode
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatEditorialDate(iso: string): { day: string; dateShort: string } {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = DIAS[dt.getDay()]
  const dateShort = `${d} ${MESES[m - 1]}`
  return { day, dateShort }
}

export function ServiceHeader({
  date,
  mode,
  shiftLabel,
  venueName,
  actions,
}: ServiceHeaderProps) {
  const { day, dateShort } = formatEditorialDate(date)

  return (
    <header className="relative bg-ink border-b border-ink-line">
      <div className="flex items-center justify-between px-6 lg:px-8 py-5 gap-4">

        {/* Lado izquierdo — identidad + signature */}
        <div className="flex items-baseline gap-6 min-w-0">
          <div>
            <NumericText label tone="muted">
              {venueName}
            </NumericText>
            <h1 className="font-display text-[22px] lg:text-[26px] font-bold text-ink-text
                           leading-[1.1] tracking-tight mt-1">
              Servicio del {day}
              <span className="text-ink-text-3 font-normal">
                {' · '}
              </span>
              <span className="text-ink-text-2 font-medium">
                <NumericText>{dateShort}</NumericText>
              </span>
              {shiftLabel && (
                <>
                  <span className="text-ink-text-3 font-normal"> · </span>
                  <span className="text-ink-text-2 font-medium">{shiftLabel}</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* Lado derecho — LIVE + acciones */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <LiveIndicator mode={mode} />
          {actions}
        </div>
      </div>
    </header>
  )
}

function LiveIndicator({ mode }: { mode: 'pre_service' | 'active_service' | 'closed' }) {
  const isLive = mode === 'active_service'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border
                  ${isLive
                    ? 'bg-wine/12 border-wine/30'
                    : 'bg-ink-2 border-ink-line-2'}`}
    >
      <span className="relative flex w-2 h-2">
        {isLive && (
          <span className="absolute inline-flex w-full h-full rounded-full bg-wine-soft
                           animate-ping opacity-75" />
        )}
        <span className={`relative inline-flex w-2 h-2 rounded-full
                          ${isLive ? 'bg-wine-soft' : 'bg-ink-text-3'}`} />
      </span>
      <span className={`text-[10.5px] font-bold uppercase tracking-[0.12em]
                        ${isLive ? 'text-wine-soft' : 'text-ink-text-3'}`}>
        {isLive ? 'Live' : mode === 'pre_service' ? 'Pre-servicio' : 'Cerrado'}
      </span>
    </div>
  )
}
