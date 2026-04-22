export type OrderStatus = 'pending' | 'in_kitchen' | 'ready' | 'delivered'

export interface Order {
  id: string
  reservation_id: string
  status: OrderStatus
  total: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  qty: number
  unit_price: number
  notes: string | null
  created_at: string
}

export interface OrderItemWithMenuItem extends OrderItem {
  menu_item: {
    name: string
    image_url: string | null
  }
}

export interface OrderWithItems extends Order {
  items: OrderItemWithMenuItem[]
}
