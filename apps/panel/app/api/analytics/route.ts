import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET /api/analytics
 * Devuelve métricas de los últimos 7 días para el venue del staff autenticado.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const venueId = staffUser.venue_id

  // Fecha de hoy y hace 7 días en ISO
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

  const [reservationsResult, paymentsResult, ordersResult, tablesResult] = await Promise.all([
    // Reservas de los últimos 7 días
    admin
      .from('reservations')
      .select('id, date, status, party_size, time_slot')
      .eq('venue_id', venueId)
      .gte('date', sevenDaysAgoStr)
      .lte('date', todayStr)
      .order('date', { ascending: true }),

    // Pagos aprobados de los últimos 7 días
    admin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'approved')
      .gte('created_at', sevenDaysAgo.toISOString()),

    // Órdenes (pre-pedidos) de los últimos 7 días
    admin
      .from('orders')
      .select('total, created_at')
      .gte('created_at', sevenDaysAgo.toISOString()),

    // Total de mesas del venue
    admin
      .from('tables')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId),
  ])

  const reservations = reservationsResult.data ?? []
  const payments = paymentsResult.data ?? []
  const orders = ordersResult.data ?? []
  const totalTables = tablesResult.count ?? 0

  // ── Métricas de hoy ──────────────────────────────────────────────────────
  const todayReservations = reservations.filter(r => r.date === todayStr)
  const todayConfirmed   = todayReservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in')
  const todayCheckedIn   = todayReservations.filter(r => r.status === 'checked_in')
  const todayNoShows     = todayReservations.filter(r => r.status === 'no_show')

  const occupancyPct = totalTables > 0
    ? Math.round((todayConfirmed.length / totalTables) * 100)
    : 0

  // ── Últimos 7 días — datos por fecha ─────────────────────────────────────
  const days: { date: string; confirmed: number; checkedIn: number; noShow: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayRes = reservations.filter(r => r.date === dateStr)
    days.push({
      date: dateStr,
      confirmed: dayRes.filter(r => ['confirmed', 'checked_in', 'no_show'].includes(r.status)).length,
      checkedIn: dayRes.filter(r => r.status === 'checked_in').length,
      noShow:    dayRes.filter(r => r.status === 'no_show').length,
    })
  }

  // ── Totales 7 días ────────────────────────────────────────────────────────
  const totalConfirmed = reservations.filter(r =>
    ['confirmed', 'checked_in', 'no_show'].includes(r.status)
  ).length
  const totalCheckedIn = reservations.filter(r => r.status === 'checked_in').length
  const totalNoShows   = reservations.filter(r => r.status === 'no_show').length
  const noShowRate     = totalConfirmed > 0
    ? Math.round((totalNoShows / totalConfirmed) * 100)
    : 0

  const depositRevenue  = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const preOrderRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0)

  const ordersWithValue = orders.filter(o => o.total > 0)
  const avgPreOrder = ordersWithValue.length > 0
    ? Math.round(ordersWithValue.reduce((s, o) => s + o.total, 0) / ordersWithValue.length)
    : 0

  // ── Horarios más populares (hoy) ─────────────────────────────────────────
  const slotCount: Record<string, number> = {}
  todayConfirmed.forEach(r => {
    slotCount[r.time_slot] = (slotCount[r.time_slot] ?? 0) + 1
  })
  const popularSlots = Object.entries(slotCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slot, count]) => ({ slot, count }))

  return NextResponse.json({
    today: {
      date: todayStr,
      totalReservations: todayReservations.length,
      confirmed: todayConfirmed.length,
      checkedIn: todayCheckedIn.length,
      noShows: todayNoShows.length,
      occupancyPct,
      totalTables,
    },
    week: {
      totalConfirmed,
      totalCheckedIn,
      totalNoShows,
      noShowRate,
      depositRevenue,
      preOrderRevenue,
      avgPreOrder,
      days,
    },
    popularSlots,
  })
}
