import { describe, it, expect } from 'vitest'
import { applyPreset, getPreset } from './import-presets'

describe('import-presets', () => {
  it('returns null for unknown source/entity combo', () => {
    expect(getPreset('untoque', 'reservations')).toBeNull()
    expect(getPreset('thefork', 'tables')).toBeNull()
  })

  it('returns preset for thefork reservations', () => {
    const p = getPreset('thefork', 'reservations')
    expect(p).not.toBeNull()
    expect(p?.mapping.guest_name).toBe('guest name')
  })

  it('applyPreset matches case-insensitive headers', () => {
    const preset = getPreset('maxirest', 'reservations')!
    const csvHeaders = ['ID_Reserva', 'Titular', 'Telefono', 'Fecha', 'Hora', 'Cubiertos', 'Mesa']
    const fields = [
      { id: 'external_id' },
      { id: 'guest_name' },
      { id: 'guest_phone' },
      { id: 'date' },
      { id: 'time_slot' },
      { id: 'party_size' },
      { id: 'table_label' },
    ]
    const m = applyPreset(preset, csvHeaders, fields)
    expect(m.guest_name).toBe('Titular')
    expect(m.guest_phone).toBe('Telefono')
    expect(m.party_size).toBe('Cubiertos')
  })

  it('applyPreset returns null for fields not in csv', () => {
    const preset = getPreset('fudo', 'customers')!
    const csvHeaders = ['nombre', 'telefono'] // no email
    const fields = [{ id: 'name' }, { id: 'phone' }, { id: 'email' }]
    const m = applyPreset(preset, csvHeaders, fields)
    expect(m.name).toBe('nombre')
    expect(m.phone).toBe('telefono')
    expect(m.email).toBeNull()
  })
})
