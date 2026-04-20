import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { VenueDetailClient, type MenuPreview } from '@/components/lab/VenueDetailClient'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { venueId: string }
  searchParams: { date?: string; time?: string; party?: string; tab?: string }
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

  // Reviews reales (tabla 007) — degrada a [] si la migration no está aplicada
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, score, comment, created_at, user:users (name)')
    .eq('venue_id', params.venueId)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = !reviewsError && reviewsData
    ? reviewsData.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        created_at: r.created_at,
        author: (r.user as unknown as { name?: string } | null)?.name ?? 'Anónimo',
      }))
    : []

  return (
    <div className="min-h-screen bg-bg">
      <VenueDetailClient
        venue={venue as Venue}
        menu={menu}
        prefill={prefill}
        initialTab={initialTab}
        reviews={reviews}
      />
    </div>
  )
}
