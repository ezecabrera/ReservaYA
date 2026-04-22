import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { TableGrid } from '@/components/tables/TableGrid'
import { getVenueMode, getAvailableTimeSlots } from '@/lib/shared'
import type { Venue, Table, Reservation, StaffUser, TableWithStatus } from '@/lib/shared'
import { DashboardHeader } from './DashboardHeader'
import { DashboardPreview } from './DashboardPreview'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    headers().get('x-dev-preview') === '1'

  if (isDevPreview) {
    return <DashboardPreview />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: staffUser, error: staffError } = await admin
    .from('staff_users')
    .select('*, venues(*)')
    .eq('id', user.id)
    .single()

  if (staffError) console.error('[dashboard] staff_users error:', staffError.message, staffError.code)

  if (!staffUser) {
    return <NoAccess userId={user.id} email={user.email ?? '—'} />
  }

  const venue = (staffUser as StaffUser & { venues: Venue }).venues
  const todayDate = new Date().toISOString().split('T')[0]

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

  const { mode, shift } = getVenueMode(venue.config_json)
  const now = new Date()
  const currentTimeSlot = shift
    ? getAvailableTimeSlots(venue.config_json, todayDate, now)[0] ?? null
    : null

  const tablesWithStatus: TableWithStatus[] = rawTables.map((t) => {
    if (t.is_occupied) return { ...t, status: 'occupied' as const }
    const checkedIn = reservations.find((r) => r.table_id === t.id && r.status === 'checked_in')
    if (checkedIn) return { ...t, status: 'occupied' as const }
    const confirmed = reservations.find((r) => r.table_id === t.id && r.status === 'confirmed')
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

  return (
    <div className="bg-sf min-h-screen">
      <DashboardHeader
        venueName={venue.name}
        mode={mode}
        stats={{ reserved, free, occupied }}
      />
      <main className="max-w-3xl mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[22px] text-tx leading-none">Mesas</h2>
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

function NoAccess({ userId, email }: { userId: string; email: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-5 bg-sf">
      <div className="w-14 h-14 rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" stroke="#ABABBA" strokeWidth="2" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-[22px] text-tx">Sin acceso al panel</p>
        <p className="text-tx2 text-[13px] mt-1 max-w-[300px]">
          Tu cuenta no está asociada a ningún negocio. Cerrá sesión y volvé a ingresar con la cuenta correcta.
        </p>
      </div>
      <a
        href="/api/auth/signout"
        className="px-5 py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                   hover:bg-[#0A2548] transition-colors"
      >
        Cerrar sesión
      </a>
      <p className="text-tx3 text-[11px] font-mono mt-2">{email} · {userId.slice(0, 8)}</p>
    </div>
  )
}
