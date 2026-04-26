// Panel home: si hay sesión, va al dashboard. Si no, mostramos la landing
// pública (/landing) para que visitantes anónimos vean el producto en vez
// de un login frío. SEO + conversion.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PanelRootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/landing')
  }

  redirect('/dashboard')
}
