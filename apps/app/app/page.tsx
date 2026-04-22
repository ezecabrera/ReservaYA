import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { HomeClient } from '@/components/lab/HomeClient'
import { DesktopHome } from '@/components/lab/DesktopHome'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: venues }, { data: { user } }] = await Promise.all([
    supabase.from('venues').select('*').eq('is_active', true).order('name'),
    supabase.auth.getUser(),
  ])

  const all = (venues ?? []) as Venue[]

  // Cómo saludar al usuario: preferir sobrenombre si lo configuró, si no
  // el primer nombre (user_metadata.name).
  const meta = (user?.user_metadata ?? {}) as { name?: string; nickname?: string }
  const fullName = meta.name ?? ''
  const firstName = fullName.trim().split(/\s+/)[0] || null
  const greetingName = meta.nickname?.trim() || firstName

  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-0">
      <div className="lg:hidden">
        <HomeClient venues={all} userFirstName={greetingName} />
      </div>
      <div className="hidden lg:block">
        <DesktopHome venues={all} userFirstName={greetingName} />
      </div>
      <BottomNav />
    </div>
  )
}
