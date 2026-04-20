import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { HomeClient } from '@/components/lab/HomeClient'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: venues }, { data: { user } }] = await Promise.all([
    supabase.from('venues').select('*').eq('is_active', true).order('name'),
    supabase.auth.getUser(),
  ])

  const all = (venues ?? []) as Venue[]

  // Primer nombre del user (metadata o email fallback)
  const fullName = (user?.user_metadata?.name ?? '') as string
  const firstName = fullName.trim().split(/\s+/)[0] || null

  return (
    <div className="min-h-screen bg-bg pb-28">
      <HomeClient venues={all} userFirstName={firstName} />
      <BottomNav />
    </div>
  )
}
