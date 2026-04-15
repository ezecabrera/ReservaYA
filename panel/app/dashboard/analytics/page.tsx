'use client'

import { useEffect, useState } from 'react'
import { PanelNav } from '@/components/nav/PanelNav'

interface AnalyticsData {
  today: {
    date: string
    totalReservations: number
    confirmed: number
    checkedIn: number
    noShows: number
    occupancyPct: number
    totalTables: number
  }
  week: {
    totalConfirmed: number
    totalCheckedIn: number
    totalNoShows: number
    noShowRate: number
    depositRevenue: number
    preOrderRevenue: number
    avgPreOrder: number
    days: { date: string; confirmed: number; checkedIn: number; noShow: number }[]
  }
  popularSlots: { slot: string; count: number }[]
}

function StatCard({
  label, value, sub, accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider">{label}</p>
      <p className={`font-display text-[28px] font-bold leading-none ${accent ?? 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-white/40 text-[12px]">{sub}</p>}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:       'bg-c4l text-[#2B5FCC]',
  checked_in:      'bg-c2l text-[#15A67A]',
  pending_payment: 'bg-c3l text-[#CC7700]',
  no_show:         'bg-c1l text-[#D63646]',
  cancelled:       'bg-sf2 text-tx3',
}
const STATUS_LABEL: Record<string, string> = {
  confirmed:       'Confirmada',
  checked_in:      'Check-in',
  pending_payment: 'Pendiente',
  no_show:         'No-show',
  cancelled:       'Cancelada',
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'short' })
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const maxConfirmed = data
    ? Math.max(...data.week.days.map(d => d.confirmed), 1)
    : 1

  return (
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-white/55 text-[13px] mt-0.5">Últimos 7 días</p>
      </div>

      {loading ? (
        <div className="px-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-center text-white/40 mt-20">Error cargando datos</p>
      ) : (
        <div className="px-5 space-y-6">

          {/* ── Hoy ─────────────────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Hoy
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Reservas"
                value={data.today.confirmed}
                sub={`${data.today.totalReservations} totales`}
              />
              <StatCard
                label="Check-ins"
                value={data.today.checkedIn}
                sub={`de ${data.today.confirmed} confirmadas`}
                accent="text-c2"
              />
              <StatCard
                label="Ocupación"
                value={`${data.today.occupancyPct}%`}
                sub={`${data.today.confirmed} / ${data.today.totalTables} mesas`}
                accent={data.today.occupancyPct >= 70 ? 'text-c2' : 'text-white'}
              />
              <StatCard
                label="No-shows hoy"
                value={data.today.noShows}
                accent={data.today.noShows > 0 ? 'text-c1' : 'text-white'}
              />
            </div>
          </div>

          {/* ── Gráfico 7 días ───────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Reservas por día
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-end gap-1.5 h-24">
                {data.week.days.map((d) => {
                  const heightPct = maxConfirmed > 0
                    ? Math.max((d.confirmed / maxConfirmed) * 100, d.confirmed > 0 ? 8 : 0)
                    : 0
                  const isToday = d.date === data.today.date
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${heightPct}%`,
                            background: isToday
                              ? 'var(--c1)'
                              : d.confirmed > 0 ? 'rgba(46,216,168,0.6)' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold ${isToday ? 'text-c1' : 'text-white/35'}`}>
                        {dayLabel(d.date)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-c2/60 inline-block" />
                  <span className="text-[11px] text-white/40">Confirmadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-c1 inline-block" />
                  <span className="text-[11px] text-white/40">Hoy</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Revenue 7 días ───────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Revenue (7 días)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Señas cobradas"
                value={`$${(data.week.depositRevenue / 1000).toFixed(0)}K`}
                sub={`${data.week.totalConfirmed} reservas`}
                accent="text-c2"
              />
              <StatCard
                label="Pre-pedidos"
                value={`$${(data.week.preOrderRevenue / 1000).toFixed(0)}K`}
                sub={data.week.avgPreOrder > 0
                  ? `Ticket prom. $${data.week.avgPreOrder.toLocaleString('es-AR')}`
                  : 'Sin pre-pedidos aún'
                }
                accent="text-c4"
              />
            </div>
          </div>

          {/* ── Tasa de no-shows ─────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              No-shows (7 días)
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-[13px]">Total no-shows</span>
                <span className="font-bold text-white text-[15px]">{data.week.totalNoShows}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-[13px]">Tasa</span>
                <span className={`font-display text-[18px] font-bold ${
                  data.week.noShowRate >= 20 ? 'text-c1' : data.week.noShowRate >= 10 ? 'text-c3' : 'text-c2'
                }`}>
                  {data.week.noShowRate}%
                </span>
              </div>
              {/* Barra de progreso */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(data.week.noShowRate, 100)}%`,
                    background: data.week.noShowRate >= 20 ? 'var(--c1)' : data.week.noShowRate >= 10 ? 'var(--c3)' : 'var(--c2)',
                  }}
                />
              </div>
              <p className="text-[11px] text-white/30">
                {data.week.noShowRate < 10
                  ? 'Excelente — por debajo del promedio de industria (15%)'
                  : data.week.noShowRate < 20
                    ? 'Dentro del promedio. Considerá recordatorios por WhatsApp.'
                    : 'Alto — revisá si la seña está disuadiendo o el monto es bajo.'
                }
              </p>
            </div>
          </div>

          {/* ── Horarios populares ────────────────────────────────────────── */}
          {data.popularSlots.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
                Horarios más pedidos hoy
              </p>
              <div className="space-y-2">
                {data.popularSlots.map(({ slot, count }, i) => (
                  <div key={slot}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3
                               flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[16px] font-bold"
                        style={{ color: i === 0 ? 'var(--c1)' : 'rgba(255,255,255,0.5)' }}>
                        #{i + 1}
                      </span>
                      <span className="text-white font-semibold text-[14px]">{slot} hs</span>
                    </div>
                    <span className="text-white/50 text-[13px]">
                      {count} reserva{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <PanelNav />
    </div>
  )
}
