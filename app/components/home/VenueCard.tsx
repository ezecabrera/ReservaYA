import Link from 'next/link'
import type { Venue } from '@/lib/shared'
import { getVenueMode } from '@/lib/shared'

interface VenueCardProps {
  venue: Venue
  variant?: 'hero' | 'compact'
}

export function VenueCard({ venue, variant = 'compact' }: VenueCardProps) {
  const { mode } = getVenueMode(venue.config_json)
  const isActive = mode === 'active_service'

  if (variant === 'hero') {
    return (
      <Link
        href={`/${venue.id}`}
        className="block card overflow-hidden group
                   hover:shadow-[0_14px_34px_-10px_rgba(0,0,0,0.18)]
                   transition-shadow duration-200"
      >
        {/* Hero image — ink con radial wine cuando no hay imagen */}
        <div
          className="relative h-48 bg-ink overflow-hidden"
          style={{
            backgroundImage: venue.image_url
              ? undefined
              : 'radial-gradient(80% 100% at 100% 0%, rgba(161,49,67,0.28) 0%, transparent 60%)',
          }}
        >
          {venue.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.image_url} alt={venue.name}
              className="w-full h-full object-cover opacity-85
                         group-hover:scale-[1.03] transition-transform duration-[600ms]" />
          ) : (
            <div className="absolute inset-0 flex items-end p-4">
              <span className="text-ink-text/20 font-display text-[60px] font-black leading-none select-none">
                {venue.name[0]}
              </span>
            </div>
          )}
          {isActive && (
            <span className="absolute top-3 right-3 badge-amber text-[10px]">
              Turno activo
            </span>
          )}
        </div>
        <div className="p-4">
          <h2 className="font-display text-[20px] font-bold text-tx tracking-tight">
            {venue.name}
          </h2>
          <p className="text-tx3 text-[13px] mt-0.5">{venue.address}</p>
          {venue.description && (
            <p className="text-tx2 text-[13px] mt-2 line-clamp-2">{venue.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className={isActive ? 'badge-amber' : 'badge-green'}>
              {isActive ? 'Turno en curso' : 'Disponible'}
            </span>
            <span className="text-tx3 text-[12px]">Ver mesas →</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/${venue.id}`}
      className="flex items-center gap-3 card p-3
                 hover:border-wine/20 active:scale-[0.98]
                 transition-all duration-[180ms]">
      {/* Avatar — ink con radial wine cuando no hay imagen */}
      <div
        className="w-14 h-14 rounded-lg bg-ink
                   flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          backgroundImage: venue.image_url
            ? undefined
            : 'radial-gradient(120% 100% at 100% 0%, rgba(161,49,67,0.35) 0%, transparent 65%)',
        }}
      >
        {venue.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.image_url} alt={venue.name}
            className="w-full h-full object-cover" />
        ) : (
          <span className="text-ink-text/40 font-display text-[24px] font-black">
            {venue.name[0]}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-tx truncate">{venue.name}</p>
        <p className="text-tx3 text-[12px] truncate mt-0.5">{venue.address}</p>
        <span className={`mt-1 inline-block ${isActive ? 'badge-amber' : 'badge-green'}`}>
          {isActive ? 'Turno activo' : 'Disponible'}
        </span>
      </div>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
        className="text-tx3 flex-shrink-0">
        <path d="M9 18l6-6-6-6" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
