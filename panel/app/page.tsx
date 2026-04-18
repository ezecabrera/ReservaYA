// Panel home — redirige al dashboard si hay sesión de staff, o a la
// landing pública si no. La landing tiene los CTAs a /login y /onboarding.
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
