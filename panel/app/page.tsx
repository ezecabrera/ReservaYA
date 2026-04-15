// Panel home — redirige al dashboard si hay sesión, a /login si no
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PanelRootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  redirect('/dashboard')
}
