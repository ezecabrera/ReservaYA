import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { DesktopSidebar } from './DesktopSidebar'

/**
 * DesktopShell — wrapper para las páginas del /dashboard/* que añade la
 * sidebar de desktop a la izquierda cuando el viewport es lg+.
 *
 * Se usa para envolver páginas como: reservas, crm, analytics, config.
 * El /dashboard (home) tiene su propio layout con split view.
 *
 * Carga lado-server: staff del venue para el shift indicator.
 */
export async function DesktopShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <>{children}</>

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, venues(name)')
    .eq('id', user.id)
    .single() as { data: { venue_id: string; venues: { name: string } | null } | null }

  if (!staffUser) return <>{children}</>

  const { data: staff } = await admin
    .from('staff_users')
    .select('id, name')
    .eq('venue_id', staffUser.venue_id)
    .limit(5)

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar
        staffOnShift={staff ?? []}
        venueName={staffUser.venues?.name}
      />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
