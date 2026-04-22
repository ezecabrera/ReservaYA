import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { MenuManager } from '@/components/menu/MenuManager'
import type { MenuCategory, MenuItem } from '@/lib/shared'

const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'c1', venue_id: 'v1', name: 'Entradas',    sort_order: 1, created_at: '' } as MenuCategory,
  { id: 'c2', venue_id: 'v1', name: 'Principales', sort_order: 2, created_at: '' } as MenuCategory,
  { id: 'c3', venue_id: 'v1', name: 'Postres',     sort_order: 3, created_at: '' } as MenuCategory,
]

const MOCK_ITEMS: MenuItem[] = [
  { id: 'i1', venue_id: 'v1', category_id: 'c1', name: 'Provoleta con tomate',  description: 'Con orégano y aceite de oliva', price: 6500,  availability_status: 'available',   created_at: '' } as MenuItem,
  { id: 'i2', venue_id: 'v1', category_id: 'c1', name: 'Empanadas de carne',    description: '3 unidades, fritas o al horno', price: 4500,  availability_status: 'limited',     created_at: '' } as MenuItem,
  { id: 'i3', venue_id: 'v1', category_id: 'c2', name: 'Bife de chorizo',       description: '400g, papas rústicas y chimichurri', price: 18500, availability_status: 'available',   created_at: '' } as MenuItem,
  { id: 'i4', venue_id: 'v1', category_id: 'c2', name: 'Milanesa napolitana',   description: 'Con jamón, queso y salsa de tomate',  price: 14000, availability_status: 'available',   created_at: '' } as MenuItem,
  { id: 'i5', venue_id: 'v1', category_id: 'c2', name: 'Ravioles de ricota',    description: 'Con salsa filetto o crema',           price: 11500, availability_status: 'unavailable', created_at: '' } as MenuItem,
  { id: 'i6', venue_id: 'v1', category_id: 'c3', name: 'Flan casero',           description: 'Con dulce de leche y crema',          price: 4800,  availability_status: 'available',   created_at: '' } as MenuItem,
]

export default async function MenuPage() {
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    headers().get('x-dev-preview') === '1'

  if (isDevPreview) {
    return (
      <MenuManager
        venueId="preview"
        initialCategories={MOCK_CATEGORIES}
        initialItems={MOCK_ITEMS}
      />
    )
  }

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

  const [categoriesResult, itemsResult] = await Promise.all([
    admin
      .from('menu_categories')
      .select('*')
      .eq('venue_id', staffUser.venue_id)
      .order('sort_order'),
    admin
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
