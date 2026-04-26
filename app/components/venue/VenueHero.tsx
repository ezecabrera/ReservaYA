import Image from 'next/image'
import type { VenueImage } from '@/lib/shared/types/venue-image'
import { thumbUrl } from '@/lib/venue-image-url'

interface VenueHeroProps {
  venue: { name: string; description?: string | null; address: string }
  cover: VenueImage | null
  logo: VenueImage | null
}

// 5 gradients pastel (paleta vibrante UnToque). El venue.name → hash → idx
// para que el mismo venue siempre vea el mismo gradient como fallback.
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #FFE5E5 0%, #FFCBCB 50%, #FF8B8B 100%)',          // coral
  'linear-gradient(135deg, #E0F7F1 0%, #B6EBD9 50%, #66D9B2 100%)',          // mint
  'linear-gradient(135deg, #FFF4D6 0%, #FFE7A0 50%, #F5C44A 100%)',          // gold
  'linear-gradient(135deg, #DEE8FF 0%, #B8CBFF 50%, #6F8DFF 100%)',          // electric
  'linear-gradient(135deg, #ECDDFF 0%, #D2B8FF 50%, #9F6FE8 100%)',          // purple
] as const

function hashName(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function VenueHero({ venue, cover, logo }: VenueHeroProps) {
  const fallbackGradient =
    FALLBACK_GRADIENTS[hashName(venue.name) % FALLBACK_GRADIENTS.length]

  const coverUrl = cover ? thumbUrl(cover.url, { width: 1200, quality: 80 }) : null
  const logoUrl = logo ? thumbUrl(logo.url, { width: 96, quality: 85 }) : null

  return (
    <header
      className="relative w-full overflow-hidden bg-bg"
      style={{ aspectRatio: '16 / 9' }}
      data-venue-hero="true"
    >
      {/* aspect-ratio responsive — desktop usa 21:9 vía className arbitrary */}
      <div className="hidden md:block absolute inset-0" style={{ aspectRatio: '21 / 9' }} />

      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={cover?.alt_text || `Foto de ${venue.name}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: fallbackGradient }}
        />
      )}

      {/* Overlay gradient bottom-to-top para legibilidad del texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 75%)',
        }}
      />

      {/* Logo overlay top-left */}
      {logoUrl && (
        <div
          className="absolute top-3 left-3 md:top-5 md:left-5 z-10
                     w-[28px] h-[28px] md:w-[32px] md:h-[32px]
                     rounded-full overflow-hidden border-2 border-white shadow-md bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={logo?.alt_text || `Logo ${venue.name}`}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title block */}
      <div className="absolute z-10 left-4 right-4 bottom-4 md:left-8 md:right-8 md:bottom-8 text-white">
        <h1
          className="font-display font-bold leading-[1.05] tracking-[-0.5px]"
          style={{ fontSize: 'clamp(32px, 6vw, 56px)' }}
        >
          {venue.name}
        </h1>
        <p
          className="mt-1 md:mt-2 uppercase tracking-[0.08em] text-[11px] md:text-[13px]"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {venue.address}
        </p>
      </div>
    </header>
  )
}

export default VenueHero
