export interface GroupRoom {
  id: string
  reservation_id: string
  /** Token único para el link compartible */
  link_token: string
  created_at: string
}

export interface GroupGuest {
  id: string
  room_id: string
  name: string
  confirmed_at: string | null
  created_at: string
}

export interface GroupRoomWithGuests extends GroupRoom {
  guests: GroupGuest[]
  reservation: {
    date: string
    time_slot: string
    venue_name: string
    table_label: string
  }
}
