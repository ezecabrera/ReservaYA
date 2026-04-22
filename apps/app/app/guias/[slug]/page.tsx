import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueCardLab } from '@/components/lab/VenueCardLab'
import { findGuide, rankVenuesForOccasion, type OccasionSlug, type VenueExtra } from '@/lib/occasions'
import { getGuideImage } from '@/lib/venue-images'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { slug: string }
}

export const revalidate = 300 // 5 min — scoring no es pesado pero evitamos re-render innecesario

export default async function GuideDetailPage({ params }: Props) {
  const guide = findGuide(params.slug)
  if (!guide) notFound()

  const supabase = await createClient()

  // Fetch venues activos + zones (para las reglas "al aire libre" y "privado")
  const [{ data: venuesData }, { data: zonesData }] = await Promise.all([
    supabase.from('venues').select('*').eq('is_active', true),
    supabase.from('zones').select('venue_id, name'),
  ])

  const venues = (venuesData ?? []) as Venue[]
  const zonesByVenue = new Map<string, string[]>()
  ;(zonesData ?? []).forEach((z) => {
    const list = zonesByVenue.get(z.venue_id) ?? []
    list.push((z.name ?? '').toLowerCase())
    zonesByVenue.set(z.venue_id, list)
  })

  // Construir el "extra" context por venue que el scoring consume
  const extras = new Map<string, VenueExtra>()
  for (const v of venues) {
    const zones = zonesByVenue.get(v.id) ?? []
    extras.set(v.id, {
      hasOutdoorZone: zones.some((z) => ['terraza', 'patio', 'jardín', 'jardin', 'vereda'].some((k) => z.includes(k))),
      hasPrivateZone: zones.some((z) => ['privado', 'reservado', 'vip'].some((k) => z.includes(k))),
      hasLargeTables: false, // sin data detallada por ahora; falta join con tables
    })
  }

  const ranked = rankVenuesForOccasion(venues, guide.slug as OccasionSlug, extras)

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Hero editorial */}
      <div className="relative h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getGuideImage(guide.imageSeed, 1200, 700)}
          alt={guide.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <Link
          href="/guias"
          aria-label="Volver a todas las guías"
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full
                     bg-black/40 backdrop-blur-sm flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="absolute bottom-4 left-[18px] right-[18px] text-white">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">
            {guide.eyebrow}
          </p>
          <h1 className="font-display text-[28px] leading-tight tracking-[-0.3px]
                         drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            {guide.title}
          </h1>
          <p className="text-[13.5px] opacity-90 mt-1 leading-snug max-w-[320px]">
            {guide.lede}
          </p>
        </div>
      </div>

      {/* Listado */}
      <div className="screen-x pt-5">
        {ranked.length === 0 ? (
          <div className="bg-sf rounded-xl p-8 text-center border border-[var(--br)]">
            <p className="text-[40px] mb-2">🔍</p>
            <p className="font-display text-[18px] text-tx">
              Estamos sumando opciones
            </p>
            <p className="text-tx2 text-[13px] mt-1 leading-relaxed max-w-[280px] mx-auto">
              Pronto vas a ver restaurantes curados para esta ocasión.
            </p>
            <Link href="/" className="mt-4 inline-block text-c1 text-[13px] font-bold underline">
              Explorar todos los locales →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-tx2 mb-3">
              <span className="font-bold text-tx">{ranked.length}</span>{' '}
              restaurante{ranked.length !== 1 ? 's' : ''} para esta ocasión
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {ranked.map(({ venue }) => (
                <VenueCardLab key={venue.id} venue={venue} variant="standard" />
              ))}
            </div>
            <p className="text-[11.5px] text-tx3 text-center mt-6 leading-relaxed">
              Ranking basado en rating, tipo de cocina y features del local.
              <br />
              ¿Notás un venue que no encaja? <Link href="/perfil" className="text-c1 font-semibold">Avisanos</Link>.
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
