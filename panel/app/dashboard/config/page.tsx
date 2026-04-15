import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfigClient } from '@/components/config/ConfigClient'

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('staff_users')
    .select('id, name, email, role, venue_id')
    .eq('id', user.id)
    .single()

  if (!me) redirect('/login')

  const { data: venue } = await supabase
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
