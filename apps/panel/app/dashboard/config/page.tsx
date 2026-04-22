import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { ConfigClient } from '@/components/config/ConfigClient'

export default async function ConfigPage() {
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    headers().get('x-dev-preview') === '1'

  if (isDevPreview) {
    return (
      <ConfigClient
        me={{ id: 'preview-me', name: 'Martín García', email: 'martin@lacantina.com', role: 'owner' }}
        venue={{ name: 'La Cantina de Martín', address: 'Av. Corrientes 1234, CABA', phone: '+54 11 4567-8901' }}
      />
    )
  }

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
    .select('name, address, phone')
    .eq('id', me.venue_id)
    .single()

  return (
    <ConfigClient
      me={{ id: me.id, name: me.name, email: me.email, role: me.role }}
      venue={venue ?? { name: '', address: '', phone: '' }}
    />
  )
}
