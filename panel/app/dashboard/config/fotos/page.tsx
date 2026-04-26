import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { PhotosManager } from '@/components/config/PhotosManager'
import type { VenueImageBundle } from '@/lib/shared/types/venue-image'

export const metadata: Metadata = { title: 'Fotos del local · UnToque' }
export const dynamic = 'force-dynamic'

const EMPTY_BUNDLE: VenueImageBundle = { logo: null, cover: null, gallery: [] }

async function fetchBundle(): Promise<VenueImageBundle> {
  try {
    const h = await headers()
    const c = await cookies()
    const host = h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'
    if (!host) return EMPTY_BUNDLE
    const cookieHeader = c.getAll().map(({ name, value }) => `${name}=${value}`).join('; ')
    const res = await fetch(`${proto}://${host}/api/venue/images`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return EMPTY_BUNDLE
    const data = (await res.json()) as VenueImageBundle
    return {
      logo: data.logo ?? null,
      cover: data.cover ?? null,
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
    }
  } catch {
    return EMPTY_BUNDLE
  }
}

export default async function FotosConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()
  if (!staffUser) redirect('/login')

  const initialBundle = await fetchBundle()

  return <PhotosManager initialBundle={initialBundle} />
}
