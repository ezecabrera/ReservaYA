'use client'

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Field, TextInput, TextArea, Select, NumberStepper } from '@/components/ui/Field'
import { ReservationHistorySheet } from '@/components/reservas/ReservationHistorySheet'
import type { Reservation, TableWithStatus, ReservationStatus } from '@/lib/shared'

export interface EditReservationPatch {
  id: string
  table_id?: string
  time_slot?: string
  party_size?: number
  duration_minutes?: number
  guest_name?: string
  guest_phone?: string | null
  customer_notes?: string | null
  staff_notes?: string | null
  status?: ReservationStatus
  cancel_reason?: string | null
  cancelled_by?: 'venue' | 'customer' | null
}

interface EditReservationSheetProps {
  open: boolean
  onClose: () => void
  reservation: Reservation | null
  tables: TableWithStatus[]
  onSave: (patch: EditReservationPatch) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
}

const STATUS_OPTIONS: Array<{ value: ReservationStatus; label: string }> = [
  { value: 'confirmed',  label: 'Confirmada' },
  { value: 'checked_in', label: 'Check-in' },
  { value: 'finished',   label: 'Cerrada' },
  { value: 'no_show',    label: 'No-show' },
  { value: 'cancelled',  label: 'Cancelada' },
]

const CANCEL_REASONS = [
  'El cliente no puede venir',
  'Doble reserva',
  'Emergencia del local',
  'Otro motivo',
]

export function EditReservationSheet({
  open,
  onClose,
  reservation,
  tables,
  onSave,
  onDelete,
}: EditReservationSheetProps) {
  const [tableId, setTableId] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [duration, setDuration] = useState(90)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [status, setStatus] = useState<ReservationStatus>('confirmed')
  const [cancelReason, setCancelReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    if (!reservation || !open) return
    setTableId(reservation.table_id)
    setTimeSlot(reservation.time_slot.slice(0, 5))
    setPartySize(reservation.party_size)
    setDuration(reservation.duration_minutes ?? 90)
    setGuestName(reservation.guest_name ?? '')
    setGuestPhone(reservation.guest_phone ?? '')
    setCustomerNotes(reservation.customer_notes ?? '')
    setStaffNotes(reservation.staff_notes ?? '')
    setStatus(reservation.status)
    setCancelReason(reservation.cancel_reason ?? '')
    setError(null)
    setConfirmDelete(false)
  }, [reservation, open])

  async function handleSave() {
    if (!reservation) return
    setSubmitting(true)
    setError(null)
    try {
      const patch: EditReservationPatch = { id: reservation.id }
      if (tableId !== reservation.table_id)                         patch.table_id = tableId
      if (timeSlot !== reservation.time_slot.slice(0, 5))           patch.time_slot = timeSlot
      if (partySize !== reservation.party_size)                     patch.party_size = partySize
      if (duration !== (reservation.duration_minutes ?? 90))        patch.duration_minutes = duration
      if (guestName.trim() !== (reservation.guest_name ?? ''))      patch.guest_name = guestName.trim()
      if (guestPhone.trim() !== (reservation.guest_phone ?? ''))    patch.guest_phone = guestPhone.trim() || null
      if (customerNotes.trim() !== (reservation.customer_notes ?? '')) patch.customer_notes = customerNotes.trim() || null
      if (staffNotes.trim() !== (reservation.staff_notes ?? ''))    patch.staff_notes = staffNotes.trim() || null
      if (status !== reservation.status) {
        patch.status = status
        if (status === 'cancelled') {
          patch.cancel_reason = cancelReason.trim() || 'Sin motivo'
          patch.cancelled_by = 'venue'
        }
      }
      await onSave(patch)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!reservation || !onDelete) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSubmitting(true)
    try {
      await onDelete(reservation.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!reservation) return null

  const tableLabel = tables.find((t) => t.id === tableId)?.label ?? '?'
  const showCancelReason = status === 'cancelled'

  return (
    <>
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Editar reserva"
      subtitle={`${guestName || '—'} · mesa ${tableLabel} · ${timeSlot}`}
      primaryAction={
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="btn btn-primary"
          style={{ height: 34, padding: '0 14px', borderRadius: 'var(--r-pill)', fontSize: 12 }}
        >
          {submitting ? 'Guardando…' : 'Guardar'}
        </button>
      }
    >
      <div className="space-y-1">
        <Field label="Estado">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>

        {showCancelReason && (
          <Field label="Motivo de cancelación" required>
            <Select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
              <option value="">Elegir motivo…</option>
              {CANCEL_REASONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Titular" required>
          <TextInput
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nombre del titular"
          />
        </Field>

        <Field label="Teléfono">
          <TextInput
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="+54 9 11…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mesa">
            <Select value={tableId} onChange={(e) => setTableId(e.target.value)}>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} · {t.capacity}p
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Hora">
            <TextInput
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Personas">
            <NumberStepper value={partySize} onChange={setPartySize} min={1} max={20} suffix="pax" />
          </Field>
          <Field label="Duración">
            <NumberStepper value={duration} onChange={setDuration} min={15} max={360} step={15} suffix="min" />
          </Field>
        </div>

        <Field label="Nota del cliente">
          <TextArea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Alergias, aniversarios…"
            rows={2}
          />
        </Field>

        <Field label="Nota interna (staff)">
          <TextArea
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="Observaciones para el equipo"
            rows={2}
          />
        </Field>

        {error && (
          <div
            className="mt-3"
            style={{
              padding: '10px 14px',
              background: 'var(--wine-bg)',
              border: '1px solid var(--wine)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--wine-soft)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn"
            style={{
              width: '100%',
              height: 38,
              justifyContent: 'center',
              borderRadius: 'var(--r-pill)',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--text-2)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Ver historial
          </button>
        </div>

        {onDelete && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              onClick={handleDelete}
              className={confirmDelete ? 'btn btn-wine' : 'btn'}
              style={{
                width: '100%',
                height: 44,
                justifyContent: 'center',
                borderRadius: 'var(--r-pill)',
                color: confirmDelete ? '#F5E9EB' : 'var(--wine-soft)',
              }}
            >
              {confirmDelete ? '¿Seguro? Click de nuevo para eliminar' : 'Eliminar reserva'}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
    <ReservationHistorySheet
      reservationId={reservation.id}
      customerName={guestName || reservation.guest_name || 'Reserva'}
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
    />
    </>
  )
}
