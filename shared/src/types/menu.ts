export type MenuItemAvailability = 'available' | 'unavailable' | 'limited'

export interface MenuCategory {
  id: string
  venue_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface MenuItem {
  id: string
  venue_id: string
  category_id: string
  name: string
  price: number
  description: string | null
  availability_status: MenuItemAvailability
  /** Solo relevante cuando availability_status = 'limited' */
  limited_count: number | null
  image_url: string | null
  /** Orden manual dentro de la categoría — drag-reorder en el panel. */
  sort_order: number
  created_at: string
}

export interface MenuItemWithCategory extends MenuItem {
  category: MenuCategory
}
