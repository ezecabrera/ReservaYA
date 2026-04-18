'use client'

import { useEffect, useState } from 'react'
import type { VenueRatingStats } from '@/lib/shared'
import { PageHero } from '@/components/ui/PageHero'
import { PremiumStatCard } from '@/components/ui/PremiumStatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconHourglass } from '@/components/ui/Icons'
import { DisputeRatingSheet } from '@/components/rating/DisputeRatingSheet'

interface ReviewRow {
  id: string
  stars: number
  comment: string | null
  created_at: string
  disputed: boolean
  dispute_reason: string | null
}

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
  const [rating, setRating] = useState<VenueRatingStats | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [disputeTarget, setDisputeTarget] = useState<ReviewRow | null>(null)
  /** Flag que se activa ~60ms después de que llegan los datos — dispara el
      grow-from-zero de las barras del chart (la transition CSS hace el resto). */
  const [chartReady, setChartReady] = useState(false)

  const reloadReviews = async () => {
    try {
      const res = await fetch('/api/venue/reviews')
      const d = await res.json()
      if (Array.isArray(d)) setReviews(d)
    } catch {}
  }

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AnalyticsData | null) => {
        setData(d && d.week && d.today ? d : null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Tras render con datos, gatillar el grow-from-zero de las barras.
  // 60ms deja que el DOM commitee con height=0 antes de la transición.
  useEffect(() => {
    if (!data) { setChartReady(false); return }
    const id = setTimeout(() => setChartReady(true), 60)
    return () => clearTimeout(id)
  }, [data])

  useEffect(() => {
    fetch('/api/venue/my-rating')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: VenueRatingStats | null) => setRating(d))
      .catch(() => {})
    reloadReviews()
  }, [])

  const maxConfirmed = data
    ? Math.max(...data.week.days.map((d) => d.confirmed), 1)
    : 1

  return (
    <div className="min-h-screen pb-28 bg-ink">

      <PageHero
        kicker="Últimos 7 días"
        title="Analytics"
        subtitle="Cómo evoluciona tu operación"
        accent="amber"
      />

      {loading ? (
        <div className="px-5 pt-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-ink-2 border border-ink-line rounded-2xl animate-pulse reveal-stagger"
              style={{ '--i': i } as React.CSSProperties}
            />
          ))}
        </div>
      ) : !data ? (
        <div className="pt-5">
          <EmptyState
            accent="amber"
            title="Los números todavía están esperando"
            description="Cuando empieces a recibir reservas, acá vas a ver ocupación, no-shows y tendencias de la semana."
            icon={<IconHourglass size={28} />}
          />
        </div>
      ) : (
        <main className="px-5 pt-5 space-y-6">

          {/* Rating público */}
          {rating && (
            <section>
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
                Cómo te ve tu público
              </p>
              <div
                className="relative rounded-2xl border border-[#E5A332]/25 p-5 overflow-hidden"
                style={{
                  background:
                    'radial-gradient(120% 100% at 100% 0%, rgba(229, 163, 50, 0.22) 0%, rgba(255,255,255,0.03) 60%)',
                }}
              >
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, #C99130 0%, #A13143 100%)' }}
                />

                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[44px] font-bold leading-none text-white tracking-tight">
                    {rating.avg_stars !== null ? rating.avg_stars.toFixed(1) : '—'}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = rating.avg_stars !== null && rating.avg_stars >= n - 0.5
                      return (
                        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
                          fill={filled ? '#E8B51A' : 'rgba(255,255,255,0.15)'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )
                    })}
                  </div>
                </div>
                <p className="text-white/55 text-[12.5px] mt-2 leading-snug">
                  {rating.total_ratings === 0
                    ? 'Todavía sin calificaciones — seguí pidiendo reviews post-visita'
                    : `${rating.total_ratings} calificación${rating.total_ratings !== 1 ? 'es' : ''} de clientes`}
                </p>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] text-white/55">
                      Cancelaciones tuyas <span className="text-white/35">(últ. 180 días)</span>
                    </span>
                    <span className={`font-display font-bold text-[20px] tracking-tight ${
                      rating.unilateral_cancel_pct === null
                        ? 'text-white/40'
                        : rating.unilateral_cancel_pct >= 5 ? 'text-[#FF8A91]'
                        : rating.unilateral_cancel_pct >= 2 ? 'text-[#F3C773]'
                        : 'text-[#7BD3B2]'
                    }`}>
                      {rating.unilateral_cancel_pct === null ? '—' : `${rating.unilateral_cancel_pct}%`}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-white/35 mt-1.5 leading-snug">
                    {rating.cancel_sample_size === 0
                      ? 'Sin reservas suficientes para calcular'
                      : rating.unilateral_cancel_pct === null || rating.unilateral_cancel_pct < 2
                        ? 'Este número se muestra públicamente en tu perfil.'
                        : rating.unilateral_cancel_pct < 5
                          ? 'Público. Un nivel razonable genera confianza.'
                          : 'Alto — los clientes van a notar esto en tu perfil público.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Últimas reseñas — con opción de apelar */}
          {reviews.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
                Últimas reseñas
              </p>
              <div className="space-y-2">
                {reviews.slice(0, 5).map((r) => {
                  const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 3_600_000
                  const canDispute = !r.disputed && ageHours <= 72
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl px-4 py-3 border ${
                        r.disputed
                          ? 'bg-[#F3C773]/8 border-[#E5A332]/25'
                          : 'bg-white/[0.04] border-white/8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <svg key={n} width="12" height="12" viewBox="0 0 24 24"
                                fill={n <= r.stars ? '#E8B51A' : 'rgba(255,255,255,0.15)'}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                          {r.disputed && (
                            <span className="text-[9.5px] font-bold uppercase tracking-wide
                                             px-1.5 py-0.5 rounded bg-[#E5A332]/25 text-[#F3C773]">
                              En disputa
                            </span>
                          )}
                        </div>
                        {canDispute && (
                          <button
                            type="button"
                            onClick={() => setDisputeTarget(r)}
                            className="text-[11.5px] font-bold text-white/70 hover:text-white
                                       transition-colors"
                          >
                            Apelar
                          </button>
                        )}
                      </div>
                      {r.comment && (
                        <p className="text-white/75 text-[12.5px] mt-1.5 leading-snug">
                          {r.comment}
                        </p>
                      )}
                      {r.disputed && r.dispute_reason && (
                        <p className="text-white/50 text-[11px] mt-1.5 italic">
                          Tu apelación: {r.dispute_reason}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Hoy */}
          <section>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
              Hoy
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PremiumStatCard
                label="Reservas"
                value={data.today.confirmed}
                hint={`${data.today.totalReservations} totales`}
                tone="blue"
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              />
              <PremiumStatCard
                label="Check-ins"
                value={data.today.checkedIn}
                hint={`de ${data.today.confirmed} confirmadas`}
                tone="sage"
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              />
              <PremiumStatCard
                label="Ocupación"
                value={data.today.occupancyPct}
                suffix="%"
                hint={`${data.today.confirmed} / ${data.today.totalTables} mesas`}
                tone={data.today.occupancyPct >= 70 ? 'sage' : 'neutral'}
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              />
              <PremiumStatCard
                label="No-shows hoy"
                value={data.today.noShows}
                tone={data.today.noShows > 0 ? 'coral' : 'neutral'}
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              />
            </div>
          </section>

          {/* Gráfico semana */}
          <section>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
              Reservas por día
            </p>
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
              <div className="flex items-end gap-1.5 h-28">
                {data.week.days.map((d, i) => {
                  const targetPct = maxConfirmed > 0
                    ? Math.max((d.confirmed / maxConfirmed) * 100, d.confirmed > 0 ? 8 : 0)
                    : 0
                  // chartReady gatillea el grow-from-zero; cada barra con delay
                  // incremental para la cascada.
                  const heightPct = chartReady ? targetPct : 0
                  const isToday = d.date === data.today.date
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-end justify-end" style={{ height: '92px' }}>
                        <div
                          className="w-full rounded-md transition-[height] duration-[800ms]"
                          style={{
                            height: `${heightPct}%`,
                            transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
                            transitionDelay: `${i * 45}ms`,
                            background: isToday
                              ? 'linear-gradient(180deg, #C36878 0%, #A13143 100%)'
                              : d.confirmed > 0
                                ? 'linear-gradient(180deg, rgba(79,138,95,0.78) 0%, rgba(79,138,95,0.32) 100%)'
                                : 'rgba(243,240,234,0.06)',
                          }}
                        />
                      </div>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wide ${
                        isToday ? 'text-wine-soft' : 'text-ink-text-3'
                      }`}>
                        {dayLabel(d.date)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-ink-line">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-olive" />
                  <span className="text-[11.5px] text-ink-text-3">Confirmadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-wine" />
                  <span className="text-[11.5px] text-ink-text-3">Hoy</span>
                </div>
              </div>
            </div>
          </section>

          {/* Revenue */}
          <section>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
              Revenue <span className="text-white/25">(7 días)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PremiumStatCard
                label="Señas cobradas"
                value={`$${(data.week.depositRevenue / 1000).toFixed(0)}K`}
                animate={false}
                hint={`${data.week.totalConfirmed} reservas`}
                tone="sage"
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              />
              <PremiumStatCard
                label="Pre-pedidos"
                value={`$${(data.week.preOrderRevenue / 1000).toFixed(0)}K`}
                animate={false}
                hint={data.week.avgPreOrder > 0
                  ? `Ticket prom. $${data.week.avgPreOrder.toLocaleString('es-AR')}`
                  : 'Sin pre-pedidos aún'}
                tone="mauve"
                icon={(
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              />
            </div>
          </section>

          {/* No-shows rate */}
          <section>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
              Tasa de no-shows
            </p>
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/55 text-[13px]">Total no-shows</span>
                <span className="font-display font-bold text-white text-[17px]">
                  {data.week.totalNoShows}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55 text-[13px]">Tasa</span>
                <span className={`font-display text-[22px] font-bold tracking-tight ${
                  data.week.noShowRate >= 20 ? 'text-[#FF8A91]'
                    : data.week.noShowRate >= 10 ? 'text-[#F3C773]'
                    : 'text-[#7BD3B2]'
                }`}>
                  {data.week.noShowRate}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(data.week.noShowRate, 100)}%`,
                    background: data.week.noShowRate >= 20
                      ? 'linear-gradient(90deg, #C36878, #A13143)'
                      : data.week.noShowRate >= 10
                        ? 'linear-gradient(90deg, #C99130, #A07420)'
                        : 'linear-gradient(90deg, #4F8A5F, #2E6B52)',
                  }}
                />
              </div>
              <p className="text-[11.5px] text-white/35 leading-snug pt-1">
                {data.week.noShowRate < 10
                  ? 'Excelente — por debajo del promedio de industria (15%).'
                  : data.week.noShowRate < 20
                    ? 'Dentro del promedio. Los recordatorios por WhatsApp ayudan a bajarlo.'
                    : 'Alto — revisá si la seña está disuadiendo o el monto es bajo.'}
              </p>
            </div>
          </section>

          {/* Horarios populares */}
          {data.popularSlots.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-3">
                Horarios más pedidos hoy
              </p>
              <div className="space-y-2">
                {data.popularSlots.map(({ slot, count }, i) => (
                  <div key={slot}
                    className="bg-white/[0.04] border border-white/8 rounded-2xl px-4 py-3
                               flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[18px] font-bold tracking-tight"
                        style={{ color: i === 0 ? '#FF8A91' : 'rgba(255,255,255,0.5)' }}>
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
            </section>
          )}
        </main>
      )}

      {disputeTarget && (
        <DisputeRatingSheet
          ratingId={disputeTarget.id}
          stars={disputeTarget.stars}
          comment={disputeTarget.comment}
          ageHours={(Date.now() - new Date(disputeTarget.created_at).getTime()) / 3_600_000}
          onClose={() => setDisputeTarget(null)}
          onDisputed={() => {
            setDisputeTarget(null)
            reloadReviews()
          }}
        />
      )}
    </div>
  )
}
