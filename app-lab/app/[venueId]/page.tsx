import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueDetailClient } from '@/components/lab/VenueDetailClient'
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

  const v = venue as Venue

  return (
    <div className="min-h-screen bg-bg pb-28">
      <VenueDetailClient venue={v} />
      <BottomNav />
    </div>
  )
}
