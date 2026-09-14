import { describe, it, expect } from 'vitest'
import { buildCierreCajaMessage, ENVIO_CIERRE_SUBJECT } from '../cierreCaja'
import type { CajaDto } from '../../types'

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
    const msg = buildCierreCajaMessage(makeCaja({ montoContadoEfectivo: undefined, montoContadoTarjetas: undefined, diferencia: undefined, fechaCierre: undefined }))
    expect(msg).not.toContain('Diferencia de caja')
    expect(msg).not.toContain('Fecha cierre:')
  })

  it('expone el asunto del mail', () => {
    expect(ENVIO_CIERRE_SUBJECT).toBe('Cierre de caja')
  })
})