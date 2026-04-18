import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { ConfigClient } from '@/components/config/ConfigClient'

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: me } = await admin
    .from('staff_users')
    .select('id, name, email, role, venue_id')
    .eq('id', user.id)
    .single()

  if (!me) redirect('/login')

  const { data: venue } = await admin
    .from('venues')
    .select('id, name, address, phone')
    .eq('id', me.venue_id)
    .single()

  // URL pública del app cliente — se usa para el snippet del widget embebible
  // y para los CTAs de WhatsApp.
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reservaya.app'

  return (
    <ConfigClient
      me={{ id: me.id, name: me.name, email: me.email, role: me.role }}
      venue={venue ?? { id: me.venue_id, name: '', address: '', phone: '' }}
      appBaseUrl={appBaseUrl}
    />
  )
}
