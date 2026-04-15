import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { TableGrid } from '@/components/tables/TableGrid'
import { getVenueMode, getAvailableTimeSlots } from '@/lib/shared'
import type { Venue, Table, Reservation, StaffUser, TableWithStatus } from '@/lib/shared'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Staff user con venue — usa admin client para evitar recursión RLS en staff_users
  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('*, venues(*)')
    .eq('id', user.id)
    .single()

  if (!staffUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-5"
        style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-[16px]">Sin acceso al panel</p>
          <p className="text-white/50 text-[13px] mt-1 max-w-[260px]">
            Tu cuenta no está asociada a ningún negocio.
            Cerrá sesión y volvé a ingresar con la cuenta correcta.
          </p>
        </div>
        <a
          href="/api/auth/signout"
          className="px-6 py-3 rounded-xl bg-white/10 border border-white/20
                     text-white font-semibold text-[14px] hover:bg-white/15 transition-colors"
        >
          Cerrar sesión
        </a>
      </div>
    )
  }

  const venue = (staffUser as StaffUser & { venues: Venue }).venues
  const todayDate = new Date().toISOString().split('T')[0]

  // Mesas + reservas del día en paralelo
  const [tablesResult, reservationsResult] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('venue_id', venue.id)
      .eq('is_active', true)
      .order('position_order'),
    supabase
      .from('reservations')
      .select('*, users(name)')
      .eq('venue_id', venue.id)
      .eq('date', todayDate)
      .in('status', ['confirmed', 'checked_in', 'pending_payment']),
  ])

  const rawTables = (tablesResult.data ?? []) as (Table & { is_occupied: boolean })[]
  const reservations = (reservationsResult.data ?? []) as (Reservation & { users: { name: string } | null })[]

  // Computar estado de cada mesa
  const { mode, shift } = getVenueMode(venue.config_json)
  const now = new Date()
  const currentTimeSlot = shift
    ? getAvailableTimeSlots(venue.config_json, todayDate, now)[0] ?? null
    : null

  const tablesWithStatus: TableWithStatus[] = rawTables.map((t) => {
    if (t.is_occupied) return { ...t, status: 'occupied' as const }

    const checkedIn = reservations.find(
      (r) => r.table_id === t.id && r.status === 'checked_in',
    )
    if (checkedIn) return { ...t, status: 'occupied' as const }

    const confirmed = reservations.find(
      (r) => r.table_id === t.id && r.status === 'confirmed',
    )
    if (confirmed) {
      return {
        ...t,
        status: 'reserved' as const,
        reservation_holder: confirmed.users?.name ?? undefined,
        reservation_time: confirmed.time_slot,
      }
    }
    return { ...t, status: 'available' as const }
  })

  const free = tablesWithStatus.filter((t) => t.status === 'available').length
  const reserved = tablesWithStatus.filter((t) => t.status === 'reserved').length
  const occupied = tablesWithStatus.filter((t) => t.status === 'occupied').length

  const modeLabel = mode === 'active_service' ? 'Servicio activo' : 'Pre-servicio'
  const modeClass = mode === 'active_service' ? 'mode-badge-active' : 'mode-badge-pre'

  return (
    <div>
      {/* Header oscuro */}
      <header
        className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-[22px] font-bold text-white tracking-tight">
              {venue.name}
            </h1>
            <p className="text-white/55 text-[13px] mt-0.5">
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>
          <span className={modeClass}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              mode === 'active_service' ? 'bg-c1' : 'bg-c2'
            }`} />
            {modeLabel}
          </span>
        </div>

        {/* Corte activo banner */}
        {mode === 'active_service' && (
          <div className="mb-4 rounded-xl bg-c1/15 border border-c1/25 px-4 py-2.5 flex items-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"
                stroke="var(--c1)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] text-white/80">
              Turno activo — las reservas nuevas para este turno están cerradas
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Reservas', value: String(reserved), color: 'text-[#7CB3FF]' },
            { label: 'Libres', value: String(free), color: 'text-c2' },
            { label: 'Ocupadas', value: String(occupied), color: 'text-c1' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/8 px-3 py-3 text-center">
              <p className={`font-display text-[26px] font-bold leading-none ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-white/45 text-[10px] font-bold uppercase tracking-wide mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* Grid de mesas */}
      <main className="px-5 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-bold text-tx">Mesas</h2>
          <span className="text-[12px] text-tx3">{rawTables.length} en total</span>
        </div>

        <TableGrid
          venueId={venue.id}
          initialTables={tablesWithStatus}
          initialReservations={reservations as unknown as Reservation[]}
          todayDate={todayDate}
          currentTimeSlot={currentTimeSlot}
        />
      </main>
    </div>
  )
}
