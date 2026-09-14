import { describe, it, expect } from 'vitest'
import { buildCierreTicketLines, buildTicketLines, wrapText } from '../ticket'
import type { TicketData } from '../ticket'
import type { CajaDto } from '../../types'

function makeCaja(): CajaDto {
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
  }
}

describe('wrapText', () => {
  it('envuelve el texto respetando el ancho máximo', () => {
    const lines = wrapText('Producto con un nombre bastante largo para envolver', 20)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every(l => l.length <= 20)).toBe(true)
    expect(lines.join(' ')).toBe('Producto con un nombre bastante largo para envolver')
  })

  it('parte palabras más largas que el ancho', () => {
    expect(wrapText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)).toEqual(['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ'])
  })
})

describe('buildTicketLines', () => {
  it('muestra el nombre completo del artículo sin truncar', () => {
    const ticket: TicketData = {
      empresaNombre: 'PosWeb',
      ventaId: 1,
      fecha: '2026-09-05T20:30:00.000Z',
      vendedor: 'Ana',
      items: [{ nombre: 'Coca-Cola Zero Lata 354ml Pack x6', cantidad: 1, precio: 100 }],
      total: 100,
      pagos: [{ nombre: 'Efectivo' }],
      cambio: 0,
    }

    const texto = buildTicketLines(ticket, 80).map(l => l.text).join('\n')
    expect(texto).not.toContain('...')
    for (const palabra of ['Coca-Cola', 'Zero', 'Lata', '354ml', 'Pack', 'x6']) {
      expect(texto).toContain(palabra)
    }
  })

})

describe('buildCierreTicketLines', () => {
  it('arma el ticket de cierre con las secciones esperadas', () => {
    const text = buildCierreTicketLines(makeCaja(), 80).map(l => l.text).join('\n')
    expect(text).toContain('CIERRE DE CAJA')
    expect(text).toContain('Apertura:')
    expect(text).toContain('Cierre:')
    expect(text).toContain('Usuario:')
    expect(text).toContain('GANANCIA')
    expect(text).toContain('MEDIOS DE PAGO')
    expect(text).toContain('CONTEO DE EFECTIVO')
    expect(text).toContain('Diferencia de caja')
    expect(text).toContain('FIN DEL CIERRE')
  })

  it('respeta el ancho del papel (58 y 80 mm)', () => {
    const caja = makeCaja()
    const max58 = Math.max(...buildCierreTicketLines(caja, 58).map(l => l.text.length))
    const max80 = Math.max(...buildCierreTicketLines(caja, 80).map(l => l.text.length))
    expect(max58).toBeLessThanOrEqual(32)
    expect(max80).toBeLessThanOrEqual(40)
  })
})
