import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/menu/MenuManager'
import type { MenuCategory, MenuItem } from '@reservaya/shared'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) redirect('/login')

  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .eq('venue_id', staffUser.venue_id)
      .order('sort_order'),
    supabase
      .from('menu_items')
      .select('*')
      .eq('venue_id', staffUser.venue_id)
      .order('name'),
  ])

  return (
    <MenuManager
      venueId={staffUser.venue_id}
      initialCategories={(categoriesResult.data ?? []) as MenuCategory[]}
      initialItems={(itemsResult.data ?? []) as MenuItem[]}
    />
  )
}
