import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueDetailClient, type MenuPreview } from '@/components/lab/VenueDetailClient'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { venueId: string }
}

export default async function VenueDetailPage({ params }: Props) {
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

  return (
    <div className="min-h-screen bg-bg pb-28">
      <VenueDetailClient venue={venue as Venue} menu={menu} />
      <BottomNav />
    </div>
  )
}
