import { describe, it, expect } from 'vitest'
import { normalizePhoneE164 } from './whatsapp'

describe('normalizePhoneE164', () => {
  it('maneja formato AR estándar con paréntesis y guiones', () => {
    expect(normalizePhoneE164('+54 (11) 5566-7788')).toBe('5491155667788')
  })

  it('agrega 549 si viene sin código', () => {
    expect(normalizePhoneE164('1155667788')).toBe('5491155667788')
  })

  it('quita 0 inicial AR', () => {
    expect(normalizePhoneE164('01155667788')).toBe('5491155667788')
  })

  it('mantiene 549 si ya viene', () => {
    expect(normalizePhoneE164('5491155667788')).toBe('5491155667788')
  })

  it('agrega el 9 si solo viene 54 + número fijo formato móvil', () => {
    expect(normalizePhoneE164('541155667788')).toBe('5491155667788')
  })

  it('null si menos de 8 dígitos', () => {
    expect(normalizePhoneE164('1234')).toBeNull()
  })
})
