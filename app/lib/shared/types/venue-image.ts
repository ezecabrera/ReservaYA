export type VenueImageKind = 'logo' | 'cover' | 'gallery'

export interface VenueImage {
  id: string
  venue_id: string
  kind: VenueImageKind
  url: string
  storage_path: string
  alt_text: string
  sort_order: number
  width: number | null
  height: number | null
  bytes: number | null
  mime_type: string | null
  created_at: string
  updated_at: string
}

export interface VenueImageBundle {
  logo: VenueImage | null
  cover: VenueImage | null
  /** Ordenado ascendente por sort_order. */
  gallery: VenueImage[]
}
