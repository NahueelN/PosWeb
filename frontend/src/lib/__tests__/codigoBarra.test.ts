import { describe, it, expect } from 'vitest'
import { esCodigoBarraCompleto, normalizarCodigoBarra } from '../codigoBarra'

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

describe('esCodigoBarraCompleto', () => {
  it('acepta un EAN-13 válido', () => {
    expect(esCodigoBarraCompleto('7790040008175')).toBe(true)
  })

  it('rechaza prefijos parciales de un EAN-13', () => {
    expect(esCodigoBarraCompleto('779004')).toBe(false)
    expect(esCodigoBarraCompleto('77900400')).toBe(false)
    expect(esCodigoBarraCompleto('779004000817')).toBe(false)
  })

  it('rechaza largos que no son GTIN', () => {
    expect(esCodigoBarraCompleto('1234567890')).toBe(false)
  })

  it('rechaza dígito verificador inválido', () => {
    expect(esCodigoBarraCompleto('7790040008176')).toBe(false)
  })

  it('rechaza códigos no numéricos', () => {
    expect(esCodigoBarraCompleto('ABC12345')).toBe(false)
  })

  it('acepta un UPC-12 válido', () => {
    expect(esCodigoBarraCompleto('036000291452')).toBe(true)
  })
})
