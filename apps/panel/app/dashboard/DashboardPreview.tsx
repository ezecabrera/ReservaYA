import { DashboardHeader } from './DashboardHeader'

// Grid estático dev-only para ver el home del panel sin sesión ni DB

type MockStatus = 'available' | 'reserved' | 'occupied'

interface MockTable {
  label: string
  capacity: number
  zone: string
  status: MockStatus
  holder?: string
  time?: string
}

const MOCK: MockTable[] = [
  { label: 'S1', capacity: 2, zone: 'Salón',   status: 'available' },
  { label: 'S2', capacity: 2, zone: 'Salón',   status: 'reserved', holder: 'Martín G.', time: '21:00' },
  { label: 'S3', capacity: 4, zone: 'Salón',   status: 'occupied' },
  { label: 'S4', capacity: 4, zone: 'Salón',   status: 'available' },
  { label: 'T1', capacity: 4, zone: 'Terraza', status: 'reserved', holder: 'Sofía L.',   time: '20:30' },
  { label: 'T2', capacity: 6, zone: 'Terraza', status: 'available' },
  { label: 'T3', capacity: 2, zone: 'Terraza', status: 'occupied' },
  { label: 'B1', capacity: 2, zone: 'Barra',   status: 'available' },
]

export function DashboardPreview() {
  const reserved = MOCK.filter(t => t.status === 'reserved').length
  const free = MOCK.filter(t => t.status === 'available').length
  const occupied = MOCK.filter(t => t.status === 'occupied').length

  return (
    <div className="bg-sf min-h-screen">
      <DashboardHeader
        venueName="La Cantina de Martín"
        mode="active_service"
        stats={{ reserved, free, occupied }}
      />
      <main className="max-w-3xl mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[22px] text-tx leading-none">Mesas</h2>
          <span className="text-[12px] text-tx3">{MOCK.length} en total</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MOCK.map(t => <PreviewTile key={t.label} table={t} />)}
        </div>
      </main>
    </div>
  )
}

function PreviewTile({ table }: { table: MockTable }) {
  const styles: Record<MockStatus, { bg: string; border: string; label: string; labelColor: string }> = {
    available: { bg: 'bg-white',          border: 'border-[rgba(0,0,0,0.08)]', label: 'Libre',    labelColor: 'text-[#15A67A]' },
    reserved:  { bg: 'bg-[#0F3460]/[0.04]', border: 'border-[#0F3460]/20',     label: 'Reservada', labelColor: 'text-[#0F3460]' },
    occupied:  { bg: 'bg-[#D63646]/[0.04]', border: 'border-[#D63646]/20',     label: 'Ocupada',  labelColor: 'text-[#D63646]' },
  }
  const s = styles[table.status]
  return (
    <div className={`${s.bg} ${s.border} rounded-md border p-4 min-h-[120px] flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-[22px] text-tx leading-none">{table.label}</p>
          <p className="text-tx3 text-[11px] mt-1 font-semibold uppercase tracking-wider">
            {table.zone} · {table.capacity} pax
          </p>
        </div>
        <span className={`text-[11px] font-semibold ${s.labelColor}`}>{s.label}</span>
      </div>
      {table.status === 'reserved' && table.holder && (
        <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] mt-2">
          <p className="text-tx text-[13px] font-semibold truncate">{table.holder}</p>
          <p className="text-tx2 text-[12px] font-mono tabular-nums">{table.time}</p>
        </div>
      )}
      {table.status === 'occupied' && (
        <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] mt-2">
          <p className="text-tx2 text-[12px]">En consumo</p>
        </div>
      )}
    </div>
  )
}
