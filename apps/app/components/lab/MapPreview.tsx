'use client'

import Link from 'next/link'
import type { Venue } from '@/lib/shared'

/**
 * Mapa placeholder — usa una grilla con pins posicionados por hash del id.
 * Cuando se integre un mapa real (Mapbox, MapLibre + OSM, Google), este
 * componente es el reemplazo único.
 */
interface Props {
  venues: Venue[]
  activeVenueId?: string | null
  onActivate?: (id: string) => void
}

function hashToPos(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const x = 10 + (Math.abs(h) % 80)
  const y = 12 + (Math.abs(h * 17) % 70)
  return { x, y }
}

export function MapPreview({ venues, activeVenueId, onActivate }: Props) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-[var(--br)]
                    bg-[#E9EDF3] aspect-[4/3] sm:aspect-[16/9]">
      {/* Grilla tipo mapa */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#D4DBE5" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {/* Avenidas horizontales */}
        <path d="M0 30 L100 30" stroke="#C7D0DE" strokeWidth="1.2" />
        <path d="M0 60 L100 60" stroke="#C7D0DE" strokeWidth="1.2" />
        <path d="M0 85 L100 85" stroke="#C7D0DE" strokeWidth="1.2" />
        {/* Avenidas verticales */}
        <path d="M20 0 L20 100" stroke="#C7D0DE" strokeWidth="1.2" />
        <path d="M55 0 L55 100" stroke="#C7D0DE" strokeWidth="1.2" />
        <path d="M80 0 L80 100" stroke="#C7D0DE" strokeWidth="1.2" />
      </svg>

      {/* Pins */}
      {venues.map((v) => {
        const { x, y } = hashToPos(v.id)
        const active = activeVenueId === v.id
        return (
          <button
            key={v.id}
            onClick={() => onActivate?.(v.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center
                       transition-transform duration-[180ms]"
            aria-label={v.name}
          >
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-md
                             text-[11px] font-bold whitespace-nowrap transition-all
                             ${active
                               ? 'bg-tx text-white scale-110'
                               : 'bg-white text-tx border border-[var(--br)]'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-c1" />
              {v.name.length > 14 ? v.name.slice(0, 13) + '…' : v.name}
            </div>
            <svg width="10" height="6" viewBox="0 0 10 6" className={active ? 'text-tx' : 'text-white'}>
              <path d="M0 0 L5 6 L10 0 Z" fill="currentColor" />
            </svg>
          </button>
        )
      })}

      {/* Active venue CTA overlay */}
      {activeVenueId && (() => {
        const v = venues.find((x) => x.id === activeVenueId)
        if (!v) return null
        return (
          <Link
            href={`/${v.id}`}
            className="absolute bottom-3 left-3 right-3 bg-white rounded-xl p-3
                       shadow-lg border border-[var(--br)] flex items-center gap-3
                       animate-fade-up"
          >
            <div className="w-12 h-12 rounded-md bg-sf2 overflow-hidden flex-shrink-0">
              {v.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-tx truncate">{v.name}</p>
              <p className="text-[11px] text-tx3 truncate">{v.address}</p>
            </div>
            <span className="text-[12px] font-semibold text-c1">Ver →</span>
          </Link>
        )
      })()}

      {/* Disclaimer */}
      <div className="absolute top-2 right-2">
        <span className="badge bg-white/90 text-tx2 text-[10px] backdrop-blur-sm">
          Vista previa
        </span>
      </div>
    </div>
  )
}
