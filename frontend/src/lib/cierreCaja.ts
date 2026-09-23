import type { CajaDto } from '../types'
import { formatCurrency, formatDate } from '../formats'

export const ENVIO_CIERRE_SUBJECT = 'Cierre de caja'

export function buildCierreCajaMessage(caja: CajaDto): string {
  const lineas: string[] = []
  lineas.push('CIERRE DE CAJA')
  lineas.push('')
  lineas.push(`Fecha apertura: ${formatDate(caja.fechaApertura)}`)
  if (caja.fechaCierre) lineas.push(`Fecha cierre: ${formatDate(caja.fechaCierre)}`)
  lineas.push(`Cajero: ${caja.usuarioCierre ?? caja.usuarioApertura}`)
  lineas.push('')
  lineas.push(`Saldo inicial: ${formatCurrency(caja.montoInicial)}`)
  lineas.push(`Total vendido: ${formatCurrency(caja.totalVentas)}`)
  lineas.push(`Gastos: ${formatCurrency(caja.gastos)}`)
  lineas.push(`Saldo final: ${formatCurrency(caja.esperado)}`)
  if (caja.desglosePagos.length > 0) {
    lineas.push('')
    lineas.push('Desglose por medio de pago:')
    caja.desglosePagos.forEach(p => lineas.push(`• ${p.medioPago}: ${formatCurrency(p.monto)}`))
  }
  lineas.push('')
  if (caja.montoContadoEfectivo != null) lineas.push(`Efectivo contado: ${formatCurrency(caja.montoContadoEfectivo)}`)
  if (caja.montoContadoTarjetas != null) lineas.push(`Tarjetas contadas: ${formatCurrency(caja.montoContadoTarjetas)}`)
  if (caja.diferencia != null) lineas.push(`Diferencia de caja: ${formatCurrency(caja.diferencia)}`)
  return lineas.join('\n')
}
