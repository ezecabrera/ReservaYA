import type { VenueMode } from '@/lib/shared'

interface Props {
  venueName: string
  mode: VenueMode
  stats: { reserved: number; free: number; occupied: number }
}

export function DashboardHeader({ venueName, mode, stats }: Props) {
  const modeLabel = mode === 'active_service' ? 'Servicio activo' : 'Pre-servicio'
  const modeDot = mode === 'active_service' ? 'bg-[#15A67A]' : 'bg-[#0F3460]'

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <header className="bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-3xl mx-auto px-5 pt-10 pb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-1">
              Panel · Un Toque
            </p>
            <h1 className="font-display text-[28px] text-tx leading-none truncate">
              {venueName}
            </h1>
            <p className="text-tx2 text-[13px] mt-1.5 capitalize">{today}</p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)]
                       bg-sf px-3 py-1.5 text-[11px] font-semibold text-tx2 flex-shrink-0 mt-1"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${modeDot}`} />
            {modeLabel}
          </span>
        </div>

        {/* Banner turno activo */}
        {mode === 'active_service' && (
          <div className="mb-5 rounded-md bg-[#C5602A]/[0.08] border border-[#C5602A]/20 px-3.5 py-2.5 flex items-start gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="#C5602A" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="#C5602A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] text-tx leading-snug">
              <span className="font-semibold">Turno en curso</span> · las reservas nuevas para este turno están cerradas.
            </p>
          </div>
        )}

        {/* Stats — números grandes, sans black, leíbles de reojo */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Reservas" value={stats.reserved} dotColor="bg-[#0F3460]" />
          <StatCard label="Libres" value={stats.free} dotColor="bg-[#15A67A]" />
          <StatCard label="Ocupadas" value={stats.occupied} dotColor="bg-[#D63646]" />
        </div>
      </div>
    </header>
  )
}

function StatCard({
  label,
  value,
  dotColor,
}: {
  label: string
  value: number
  dotColor: string
}) {
  return (
    <div className="rounded-md border border-[rgba(0,0,0,0.07)] bg-sf px-4 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <p className="text-tx3 text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="font-sans-black text-[44px] text-tx leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}
