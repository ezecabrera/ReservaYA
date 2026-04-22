import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PanelNav } from '@/components/nav/PanelNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    headers().get('x-dev-preview') === '1'
  if (!isDevPreview) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <div className="min-h-screen pb-20">
      {children}
      <PanelNav />
    </div>
  )
}
