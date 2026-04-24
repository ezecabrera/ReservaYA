/**
 * Presets de import por origen — sistema (TheFork/Maxirest/Fudo) y entidad.
 * Cada preset declara los headers exactos que esos sistemas exportan en su CSV.
 *
 * El wizard usa estos presets de dos formas:
 *  - Auto-aplicar mapping si el usuario eligió un origen conocido (sin que tenga
 *    que mapear manualmente columna por columna).
 *  - Mostrar hints contextuales ("Buscamos columnas con nombre 'Telefono Cliente'").
 *
 * Si el CSV trae columnas extra, se ignoran. Si faltan campos requeridos,
 * el usuario completa lo que falte en el step 'map'.
 */

import type { ImportEntity } from './import-schemas'

export type ImportSource =
  | 'untoque'
  | 'thefork'
  | 'maxirest'
  | 'fudo'
  | 'google-sheets'
  | 'excel'
  | 'manual'

export interface ImportPreset {
  /** Mapping interno_field -> nombre exacto de columna en el CSV (lowercase). */
  mapping: Record<string, string>
  /** Notas para el usuario sobre cómo exportar desde el sistema origen. */
  exportTip?: string
}

/** Catalog de presets — vacío significa "sin preset, mapeo manual". */
export const IMPORT_PRESETS: Partial<
  Record<ImportSource, Partial<Record<ImportEntity, ImportPreset>>>
> = {
  thefork: {
    reservations: {
      mapping: {
        external_id: 'reservation id',
        guest_name: 'guest name',
        guest_phone: 'guest phone',
        date: 'date',
        time_slot: 'time',
        party_size: 'covers',
        table_label: 'table',
        duration_minutes: 'duration',
        status: 'status',
        customer_notes: 'comment',
      },
      exportTip:
        'TheFork Manager → Reservas → Exportar CSV. Incluí "comment" para conservar las notas.',
    },
    customers: {
      mapping: {
        name: 'customer name',
        phone: 'phone number',
        email: 'email',
        notes: 'notes',
        external_id: 'customer id',
      },
      exportTip: 'TheFork Manager → Clientes → Exportar lista completa.',
    },
  },

  maxirest: {
    tables: {
      mapping: {
        label: 'mesa',
        capacity: 'capacidad',
        zone_name: 'sector',
        shape: 'forma',
        external_id: 'id',
      },
      exportTip: 'Maxirest BackOffice → Configuración → Mesas → Exportar.',
    },
    reservations: {
      mapping: {
        external_id: 'id_reserva',
        guest_name: 'titular',
        guest_phone: 'telefono',
        date: 'fecha',
        time_slot: 'hora',
        party_size: 'cubiertos',
        table_label: 'mesa',
        duration_minutes: 'duracion',
        status: 'estado',
        customer_notes: 'observacion',
      },
      exportTip: 'Maxirest → Reservas → filtrar período → "Exportar a Excel".',
    },
  },

  fudo: {
    customers: {
      mapping: {
        name: 'nombre',
        phone: 'telefono',
        email: 'email',
        notes: 'notas',
        external_id: 'id',
      },
      exportTip: 'Fudo → Clientes → ⋯ → Exportar CSV.',
    },
    reservations: {
      mapping: {
        external_id: 'id',
        guest_name: 'cliente',
        guest_phone: 'telefono',
        date: 'fecha',
        time_slot: 'hora',
        party_size: 'personas',
        table_label: 'mesa',
        status: 'estado',
        customer_notes: 'comentario',
      },
      exportTip: 'Fudo → Reservas → Exportar (CSV, separador ",").',
    },
  },
}

/** Obtiene el preset si existe — devuelve null si no hay para esa combinación. */
export function getPreset(
  source: ImportSource,
  entity: ImportEntity,
): ImportPreset | null {
  return IMPORT_PRESETS[source]?.[entity] ?? null
}

/**
 * Aplica preset al mapping actual — si los headers del CSV coinciden (case-insensitive)
 * con los del preset, los pre-llena. Headers no coincidentes quedan en null para
 * mapeo manual.
 */
export function applyPreset(
  preset: ImportPreset,
  csvHeaders: string[],
  internalFields: Array<{ id: string }>,
): Record<string, string | null> {
  const headerSet = new Set(csvHeaders.map((h) => h.toLowerCase().trim()))
  const out: Record<string, string | null> = {}
  for (const field of internalFields) {
    const expected = preset.mapping[field.id]?.toLowerCase()
    if (expected && headerSet.has(expected)) {
      // Devolvemos el header EXACTO del CSV (no lowercase) para que el lookup
      // por row[header] funcione.
      const original = csvHeaders.find((h) => h.toLowerCase().trim() === expected)
      out[field.id] = original ?? null
    } else {
      out[field.id] = null
    }
  }
  return out
}
