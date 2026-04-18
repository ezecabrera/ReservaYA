'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { GuestProfile } from '@/lib/shared'
import { GuestTagChip } from '@/components/crm/GuestTagChip'
import { PageHero } from '@/components/ui/PageHero'
import { PremiumStatCard } from '@/components/ui/PremiumStatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconPlateCutlery, IconOpenBook } from '@/components/ui/Icons'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export default function CrmPage() {
  const [guests, setGuests] = useState<GuestProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const url = q.trim() ? `/api/crm/guests?search=${encodeURIComponent(q.trim())}` : '/api/crm/guests'
      const res = await fetch(url)
      const data = await res.json()
      setGuests(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load('') }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search, load])

  const totalVisits = guests.reduce((acc, g) => acc + g.stats.visits_completed, 0)
  const habitues = guests.filter((g) => g.tags.includes('habitue') || g.tags.includes('vip')).length
  const noShows = guests.reduce((acc, g) => acc + g.stats.no_shows, 0)

  return (
    <div className="min-h-screen pb-28 bg-ink">

      <PageHero
        kicker="CRM"
        title="Comensales"
        subtitle="Perfiles unificados · las reservas alimentan las fichas"
        accent="sage"
        actions={
          <a
            href="/api/crm/export"
            className="h-10 px-3.5 rounded-xl bg-white/10 border border-white/15 text-white
                       text-[12.5px] font-bold flex items-center gap-1.5
                       active:scale-[0.97] transition-transform"
            aria-label="Descargar CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CSV
          </a>
        }
      />

      <main className="px-5 pt-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <PremiumStatCard
            label="Perfiles"
            value={guests.length}
            tone="sage"
            icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          />
          <PremiumStatCard
            label="Habitués"
            value={habitues}
            tone="amber"
            hint="3+ visitas"
            icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            )}
          />
          <PremiumStatCard
            label="No-shows"
            value={noShows}
            tone={noShows > 0 ? 'coral' : 'neutral'}
            icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-11 pr-4 py-3
                       text-[14px] text-white placeholder:text-white/35 outline-none
                       focus:border-white/25 focus:bg-white/[0.08] transition-all"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : guests.length === 0 ? (
          <EmptyState
            accent="sage"
            title={search ? 'Sin resultados' : 'Tu cuaderno está en blanco'}
            description={search
              ? 'Probá otro nombre o número.'
              : 'Los perfiles se generan solos a medida que cargás reservas. El CSV también.'}
            icon={search ? <IconOpenBook size={28} /> : <IconPlateCutlery size={28} />}
          />
        ) : (
          <div className="space-y-2">
            {guests.map((g, idx) => (
              <Link
                key={g.key}
                href={`/dashboard/crm/${encodeURIComponent(g.key)}`}
                className="block bg-white/[0.04] border border-white/8 rounded-2xl px-4 py-3.5
                           active:bg-white/[0.08] hover:border-white/15
                           transition-all duration-200"
                style={{
                  opacity: 0,
                  animation: `fadeInUp 420ms ${Math.min(idx * 40, 600)}ms cubic-bezier(.2,1,.3,1) forwards`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white font-semibold text-[14.5px] truncate">
                        {g.name}
                      </p>
                      {g.tags.slice(0, 2).map((tag) => (
                        <GuestTagChip key={tag} tag={tag} />
                      ))}
                    </div>
                    {g.phone && (
                      <p className="text-white/45 text-[12px] mt-0.5 font-mono">{g.phone}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-[11.5px] text-white/55">
                      <span>
                        <span className="font-bold text-white/85">{g.stats.visits_completed}</span> visitas
                      </span>
                      {g.stats.no_shows > 0 && (
                        <span>
                          <span className="font-bold text-[#FF8A91]">{g.stats.no_shows}</span> no-shows
                        </span>
                      )}
                      <span>Última <span className="text-white/75">{formatDate(g.stats.last_visit_date)}</span></span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-[22px] font-bold text-white leading-none tracking-tight">
                      {g.stats.avg_party_size || '—'}
                    </p>
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/35 mt-1">
                      Prom. pax
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Animación local (no sacamos a globals.css para no tocar builds) */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
