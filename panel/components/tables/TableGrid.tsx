'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TableCard } from './TableCard'
import { ActionModal } from './ActionModal'
import type { TableWithStatus, Reservation } from '@/lib/shared'

interface TableGridProps {
  venueId: string
  initialTables: TableWithStatus[]
  initialReservations: Reservation[]
  todayDate: string   // YYYY-MM-DD
  currentTimeSlot: string | null
}

function computeTableStatus(
  table: TableWithStatus & { is_occupied?: boolean },
  reservations: Reservation[],
  currentTimeSlot: string | null,
): TableWithStatus {
  if (table.is_occupied) {
    return { ...table, venue_id: '', zone_id: null, is_active: true, created_at: '', status: 'occupied' }
  }

  const activeReservation = reservations.find(
    (r) =>
      r.table_id === table.id &&
      r.status === 'checked_in',
  )
  if (activeReservation) {
    return { ...table, venue_id: '', zone_id: null, is_active: true, created_at: '', status: 'occupied' }
  }

  if (currentTimeSlot) {
    const reserved = reservations.find(
      (r) =>
        r.table_id === table.id &&
        r.status === 'confirmed' &&
        r.time_slot === currentTimeSlot,
    )
    if (reserved) {
      return {
        ...table, venue_id: '', zone_id: null, is_active: true, created_at: '', status: 'reserved',
        reservation_holder: undefined, // se une con users en el servidor
        reservation_time: reserved.time_slot,
      }
    }
  }

  return { ...table, venue_id: '', zone_id: null, is_active: true, created_at: '', status: 'available' }
}

export function TableGrid({
  venueId,
  initialTables,
  initialReservations,
  todayDate,
  currentTimeSlot,
}: TableGridProps) {
  const [tables, setTables] = useState(initialTables)
  const [reservations, setReservations] = useState(initialReservations)
  const [modalState, setModalState] = useState<{
    table: TableWithStatus
    action: 'occupy' | 'free' | 'checkin'
  } | null>(null)

  const supabase = createClient()

  // Recomputar estados al cambiar reservations
  const refreshStatuses = useCallback(
    (freshReservations: Reservation[]) => {
      setTables((prev) =>
        prev.map((t) => computeTableStatus(t, freshReservations, currentTimeSlot)),
      )
      setReservations(freshReservations)
    },
    [currentTimeSlot],
  )

  // Supabase Realtime — escuchar cambios en reservations y tables del venue
  useEffect(() => {
    const channel = supabase
      .channel(`panel-${venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `venue_id=eq.${venueId}`,
        },
        async () => {
          // Re-fetch las reservas del día
          const { data } = await supabase
            .from('reservations')
            .select('*')
            .eq('venue_id', venueId)
            .eq('date', todayDate)
            .in('status', ['confirmed', 'checked_in', 'pending_payment'])
          if (data) refreshStatuses(data as Reservation[])
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tables',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          const updated = payload.new as TableWithStatus
          setTables((prev) =>
            prev.map((t) =>
              t.id === updated.id
                ? computeTableStatus(updated, reservations, currentTimeSlot)
                : t,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [venueId, todayDate, currentTimeSlot, refreshStatuses, supabase, reservations])

  async function handleAction(table: TableWithStatus, action: 'occupy' | 'free' | 'checkin') {
    if (action === 'occupy') {
      await supabase.from('tables').update({ is_occupied: true }).eq('id', table.id)
    } else if (action === 'free') {
      await supabase.from('tables').update({ is_occupied: false }).eq('id', table.id)
      // Si había check-in, mantener el status checked_in en la reserva (histórico)
    } else if (action === 'checkin') {
      // Buscar la reserva confirmada más próxima
      const reservation = reservations.find(
        (r) => r.table_id === table.id && r.status === 'confirmed',
      )
      if (reservation) {
        await Promise.all([
          supabase
            .from('reservations')
            .update({ status: 'checked_in' })
            .eq('id', reservation.id),
          supabase.from('tables').update({ is_occupied: true }).eq('id', table.id),
        ])
      } else {
        // Check-in manual sin reserva digital
        await supabase.from('tables').update({ is_occupied: true }).eq('id', table.id)
      }
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onAction={(t, action) => setModalState({ table: t, action })}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-4">
        {[
          { color: 'bg-c2', label: 'Libre' },
          { color: 'bg-c4', label: 'Reservada' },
          { color: 'bg-c1', label: 'Ocupada' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-[11px] font-semibold text-tx3">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Modal de acción */}
      {modalState && (
        <ActionModal
          table={modalState.table}
          action={modalState.action}
          onConfirm={() => handleAction(modalState.table, modalState.action)}
          onClose={() => setModalState(null)}
        />
      )}
    </>
  )
}
