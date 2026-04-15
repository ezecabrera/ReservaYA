export interface User {
  /** Referencia a auth.users(id) de Supabase */
  id: string
  phone: string
  email: string | null
  name: string
  created_at: string
}

export type StaffRole = 'owner' | 'manager' | 'receptionist'

export interface StaffUser {
  /** Referencia a auth.users(id) de Supabase */
  id: string
  venue_id: string
  name: string
  role: StaffRole
  email: string
  created_at: string
}
