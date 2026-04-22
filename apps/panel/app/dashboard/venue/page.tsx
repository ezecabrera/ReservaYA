import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VenueClient } from './VenueClient'

export default async function VenuePage() {
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    headers().get('x-dev-preview') === '1'

  if (isDevPreview) {
    return <VenueClient />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <VenueClient />
}
