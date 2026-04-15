'use client'

import { useState } from 'react'
import type { TableWithStatus } from '@reservaya/shared'

interface ActionModalProps {
  table: TableWithStatus
  action: 'occupy' | 'free' | 'checkin'
  onConfirm: () => Promise<void>
  onClose: () => void
}

const ACTION_CONFIG = {
  occupy: {
    title: 'Marcar como ocupada',
    description: 'Cliente presencial sin reserva.',
    btnLabel: 'Marcar ocupada',
    btnClass: 'bg-c1l text-[#C0313E] border border-c1/30',
  },
  free: {
    title: 'Liberar mesa',
    description: 'La mesa quedará disponible para nuevas reservas.',
    btnLabel: 'Liberar mesa',
    btnClass: 'bg-c4l text-[#2B5FCC] border border-c4/30',
  },
  checkin: {
    title: 'Hacer check-in',
    description: 'El cliente llegó con su reserva.',
    btnLabel: 'Confirmar check-in',
    btnClass: 'bg-c2l text-[#0A9A72] border border-c2/30',
  },
}

export function ActionModal({ table, action, onConfirm, onClose }: ActionModalProps) {
  const [loading, setLoading] = useState(false)
  const cfg = ACTION_CONFIG[action]

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-2xl p-6 pb-8
                      animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                           font-display text-[20px] font-bold ${cfg.btnClass}`}>
            {table.label}
          </div>
          <div>
            <p className="font-bold text-[16px] text-tx">{cfg.title}</p>
            <p className="text-tx2 text-[13px]">{table.label} · {table.capacity} personas</p>
          </div>
        </div>

        <p className="text-tx2 text-[14px] mb-5">{cfg.description}</p>

        {action === 'checkin' && table.reservation_holder && (
          <div className="bg-c4l rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-[24px]">👤</span>
            <div>
              <p className="font-semibold text-[14px] text-[#2B5FCC]">
                {table.reservation_holder}
              </p>
              {table.reservation_time && (
                <p className="text-[12px] text-tx2">Reserva · {table.reservation_time} hs</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-sf text-tx text-[14px] font-semibold
                       border border-[var(--br)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3.5 rounded-xl text-[14px] font-bold
                        disabled:opacity-60 ${cfg.btnClass}`}
          >
            {loading ? '…' : cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
