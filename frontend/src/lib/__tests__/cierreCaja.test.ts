import { describe, it, expect } from 'vitest'
import { buildCierreCajaMessage, normalizarEnvioCierre, normalizarTelefonoWhatsApp, ENVIO_CIERRE_SUBJECT } from '../cierreCaja'
import type { CajaDto, EnvioCierreCajaConfig } from '../../types'

function makeCaja(overrides: Partial<CajaDto> = {}): CajaDto {
  return {
    id: 1,
    sucursalId: 2,
    estado: 'Cerrada',
    fechaApertura: '2026-09-05T08:00:00.000Z',
    fechaCierre: '2026-09-05T20:30:00.000Z',
    montoInicial: 1000,
    montoContadoEfectivo: 5500,
    montoContadoTarjetas: 1200,
    diferencia: 300,
    totalVentas: 6000,
    gastos: 500,
    esperado: 6500,
    desglosePagos: [
      { idMedioPago: 1, medioPago: 'Efectivo', monto: 4500, pagaVuelto: true },
      { idMedioPago: 2, medioPago: 'Tarjeta Débito', monto: 1500, pagaVuelto: false },
    ],
    usuarioApertura: 'Ana',
    usuarioCierre: 'Ana',
    ...overrides,
  }
}

describe('normalizarTelefonoWhatsApp', () => {
  it('devuelve el número ya normalizado +549 si viene completo', () => {
    expect(normalizarTelefonoWhatsApp('+54 9 11 1234-5678')).toBe('+5491112345678')
  })

  it('agrega +549 a un número local sin código de país', () => {
    expect(normalizarTelefonoWhatsApp('11 1234-5678')).toBe('+5491112345678')
  })

  it('devuelve vacío si no hay dígitos', () => {
    expect(normalizarTelefonoWhatsApp('abc')).toBe('')
  })
})

describe('normalizarEnvioCierre', () => {
  it('aplica defaults cuando la preferencia no existe', () => {
    const cfg = normalizarEnvioCierre(undefined)
    expect(cfg).toEqual({ envioAutomatico: false, whatsapp: { habilitado: false, destinatarios: [] }, email: { habilitado: false, destinatarios: [] } })
  })

  it('lee la configuración persistida y descarta destinatarios inválidos', () => {
    const raw = {
      envioAutomatico: true,
      whatsapp: { habilitado: true, destinatarios: ['+5491112345678', '   ', 42] },
      email: { habilitado: true, destinatarios: ['admin@empresa.com', null] },
    }
    const cfg: EnvioCierreCajaConfig = normalizarEnvioCierre(raw)
    expect(cfg.envioAutomatico).toBe(true)
    expect(cfg.whatsapp.habilitado).toBe(true)
    expect(cfg.whatsapp.destinatarios).toEqual(['+5491112345678'])
    expect(cfg.email.destinatarios).toEqual(['admin@empresa.com'])
  })
})

describe('buildCierreCajaMessage', () => {
  it('arma el resumen con los datos del cierre', () => {
    const msg = buildCierreCajaMessage(makeCaja())
    expect(msg).toContain('CIERRE DE CAJA')
    expect(msg).toContain('Fecha apertura:')
    expect(msg).toContain('Fecha cierre:')
    expect(msg).toContain('Cajero: Ana')
    expect(msg).toContain('Saldo inicial:')
    expect(msg).toContain('Total vendido:')
    expect(msg).toContain('Gastos:')
    expect(msg).toContain('Saldo final:')
    expect(msg).toContain('• Efectivo:')
    expect(msg).toContain('• Tarjeta Débito:')
    expect(msg).toContain('Diferencia de caja:')
  })

  it('no incluye diferencias/cierres ausentes', () => {
    const msg = buildCierreCajaMessage(makeCaja({ montoContadoEfectivo: null, montoContadoTarjetas: null, diferencia: null, fechaCierre: null }))
    expect(msg).not.toContain('Diferencia de caja')
    expect(msg).not.toContain('Fecha cierre:')
  })

  it('expone el asunto del mail', () => {
    expect(ENVIO_CIERRE_SUBJECT).toBe('Cierre de caja')
  })
})