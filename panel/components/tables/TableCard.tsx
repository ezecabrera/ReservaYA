'use client'

import type { TableWithStatus } from '@reservaya/shared'

interface TableCardProps {
  table: TableWithStatus
  onAction: (table: TableWithStatus, action: 'occupy' | 'free' | 'checkin') => void
}

const STATUS_STYLES: Record<string, { card: string; label: string; dot: string }> = {
  available: {
    card: 'bg-c2l border-c2/30 text-[#14A874]',
    label: 'Libre',
    dot: 'bg-c2',
  },
  reserved: {
    card: 'bg-c4l border-c4/30 text-[#2B5FCC]',
    label: 'Reservada',
    dot: 'bg-c4',
  },
  occupied: {
    card: 'bg-c1l border-c1/30 text-[#D63646]',
    label: 'Ocupada',
    dot: 'bg-c1',
  },
}

export function TableCard({ table, onAction }: TableCardProps) {
  const style = STATUS_STYLES[table.status]

  return (
    <button
      onClick={() => {
        if (table.status === 'available') onAction(table, 'occupy')
        else if (table.status === 'reserved') onAction(table, 'checkin')
        else onAction(table, 'free')
      }}
      className={`relative flex flex-col items-center justify-center gap-1.5
                  rounded-xl border-2 transition-all duration-[180ms]
                  active:scale-[0.95] ${style.card}`}
      style={{ aspectRatio: '1' }}
    >
      {/* Dot de estado */}
      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${style.dot}`} />

      {/* Código de mesa */}
      <span className="font-display text-[18px] font-bold leading-none">
        {table.label}
      </span>

      {/* Capacidad */}
      <span className="text-[10px] font-semibold opacity-70">
        {table.capacity} 👤
      </span>

      {/* Titular de la reserva */}
      {table.status === 'reserved' && table.reservation_holder && (
        <span className="text-[9px] font-bold text-center leading-tight px-1 opacity-80 max-w-full truncate">
          {table.reservation_holder}
          {table.reservation_time && ` · ${table.reservation_time}`}
        </span>
      )}

      {/* Label de estado */}
      {table.status === 'occupied' && (
        <span className="text-[10px] font-bold">Ocupada</span>
      )}
    </button>
  )
}
