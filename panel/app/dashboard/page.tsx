import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { SplitDashboard } from '@/components/dashboard/SplitDashboard'
import type { SplitReservation, SplitTable, SplitZone } from '@/components/dashboard/SplitDashboard'
import { buildGuestProfiles, guestKey, getVenueMode } from '@/lib/shared'
import type { Venue, GuestTag } from '@/lib/shared'
import type { GuestReservationRow } from '@/lib/shared/utils/crm'

export const dynamic = 'force-dynamic'

/**
 * Dashboard operativo — entrypoint del staff durante el servicio.
 *
 * Carga paralela:
 *   - venue (del staff autenticado)
 *   - zones del venue
 *   - tables activas
 *   - reservas del día
 *   - historial para computar tags (CRM auto-tags)
 *
 * Fallback graceful si migration 006+ no aplicada: las columnas nuevas
 * quedan en null y el dashboard funciona igual.
 */

const TAG_PRIORITY: GuestTag[] = [
  'no_show_previo',
  'vip',
  'habitue',
  'regular_reciente',
  'primera_vez',
]

function primaryTag(tags: GuestTag[]): GuestTag | null {
  for (const t of TAG_PRIORITY) if (tags.includes(t)) return t
  return null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: staffUser, error: staffError } = await admin
    .from('staff_users')
    .select('*, venues(*)')
    .eq('id', user.id)
    .single()

  if (staffError) console.error('[dashboard] staff_users error:', staffError.message)

  if (!staffUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-5 bg-ink">
        <div className="w-14 h-14 rounded-2xl bg-ink-2 flex items-center justify-center
                        border border-ink-line-2">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="var(--ink-text-2)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" stroke="var(--ink-text-2)" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-[17px] text-ink-text">Sin acceso al panel</p>
          <p className="text-ink-text-2 text-[13px] mt-1 max-w-[260px]">
            Tu cuenta no está asociada a ningún negocio.
          </p>
        </div>
        <a
          href="/api/auth/signout"
          className="px-6 py-3 rounded-xl bg-ink-2 border border-ink-line-2
                     text-ink-text font-semibold text-[14px] hover:bg-ink-3 transition-colors"
        >
          Cerrar sesión
        </a>
      </div>
    )
  }

  const venue = staffUser.venues as Venue
  const todayDate = new Date().toISOString().split('T')[0]

  const [zonesResult, tablesResult, reservationsResult, historyResult] = await Promise.all([
    admin.from('zones').select('id, name, prefix').eq('venue_id', venue.id),
    admin.from('tables').select('id, label, capacity, zone_id, is_occupied, position_order')
      .eq('venue_id', venue.id).eq('is_active', true).order('position_order'),
    // Reservas del día. Fallback legacy si migration 006+ o 012 no aplicadas.
    (async () => {
      const withNew = await admin
        .from('reservations')
        .select(`id, status, time_slot, party_size, table_id,
                 guest_name, guest_phone, notes, user_id, duration_minutes,
                 users(name, phone)`)
        .eq('venue_id', venue.id)
        .eq('date', todayDate)
        .order('time_slot', { ascending: true })

      if (withNew.error?.message?.includes('does not exist')) {
        // Fallback: intentar sin duration_minutes (migration 012 pendiente)
        const withoutDuration = await admin
          .from('reservations')
          .select(`id, status, time_slot, party_size, table_id,
                   guest_name, guest_phone, notes, user_id,
                   users(name, phone)`)
          .eq('venue_id', venue.id)
          .eq('date', todayDate)
          .order('time_slot', { ascending: true })

        if (withoutDuration.error?.message?.includes('does not exist')) {
          return admin
            .from('reservations')
            .select(`id, status, time_slot, party_size, table_id, user_id,
                     users(name, phone)`)
            .eq('venue_id', venue.id)
            .eq('date', todayDate)
            .order('time_slot', { ascending: true })
        }
        return withoutDuration
      }
      return withNew
    })(),
    // Historial para computar tags
    (async () => {
      const withNew = await admin
        .from('reservations')
        .select(`user_id, status, date, party_size, created_at,
                 guest_name, guest_phone, users(name, phone)`)
        .eq('venue_id', venue.id)

      if (withNew.error?.message?.includes('does not exist')) {
        return admin
          .from('reservations')
          .select(`user_id, status, date, party_size, created_at, users(name, phone)`)
          .eq('venue_id', venue.id)
      }
      return withNew
    })(),
  ])

  const zones = (zonesResult.data ?? []) as SplitZone[]
  const rawTables = (tablesResult.data ?? []) as SplitTable[]

  // Compute tags del guest por reservation
  type HistRow = {
    user_id: string | null
    status: GuestReservationRow['status']
    date: string
    party_size: number
    created_at: string
    guest_name?: string | null
    guest_phone?: string | null
    users: { name: string | null; phone: string | null } | null
  }
  const histTyped = (historyResult.data ?? []) as unknown as HistRow[]
  const profiles = buildGuestProfiles(
    histTyped.map((r) => ({
      user_id: r.user_id,
      user_name: r.users?.name ?? null,
      user_phone: r.users?.phone ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      status: r.status,
      date: r.date,
      party_size: r.party_size,
      created_at: r.created_at,
    })),
  )
  const tagByKey = new Map<string, GuestTag | null>(
    profiles.map((p) => [p.key, primaryTag(p.tags)]),
  )

  type TodayRow = {
    id: string
    status: SplitReservation['status']
    time_slot: string
    party_size: number
    table_id: string
    user_id: string | null
    guest_name?: string | null
    guest_phone?: string | null
    notes?: string | null
    duration_minutes?: number | null
    users: { name: string | null; phone: string | null } | null
  }
  const reservations: SplitReservation[] = (reservationsResult.data as unknown as TodayRow[] ?? []).map((r) => {
    const key = guestKey({
      user_id: r.user_id,
      user_name: r.users?.name ?? null,
      user_phone: r.users?.phone ?? null,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      status: r.status,
      date: todayDate,
      party_size: r.party_size,
      created_at: '',
    })
    return {
      id: r.id,
      status: r.status,
      time_slot: r.time_slot,
      party_size: r.party_size,
      table_id: r.table_id,
      guest_name: r.guest_name ?? null,
      guest_phone: r.guest_phone ?? null,
      notes: r.notes ?? null,
      duration_minutes: r.duration_minutes ?? 90,
      guest_tag: tagByKey.get(key) ?? null,
      user_name: r.users?.name ?? null,
    }
  })

  const { mode, shift } = getVenueMode(venue.config_json)
  const shiftLabel = shift
    ? (() => {
        const open = shift.opens_at.slice(0, 5)
        const close = shift.closes_at.slice(0, 5)
        const isLunch = parseInt(open.split(':')[0], 10) < 17
        return `${isLunch ? 'Almuerzo' : 'Cena'} · ${open}–${close}`
      })()
    : null

  return (
    <SplitDashboard
      venueName={venue.name}
      date={todayDate}
      mode={mode}
      shiftLabel={shiftLabel}
      zones={zones}
      tables={rawTables}
      reservations={reservations}
    />
  )
}
