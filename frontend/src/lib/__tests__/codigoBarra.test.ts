import { describe, it, expect } from 'vitest'
import { normalizarCodigoBarra } from '../codigoBarra'

describe('normalizarCodigoBarra', () => {
  it('rellena códigos numéricos cortos hasta 13 dígitos', () => {
    expect(normalizarCodigoBarra('5678')).toBe('0000000005678')
    expect(normalizarCodigoBarra('123')).toBe('0000000000123')
  })

  it('no modifica códigos de exactamente 13 dígitos', () => {
    expect(normalizarCodigoBarra('1234567890123')).toBe('1234567890123')
  })

  it('no trunca códigos de más de 13 dígitos', () => {
    expect(normalizarCodigoBarra('12345678901234')).toBe('12345678901234')
  })

  it('deja tal cual los códigos no numéricos', () => {
    expect(normalizarCodigoBarra('ABC123')).toBe('ABC123')
  })

  it('recorta espacios y deja vacío el string vacío', () => {
    expect(normalizarCodigoBarra('  5678  ')).toBe('0000000005678')
    expect(normalizarCodigoBarra('   ')).toBe('')
  })
})
