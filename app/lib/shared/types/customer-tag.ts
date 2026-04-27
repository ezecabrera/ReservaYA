/**
 * Customer tags: etiquetas operativas por cliente (venue + phone).
 * Tabla: customer_tags. Migracion: 017.
 */

export type CustomerTagKind =
  | 'allergy'
  | 'dietary'
  | 'restriction'
  | 'preference'
  | 'celebration'
  | 'note'
  | 'vip'

export interface CustomerTag {
  id: string
  venue_id: string
  customer_phone: string
  kind: CustomerTagKind
  value: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Sets pre-cargados es-AR para autocomplete en el panel.
 * No son enums DB: el campo `value` acepta texto libre.
 */
export const COMMON_ALLERGIES = [
  'Mariscos',
  'Frutos secos',
  'Maní',
  'Lácteos',
  'Huevo',
  'Soja',
  'Trigo / Gluten',
  'Pescado',
  'Mostaza',
  'Apio',
  'Sésamo',
  'Sulfitos',
] as const

export const COMMON_DIETARY = [
  'Vegetariano',
  'Vegano',
  'Celíaco / Sin gluten',
  'Sin lactosa',
  'Kosher',
  'Halal',
  'Sin azúcar',
  'Keto',
  'Diabético',
] as const

export const COMMON_CELEBRATIONS = [
  'Cumpleaños',
  'Aniversario',
  'Cumple del cónyuge',
  'Despedida',
  'Casamiento',
  'Bautismo',
] as const

export type CommonAllergy = (typeof COMMON_ALLERGIES)[number]
export type CommonDietary = (typeof COMMON_DIETARY)[number]
export type CommonCelebration = (typeof COMMON_CELEBRATIONS)[number]
