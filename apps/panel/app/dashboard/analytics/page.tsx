'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

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

const NAVY = '#0F3460'
const GREEN = '#15A67A'
const AMBER = '#CC7700'
const RED = '#D63646'

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
}

// ── Mock preview ─────────────────────────────────────────────────────────────

function previewData(): AnalyticsData {
  const today = new Date().toISOString().slice(0, 10)
  const days: AnalyticsData['week']['days'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const base = [8, 14, 11, 17, 22, 19, 12][6 - i] ?? 10
    days.push({ date: iso, confirmed: base, checkedIn: Math.round(base * 0.85), noShow: Math.round(base * 0.08) })
  }
  return {
    today: { date: today, totalReservations: 14, confirmed: 12, checkedIn: 8, noShows: 1, occupancyPct: 65, totalTables: 8 },
    week: {
      totalConfirmed: 103, totalCheckedIn: 87, totalNoShows: 9, noShowRate: 9,
      depositRevenue: 206000, preOrderRevenue: 84500, avgPreOrder: 2800,
      days,
    },
    popularSlots: [
      { slot: '21:00', count: 5 },
      { slot: '20:30', count: 4 },
      { slot: '22:00', count: 3 },
    ],
  }
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <AnalyticsInner />
    </Suspense>
  )
}

function AnalyticsInner() {
  const searchParams = useSearchParams()
  const isPreview = process.env.NODE_ENV !== 'production' && searchParams.has('preview')

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(!isPreview)

  useEffect(() => {
    if (isPreview) { setData(previewData()); setLoading(false); return }
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isPreview])

  const maxConfirmed = data ? Math.max(...data.week.days.map(d => d.confirmed), 1) : 1

  return (
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Analytics"
        subtitle="Últimos 7 días de operación"
        venueName={isPreview ? 'La Cantina de Martín' : undefined}
      />

      <main className="max-w-3xl mx-auto px-5 pt-6 space-y-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-md border border-[rgba(0,0,0,0.07)] animate-pulse" />
            ))}
          </div>
        ) : !data ? (
          <p className="text-center text-tx3 mt-10 text-[14px]">Error cargando datos.</p>
        ) : (
          <>
            {/* ── Hoy ─────────────────────────────────────────────────────── */}
            <Section title="Hoy">
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
                  accent={GREEN}
                />
                <StatCard
                  label="Ocupación"
                  value={`${data.today.occupancyPct}%`}
                  sub={`${data.today.confirmed} / ${data.today.totalTables} mesas`}
                  accent={data.today.occupancyPct >= 70 ? GREEN : undefined}
                />
                <StatCard
                  label="No-shows"
                  value={data.today.noShows}
                  sub={data.today.noShows === 0 ? 'Sin incidentes' : 'hoy'}
                  accent={data.today.noShows > 0 ? RED : undefined}
                />
              </div>
            </Section>

            {/* ── Gráfico 7 días ──────────────────────────────────────────── */}
            <Section title="Reservas por día">
              <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4">
                <div className="flex items-end gap-2 h-28">
                  {data.week.days.map((d) => {
                    const heightPct = maxConfirmed > 0
                      ? Math.max((d.confirmed / maxConfirmed) * 100, d.confirmed > 0 ? 8 : 2)
                      : 2
                    const isToday = d.date === data.today.date
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        <div className="w-full flex items-end justify-center" style={{ height: 92 }}>
                          <div
                            className="w-full rounded-t-sm transition-all duration-700"
                            style={{
                              height: `${heightPct}%`,
                              background: isToday ? NAVY : 'rgba(15,52,96,0.2)',
                            }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider truncate
                                      ${isToday ? 'text-[#0F3460]' : 'text-tx3'}`}
                        >
                          {dayLabel(d.date)}
                        </span>
                        <span className="text-[11px] text-tx2 font-mono tabular-nums">
                          {d.confirmed}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
                  <Legend color={NAVY} label="Hoy" />
                  <Legend color="rgba(15,52,96,0.2)" label="Días previos" />
                </div>
              </div>
            </Section>

            {/* ── Revenue ──────────────────────────────────────────────────── */}
            <Section title="Revenue (7 días)">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Señas cobradas"
                  value={`$${(data.week.depositRevenue / 1000).toFixed(0)}K`}
                  sub={`${data.week.totalConfirmed} reservas`}
                  accent={NAVY}
                />
                <StatCard
                  label="Pre-pedidos"
                  value={`$${(data.week.preOrderRevenue / 1000).toFixed(0)}K`}
                  sub={data.week.avgPreOrder > 0
                    ? `Ticket prom. $${data.week.avgPreOrder.toLocaleString('es-AR')}`
                    : 'Sin pre-pedidos aún'}
                  accent={GREEN}
                />
              </div>
            </Section>

            {/* ── No-shows ─────────────────────────────────────────────────── */}
            <Section title="No-shows (7 días)">
              <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-tx2 text-[13px]">Total no-shows</span>
                  <span className="font-semibold text-tx text-[15px] tabular-nums">
                    {data.week.totalNoShows}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-tx2 text-[13px]">Tasa</span>
                  <span
                    className="font-sans-black text-[22px] leading-none tabular-nums"
                    style={{
                      color: data.week.noShowRate >= 20 ? RED
                        : data.week.noShowRate >= 10 ? AMBER
                        : GREEN,
                    }}
                  >
                    {data.week.noShowRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-sf2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(data.week.noShowRate, 100)}%`,
                      background: data.week.noShowRate >= 20 ? RED
                        : data.week.noShowRate >= 10 ? AMBER
                        : GREEN,
                    }}
                  />
                </div>
                <p className="text-tx3 text-[12px] leading-relaxed">
                  {data.week.noShowRate < 10
                    ? 'Excelente — por debajo del promedio de industria (15%).'
                    : data.week.noShowRate < 20
                      ? 'Dentro del promedio. Considerá recordatorios por WhatsApp.'
                      : 'Alto — revisá si la seña está disuadiendo o el monto es bajo.'}
                </p>
              </div>
            </Section>

            {/* ── Horarios populares ───────────────────────────────────────── */}
            {data.popularSlots.length > 0 && (
              <Section title="Horarios más pedidos hoy">
                <div className="space-y-2">
                  {data.popularSlots.map(({ slot, count }, i) => (
                    <div
                      key={slot}
                      className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] px-4 py-3
                                 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="font-sans-black text-[18px] leading-none tabular-nums"
                          style={{ color: i === 0 ? NAVY : '#ABABBA' }}
                        >
                          #{i + 1}
                        </span>
                        <span className="text-tx font-semibold text-[14px] tabular-nums font-mono">
                          {slot} hs
                        </span>
                      </div>
                      <span className="text-tx2 text-[13px]">
                        {count} reserva{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Componentes ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </section>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4 flex flex-col gap-1">
      <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider">{label}</p>
      <p
        className="font-sans-black text-[28px] leading-none tabular-nums"
        style={{ color: accent ?? '#0D0D0D' }}
      >
        {value}
      </p>
      {sub && <p className="text-tx2 text-[12px]">{sub}</p>}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
      <span className="text-[11px] text-tx2">{label}</span>
    </div>
  )
}
