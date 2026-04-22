export type TableStatus = 'available' | 'reserved' | 'occupied'

export interface Table {
  id: string
  venue_id: string
  zone_id: string | null
  /** Código legible: "Mesa 3", "T2", "S1" */
  label: string
  capacity: number
  position_order: number
  is_active: boolean
  created_at: string
}

/** Table con estado calculado — usado en la UI */
export interface TableWithStatus extends Table {
  status: TableStatus
  /** Nombre del titular si hay reserva activa */
  reservation_holder?: string | null
  /** Hora de llegada esperada si hay reserva activa ("HH:MM") */
  reservation_time?: string | null
  /** Cantidad de ítems en el pedido anticipado */
  pre_order_count?: number
}

export interface TableLock {
  id: string
  table_id: string
  reservation_id: string | null
  /** selection = 3 min (elegir mesa), payment = 10 min (completar pago) */
  type: 'selection' | 'payment'
  expires_at: string
  created_at: string
}
