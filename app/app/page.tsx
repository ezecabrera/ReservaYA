import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { HomeClient } from '@/components/lab/HomeClient'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const all = (venues ?? []) as Venue[]

  return (
    <div className="min-h-screen bg-bg pb-28">
      <HomeClient venues={all} />
      <BottomNav />
    </div>
  )
}
