import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { VenueDetailClient, type MenuPreview } from '@/components/lab/VenueDetailClient'
import type { Venue } from '@/lib/shared'
import type { VenueImage, VenueImageBundle } from '@/lib/shared/types/venue-image'

interface Props {
  params: { venueId: string }
  searchParams: { date?: string; time?: string; party?: string; tab?: string }
}

/**
 * generateMetadata — SEO + OpenGraph por venue.
 * Carga mínima (sólo name/description/image) para no bloquear CLS.
 * Schema.org Restaurant se emite inline en el client component.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('name, description, address, image_url')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (!venue) {
    return { title: 'Restaurante · UnToque' }
  }

  const title = `${venue.name} · Reservá en UnToque`
  const description = venue.description
    ?? `${venue.name} — ${venue.address}. Reservá tu mesa sin comisión.`
  const image = venue.image_url ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image, alt: venue.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: `/${params.venueId}`,
    },
  }
}

const VALID_TABS = ['reservar', 'menu', 'resenas', 'horarios', 'nosotros'] as const
type ValidTab = typeof VALID_TABS[number]

export default async function VenueDetailPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (error || !venue) notFound()

  // Menú preview — admin client para evitar RLS (mismo approach que en wizard)
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
  const [{ data: categories }, { data: items }] = await Promise.all([
    admin
      .from('menu_categories')
      .select('id, name, sort_order')
      .eq('venue_id', params.venueId)
      .order('sort_order'),
    admin
      .from('menu_items')
      .select('id, category_id, name, price, description')
      .eq('venue_id', params.venueId)
      .eq('availability_status', 'available'),
  ])

  const menu: MenuPreview = (categories ?? []).map((c) => ({
    name: c.name,
    items: (items ?? [])
      .filter((it) => it.category_id === c.id)
      .slice(0, 3)
      .map((it) => ({
        name: it.name,
        price: Number(it.price),
        description: it.description,
      })),
  })).filter((c) => c.items.length > 0)

  // ─── Imágenes reales del venue (tabla `venue_images`) ───
  // Bucket: `venue-photos`. Si la migration no está aplicada en este entorno,
  // atrapamos el error y devolvemos un bundle vacío para no romper la página.
  let imageBundle: VenueImageBundle = { logo: null, cover: null, gallery: [] }
  try {
    const { data: rawImages, error: imgErr } = await supabase
      .from('venue_images')
      .select('*')
      .eq('venue_id', params.venueId)
      .order('kind')
      .order('sort_order')

    if (!imgErr && rawImages) {
      const all = rawImages as VenueImage[]
      imageBundle = {
        logo: all.find((i) => i.kind === 'logo') ?? null,
        cover: all.find((i) => i.kind === 'cover') ?? null,
        gallery: all
          .filter((i) => i.kind === 'gallery')
          .sort((a, b) => a.sort_order - b.sort_order),
      }
    }
  } catch {
    // Tabla no existe aún (preview deploy sin migration) — bundle vacío.
  }

  // Prefill wizard desde SearchPill del home (si vino con params)
  const party = searchParams.party ? parseInt(searchParams.party, 10) : undefined
  const prefill = {
    date: searchParams.date,
    time: searchParams.time,
    partySize: party && party >= 1 && party <= 20 ? party : undefined,
  }

  // Tab inicial vía query param (?tab=resenas lleva a esa tab directo —
  // útil desde la LiveReviewsStrip del home)
  const initialTab: ValidTab = VALID_TABS.includes(searchParams.tab as ValidTab)
    ? (searchParams.tab as ValidTab)
    : 'reservar'

  // Reviews reales (tabla 007) — degrada a [] si la migration no está aplicada.
  // Incluimos `response:review_responses(...)` que falla silenciosamente si la
  // migración 015 no está aplicada — fallback a SELECT sin response en ese caso.
  const reviewsRes = await supabase
    .from('reviews')
    .select('id, score, comment, created_at, user:users (name), response:review_responses (body, created_at)')
    .eq('venue_id', params.venueId)
    .order('created_at', { ascending: false })
    .limit(20)

  let reviewsData = reviewsRes.data
  let reviewsError = reviewsRes.error
  if (reviewsError && /review_responses/.test(reviewsError.message)) {
    // Fallback sin response join (migración 015 pendiente)
    const fallback = await supabase
      .from('reviews')
      .select('id, score, comment, created_at, user:users (name)')
      .eq('venue_id', params.venueId)
      .order('created_at', { ascending: false })
      .limit(20)
    reviewsData = fallback.data as unknown as typeof reviewsData
    reviewsError = fallback.error
  }

  const reviews = !reviewsError && reviewsData
    ? reviewsData.map((r) => {
        const responseRaw = (r as unknown as { response?: Array<{ body: string; created_at: string }> | { body: string; created_at: string } | null }).response
        const response = Array.isArray(responseRaw) ? responseRaw[0] ?? null : (responseRaw ?? null)
        return {
          id: r.id,
          score: r.score,
          comment: r.comment,
          created_at: r.created_at,
          author: (r.user as unknown as { name?: string } | null)?.name ?? 'Anónimo',
          response,
        }
      })
    : []

  // Schema.org Restaurant JSON-LD — Google Rich Results + Reserve Action
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: venue.name,
    description: venue.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
    },
    image: venue.image_url ?? undefined,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${params.venueId}`,
    aggregateRating: reviews.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: (reviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / reviews.length).toFixed(1),
      reviewCount: reviews.length,
    } : undefined,
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${params.venueId}/reservar`,
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
      },
      result: {
        '@type': 'Reservation',
        name: `Reserva en ${venue.name}`,
      },
    },
  }

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VenueDetailClient
        venue={venue as Venue}
        menu={menu}
        prefill={prefill}
        initialTab={initialTab}
        reviews={reviews}
        realImages={{ cover: imageBundle.cover, gallery: imageBundle.gallery }}
      />
    </div>
  )
}
